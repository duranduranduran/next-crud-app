export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

// Verify Mailgun webhook signature
function verifyMailgunSignature(signingKey, timestamp, token, signature) {
    const value = timestamp + token;
    const hash = crypto
        .createHmac("sha256", signingKey)
        .update(value)
        .digest("hex");
    return hash === signature;
}

export async function POST(req) {
    try {
        const formData = await req.formData();

        const timestamp = formData.get("timestamp");
        const token = formData.get("token");
        const signature = formData.get("signature");

        // Verify webhook signature
        const signingKey = process.env.MAILGUN_WEBHOOK_SIGNING_KEY;
        if (signingKey) {
            const isValid = verifyMailgunSignature(signingKey, timestamp, token, signature);
            if (!isValid) {
                console.error("[EMAIL_REPLY_WEBHOOK] Invalid signature");
                return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
            }
        }

        const to = formData.get("To") || formData.get("to") || "";
        const from = formData.get("From") || formData.get("from") || "";
        const subject = formData.get("Subject") || formData.get("subject") || "";
        const bodyText = formData.get("body-plain") || formData.get("stripped-text") || "";
        const bodyHtml = formData.get("body-html") || "";
        const rawPayload = {};

        // Extract all fields for audit log
        for (const [key, value] of formData.entries()) {
            rawPayload[key] = value;
        }

        console.log("[EMAIL_REPLY_WEBHOOK] Received reply from:", from, "to:", to);

        // Extract debtor ID from the To address
        // Format: reply-{debtorId}@replies.recupera.it.com
        const toAddress = to.match(/reply-([^@\s<>]+)@replies\.recupera\.it\.com/i);
        if (!toAddress) {
            console.error("[EMAIL_REPLY_WEBHOOK] Could not extract debtor ID from:", to);
            return NextResponse.json({ error: "Invalid recipient format" }, { status: 400 });
        }

        const debtorId = toAddress[1];
        console.log("[EMAIL_REPLY_WEBHOOK] Extracted debtorId:", debtorId);

        // Find the debtor
        const debtor = await prisma.debtor.findUnique({
            where: { id: debtorId },
            include: { user: true },
        });

        if (!debtor) {
            console.error("[EMAIL_REPLY_WEBHOOK] Debtor not found:", debtorId);
            return NextResponse.json({ error: "Debtor not found" }, { status: 404 });
        }

        // Extract sender email
        const senderEmail = from.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)?.[0] || from;

        // Save the inbound message
        const message = await prisma.inboundMessage.create({
            data: {
                debtorId: debtor.id,
                clientId: debtor.userId,
                channel: "EMAIL",
                sender: senderEmail,
                subject: subject || null,
                content: bodyText || bodyHtml || "(sin contenido)",
                rawPayload: JSON.stringify(rawPayload),
            },
        });

        // Log in activity log
        await prisma.activityLog.create({
            data: {
                event: "REMINDER_SENT",
                detail: `Respuesta recibida de ${debtor.name} (${senderEmail}): "${(bodyText || "").slice(0, 80)}${bodyText?.length > 80 ? "..." : ""}"`,
                userId: debtor.userId,
                debtorId: debtor.id,
            },
        });

        console.log(`[EMAIL_REPLY_WEBHOOK] ✅ Saved reply from ${debtor.name}`);

        return NextResponse.json({ success: true, messageId: message.id });

    } catch (err) {
        console.error("[EMAIL_REPLY_WEBHOOK] Error:", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
