export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { inngest } from "@/inngest/client";
import { getOrCreateUser } from "@/lib/getOrCreateUser";

export async function GET() {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const clerkUser = await currentUser();
        if (!clerkUser || clerkUser.publicMetadata?.role !== "admin") {
            return NextResponse.json({ message: "Forbidden" }, { status: 403 });
        }

        // Replace findUnique with getOrCreateUser
        const dbUser = await getOrCreateUser();
        if (!dbUser) {
            return NextResponse.json({ message: "User sync failed" }, { status: 500 });
        }

        const debtorsToNotify = await prisma.debtor.findMany({
            where: { availableForNotify: true },
            include: { user: true },
        });

        if (debtorsToNotify.length === 0) {
            return NextResponse.json({ message: "No debtors to notify." });
        }

        await inngest.send({
            name: "reminders/send",
            data: {
                dbUserId: dbUser.id,
                debtors: debtorsToNotify.map((d) => ({
                    id: d.id,
                    name: d.name,
                    email: d.email,
                    telephone: d.telephone,
                    amountOwed: d.amountOwed,
                    smsOptOut: d.smsOptOut,
                    clientName: d.user?.name || null,
                })),
            },
        });

        return NextResponse.json({
            message: `Reminders queued for ${debtorsToNotify.length} debtor(s). Email → SMS → 15s wait → Call running in background.`,
            count: debtorsToNotify.length,
        });

    } catch (error) {
        console.error("Error queuing reminders:", error);
        return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
    }
}