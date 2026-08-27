import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { nanoid } from "nanoid";
import { getOrCreateUser } from "@/lib/getOrCreateUser";

// BULK CREATE debtors
export async function POST(req) {
    try {

        // Clerk authentication
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            );
        }

        const body = await req.json();

        if (!Array.isArray(body)) {
            return NextResponse.json(
                { message: "Expected an array of debtors" },
                { status: 400 }
            );
        }

        // Get (or self-heal) user from database — same bare-lookup bug as the
        // admin status route: a stale stored clerkId 404s a real user here.
        const user = await getOrCreateUser();

        if (!user) {
            return NextResponse.json(
                { message: "User sync failed" },
                { status: 500 }
            );
        }

        const validDebtors = [];
        const errors = [];

        for (let i = 0; i < body.length; i++) {

            const debtor = body[i];

            const {
                name,
                email,
                amountOwed,
                documentUrl,
                telephone,
                address,
                cedulaIdentidad,
            } = debtor;

            // Validation
            if (!name || !amountOwed || !cedulaIdentidad) {
                errors.push({
                    row: i + 2,
                    debtor,
                    message: "Missing required fields",
                });
                continue;
            }

            const parsedAmount = parseFloat(amountOwed);

            if (isNaN(parsedAmount)) {
                errors.push({
                    row: i + 2,
                    debtor,
                    message: "Invalid amountOwed",
                });
                continue;
            }

            validDebtors.push({
                name,
                email: email || null,
                telephone: telephone || null,
                address: address || null,
                cedulaIdentidad,
                amountOwed: parsedAmount,
                documentUrl: documentUrl || null,
                userId: user.id,
                publicToken: nanoid(8),
            });
        }

        // Insert all rows at once (much faster)
        await prisma.debtor.createMany({
            data: validDebtors,
            skipDuplicates: true, // prevents cedula unique constraint crash
        });

        return NextResponse.json(
            {
                created: validDebtors.length,
                errors,
            },
            { status: 201 }
        );

    } catch (error) {

        console.error("[DEBTOR_UPLOAD]", error);

        return NextResponse.json(
            { message: "Server error" },
            { status: 500 }
        );
    }
}