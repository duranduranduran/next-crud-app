import { inngest } from "./client";
import { prisma } from "@/lib/prisma";
import nodemailer from "nodemailer";
import twilio from "twilio";

function normalizePhone(telephone) {
    let phone = telephone.replace(/\s+/g, "").replace(/-/g, "");
    if (phone.startsWith("+593")) return phone;
    if (phone.startsWith("593")) return "+" + phone;
    if (phone.startsWith("0")) return "+593" + phone.slice(1);
    if (!phone.startsWith("+")) return "+" + phone;
    return phone;
}

export const sendRemindersFunction = inngest.createFunction(
    {
        id: "send-reminders",
        name: "Send Payment Reminders",
        retries: 2,
        triggers: [{ event: "reminders/send" }],
    },
    async ({ event, step }) => {

        console.log("=== INNGEST EVENT DATA ===");
        console.log("Keys received:", Object.keys(event.data));
        console.log("twilioSid exists:", !!event.data.twilioSid);
        console.log("twilioToken exists:", !!event.data.twilioToken);
        console.log("twilioPhone exists:", !!event.data.twilioPhone);
        console.log("emailUser exists:", !!event.data.emailUser);
        console.log("debtors count:", event.data.debtors?.length);
        console.log("=========================");

        const {
            debtors,
            dbUserId,
            twilioSid,
            twilioToken,
            twilioPhone,
            emailUser,
            emailPass,
        } = event.data;

        for (const debtor of debtors) {
            const phone = debtor.telephone ? normalizePhone(debtor.telephone) : null;

            // --- EMAIL ---
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
                        user: emailUser,
                        pass: emailPass,
                    },
                });

                // Reply-To uses the debtor ID so we can identify who replied
                const replyToAddress = `reply-${debtor.id}@replies.recupera.it.com`;

                await transporter.sendMail({
                    from: `"Cobranza Automatizada" <${emailUser}>`,
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

                console.log(`✅ Email sent to ${debtor.name} with Reply-To: ${replyToAddress}`);
            });

            // --- SMS ---
            await step.run(`sms-${debtor.id}`, async () => {
                if (!phone) {
                    console.log(`Skipping SMS for ${debtor.name} — no phone`);
                    return;
                }

                console.log(`Sending SMS to ${debtor.name} (${phone})...`);

                const client = twilio(twilioSid, twilioToken);

                await client.messages.create({
                    to: phone,
                    from: twilioPhone,
                    body: `Recupera: Hola ${debtor.name}, debe $${debtor.amountOwed.toFixed(2)}. Contáctenos para regularizar. Gracias.`,
                });

                await prisma.activityLog.create({
                    data: {
                        event: "REMINDER_SENT",
                        detail: `SMS reminder sent to ${debtor.name} (${phone}) — USD ${debtor.amountOwed.toFixed(2)}`,
                        userId: dbUserId,
                        debtorId: debtor.id,
                    },
                });

                console.log(`✅ SMS sent to ${debtor.name}`);
            });

            // --- WAIT 15s before call ---
            if (phone) {
                await step.sleep(`wait-before-call-${debtor.id}`, "15s");
            }

            // --- CALL ---
            await step.run(`call-${debtor.id}`, async () => {
                if (!phone) {
                    console.log(`Skipping call for ${debtor.name} — no phone`);
                    return;
                }

                console.log(`Triggering call to ${debtor.name} (${phone})...`);

                const client = twilio(twilioSid, twilioToken);

                await client.calls.create({
                    to: phone,
                    from: twilioPhone,
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

        return { processed: debtors.length };
    }
);
