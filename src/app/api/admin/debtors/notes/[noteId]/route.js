export const runtime = "nodejs";

import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(req, { params }) {
    // 1. Auth (Clerk v5)
    const { userId } = await auth();

    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Get full user from Clerk
    const user = await currentUser();

    if (!user || user.publicMetadata?.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 3. Business logic
    try {
        const { noteId } = params;

        await prisma.debtorNote.delete({
            where: { id: noteId },
        });

        return NextResponse.json({ message: "Note deleted" });
    } catch (err) {
        console.error(err);
        return NextResponse.json(
            { error: "Failed to delete note" },
            { status: 500 }
        );
    }
}