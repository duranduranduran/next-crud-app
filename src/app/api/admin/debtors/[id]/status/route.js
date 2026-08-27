// export const runtime = "nodejs";
//
// import { NextResponse } from "next/server";
// import { auth, currentUser } from "@clerk/nextjs/server";
// import { prisma } from "@/lib/prisma";
//
// export async function PATCH(req, { params }) {
//     // 1. Auth
//     const { userId } = await auth();
//
//     if (!userId) {
//         return NextResponse.json(
//             { message: "Unauthorized" },
//             { status: 401 }
//         );
//     }
//
//     // 2. Role check (admin only)
//     const user = await currentUser();
//
//     if (!user || user.publicMetadata?.role !== "admin") {
//         return NextResponse.json(
//             { message: "Forbidden" },
//             { status: 403 }
//         );
//     }
//
//     // 3. Params & body
//     const { id } = params;
//     const { status } = await req.json();
//
//     // 4. Validate status
//     const validStatuses = [
//         "PENDIENTE",
//         "EN_GESTION",
//         "ACUERDO_DE_PAGO",
//         "PAGADO",
//         "ESCALADO_JUDICIAL",
//     ];
//
//     if (!validStatuses.includes(status)) {
//         return NextResponse.json(
//             { message: "Invalid status value" },
//             { status: 400 }
//         );
//     }
//
//     // 5. Update debtor
//     try {
//         const updatedDebtor = await prisma.debtor.update({
//             where: { id },
//             data: { status },
//         });
//
//         return NextResponse.json(
//             { message: "Status updated", debtor: updatedDebtor },
//             { status: 200 }
//         );
//     } catch (err) {
//         console.error("[ADMIN_DEBTOR_STATUS_PATCH_ERROR]", err);
//         return NextResponse.json(
//             { message: "Server error" },
//             { status: 500 }
//         );
//     }
// }


export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/getOrCreateUser";

export async function PATCH(req, { params }) {
    // 1. Auth
    const { userId } = await auth();

    if (!userId) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // 2. Role check (admin only)
    const clerkUser = await currentUser();

    if (!clerkUser || clerkUser.publicMetadata?.role !== "admin") {
        return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    // 3. Params & body
    const { id } = await params;
    const { status } = await req.json();

    // 4. Validate status
    const validStatuses = [
        "PENDIENTE",
        "EN_GESTION",
        "ACUERDO_DE_PAGO",
        "PAGADO",
        "ESCALADO_JUDICIAL",
    ];

    if (!validStatuses.includes(status)) {
        return NextResponse.json({ message: "Invalid status value" }, { status: 400 });
    }

    try {
        // NOTE: this is a generic status update, not a notification trigger.
        // Masiva template 3 (5-day legal notice) must never fire automatically
        // from a status transition here (e.g. -> ESCALADO_JUDICIAL) — it
        // requires its own endpoint, its own confirmation dialog, and
        // deliberate client authorization. Do not wire an SMS send into this
        // handler for template 3.

        // 5. Get current debtor BEFORE updating
        const existingDebtor = await prisma.debtor.findUnique({
            where: { id },
            select: { status: true, name: true },
        });

        if (!existingDebtor) {
            return NextResponse.json({ message: "Debtor not found" }, { status: 404 });
        }

        // 6. Find (or self-heal) the DB user. A bare findUnique({where:{clerkId}})
        // 404s if the stored clerkId is out of sync with what Clerk's current
        // session reports — getOrCreateUser upserts by email instead, so a
        // real admin row that exists but has a stale clerkId gets its clerkId
        // corrected here rather than the request failing.
        const dbUser = await getOrCreateUser();

        if (!dbUser) {
            return NextResponse.json({ message: "User sync failed" }, { status: 500 });
        }

        // 7. Update debtor + log in one transaction
        const [updatedDebtor] = await prisma.$transaction([
            prisma.debtor.update({
                where: { id },
                data: { status },
            }),
            prisma.activityLog.create({
                data: {
                    event: "STATUS_CHANGED",
                    detail: `${existingDebtor.name}: ${existingDebtor.status} → ${status}`,
                    userId: dbUser.id,
                    debtorId: id,
                },
            }),
        ]);

        return NextResponse.json(
            { message: "Status updated", debtor: updatedDebtor },
            { status: 200 }
        );
    } catch (err) {
        console.error("[ADMIN_DEBTOR_STATUS_PATCH_ERROR]", err);
        return NextResponse.json({ message: "Server error" }, { status: 500 });
    }
}

