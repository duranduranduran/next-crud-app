export const runtime = "nodejs";

import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/getOrCreateUser";
import { nanoid } from "nanoid";

// CREATE a debtor
export async function POST(req) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const user = await getOrCreateUser();
        if (!user) {
            return NextResponse.json({ message: "User sync failed" }, { status: 500 });
        }

        const body = await req.json();
        const {
            name,
            email,
            amountOwed,
            documentUrl,
            telephone,
            address,
            cedulaIdentidad,
            ruc,
            invoiceNumber,
        } = body;

        if (!name || !amountOwed) {
            return NextResponse.json(
                { message: "Missing required fields" },
                { status: 400 }
            );
        }

        const debtor = await prisma.debtor.create({
            data: {
                name,
                email: email || null,
                telephone: telephone || null,
                address: address || null,
                cedulaIdentidad: cedulaIdentidad || null,
                ruc: ruc || null,
                invoiceNumber: invoiceNumber || null,
                amountOwed: parseFloat(amountOwed),
                documentUrl: documentUrl || null,
                userId: user.id,
                publicToken: nanoid(8),
            },
        });

        await prisma.activityLog.create({
            data: {
                event: "DEBTOR_CREATED",
                detail: `Nuevo deudor creado: ${name} (USD ${parseFloat(amountOwed)})`,
                userId: user.id,
                debtorId: debtor.id,
            },
        });

        return NextResponse.json(
            { message: "Debtor created", debtor },
            { status: 201 }
        );
    } catch (error) {
        console.error("[DEBTORS_POST]", error);
        return NextResponse.json({ message: "Server error" }, { status: 500 });
    }
}

// GET list of debtors
export async function GET() {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const user = await getOrCreateUser();
        if (!user) {
            return NextResponse.json({ message: "User sync failed" }, { status: 500 });
        }

        const debtors = await prisma.debtor.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(debtors);
    } catch (error) {
        console.error("[DEBTORS_GET]", error);
        return NextResponse.json({ message: "Server error" }, { status: 500 });
    }
}

// UPDATE a debtor
export async function PATCH(req) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const user = await getOrCreateUser();
        if (!user) {
            return NextResponse.json({ message: "User sync failed" }, { status: 500 });
        }

        const body = await req.json();
        const {
            id,
            name,
            email,
            amountOwed,
            documentUrl,
            telephone,
            address,
            cedulaIdentidad,
            ruc,
            invoiceNumber,
        } = body;

        if (!id || !name || !amountOwed) {
            return NextResponse.json(
                { message: "Missing required fields" },
                { status: 400 }
            );
        }

        const debtor = await prisma.debtor.findUnique({ where: { id } });

        if (!debtor || debtor.userId !== user.id) {
            return NextResponse.json({ message: "Forbidden" }, { status: 403 });
        }

        const updatedDebtor = await prisma.debtor.update({
            where: { id },
            data: {
                name,
                email: email || null,
                telephone: telephone || null,
                address: address || null,
                cedulaIdentidad: cedulaIdentidad || null,
                ruc: ruc || null,
                invoiceNumber: invoiceNumber || null,
                amountOwed: parseFloat(amountOwed),
                documentUrl: documentUrl || null,
            },
        });

        await prisma.activityLog.create({
            data: {
                event: "DEBTOR_CREATED",
                detail: `[ACTUALIZADO] Deudor: ${name} (USD ${parseFloat(amountOwed)})`,
                userId: user.id,
                debtorId: id,
            },
        });

        return NextResponse.json({
            message: "Debtor updated",
            debtor: updatedDebtor,
        });
    } catch (error) {
        console.error("[DEBTORS_PATCH]", error);
        return NextResponse.json({ message: "Server error" }, { status: 500 });
    }
}