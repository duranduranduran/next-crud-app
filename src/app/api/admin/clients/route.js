import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
    try {
        const clients = await prisma.user.findMany({
            where: {
                role: 'client',
            },
            include: {
                debtorRecords: true,
            },
        });

        return NextResponse.json({ clients });
    } catch (error) {
        console.error('[ADMIN_CLIENTS_GET_ERROR]', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}