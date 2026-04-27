export const runtime = "nodejs";

import { prisma } from '@/lib/prisma';
import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const clerkUser = await currentUser();
        if (!clerkUser || clerkUser.publicMetadata?.role !== 'admin') {
            return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
        }

        // Existing metrics
        const totalDebtors = await prisma.debtor.count();

        const totalAmount = await prisma.debtor.aggregate({
            _sum: { amountOwed: true }
        });

        const totalPaid = await prisma.debtor.aggregate({
            _sum: { amountOwed: true },
            where: { status: 'PAGADO' }
        });

        const statusCounts = await prisma.debtor.groupBy({
            by: ['status'],
            _count: { status: true }
        });

        const formattedStatus = {};
        statusCounts.forEach(item => {
            formattedStatus[item.status] = item._count.status;
        });

        // --- CALL METRICS ---

        // Total calls ever
        const totalCalls = await prisma.activityLog.count({
            where: { event: 'CALL_TRIGGERED' }
        });

        // Calls in last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const recentCalls = await prisma.activityLog.findMany({
            where: {
                event: 'CALL_TRIGGERED',
                createdAt: { gte: sevenDaysAgo }
            },
            select: { createdAt: true }
        });

        // Group calls by day
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

        // Total reminders sent
        const totalReminders = await prisma.activityLog.count({
            where: { event: 'REMINDER_SENT' }
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
        });

    } catch (err) {
        console.error("SERVER ERROR:", err);
        return NextResponse.json({ message: 'Server error' }, { status: 500 });
    }
}