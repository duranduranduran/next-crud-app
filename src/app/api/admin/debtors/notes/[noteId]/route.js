// export const runtime = "nodejs";
//
// import { auth, currentUser } from "@clerk/nextjs/server";
// import { NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";
//
// export async function DELETE(req, { params }) {
//     // 1. Auth (Clerk v5)
//     const { userId } = await auth();
//
//     if (!userId) {
//         return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }
//
//     // 2. Get full user from Clerk
//     const user = await currentUser();
//
//     if (!user || user.publicMetadata?.role !== "admin") {
//         return NextResponse.json({ error: "Forbidden" }, { status: 403 });
//     }
//
//     // 3. Business logic
//     try {
//         const { noteId } = params;
//
//         await prisma.debtorNote.delete({
//             where: { id: noteId },
//         });
//
//         return NextResponse.json({ message: "Note deleted" });
//     } catch (err) {
//         console.error(err);
//         return NextResponse.json(
//             { error: "Failed to delete note" },
//             { status: 500 }
//         );
//     }
// }

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
        const { noteId } = await params;

        // Get note + debtor info BEFORE deleting
        const note = await prisma.debtorNote.findUnique({
            where: { id: noteId },
            select: {
                content: true,
                debtorId: true,
                debtor: { select: { name: true } },
            },
        });

        if (!note) {
            return NextResponse.json({ error: "Note not found" }, { status: 404 });
        }

        // Find DB user by clerkId
        const dbUser = await prisma.user.findUnique({
            where: { clerkId: userId },
        });

        if (!dbUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Delete note + log in one transaction
        await prisma.$transaction([
            prisma.debtorNote.delete({
                where: { id: noteId },
            }),
            prisma.activityLog.create({
                data: {
                    event: "NOTE_DELETED",
                    detail: `Note deleted on ${note.debtor?.name || "unknown"}: "${note.content.slice(0, 60)}${note.content.length > 60 ? "..." : ""}"`,
                    userId: dbUser.id,
                    debtorId: note.debtorId,
                },
            }),
        ]);

        return NextResponse.json({ message: "Note deleted" });
    } catch (err) {
        console.error(err);
        return NextResponse.json(
            { error: "Failed to delete note" },
            { status: 500 }
        );
    }
}