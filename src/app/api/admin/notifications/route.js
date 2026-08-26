export const runtime = "nodejs";

import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Mirrors GET /api/admin/logs: fetch everything, filter client-side —
// same convention as the existing activity-log page.
export async function GET() {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const clerkUser = await currentUser();
    if (!clerkUser || clerkUser.publicMetadata?.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const logs = await prisma.notificationLog.findMany({
            orderBy: { sentAt: "desc" },
            include: {
                debtor: { select: { name: true } },
                user: { select: { name: true, email: true } },
            },
        });

        return NextResponse.json(logs);
    } catch (err) {
        console.error("[NOTIFICATIONS_GET]", err);
        return NextResponse.json({ error: "Failed to fetch notification logs" }, { status: 500 });
    }
}
