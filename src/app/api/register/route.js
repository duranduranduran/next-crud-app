import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req) {
    try {
        const body = await req.json();
        const { email, name, password } = body;

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({ where: { email } });

        if (existingUser) {
            return NextResponse.json({ message: 'User already exists' }, { status: 400 });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Save user (default role = 'client')
        await prisma.user.create({
            data: {
                email,
                name,
                hashedPassword,
                role: 'client',
            },
        });

        return NextResponse.json({ message: 'User created' }, { status: 201 });
    } catch (error) {
        console.error('Error in register route:', error);
        return NextResponse.json({ message: 'Something went wrong' }, { status: 500 });
    }
}