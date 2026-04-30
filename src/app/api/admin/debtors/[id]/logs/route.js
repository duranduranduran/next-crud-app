export const runtime = "nodejs";

import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req, { params }) {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await currentUser();
    if (!user || user.publicMetadata?.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const logs = await prisma.activityLog.findMany({
        where: { debtorId: id },
        orderBy: { createdAt: "desc" },
        take: 20,
        include: { user: { select: { name: true, email: true } } },
    });

    return NextResponse.json(logs);
}