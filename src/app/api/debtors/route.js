import { prisma } from '@/lib/prisma';
import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';

// CREATE a debtor
export async function POST(req) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    if (!token || !token.email) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, email, amountOwed, documentUrl, telephone, address, cedulaIdentidad } = body;

    if (!name || !amountOwed || !cedulaIdentidad) {
        return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { email: token.email },
        });

        if (!user) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        const debtor = await prisma.debtor.create({
            data: {
                name,
                email: email || null,
                telephone: telephone || null,
                address: address || null,
                cedulaIdentidad,
                amountOwed: parseFloat(amountOwed),
                userId: user.id,
                documentUrl: documentUrl || null,
            },
        });

        return NextResponse.json({ message: 'Debtor created', debtor }, { status: 201 });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ message: 'Server error' }, { status: 500 });
    }
}

// GET list of debtors
export async function GET(req) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    if (!token || !token.email) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { email: token.email },
        });

        if (!user) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        const debtors = await prisma.debtor.findMany({
            where: {
                userId: user.id,
            },
        });

        return NextResponse.json(debtors, { status: 200 });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ message: 'Server error' }, { status: 500 });
    }
}

// UPDATE a debtor
export async function PATCH(req) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    if (!token || !token.email) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { id, name, email, amountOwed, documentUrl, telephone, address, cedulaIdentidad } = body;

    if (!id || !name || !amountOwed || !cedulaIdentidad) {
        return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

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
            },
            data: {
                name,
                email: email || null,
                telephone: telephone || null,
                address: address || null,
                cedulaIdentidad,
                amountOwed: parseFloat(amountOwed),
                documentUrl: documentUrl || null,
            },
        });

        return NextResponse.json({ message: 'Debtor updated', debtor: updatedDebtor }, { status: 200 });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ message: 'Server error' }, { status: 500 });
    }
}
