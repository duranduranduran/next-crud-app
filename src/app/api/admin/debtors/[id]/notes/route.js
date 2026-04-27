// export const runtime = "nodejs";
//
// import { auth, currentUser } from "@clerk/nextjs/server";
// import { NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";
//
// export async function GET() {
//     return NextResponse.json({ ok: true });
// }
// export async function POST(req, { params }) {
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
//         const { id } = await params; // 👈 await params
//         const { content } = await req.json();
//
//         const dbUser = await prisma.user.findUnique({
//             where: { clerkId: userId },
//         });
//
//         if (!dbUser) {
//             return NextResponse.json({ error: "User not found" }, { status: 404 });
//         }
//
//         const note = await prisma.debtorNote.create({
//             data: {
//                 content,
//                 debtorId: id,
//                 userId: dbUser.id,
//             },
//         });
//
//         return NextResponse.json(note);
//     } catch (err) {
//         console.error(err);
//         return NextResponse.json(
//             { error: "Failed to create note" },
//             { status: 500 }
//         );
//     }
// }

export const runtime = "nodejs";

import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    return NextResponse.json({ ok: true });
}

export async function POST(req, { params }) {
    console.log("POST notes hit");
    const { userId } = await auth();
    console.log("userId:", userId);

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
        const { id } = await params;
        const { content } = await req.json();

        // Find DB user by clerkId
        const dbUser = await prisma.user.findUnique({
            where: { clerkId: userId },
        });

        if (!dbUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Get debtor name for the log
        const debtor = await prisma.debtor.findUnique({
            where: { id },
            select: { name: true },
        });

        // Create note + log in one transaction
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
                    detail: `Note added on ${debtor?.name || "unknown"}: "${content.slice(0, 60)}${content.length > 60 ? "..." : ""}"`,
                    userId: dbUser.id,
                    debtorId: id,
                },
            }),
        ]);

        return NextResponse.json(note);
    } catch (err) {
        console.error(err);
        return NextResponse.json(
            { error: "Failed to create note" },
            { status: 500 }
        );
    }
}