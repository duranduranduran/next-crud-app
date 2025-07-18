import { prisma } from '@/lib/prisma';
import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';

export async function PATCH(req, { params }) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    if (!token || !token.email) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();
    const { name, email, amountOwed } = body;

    try {
        const user = await prisma.user.findUnique({
            where: { email: token.email },
        });

        if (!user) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        const updatedDebtor = await prisma.debtor.update({
            where: {
                id,
                userId: user.id,
            },
            data: {
                name,
                email,
                amountOwed: parseFloat(amountOwed),
            },
        });

        return NextResponse.json({ message: 'Debtor updated', debtor: updatedDebtor }, { status: 200 });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ message: 'Server error' }, { status: 500 });
    }
}

export async function DELETE(req, { params }) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    if (!token || !token.email) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    try {
        const user = await prisma.user.findUnique({
            where: { email: token.email },
        });

        if (!user) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        await prisma.debtor.delete({
            where: {
                id,
                userId: user.id,
            },
        });

        return NextResponse.json({ message: 'Debtor deleted' }, { status: 200 });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ message: 'Server error' }, { status: 500 });
    }
}