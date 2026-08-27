export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

const SHORT_NAME_MAX_LENGTH = 12;

// Admin editing a client record — currently just shortName (the field an
// admin needs to set for SMS to work at all, and the one that had no
// editing UI anywhere before this route existed), kept narrow rather than
// a general client-PATCH to avoid opening up fields with their own
// separate ownership/validation rules (email, role) through a side door.
export async function PATCH(req, { params }) {
    try {
        const { userId } = await auth();
        if (!userId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

        const clerkUser = await currentUser();
        if (!clerkUser || clerkUser.publicMetadata?.role !== "admin") {
            return NextResponse.json({ message: "Forbidden" }, { status: 403 });
        }

        const { id } = await params;
        const { shortName } = await req.json();

        if (typeof shortName !== "string") {
            return NextResponse.json({ message: "shortName es obligatorio" }, { status: 400 });
        }
        const trimmed = shortName.trim();
        if (trimmed.length === 0) {
            return NextResponse.json({ message: "shortName no puede estar vacío" }, { status: 400 });
        }
        if (trimmed.length > SHORT_NAME_MAX_LENGTH) {
            return NextResponse.json({ message: `shortName no puede superar ${SHORT_NAME_MAX_LENGTH} caracteres` }, { status: 400 });
        }

        const client = await prisma.user.findUnique({ where: { id }, select: { id: true, role: true } });
        if (!client || client.role !== "client") {
            return NextResponse.json({ message: "Cliente no encontrado" }, { status: 404 });
        }

        const updated = await prisma.user.update({
            where: { id },
            data: { shortName: trimmed },
            select: { id: true, name: true, email: true, shortName: true },
        });

        return NextResponse.json(updated);
    } catch (err) {
        console.error("[CLIENT_UPDATE]", err);
        return NextResponse.json({ message: "Server error" }, { status: 500 });
    }
}
