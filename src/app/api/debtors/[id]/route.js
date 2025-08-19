// import { prisma } from '@/lib/prisma';
// import { getToken } from 'next-auth/jwt';
// import { NextResponse } from 'next/server';
//
// export async function PATCH(req, { params }) {
//     const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
//
//     if (!token || !token.email) {
//         return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
//     }
//
//     const { id } = params;
//     const body = await req.json();
//     const { name, email, amountOwed } = body;
//
//     try {
//         const user = await prisma.user.findUnique({
//             where: { email: token.email },
//         });
//
//         if (!user) {
//             return NextResponse.json({ message: 'User not found' }, { status: 404 });
//         }
//
//         const updatedDebtor = await prisma.debtor.update({
//             where: {
//                 id,
//                 userId: user.id,
//             },
//             data: {
//                 name,
//                 email,
//                 amountOwed: parseFloat(amountOwed),
//             },
//         });
//
//         return NextResponse.json({ message: 'Debtor updated', debtor: updatedDebtor }, { status: 200 });
//     } catch (err) {
//         console.error(err);
//         return NextResponse.json({ message: 'Server error' }, { status: 500 });
//     }
// }
//
// export async function DELETE(req, { params }) {
//     const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
//
//     if (!token || !token.email) {
//         return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
//     }
//
//     const { id } = params;
//
//     try {
//         const user = await prisma.user.findUnique({
//             where: { email: token.email },
//         });
//
//         if (!user) {
//             return NextResponse.json({ message: 'User not found' }, { status: 404 });
//         }
//
//         await prisma.debtor.delete({
//             where: {
//                 id,
//                 userId: user.id,
//             },
//         });
//
//         return NextResponse.json({ message: 'Debtor deleted' }, { status: 200 });
//     } catch (err) {
//         console.error(err);
//         return NextResponse.json({ message: 'Server error' }, { status: 500 });
//     }
// }


import { prisma } from '@/lib/prisma';
import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';

// UPDATE a debtor by ID
export async function PATCH(req, { params }) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    if (!token || !token.email) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();
    const { name, email, amountOwed, documentUrl, telephone, address, cedulaIdentidad } = body;

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

        // Check if another debtor already has this cedulaIdentidad
        const existingDebtor = await prisma.debtor.findFirst({
            where: {
                cedulaIdentidad,
                NOT: { id }, // ignore the current debtor
            },
        });

        if (existingDebtor) {
            return NextResponse.json({ message: 'Cédula de Identidad already in use by another debtor' }, { status: 400 });
        }

        const updatedDebtor = await prisma.debtor.update({
            where: { id }, // only use id as unique field
            data: {
                name,
                email: email || null,
                telephone: telephone || null,
                address: address || null,
                cedulaIdentidad,
                amountOwed: parseFloat(amountOwed),
                documentUrl: documentUrl || null,
                userId: user.id, // optional if you want to ensure ownership
            },
        });

        return NextResponse.json({ message: 'Debtor updated', debtor: updatedDebtor }, { status: 200 });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ message: 'Server error' }, { status: 500 });
    }
}

// DELETE a debtor by ID
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

        // Ensure the debtor belongs to this user before deleting
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
