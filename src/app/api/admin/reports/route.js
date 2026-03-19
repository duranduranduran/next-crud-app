import { prisma } from '@/lib/prisma';
import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from 'next/server';

export async function GET(req) {
    try {
        // 🔥 Get full Clerk user (more reliable)
        const clerkUser = await currentUser();

        console.log("CLERK USER:", clerkUser);

        if (!clerkUser) {
            return NextResponse.json(
                { message: 'Unauthorized' },
                { status: 401 }
            );
        }

        // 🔥 Use email instead of clerkId (since your DB likely already has this)
        const email = clerkUser.emailAddresses[0].emailAddress;

        const user = await prisma.user.findUnique({
            where: { email },
        });

        console.log("DB USER:", user);

        if (!user || user.role !== 'admin') {
            return NextResponse.json(
                { message: 'Forbidden' },
                { status: 403 }
            );
        }

        // 🔥 YOUR ORIGINAL LOGIC (unchanged)
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

        return NextResponse.json({
            totalDebtors,
            totalAmountOwed: totalAmount._sum.amountOwed || 0,
            totalCollected: totalPaid._sum.amountOwed || 0,
            byStatus: formattedStatus
        });

    } catch (err) {
        console.error("SERVER ERROR:", err);
        return NextResponse.json(
            { message: 'Server error' },
            { status: 500 }
        );
    }
}