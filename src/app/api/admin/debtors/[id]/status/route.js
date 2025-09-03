import { prisma } from '@/lib/prisma';
import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';

export async function PATCH(req, { params }) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    if (!token || token.role !== 'admin') {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();
    const { status } = body;

    // Validate status
    const validStatuses = [
        'PENDIENTE',
        'EN_GESTION',
        'ACUERDO_DE_PAGO',
        'PAGADO',
        'ESCALADO_JUDICIAL'
    ];

    if (!validStatuses.includes(status)) {
        return NextResponse.json({ message: 'Invalid status value' }, { status: 400 });
    }

    try {
        const updatedDebtor = await prisma.debtor.update({
            where: { id },
            data: { status }
        });

        return NextResponse.json({ message: 'Status updated', debtor: updatedDebtor }, { status: 200 });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ message: 'Server error' }, { status: 500 });
    }
}
