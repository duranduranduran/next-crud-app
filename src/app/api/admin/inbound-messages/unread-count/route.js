export const runtime = "nodejs";

import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET unread count for bell icon polling
export async function GET() {
    try {
        const { userId } = await auth();
        if (!userId) return NextResponse.json({ count: 0 });

        const user = await currentUser();
        if (!user || user.publicMetadata?.role !== "admin") {
            return NextResponse.json({ count: 0 });
        }

        const count = await prisma.inboundMessage.count({
            where: { readByClientAt: null },
        });

        return NextResponse.json({ count });
    } catch (err) {
        console.error("[UNREAD_COUNT_GET]", err);
        return NextResponse.json({ count: 0 });
    }
}
