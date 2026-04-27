export const runtime = "nodejs";

import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/getOrCreateUser";

export async function GET() {
    try {
        const { userId } = await auth();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const user = await getOrCreateUser();
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        // Get all debtor IDs for this client
        const debtors = await prisma.debtor.findMany({
            where: { userId: user.id },
            select: { id: true },
        });

        const debtorIds = debtors.map(d => d.id);

        // Get activity logs for those debtors
        const logs = await prisma.activityLog.findMany({
            where: {
                debtorId: { in: debtorIds },
                event: { in: ["REMINDER_SENT", "CALL_TRIGGERED"] },
            },
            orderBy: { createdAt: "desc" },
            include: {
                debtor: { select: { name: true } },
            },
            take: 50,
        });

        // Summary stats
        const totalEmails = logs.filter(l => l.event === "REMINDER_SENT" && l.detail.includes("Email")).length;
        const totalCalls = logs.filter(l => l.event === "CALL_TRIGGERED").length;
        const totalSms = logs.filter(l => l.event === "REMINDER_SENT" && l.detail.includes("SMS")).length;

        // Per debtor notification count
        const byDebtor = debtorIds.map(id => {
            const debtorLogs = logs.filter(l => l.debtorId === id);
            return {
                id,
                name: debtorLogs[0]?.debtor?.name || id,
                emails: debtorLogs.filter(l => l.detail.includes("Email")).length,
                calls: debtorLogs.filter(l => l.event === "CALL_TRIGGERED").length,
                total: debtorLogs.length,
                lastContact: debtorLogs[0]?.createdAt || null,
            };
        }).filter(d => d.total > 0).sort((a, b) => b.total - a.total);

        return NextResponse.json({ logs, totalEmails, totalCalls, totalSms, byDebtor });
    } catch (err) {
        console.error("[DEBTOR_LOGS_GET]", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}