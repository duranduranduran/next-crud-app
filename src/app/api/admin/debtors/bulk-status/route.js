import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { prisma } from '@/lib/prisma'; // <-- named import

export async function POST(req) {
    try {
        const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
        if (!token || token.role !== 'admin') {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { debtorIds, status } = await req.json();

        const validStatuses = [
            'PENDIENTE',
            'EN_GESTION',
            'ACUERDO_DE_PAGO',
            'PAGADO',
            'ESCALADO_JUDICIAL',
        ];

        if (!Array.isArray(debtorIds) || debtorIds.length === 0) {
            return NextResponse.json({ message: 'No debtors selected' }, { status: 400 });
        }
        if (!validStatuses.includes(status)) {
            return NextResponse.json({ message: 'Invalid status value' }, { status: 400 });
        }

        await prisma.debtor.updateMany({
            where: { id: { in: debtorIds } },
            data: { status },
        });

        return NextResponse.json({ message: 'Status updated successfully' }, { status: 200 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
