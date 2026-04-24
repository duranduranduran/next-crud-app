// // app/api/send-reminders/route.js
//
// import { NextResponse } from 'next/server';
// import nodemailer from 'nodemailer';
// import { PrismaClient } from '@prisma/client';
//
// const prisma = new PrismaClient();
//
// export async function GET() {
//     try {
//         // 1. Get all debtors who are available for notification
//         const debtorsToNotify = await prisma.debtor.findMany({
//             where: {
//                 availableForNotify: true,
//             },
//             include: {
//                 user: true,
//             },
//         });
//
//         if (debtorsToNotify.length === 0) {
//             return NextResponse.json({ message: 'No debtors to notify.' });
//         }
//
//         // 2. Set up the nodemailer transporter
//         const transporter = nodemailer.createTransport({
//             service: 'gmail',
//             auth: {
//                 user: process.env.EMAIL_USER,
//                 pass: process.env.EMAIL_PASS,
//             },
//         });
//
//         // 3. Send emails to each debtor
//         for (const debtor of debtorsToNotify) {
//             const mailOptions = {
//                 from: `"Cobranza Automatizada" <${process.env.EMAIL_USER}>`,
//                 to: debtor.email,
//                 subject: 'Recordatorio de Pago',
//                 text: `Hola ${debtor.name},\n\nEste es un recordatorio amistoso de que debes $${debtor.amountOwed.toFixed(
//                     2
//                 )} a ${debtor.user.name || 'nuestro cliente'}.\n\nPor favor realiza el pago lo antes posible.\n\nGracias.`,
//             };
//
//             // Send the email
//             await transporter.sendMail(mailOptions);
//         }
//
//         return NextResponse.json({ message: 'Emails sent successfully!' });
//     } catch (error) {
//         console.error('Error sending reminders:', error);
//         return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
//     }
// }
//


// export const runtime = "nodejs";
//
// import { NextResponse } from 'next/server';
// import nodemailer from 'nodemailer';
// import { prisma } from '@/lib/prisma';
// import { auth, currentUser } from '@clerk/nextjs/server';
//
// export async function GET() {
//     try {
//         // 1. Auth
//         const { userId } = await auth();
//
//         if (!userId) {
//             return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
//         }
//
//         // 2. Role check
//         const clerkUser = await currentUser();
//
//         if (!clerkUser || clerkUser.publicMetadata?.role !== 'admin') {
//             return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
//         }
//
//         // 3. Find DB user
//         const dbUser = await prisma.user.findUnique({
//             where: { clerkId: userId },
//         });
//
//         if (!dbUser) {
//             return NextResponse.json({ message: 'User not found' }, { status: 404 });
//         }
//
//         // 4. Get all debtors available for notification
//         const debtorsToNotify = await prisma.debtor.findMany({
//             where: { availableForNotify: true },
//             include: { user: true },
//         });
//
//         if (debtorsToNotify.length === 0) {
//             return NextResponse.json({ message: 'No debtors to notify.' });
//         }
//
//         // 5. Set up nodemailer
//         const transporter = nodemailer.createTransport({
//             service: 'gmail',
//             auth: {
//                 user: process.env.EMAIL_USER,
//                 pass: process.env.EMAIL_PASS,
//             },
//         });
//
//         // 6. Send emails + log each one
//         for (const debtor of debtorsToNotify) {
//             const mailOptions = {
//                 from: `"Cobranza Automatizada" <${process.env.EMAIL_USER}>`,
//                 to: debtor.email,
//                 subject: 'Recordatorio de Pago',
//                 text: `Hola ${debtor.name},\n\nEste es un recordatorio amistoso de que debes $${debtor.amountOwed.toFixed(2)} a ${debtor.user.name || 'nuestro cliente'}.\n\nPor favor realiza el pago lo antes posible.\n\nGracias.`,
//             };
//
//             await transporter.sendMail(mailOptions);
//
//             // Log each reminder sent
//             await prisma.activityLog.create({
//                 data: {
//                     event: 'REMINDER_SENT',
//                     detail: `Email reminder sent to ${debtor.name} (${debtor.email}) — USD ${debtor.amountOwed.toFixed(2)}`,
//                     userId: dbUser.id,
//                     debtorId: debtor.id,
//                 },
//             });
//         }
//
//         return NextResponse.json({
//             message: `Emails sent successfully to ${debtorsToNotify.length} debtor(s)!`
//         });
//     } catch (error) {
//         console.error('Error sending reminders:', error);
//         return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
//     }
// }

export const runtime = "nodejs";

import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import twilio from 'twilio';
import { prisma } from '@/lib/prisma';
import { auth, currentUser } from '@clerk/nextjs/server';

const twilioClient = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
);

export async function GET() {
    try {
        // 1. Auth
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        // 2. Role check
        const clerkUser = await currentUser();

        if (!clerkUser || clerkUser.publicMetadata?.role !== 'admin') {
            return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
        }

        // 3. Find DB user
        const dbUser = await prisma.user.findUnique({
            where: { clerkId: userId },
        });

        if (!dbUser) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        // 4. Get all debtors available for notification
        const debtorsToNotify = await prisma.debtor.findMany({
            where: { availableForNotify: true },
            include: { user: true },
        });

        if (debtorsToNotify.length === 0) {
            return NextResponse.json({ message: 'No debtors to notify.' });
        }

        // 5. Set up nodemailer
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const results = [];

        // 6. Send email + call + log each debtor
        for (const debtor of debtorsToNotify) {
            const debtorResult = { name: debtor.name, email: null, call: null };

            // --- EMAIL ---
            if (debtor.email) {
                try {
                    await transporter.sendMail({
                        from: `"Cobranza Automatizada" <${process.env.EMAIL_USER}>`,
                        to: debtor.email,
                        subject: 'Recordatorio de Pago',
                        text: `Hola ${debtor.name},\n\nEste es un recordatorio amistoso de que debes $${debtor.amountOwed.toFixed(2)} a ${debtor.user.name || 'nuestro cliente'}.\n\nPor favor realiza el pago lo antes posible.\n\nGracias.`,
                    });

                    debtorResult.email = 'sent';

                    await prisma.activityLog.create({
                        data: {
                            event: 'REMINDER_SENT',
                            detail: `Email reminder sent to ${debtor.name} (${debtor.email}) — USD ${debtor.amountOwed.toFixed(2)}`,
                            userId: dbUser.id,
                            debtorId: debtor.id,
                        },
                    });
                } catch (emailErr) {
                    console.error(`Email failed for ${debtor.name}:`, emailErr);
                    debtorResult.email = 'failed';
                }
            } else {
                debtorResult.email = 'skipped — no email';
            }

            // --- PHONE CALL ---
            if (debtor.telephone) {
                try {
                    // Normalize phone number to international format
                    // Converts 09XXXXXXXX (Ecuador) → +5939XXXXXXXX
                    let phone = debtor.telephone.replace(/\s+/g, '');
                    if (phone.startsWith('0')) {
                        phone = '+593' + phone.slice(1);
                    } else if (!phone.startsWith('+')) {
                        phone = '+' + phone;
                    }

                    await twilioClient.calls.create({
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

                    debtorResult.call = 'triggered';

                    await prisma.activityLog.create({
                        data: {
                            event: 'CALL_TRIGGERED',
                            detail: `Automated call triggered to ${debtor.name} (${phone}) — USD ${debtor.amountOwed.toFixed(2)}`,
                            userId: dbUser.id,
                            debtorId: debtor.id,
                        },
                    });
                } catch (callErr) {
                    console.error(`Call failed for ${debtor.name}:`, callErr);
                    debtorResult.call = 'failed';
                }
            } else {
                debtorResult.call = 'skipped — no phone';
            }

            results.push(debtorResult);
        }

        return NextResponse.json({
            message: `Reminders processed for ${debtorsToNotify.length} debtor(s)`,
            results,
        });

    } catch (error) {
        console.error('Error sending reminders:', error);
        return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
    }
}