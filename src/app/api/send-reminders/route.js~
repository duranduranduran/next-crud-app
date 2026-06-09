export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { inngest } from "@/inngest/client";

export async function GET() {
    try {
        // 1. Auth
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        // 2. Role check
        const clerkUser = await currentUser();
        if (!clerkUser || clerkUser.publicMetadata?.role !== "admin") {
            return NextResponse.json({ message: "Forbidden" }, { status: 403 });
        }

        // 3. Find DB user
        const dbUser = await prisma.user.findUnique({
            where: { clerkId: userId },
        });
        if (!dbUser) {
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }

        // 4. Get all debtors available for notification
        const debtorsToNotify = await prisma.debtor.findMany({
            where: { availableForNotify: true },
            include: { user: true },
        });

        if (debtorsToNotify.length === 0) {
            return NextResponse.json({ message: "No debtors to notify." });
        }

        // 5. Send event to Inngest with credentials in payload
        await inngest.send({
            name: "reminders/send",
            data: {
                dbUserId: dbUser.id,
                // 👇 Pass credentials through event data so steps always have them
                twilioSid: process.env.TWILIO_ACCOUNT_SID,
                twilioToken: process.env.TWILIO_AUTH_TOKEN,
                twilioPhone: process.env.TWILIO_PHONE_NUMBER,
                emailUser: process.env.EMAIL_USER,
                emailPass: process.env.EMAIL_PASS,
                debtors: debtorsToNotify.map((d) => ({
                    id: d.id,
                    name: d.name,
                    email: d.email,
                    telephone: d.telephone,
                    amountOwed: d.amountOwed,
                    clientName: d.user?.name || null,
                })),
            },
        });

        // 6. Return immediately
        return NextResponse.json({
            message: `Reminders queued for ${debtorsToNotify.length} debtor(s). Email → SMS → 15s wait → Call running in background.`,
            count: debtorsToNotify.length,
        });

    } catch (error) {
        console.error("Error queuing reminders:", error);
        return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
    }
}