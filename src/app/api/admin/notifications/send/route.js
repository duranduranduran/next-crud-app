export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/getOrCreateUser";
import { sendList, MasivaError } from "@/lib/sms/masiva";
import { toE164Ec } from "@/lib/phone";
import { buildSmsFromTemplateRow, deriveShortName, fillTemplate, publicDebtorUrl, SmsTemplateFitError } from "@/lib/sms/templates";
import nodemailer from "nodemailer";

function todayEcDateString() {
    // dd/mm/yyyy — matches the human-facing date convention used elsewhere
    // in this app (toLocaleDateString("es-EC")), NOT the mm/dd/yyyy the
    // Masiva shipped-report endpoint separately requires (see getShipped in
    // lib/sms/masiva.js) — these are two unrelated date-format concerns
    // that happen to both involve Masiva; do not conflate them.
    return new Date().toLocaleDateString("es-EC", { timeZone: "America/Guayaquil" });
}

async function requireAdmin() {
    const { userId } = await auth();
    if (!userId) return { error: NextResponse.json({ message: "Unauthorized" }, { status: 401 }) };

    const clerkUser = await currentUser();
    if (!clerkUser || clerkUser.publicMetadata?.role !== "admin") {
        return { error: NextResponse.json({ message: "Forbidden" }, { status: 403 }) };
    }

    const dbUser = await getOrCreateUser();
    if (!dbUser) return { error: NextResponse.json({ message: "User sync failed" }, { status: 500 }) };

    return { dbUser };
}

async function sendSmsNotification({ debtors, templateId, confirmed, dbUser }) {
    const template = await prisma.template.findUnique({ where: { id: templateId } });
    if (!template || template.channel !== "SMS") {
        return NextResponse.json({ message: "Plantilla SMS no encontrada" }, { status: 400 });
    }
    if (!template.active) {
        return NextResponse.json({ message: "Esta plantilla está desactivada" }, { status: 400 });
    }

    // Restricted templates (the 5-day legal-notice style) require
    // deliberate, explicit authorization — never trust the client alone
    // for this gate, the composer UI's own confirmation dialog is the
    // first line, this is the second.
    if (template.restricted && confirmed !== true) {
        return NextResponse.json({ message: "Este template requiere confirmación explícita." }, { status: 400 });
    }

    const date = todayEcDateString();
    const results = { sent: [], failed: [], skipped: [] };
    const items = [];
    const numberToDebtorId = new Map();
    const logs = [];

    for (const d of debtors) {
        if (d.smsOptOut) {
            results.skipped.push({ debtorId: d.id, reason: "opt_out" });
            logs.push({ debtorId: d.id, userId: dbUser.id, channel: "SMS", template: template.id, recipient: toE164Ec(d.telephone) || d.telephone || "", status: "OPT_OUT" });
            continue;
        }
        const to = toE164Ec(d.telephone);
        if (!to) {
            results.skipped.push({ debtorId: d.id, reason: "invalid_number" });
            logs.push({ debtorId: d.id, userId: dbUser.id, channel: "SMS", template: template.id, recipient: d.telephone || "", status: "INVALID_NUMBER", detail: d.telephone || null });
            continue;
        }

        // A client with no shortName no longer blocks the send — it falls
        // back to one derived from the client's name, same as the
        // composer's preview does, so what actually gets sent matches
        // what the admin saw before clicking send. Flagged in the log
        // detail so it's visible in Historial rather than looking
        // identical to a real shortName.
        const hasRealShortName = Boolean(d.user?.shortName);
        const shortName = hasRealShortName ? d.user.shortName : deriveShortName(d.user?.name);

        let message;
        try {
            message = buildSmsFromTemplateRow(template, { debtor: d, client: { shortName }, date });
        } catch (err) {
            console.error("[NOTIF_SEND] template did not fit, skipping debtor:", err instanceof SmsTemplateFitError ? err.message : err);
            results.skipped.push({ debtorId: d.id, reason: "does_not_fit" });
            continue;
        }

        items.push({ to_number: to, content: message });
        numberToDebtorId.set(to, { debtorId: d.id, usedFallbackShortName: !hasRealShortName });
    }

    if (items.length > 0) {
        let sendResult;
        try {
            sendResult = await sendList(items);
        } catch (err) {
            const detail = err instanceof MasivaError ? err.message : String(err);
            for (const it of items) {
                const entry = numberToDebtorId.get(it.to_number);
                results.failed.push(entry.debtorId);
                logs.push({ debtorId: entry.debtorId, userId: dbUser.id, channel: "SMS", template: template.id, recipient: it.to_number, status: "FAILED", detail });
            }
        }

        if (sendResult) {
            for (const num of sendResult.sent) {
                const entry = numberToDebtorId.get(num);
                if (!entry) continue;
                results.sent.push(entry.debtorId);
                logs.push({
                    debtorId: entry.debtorId, userId: dbUser.id, channel: "SMS", template: template.id, recipient: num, status: "SENT",
                    detail: entry.usedFallbackShortName ? "shortName derivado del nombre del cliente (sin shortName configurado)" : null,
                });
            }
            for (const num of sendResult.failed) {
                const entry = numberToDebtorId.get(num);
                if (!entry) continue;
                results.failed.push(entry.debtorId);
                logs.push({ debtorId: entry.debtorId, userId: dbUser.id, channel: "SMS", template: template.id, recipient: num, status: "FAILED" });
            }
        }
    }

    if (logs.length > 0) {
        await prisma.notificationLog.createMany({ data: logs });
    }

    if (results.sent.length > 0) {
        const event = template.restricted ? "LEGAL_NOTICE_SENT" : "NOTIFICATION_SENT";
        const debtorById = new Map(debtors.map((d) => [d.id, d]));
        await prisma.activityLog.createMany({
            data: results.sent.map((debtorId) => ({
                event,
                detail: `SMS (${template.label}) enviado a ${debtorById.get(debtorId)?.name ?? debtorId}`,
                userId: dbUser.id,
                debtorId,
            })),
        });
    }

    return NextResponse.json({ message: "Envío procesado", ...results });
}

async function sendEmailNotification({ debtors, subject, body, templateId, dbUser }) {
    if (!subject || !body) {
        return NextResponse.json({ message: "Subject and body are required" }, { status: 400 });
    }

    const transporter = nodemailer.createTransport({
        host: "mail.privateemail.com",
        port: 587,
        secure: false,
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    const date = todayEcDateString();
    const results = { sent: [], failed: [], skipped: [] };
    const logs = [];

    for (const d of debtors) {
        if (!d.email) {
            results.skipped.push({ debtorId: d.id, reason: "no_email" });
            continue;
        }

        // Per-recipient variable substitution — subject/body may carry
        // {{name}}/{{amount}}/{{client}}/{{date}}/{{url}} placeholders
        // whether typed by hand or pre-filled from a saved Template; every
        // recipient in a bulk send needs their OWN values, not whatever
        // the composer's single-debtor preview happened to show.
        const vars = {
            name: d.name,
            amount: Number(d.amountOwed).toFixed(2),
            client: d.user?.name || d.user?.email || "Cliente",
            date,
            url: publicDebtorUrl(d.publicToken),
        };
        const finalSubject = fillTemplate(subject, vars);
        const finalBody = fillTemplate(body, vars);

        try {
            await transporter.sendMail({
                from: `"Cobranza Automatizada" <${process.env.EMAIL_USER}>`,
                to: d.email,
                replyTo: `reply-${d.id}@replies.recupera.it.com`,
                subject: finalSubject,
                text: finalBody,
            });
            results.sent.push(d.id);
            logs.push({ debtorId: d.id, userId: dbUser.id, channel: "EMAIL", template: templateId || "custom", recipient: d.email, status: "SENT" });
        } catch (err) {
            console.error("[NOTIF_SEND] email failed:", err);
            results.failed.push(d.id);
            logs.push({ debtorId: d.id, userId: dbUser.id, channel: "EMAIL", template: templateId || "custom", recipient: d.email, status: "FAILED", detail: String(err) });
        }
    }

    if (logs.length > 0) {
        await prisma.notificationLog.createMany({ data: logs });
    }

    if (results.sent.length > 0) {
        const debtorById = new Map(debtors.map((d) => [d.id, d]));
        await prisma.activityLog.createMany({
            data: results.sent.map((debtorId) => ({
                event: "NOTIFICATION_SENT",
                detail: `Email "${subject}" enviado a ${debtorById.get(debtorId)?.name ?? debtorId}`,
                userId: dbUser.id,
                debtorId,
            })),
        });
    }

    return NextResponse.json({ message: "Envío procesado", ...results });
}

export async function POST(req) {
    try {
        const { error, dbUser } = await requireAdmin();
        if (error) return error;

        const { channel, debtorIds, templateId, confirmed, subject, body } = await req.json();

        if (!Array.isArray(debtorIds) || debtorIds.length === 0) {
            return NextResponse.json({ message: "No recipients selected" }, { status: 400 });
        }
        if (channel !== "SMS" && channel !== "EMAIL") {
            return NextResponse.json({ message: "Invalid channel" }, { status: 400 });
        }
        if (channel === "SMS" && !templateId) {
            return NextResponse.json({ message: "Seleccione una plantilla" }, { status: 400 });
        }

        const debtors = await prisma.debtor.findMany({
            where: { id: { in: debtorIds } },
            include: { user: { select: { name: true, email: true, shortName: true } } },
        });

        if (channel === "SMS") {
            return await sendSmsNotification({ debtors, templateId, confirmed, dbUser });
        }
        return await sendEmailNotification({ debtors, subject, body, templateId, dbUser });
    } catch (error) {
        console.error("[NOTIFICATIONS_SEND]", error);
        return NextResponse.json({ message: "Server error" }, { status: 500 });
    }
}
