

import { prisma } from '@/lib/prisma';
import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';

// BULK CREATE debtors
export async function POST(req) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    if (!token || !token.email) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    if (!Array.isArray(body)) {
        return NextResponse.json({ message: 'Expected an array of debtors' }, { status: 400 });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { email: token.email },
        });

        if (!user) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        const created = [];
        const errors = [];

        for (let i = 0; i < body.length; i++) {
            const debtor = body[i];
            const { name, email, amountOwed, documentUrl, telephone, address, cedulaIdentidad } = debtor;

            // Basic validation
            if (!name || !amountOwed || !cedulaIdentidad) {
                errors.push({ row: i + 2, debtor, message: 'Missing required fields' }); // +2 to match Excel row
                continue;
            }

            // Convert amountOwed to float
            const parsedAmount = parseFloat(amountOwed);
            if (isNaN(parsedAmount)) {
                errors.push({ row: i + 2, debtor, message: 'Invalid amountOwed' });
                continue;
            }

            try {
                const newDebtor = await prisma.debtor.create({
                    data: {
                        name,
                        email: email || null,
                        telephone: telephone || null,
                        address: address || null,
                        cedulaIdentidad,
                        amountOwed: parsedAmount,
                        documentUrl: documentUrl || null,
                        userId: user.id,
                    },
                });

                created.push(newDebtor);
            } catch (err) {
                // Catch database errors (like duplicate cedulaIdentidad for the same user)
                errors.push({ row: i + 2, debtor, message: err.message });
            }
        }

        return NextResponse.json({ created, errors }, { status: 201 });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ message: 'Server error' }, { status: 500 });
    }
}
