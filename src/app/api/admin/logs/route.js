export const runtime = "nodejs";

import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    // 1. Auth
    const { userId } = await auth();

    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Role check
    const clerkUser = await currentUser();

    if (!clerkUser || clerkUser.publicMetadata?.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 3. Fetch logs
    try {
        const logs = await prisma.activityLog.findMany({
            orderBy: { createdAt: "desc" },
            include: {
                user: {
                    select: { name: true, email: true },
                },
                debtor: {
                    select: { name: true },
                },
            },
        });

        return NextResponse.json(logs);
    } catch (err) {
        console.error("[LOGS_GET]", err);
        return NextResponse.json({ error: "Failed to fetch logs" }, { status: 500 });
    }
}
