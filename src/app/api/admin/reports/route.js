export const runtime = "nodejs";

import { prisma } from '@/lib/prisma';
import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from 'next/server';

export async function GET(req) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const clerkUser = await currentUser();
        if (!clerkUser || clerkUser.publicMetadata?.role !== 'admin') {
            return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
        }

        // --- PERIOD FILTER ---
        const { searchParams } = new URL(req.url);
        const period = searchParams.get("period") || "all";

        let dateFilter = {};
        if (period === "7d") {
            const d = new Date();
            d.setDate(d.getDate() - 7);
            dateFilter = { createdAt: { gte: d } };
        } else if (period === "30d") {
            const d = new Date();
            d.setDate(d.getDate() - 30);
            dateFilter = { createdAt: { gte: d } };
        }

        // --- DEBTOR METRICS ---
        const totalDebtors = await prisma.debtor.count({
            where: dateFilter,
        });

        const totalAmount = await prisma.debtor.aggregate({
            _sum: { amountOwed: true },
            where: dateFilter,
        });

        const totalPaid = await prisma.debtor.aggregate({
            _sum: { amountOwed: true },
            where: { status: 'PAGADO', ...dateFilter },
        });

        const statusCounts = await prisma.debtor.groupBy({
            by: ['status'],
            _count: { status: true },
            where: dateFilter,
        });

        const formattedStatus = {};
        statusCounts.forEach(item => {
            formattedStatus[item.status] = item._count.status;
        });

        // --- CALL METRICS (filtered by period) ---
        const totalCalls = await prisma.activityLog.count({
            where: { event: 'CALL_TRIGGERED', ...dateFilter },
        });

        // Calls in last 7 days (always fixed at 7d for the chart regardless of period)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const recentCalls = await prisma.activityLog.findMany({
            where: {
                event: 'CALL_TRIGGERED',
                createdAt: { gte: sevenDaysAgo },
            },
            select: { createdAt: true },
        });

        // Group calls by day (last 7 days chart — always shown)
        const callsByDay = {};
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const key = date.toISOString().split('T')[0];
            callsByDay[key] = 0;
        }

        recentCalls.forEach(log => {
            const key = log.createdAt.toISOString().split('T')[0];
            if (callsByDay[key] !== undefined) {
                callsByDay[key]++;
            }
        });

        const callsPerDay = Object.entries(callsByDay).map(([date, count]) => ({
            date: new Date(date).toLocaleDateString('es-EC', { weekday: 'short', day: 'numeric' }),
            calls: count,
        }));

        // --- REMINDERS (filtered by period) ---
        const totalReminders = await prisma.activityLog.count({
            where: { event: 'REMINDER_SENT', ...dateFilter },
        });

        return NextResponse.json({
            totalDebtors,
            totalAmountOwed: totalAmount._sum.amountOwed || 0,
            totalCollected: totalPaid._sum.amountOwed || 0,
            byStatus: formattedStatus,
            calls: {
                total: totalCalls,
                last7Days: recentCalls.length,
                perDay: callsPerDay,
            },
            totalReminders,
            period,
        });

    } catch (err) {
        console.error("SERVER ERROR:", err);
        return NextResponse.json({ message: 'Server error' }, { status: 500 });
    }
}