export const runtime = "nodejs";

import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/getOrCreateUser";

export async function GET() {
    return NextResponse.json({ ok: true });
}

export async function POST(req, { params }) {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await currentUser();
    if (!user || user.publicMetadata?.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const { id } = await params;
        const { content } = await req.json();

        const dbUser = await getOrCreateUser();
        if (!dbUser) return NextResponse.json({ error: "User sync failed" }, { status: 500 });

        const debtor = await prisma.debtor.findUnique({
            where: { id },
            select: { name: true },
        });

        const [note] = await prisma.$transaction([
            prisma.debtorNote.create({
                data: {
                    content,
                    debtorId: id,
                    userId: dbUser.id,
                },
            }),
            prisma.activityLog.create({
                data: {
                    event: "NOTE_ADDED",
                    detail: `Nota agregada en ${debtor?.name || "unknown"}: "${content.slice(0, 60)}${content.length > 60 ? "..." : ""}"`,
                    userId: dbUser.id,
                    debtorId: id,
                },
            }),
        ]);

        return NextResponse.json(note);
    } catch (err) {
        console.error("[NOTES_POST_ERROR]", err);
        return NextResponse.json({ error: "Failed to create note" }, { status: 500 });
    }
}