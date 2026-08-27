export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { validateSmsTemplateBody } from "@/lib/sms/templates";

async function requireAdmin() {
    const { userId } = await auth();
    if (!userId) return { error: NextResponse.json({ message: "Unauthorized" }, { status: 401 }) };

    const clerkUser = await currentUser();
    if (!clerkUser || clerkUser.publicMetadata?.role !== "admin") {
        return { error: NextResponse.json({ message: "Forbidden" }, { status: 403 }) };
    }
    return {};
}

// Edits (label/body/subject/restricted/active). Re-validates SMS bodies on
// every edit, not just at creation — an edited template is functionally a
// new registration and could reintroduce exactly the problem validation
// exists to catch. Deliberately no DELETE here: `active: false` is the
// intended way to retire a template (see the schema comment) so historical
// NotificationLog rows referencing it by id keep resolving to something.
export async function PATCH(req, { params }) {
    try {
        const { error } = await requireAdmin();
        if (error) return error;

        const { id } = await params;
        const existing = await prisma.template.findUnique({ where: { id } });
        if (!existing) {
            return NextResponse.json({ message: "Plantilla no encontrada" }, { status: 404 });
        }

        const payload = await req.json();
        const data = {};

        if (payload.label !== undefined) {
            if (!String(payload.label).trim()) {
                return NextResponse.json({ message: "La etiqueta es obligatoria" }, { status: 400 });
            }
            data.label = String(payload.label).trim();
        }
        if (payload.restricted !== undefined) data.restricted = Boolean(payload.restricted);
        if (payload.active !== undefined) data.active = Boolean(payload.active);
        if (payload.subject !== undefined) {
            data.subject = existing.channel === "EMAIL" && payload.subject ? String(payload.subject) : null;
        }

        if (payload.body !== undefined) {
            if (!String(payload.body).trim()) {
                return NextResponse.json({ message: "El contenido es obligatorio" }, { status: 400 });
            }
            if (existing.channel === "SMS") {
                const validation = validateSmsTemplateBody(payload.body);
                if (!validation.valid) {
                    return NextResponse.json({ message: "Plantilla SMS inválida", errors: validation.errors }, { status: 400 });
                }
            }
            data.body = String(payload.body);
        }

        const updated = await prisma.template.update({ where: { id }, data });
        return NextResponse.json(updated);
    } catch (err) {
        console.error("[TEMPLATES_UPDATE]", err);
        return NextResponse.json({ message: "Server error" }, { status: 500 });
    }
}
