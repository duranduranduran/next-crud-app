// app/api/send-reminders/route.js

import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
    try {
        // 1. Get all debtors who are available for notification
        const debtorsToNotify = await prisma.debtor.findMany({
            where: {
                availableForNotify: true,
            },
            include: {
                user: true,
            },
        });

        if (debtorsToNotify.length === 0) {
            return NextResponse.json({ message: 'No debtors to notify.' });
        }

        // 2. Set up the nodemailer transporter
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        // 3. Send emails to each debtor
        for (const debtor of debtorsToNotify) {
            const mailOptions = {
                from: `"Cobranza Automatizada" <${process.env.EMAIL_USER}>`,
                to: debtor.email,
                subject: 'Recordatorio de Pago',
                text: `Hola ${debtor.name},\n\nEste es un recordatorio amistoso de que debes $${debtor.amountOwed.toFixed(
                    2
                )} a ${debtor.user.name || 'nuestro cliente'}.\n\nPor favor realiza el pago lo antes posible.\n\nGracias.`,
            };

            // Send the email
            await transporter.sendMail(mailOptions);
        }

        return NextResponse.json({ message: 'Emails sent successfully!' });
    } catch (error) {
        console.error('Error sending reminders:', error);
        return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
    }
}