export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/getOrCreateUser";
import { validateSmsTemplateBody } from "@/lib/sms/templates";

async function requireAdmin() {
    const { userId } = await auth();
    if (!userId) return { error: NextResponse.json({ message: "Unauthorized" }, { status: 401 }) };

    const clerkUser = await currentUser();
    if (!clerkUser || clerkUser.publicMetadata?.role !== "admin") {
        return { error: NextResponse.json({ message: "Forbidden" }, { status: 403 }) };
    }

    // getOrCreateUser upserts by email, so a real admin whose stored
    // clerkId has drifted out of sync with Clerk's current session gets
    // it corrected here instead of a bare clerkId lookup 404ing — same
    // fix already applied to the other admin routes this session.
    const dbUser = await getOrCreateUser();
    if (!dbUser) return { error: NextResponse.json({ message: "User sync failed" }, { status: 500 }) };

    return { dbUser };
}

export async function GET(req) {
    const { error } = await requireAdmin();
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const channel = searchParams.get("channel");
    const activeOnly = searchParams.get("active") === "true";

    const where = {};
    if (channel === "SMS" || channel === "EMAIL") where.channel = channel;
    if (activeOnly) where.active = true;

    const templates = await prisma.template.findMany({
        where,
        orderBy: [{ active: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json(templates);
}

export async function POST(req) {
    try {
        const { error, dbUser } = await requireAdmin();
        if (error) return error;

        const { channel, label, body, subject, restricted } = await req.json();

        if (channel !== "SMS" && channel !== "EMAIL") {
            return NextResponse.json({ message: "Canal inválido" }, { status: 400 });
        }
        if (!label || !String(label).trim()) {
            return NextResponse.json({ message: "La etiqueta es obligatoria" }, { status: 400 });
        }
        if (!body || !String(body).trim()) {
            return NextResponse.json({ message: "El contenido es obligatorio" }, { status: 400 });
        }

        // SMS registers an ALREADY-approved template — validated here on the
        // server too (not just client-side) since this is the one place
        // nothing can bypass either requirement, same reasoning as
        // prepareSmsContent being the one funnel for every send.
        if (channel === "SMS") {
            const validation = validateSmsTemplateBody(body);
            if (!validation.valid) {
                return NextResponse.json({ message: "Plantilla SMS inválida", errors: validation.errors }, { status: 400 });
            }
        }

        const template = await prisma.template.create({
            data: {
                channel,
                label: String(label).trim(),
                body: String(body),
                subject: channel === "EMAIL" ? (subject ? String(subject) : null) : null,
                restricted: Boolean(restricted),
                createdById: dbUser.id,
            },
        });

        return NextResponse.json(template, { status: 201 });
    } catch (err) {
        console.error("[TEMPLATES_CREATE]", err);
        return NextResponse.json({ message: "Server error" }, { status: 500 });
    }
}
