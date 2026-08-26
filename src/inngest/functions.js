import { inngest } from "./client";
import { prisma } from "@/lib/prisma";
import nodemailer from "nodemailer";
import twilio from "twilio";
import { sendList, toE164Ec, MasivaError, getShipped } from "@/lib/sms/masiva";

const REMINDER_CAMPAIGN = "payment_reminder";

function normalizePhone(telephone) {
    let phone = telephone.replace(/\s+/g, "").replace(/-/g, "");
    if (phone.startsWith("+593")) return phone;
    if (phone.startsWith("593")) return "+" + phone;
    if (phone.startsWith("0")) return "+593" + phone.slice(1);
    if (!phone.startsWith("+")) return "+" + phone;
    return phone;
}

function todayEcDateString() {
    return new Date().toLocaleDateString("en-CA", { timeZone: "America/Guayaquil" });
}

function resolvePhoneToDebtorId(rawNumber, phoneToDebtorId) {
    if (phoneToDebtorId.has(rawNumber)) return phoneToDebtorId.get(rawNumber);
    const normalized = toE164Ec(rawNumber);
    if (normalized && phoneToDebtorId.has(normalized)) return phoneToDebtorId.get(normalized);
    return null;
}

export const sendRemindersFunction = inngest.createFunction(
    {
        id: "send-reminders",
        name: "Send Payment Reminders",
        retries: 2,
        triggers: [{ event: "reminders/send" }],
    },
    async ({ event, step }) => {
        const { debtors, dbUserId } = event.data;

        // --- EMAIL: unchanged shape, per-debtor loop ---
        for (const debtor of debtors) {
            await step.run(`email-${debtor.id}`, async () => {
                if (!debtor.email) {
                    console.log(`Skipping email for ${debtor.name} — no email`);
                    return;
                }

                console.log(`Sending email to ${debtor.name} (${debtor.email})...`);

                const transporter = nodemailer.createTransport({
                    host: "mail.privateemail.com",
                    port: 587,
                    secure: false,
                    auth: {
                        user: process.env.EMAIL_USER,
                        pass: process.env.EMAIL_PASS,
                    },
                });

                // Reply-To uses the debtor ID so we can identify who replied
                const replyToAddress = `reply-${debtor.id}@replies.recupera.it.com`;

                await transporter.sendMail({
                    from: `"Cobranza Automatizada" <${process.env.EMAIL_USER}>`,
                    to: debtor.email,
                    replyTo: replyToAddress,
                    subject: "Recordatorio de Pago",
                    text: `Hola ${debtor.name},\n\nEste es un recordatorio amistoso de que debes $${debtor.amountOwed.toFixed(2)} a ${debtor.clientName || "nuestro cliente"}.\n\nPor favor realiza el pago lo antes posible o responde este correo para coordinar.\n\nGracias.`,
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                            <div style="background: #443CA3; padding: 20px; border-radius: 12px 12px 0 0; text-align: center;">
                                <h1 style="color: #21FE83; margin: 0; font-size: 24px;">RECUPERA</h1>
                            </div>
                            <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e0e0e0;">
                                <p style="color: #333; font-size: 16px;">Hola <strong>${debtor.name}</strong>,</p>
                                <p style="color: #555;">Este es un recordatorio de que tiene un saldo pendiente de:</p>
                                <div style="background: #443CA3; color: #21FE83; text-align: center; padding: 20px; border-radius: 8px; margin: 20px 0;">
                                    <p style="margin: 0; font-size: 32px; font-weight: bold;">$${debtor.amountOwed.toFixed(2)}</p>
                                    ${debtor.invoiceNumber ? `<p style="margin: 8px 0 0; color: white; font-size: 13px;">Factura: ${debtor.invoiceNumber}</p>` : ""}
                                </div>
                                <p style="color: #555;">Por favor realiza el pago lo antes posible o <strong>responde este correo</strong> para coordinar un plan de pago.</p>
                                <p style="color: #888; font-size: 12px; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 15px;">
                                    Este mensaje fue enviado por Recupera en nombre de ${debtor.clientName || "nuestro cliente"}.
                                </p>
                            </div>
                        </div>
                    `,
                });

                await prisma.activityLog.create({
                    data: {
                        event: "REMINDER_SENT",
                        detail: `Email reminder sent to ${debtor.name} (${debtor.email}) — USD ${debtor.amountOwed.toFixed(2)}`,
                        userId: dbUserId,
                        debtorId: debtor.id,
                    },
                });

                // Best-effort — the email already sent and the ActivityLog
                // entry above already recorded it; a failure here must never
                // look like the send itself failed.
                try {
                    await prisma.notificationLog.create({
                        data: {
                            debtorId: debtor.id,
                            userId: dbUserId,
                            channel: "EMAIL",
                            template: "reminder_cron",
                            recipient: debtor.email,
                            status: "SENT",
                        },
                    });
                } catch (err) {
                    console.error("[NOTIFICATION_LOG] email write failed (non-fatal):", err);
                }

                console.log(`✅ Email sent to ${debtor.name} with Reply-To: ${replyToAddress}`);
            });
        }

        // --- SMS: one batched step for every debtor ---
        // Sends the generic reminder template only. Masiva template 3 (5-day
        // legal notice) must never be reachable from this routine, automatic
        // reminder path — it requires its own endpoint, its own confirmation
        // dialog, and deliberate client authorization. Do not add template
        // selection here that could route a debtor into template 3.
        const smsResult = await step.run("sms-batch", async () => {
            const sendDate = todayEcDateString();
            const debtorById = new Map(debtors.map((d) => [d.id, d]));
            const withPhone = debtors.filter((d) => d.telephone);

            if (withPhone.length === 0) {
                return { sent: [], failed: [], skipped: [] };
            }

            const debtorIds = withPhone.map((d) => d.id);
            const alreadySent = await prisma.smsDeliveryLog.findMany({
                where: {
                    campaign: REMINDER_CAMPAIGN,
                    sendDate,
                    debtorId: { in: debtorIds },
                    status: "sent",
                },
                select: { debtorId: true },
            });
            const alreadySentIds = new Set(alreadySent.map((r) => r.debtorId));

            // Filter: already sent today, opted out, invalid/non-mobile number.
            // This is the only SMS send call site in the app — nothing bypasses it.
            const skipLogs = [];
            const skipNotifLogs = [];
            const items = [];
            const phoneToDebtorId = new Map();
            const debtorIdToPhone = new Map();

            for (const d of withPhone) {
                if (alreadySentIds.has(d.id)) continue;

                if (d.smsOptOut) {
                    skipLogs.push({ debtorId: d.id, campaign: REMINDER_CAMPAIGN, sendDate, status: "opted_out" });
                    skipNotifLogs.push({ debtorId: d.id, userId: dbUserId, channel: "SMS", template: "reminder_cron", recipient: toE164Ec(d.telephone) || d.telephone, status: "OPT_OUT" });
                    continue;
                }

                const to = toE164Ec(d.telephone);
                if (!to) {
                    skipLogs.push({ debtorId: d.id, campaign: REMINDER_CAMPAIGN, sendDate, status: "invalid_number", detail: d.telephone });
                    skipNotifLogs.push({ debtorId: d.id, userId: dbUserId, channel: "SMS", template: "reminder_cron", recipient: d.telephone, status: "INVALID_NUMBER", detail: d.telephone });
                    continue;
                }

                phoneToDebtorId.set(to, d.id);
                debtorIdToPhone.set(d.id, to);
                items.push({
                    to_number: to,
                    content: `Recupera: Hola ${d.name}, debe $${d.amountOwed.toFixed(2)}. Contáctenos para regularizar. Gracias.`,
                });
            }

            if (skipLogs.length > 0) {
                await prisma.smsDeliveryLog.createMany({ data: skipLogs, skipDuplicates: true });
            }
            if (skipNotifLogs.length > 0) {
                try {
                    await prisma.notificationLog.createMany({ data: skipNotifLogs });
                } catch (err) {
                    console.error("[NOTIFICATION_LOG] skip-log write failed (non-fatal):", err);
                }
            }

            if (items.length === 0) {
                return { sent: [], failed: [], skipped: [...alreadySentIds, ...skipLogs.map((s) => s.debtorId)] };
            }

            let result;
            try {
                result = await sendList(items);
            } catch (err) {
                console.error("[SMS_BATCH] sendList failed outright, marking batch failed (not retrying this step):", err);
                const detail = err instanceof MasivaError ? err.message : String(err);
                await prisma.smsDeliveryLog.createMany({
                    data: [...phoneToDebtorId.values()].map((debtorId) => ({
                        debtorId,
                        campaign: REMINDER_CAMPAIGN,
                        sendDate,
                        status: "failed",
                        detail,
                    })),
                    skipDuplicates: true,
                });
                try {
                    await prisma.notificationLog.createMany({
                        data: [...phoneToDebtorId.entries()].map(([phone, debtorId]) => ({
                            debtorId, userId: dbUserId, channel: "SMS", template: "reminder_cron",
                            recipient: phone, status: "FAILED", detail,
                        })),
                    });
                } catch (logErr) {
                    console.error("[NOTIFICATION_LOG] batch-failure write failed (non-fatal):", logErr);
                }
                return { sent: [], failed: [...phoneToDebtorId.values()], skipped: [...alreadySentIds] };
            }

            if (result.errors?.length > 0) {
                console.error(`[SMS_BATCH] ${result.errors.length} chunk(s) had transport errors:`, result.errors);
            }

            const sentIds = [];
            for (const num of result.sent) {
                const debtorId = resolvePhoneToDebtorId(num, phoneToDebtorId);
                if (debtorId) sentIds.push(debtorId);
                else console.error(`[SMS_BATCH] Unresolved "sent" number from Masiva response: ${num}`);
            }

            const failedIds = [];
            for (const num of result.failed) {
                const debtorId = resolvePhoneToDebtorId(num, phoneToDebtorId);
                if (debtorId) failedIds.push(debtorId);
                else console.error(`[SMS_BATCH] Unresolved "failed" number from Masiva response: ${num}`);
            }

            await prisma.$transaction([
                ...sentIds.map((debtorId) =>
                    prisma.smsDeliveryLog.upsert({
                        where: { debtorId_campaign_sendDate: { debtorId, campaign: REMINDER_CAMPAIGN, sendDate } },
                        create: { debtorId, campaign: REMINDER_CAMPAIGN, sendDate, status: "sent" },
                        update: { status: "sent", detail: null },
                    })
                ),
                ...failedIds.map((debtorId) =>
                    prisma.smsDeliveryLog.upsert({
                        where: { debtorId_campaign_sendDate: { debtorId, campaign: REMINDER_CAMPAIGN, sendDate } },
                        create: { debtorId, campaign: REMINDER_CAMPAIGN, sendDate, status: "failed" },
                        update: { status: "failed" },
                    })
                ),
            ]);

            if (sentIds.length > 0) {
                await prisma.$transaction(
                    sentIds.map((debtorId) => {
                        const d = debtorById.get(debtorId);
                        return prisma.activityLog.create({
                            data: {
                                event: "REMINDER_SENT",
                                detail: `SMS reminder sent to ${d?.name ?? debtorId} — USD ${d ? d.amountOwed.toFixed(2) : "?"}`,
                                userId: dbUserId,
                                debtorId,
                            },
                        });
                    })
                );
            }

            try {
                await prisma.notificationLog.createMany({
                    data: [
                        ...sentIds.map((debtorId) => ({
                            debtorId, userId: dbUserId, channel: "SMS", template: "reminder_cron",
                            recipient: debtorIdToPhone.get(debtorId) || "", status: "SENT",
                        })),
                        ...failedIds.map((debtorId) => ({
                            debtorId, userId: dbUserId, channel: "SMS", template: "reminder_cron",
                            recipient: debtorIdToPhone.get(debtorId) || "", status: "FAILED",
                        })),
                    ],
                });
            } catch (err) {
                console.error("[NOTIFICATION_LOG] batch-result write failed (non-fatal):", err);
            }

            console.log(`✅ SMS batch: ${sentIds.length} sent, ${failedIds.length} failed`);
            return { sent: sentIds, failed: failedIds, skipped: [...alreadySentIds] };
        });

        // --- CALLS: unchanged shape, per-debtor loop with 15s sleep, now decoupled from SMS ---
        for (const debtor of debtors) {
            const phone = debtor.telephone ? normalizePhone(debtor.telephone) : null;

            if (phone) {
                await step.sleep(`wait-before-call-${debtor.id}`, "15s");
            }

            await step.run(`call-${debtor.id}`, async () => {
                if (!phone) {
                    console.log(`Skipping call for ${debtor.name} — no phone`);
                    return;
                }

                console.log(`Triggering call to ${debtor.name} (${phone})...`);

                const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

                await client.calls.create({
                    to: phone,
                    from: process.env.TWILIO_PHONE_NUMBER,
                    twiml: `
                        <Response>
                            <Say language="es-MX" voice="Polly.Mia">
                                Hola, ${debtor.name}.
                                Le contactamos de Recupera para informarle que tiene un saldo pendiente
                                de ${debtor.amountOwed.toFixed(2)} dólares.
                                Por favor comuníquese con nosotros para regularizar su situación.
                                Gracias y que tenga un buen día.
                            </Say>
                        </Response>
                    `,
                });

                await prisma.activityLog.create({
                    data: {
                        event: "CALL_TRIGGERED",
                        detail: `Automated call triggered to ${debtor.name} (${phone}) — USD ${debtor.amountOwed.toFixed(2)}`,
                        userId: dbUserId,
                        debtorId: debtor.id,
                    },
                });

                console.log(`✅ Call triggered for ${debtor.name}`);
            });

            await step.sleep(`gap-${debtor.id}`, "2s");
        }

        return { processed: debtors.length, sms: smsResult };
    }
);

// Upgrades NotificationLog rows from "sent" (accepted by Masiva — not proof
// of delivery) to "delivered", by polling the shipped-report endpoint a few
// minutes after sends land. 10-minute cadence matches the inbound-SMS
// poller cadence used elsewhere in this app for consistency, not because
// this endpoint requires it.
const DELIVERY_LOOKBACK_MS = 48 * 60 * 60 * 1000; // 48h — generous enough to
// still catch anything the previous run(s) missed without re-scanning the
// entire table on every tick.

export const pollSmsDeliveryFunction = inngest.createFunction(
    {
        id: "poll-sms-delivery",
        name: "Poll SMS Delivery Status",
        retries: 2,
        triggers: [{ cron: "*/10 * * * *" }],
    },
    async ({ step }) => {
        return step.run("poll-and-upgrade", async () => {
            const windowStart = new Date(Date.now() - DELIVERY_LOOKBACK_MS);
            const windowEnd = new Date();

            const pendingRows = await prisma.notificationLog.findMany({
                where: { channel: "SMS", status: "SENT", sentAt: { gte: windowStart } },
                select: { id: true, recipient: true },
            });

            if (pendingRows.length === 0) {
                return { checked: 0, upgraded: 0 };
            }

            let shipped;
            try {
                shipped = await getShipped(windowStart, windowEnd);
            } catch (err) {
                console.error("[POLL_SMS_DELIVERY] getShipped failed:", err);
                return { checked: pendingRows.length, upgraded: 0, error: String(err) };
            }

            const shippedNumbers = new Set(shipped.map((s) => s.toNumber));
            const toUpgrade = pendingRows.filter((r) => shippedNumbers.has(r.recipient));

            if (toUpgrade.length > 0) {
                await prisma.notificationLog.updateMany({
                    where: { id: { in: toUpgrade.map((r) => r.id) } },
                    data: { status: "DELIVERED", deliveredAt: new Date() },
                });
            }

            console.log(`✅ SMS delivery poll: ${toUpgrade.length}/${pendingRows.length} upgraded to delivered`);
            return { checked: pendingRows.length, upgraded: toUpgrade.length };
        });
    }
);
