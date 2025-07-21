import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getToken } from 'next-auth/jwt';

export async function PATCH(req, { params }) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    if (!token || token.role !== 'admin') {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const debtor = await prisma.debtor.update({
            where: { id: params.id },
            data: {
                availableForNotify: {
                    // toggle current value
                    set: !(await prisma.debtor.findUnique({ where: { id: params.id } })).availableForNotify,
                },
            },
        });
        return NextResponse.json(debtor);
    } catch (error) {
        console.error('Error toggling availability:', error);
        return NextResponse.json({ error: 'Error toggling availability' }, { status: 500 });
    }
}