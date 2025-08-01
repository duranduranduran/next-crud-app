import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const filePath = path.join(process.cwd(), 'reminderTime.json');

export async function GET(request) {
    try {
        const body = await request.json();
        const { hour, minute } = body;

        if (
            isNaN(hour) || isNaN(minute) ||
            hour < 0 || hour > 23 ||
            minute < 0 || minute > 59
        ) {
            return NextResponse.json({ error: 'Invalid time' }, { status: 400 });
        }

        await fs.writeFile(filePath, JSON.stringify({ hour, minute }));
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to save time' }, { status: 500 });
    }
}