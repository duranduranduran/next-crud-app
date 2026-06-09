export const runtime = "nodejs";

import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/getOrCreateUser";
import nodemailer from "nodemailer";

export async function POST(req) {
    try {
        const { userId } = await auth();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const clerkUser = await currentUser();
        if (!clerkUser || clerkUser.publicMetadata?.role !== "admin") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const dbUser = await getOrCreateUser();
        if (!dbUser) return NextResponse.json({ error: "User sync failed" }, { status: 500 });

        const { messageId, content, debtorId } = await req.json();
        if (!messageId || !content || !debtorId) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }

        // Get original message + debtor
        const original = await prisma.inboundMessage.findUnique({
            where: { id: messageId },
            include: { debtor: true },
        });

        if (!original) return NextResponse.json({ error: "Message not found" }, { status: 404 });

        // Send reply via nodemailer
        const transporter = nodemailer.createTransport({
            host: "mail.privateemail.com",
            port: 587,
            secure: false,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const replyToAddress = `reply-${debtorId}@replies.recupera.it.com`;

        await transporter.sendMail({
            from: `"Recupera" <${process.env.EMAIL_USER}>`,
            to: original.sender,
            replyTo: replyToAddress,
            subject: original.subject ? `Re: ${original.subject}` : "Re: Recordatorio de Pago",
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background: #443CA3; padding: 16px 20px; border-radius: 12px 12px 0 0;">
                        <h2 style="color: #21FE83; margin: 0; font-size: 18px;">RECUPERA</h2>
                    </div>
                    <div style="background: #f9f9f9; padding: 24px; border-radius: 0 0 12px 12px; border: 1px solid #e0e0e0;">
                        <p style="color: #333; white-space: pre-wrap; line-height: 1.6;">${content}</p>
                        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;" />
                        <p style="color: #888; font-size: 12px;">Recupera · Sistema de Cobranza Automatizada</p>
                    </div>
                </div>
            `,
            text: content,
        });

        // Log in activity log
        await prisma.activityLog.create({
            data: {
                event: "REMINDER_SENT",
                detail: `Respuesta enviada a ${original.debtor.name} (${original.sender}): "${content.slice(0, 60)}${content.length > 60 ? "..." : ""}"`,
                userId: dbUser.id,
                debtorId,
            },
        });

        // Mark original as read
        await prisma.inboundMessage.update({
            where: { id: messageId },
            data: { readByClientAt: new Date() },
        });

        return NextResponse.json({ success: true });

    } catch (err) {
        console.error("[REPLY_POST]", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
