import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

// -------------------------
// UPDATE debtor
// -------------------------
export async function PATCH(req, { params }) {
    const { userId, sessionClaims } = auth();

    if (!userId) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const role = sessionClaims?.publicMetadata?.role;

    if (role !== 'client') {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const { id } = params;
    const body = await req.json();

    const {
        name,
        email,
        amountOwed,
        documentUrl,
        telephone,
        address,
        cedulaIdentidad,
    } = body;

    if (!id || !name || !amountOwed || !cedulaIdentidad) {
        return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    try {
        // buscar user por clerkUserId
        const user = await prisma.user.findUnique({
            where: { clerkUserId: userId },
        });

        if (!user) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        // validar cédula duplicada
        const existingDebtor = await prisma.debtor.findFirst({
            where: {
                cedulaIdentidad,
                NOT: { id },
            },
        });

        if (existingDebtor) {
            return NextResponse.json(
                { message: 'Cédula de Identidad already in use by another debtor' },
                { status: 400 }
            );
        }

        // asegurar ownership
        const debtor = await prisma.debtor.findUnique({ where: { id } });

        if (!debtor || debtor.userId !== user.id) {
            return NextResponse.json({ message: 'Debtor not found or unauthorized' }, { status: 404 });
        }

        const updatedDebtor = await prisma.debtor.update({
            where: { id },
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

        return NextResponse.json(
            { message: 'Debtor updated', debtor: updatedDebtor },
            { status: 200 }
        );
    } catch (err) {
        console.error(err);
        return NextResponse.json({ message: 'Server error' }, { status: 500 });
    }
}

// -------------------------
// DELETE debtor
// -------------------------
export async function DELETE(req, { params }) {
    const { userId, sessionClaims } = auth();

    if (!userId) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const role = sessionClaims?.publicMetadata?.role;

    if (role !== 'client') {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const { id } = params;

    try {
        const user = await prisma.user.findUnique({
            where: { clerkUserId: userId },
        });

        if (!user) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        const debtor = await prisma.debtor.findUnique({ where: { id } });

        if (!debtor || debtor.userId !== user.id) {
            return NextResponse.json({ message: 'Debtor not found or unauthorized' }, { status: 404 });
        }

        await prisma.debtor.delete({ where: { id } });

        return NextResponse.json({ message: 'Debtor deleted' }, { status: 200 });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ message: 'Server error' }, { status: 500 });
    }
}
