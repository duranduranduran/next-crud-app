export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function POST(req) {
    try {
        // 1. Auth
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            );
        }

        // 2. Role check (admin only)
        const user = await currentUser();

        if (!user || user.publicMetadata?.role !== "admin") {
            return NextResponse.json(
                { message: "Forbidden" },
                { status: 403 }
            );
        }

        // 3. Body
        const { debtorIds, status } = await req.json();

        const validStatuses = [
            "PENDIENTE",
            "EN_GESTION",
            "ACUERDO_DE_PAGO",
            "PAGADO",
            "ESCALADO_JUDICIAL",
        ];

        // 4. Validations
        if (!Array.isArray(debtorIds) || debtorIds.length === 0) {
            return NextResponse.json(
                { message: "No debtors selected" },
                { status: 400 }
            );
        }

        if (!validStatuses.includes(status)) {
            return NextResponse.json(
                { message: "Invalid status value" },
                { status: 400 }
            );
        }

        // 5. Update many
        await prisma.debtor.updateMany({
            where: {
                id: { in: debtorIds },
            },
            data: { status },
        });

        return NextResponse.json(
            { message: "Status updated successfully" },
            { status: 200 }
        );
    } catch (error) {
        console.error("[ADMIN_BULK_STATUS_ERROR]", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}
