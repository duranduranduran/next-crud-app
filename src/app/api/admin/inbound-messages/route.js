export const runtime = "nodejs";

import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/getOrCreateUser";

// GET all inbound messages for admin
export async function GET(req) {
    try {
        const { userId } = await auth();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const user = await currentUser();
        if (!user || user.publicMetadata?.role !== "admin") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const channel = searchParams.get("channel"); // EMAIL | SMS | all
        const unreadOnly = searchParams.get("unread") === "true";

        const where = {};
        if (channel && channel !== "all") where.channel = channel;
        if (unreadOnly) where.readByClientAt = null;

        // No clientId filter here on purpose: this route is gated to admin
        // role above and is meant to surface every inbound message, including
        // unmatched SMS with a null debtor/clientId (the Masiva account is
        // shared across tenants, so an unmatched from_number has no derivable
        // client). If a client-facing version of this query is ever built,
        // it must add `where: { clientId: dbUser.id }` — a plain equality
        // filter already excludes null-clientId rows under SQL semantics, so
        // that's sufficient on its own; do not also OR in `clientId: null`.
        const messages = await prisma.inboundMessage.findMany({
            where,
            orderBy: { receivedAt: "desc" },
            include: {
                debtor: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        amountOwed: true,
                        status: true,
                        invoiceNumber: true,
                        ruc: true,
                        cedulaIdentidad: true,
                        user: {
                            select: { name: true, email: true },
                        },
                    },
                },
            },
        });

        return NextResponse.json(messages);
    } catch (err) {
        console.error("[INBOUND_MESSAGES_GET]", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}

// PATCH — mark message as read
export async function PATCH(req) {
    try {
        const { userId } = await auth();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const user = await currentUser();
        if (!user || user.publicMetadata?.role !== "admin") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { id, read } = await req.json();
        if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

        const updated = await prisma.inboundMessage.update({
            where: { id },
            data: {
                readByClientAt: read ? new Date() : null,
            },
        });

        return NextResponse.json(updated);
    } catch (err) {
        console.error("[INBOUND_MESSAGES_PATCH]", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
