// import { prisma } from '@/lib/prisma';
// import { NextResponse } from 'next/server';
// import { auth } from '@clerk/nextjs/server';
//
// // -------------------------
// // UPDATE debtor
// // -------------------------
// export async function PATCH(req, { params }) {
//     const { userId, sessionClaims } = auth();
//
//     if (!userId) {
//         return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
//     }
//
//     const role = sessionClaims?.publicMetadata?.role;
//
//     if (role !== 'client') {
//         return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
//     }
//
//     const { id } = params;
//     const body = await req.json();
//
//     const {
//         name,
//         email,
//         amountOwed,
//         documentUrl,
//         telephone,
//         address,
//         cedulaIdentidad,
//     } = body;
//
//     if (!id || !name || !amountOwed || !cedulaIdentidad) {
//         return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
//     }
//
//     try {
//         // buscar user por clerkUserId
//         const user = await prisma.user.findUnique({
//             where: { clerkUserId: userId },
//         });
//
//         if (!user) {
//             return NextResponse.json({ message: 'User not found' }, { status: 404 });
//         }
//
//         // validar cédula duplicada
//         const existingDebtor = await prisma.debtor.findFirst({
//             where: {
//                 cedulaIdentidad,
//                 NOT: { id },
//             },
//         });
//
//         if (existingDebtor) {
//             return NextResponse.json(
//                 { message: 'Cédula de Identidad already in use by another debtor' },
//                 { status: 400 }
//             );
//         }
//
//         // asegurar ownership
//         const debtor = await prisma.debtor.findUnique({ where: { id } });
//
//         if (!debtor || debtor.userId !== user.id) {
//             return NextResponse.json({ message: 'Debtor not found or unauthorized' }, { status: 404 });
//         }
//
//         const updatedDebtor = await prisma.debtor.update({
//             where: { id },
//             data: {
//                 name,
//                 email: email || null,
//                 telephone: telephone || null,
//                 address: address || null,
//                 cedulaIdentidad,
//                 amountOwed: parseFloat(amountOwed),
//                 documentUrl: documentUrl || null,
//             },
//         });
//
//         return NextResponse.json(
//             { message: 'Debtor updated', debtor: updatedDebtor },
//             { status: 200 }
//         );
//     } catch (err) {
//         console.error(err);
//         return NextResponse.json({ message: 'Server error' }, { status: 500 });
//     }
// }
//
// // -------------------------
// // DELETE debtor
// // -------------------------
// export async function DELETE(req, { params }) {
//     const { userId, sessionClaims } = auth();
//
//     if (!userId) {
//         return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
//     }
//
//     const role = sessionClaims?.publicMetadata?.role;
//
//     if (role !== 'client') {
//         return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
//     }
//
//     const { id } = params;
//
//     try {
//         const user = await prisma.user.findUnique({
//             where: { clerkUserId: userId },
//         });
//
//         if (!user) {
//             return NextResponse.json({ message: 'User not found' }, { status: 404 });
//         }
//
//         const debtor = await prisma.debtor.findUnique({ where: { id } });
//
//         if (!debtor || debtor.userId !== user.id) {
//             return NextResponse.json({ message: 'Debtor not found or unauthorized' }, { status: 404 });
//         }
//
//         await prisma.debtor.delete({ where: { id } });
//
//         return NextResponse.json({ message: 'Debtor deleted' }, { status: 200 });
//     } catch (err) {
//         console.error(err);
//         return NextResponse.json({ message: 'Server error' }, { status: 500 });
//     }
// }


export const runtime = "nodejs";

import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getOrCreateUser } from '@/lib/getOrCreateUser';

// =========================
// UPDATE debtor
// =========================
export async function PATCH(req, context) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        // getOrCreateUser upserts by email, so a real user whose stored
        // clerkId has drifted out of sync with Clerk's current session
        // gets it corrected here instead of a bare clerkId lookup 404ing.
        const user = await getOrCreateUser();

        if (!user) {
            return NextResponse.json({ message: 'User sync failed' }, { status: 500 });
        }

        if (user.role !== 'client' && user.role !== 'admin') {
            return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
        }

        const { id } = await context.params;
        const body = await req.json();

        const {
            name,
            email,
            amountOwed,
            documentUrl,
            telephone,
            address,
            cedulaIdentidad,
        } = body;

        if (!id || !name || !amountOwed || !cedulaIdentidad) {
            return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
        }

        // Validate duplicate cedula
        const existingDebtor = await prisma.debtor.findFirst({
            where: {
                cedulaIdentidad,
                NOT: { id },
            },
        });

        if (existingDebtor) {
            return NextResponse.json(
                { message: 'Cédula already in use by another debtor' },
                { status: 400 }
            );
        }

        // Ensure ownership
        const debtor = await prisma.debtor.findUnique({
            where: { id },
        });

        if (!debtor || debtor.userId !== user.id) {
            return NextResponse.json(
                { message: 'Debtor not found or unauthorized' },
                { status: 404 }
            );
        }

        // Update debtor
        const updatedDebtor = await prisma.debtor.update({
            where: { id },
            data: {
                name,
                email: email || null,
                telephone: telephone || null,
                address: address || null,
                cedulaIdentidad,
                amountOwed: parseFloat(amountOwed),
                documentUrl: documentUrl || null,
            },
        });

        // Log the update
        await prisma.activityLog.create({
            data: {
                event: "DEBTOR_CREATED", // closest available — replace with DEBTOR_UPDATED when added to schema
                detail: `[UPDATED] ${name} (USD ${parseFloat(amountOwed)})`,
                userId: user.id,
                debtorId: id,
            },
        });

        return NextResponse.json(
            { message: 'Debtor updated', debtor: updatedDebtor },
            { status: 200 }
        );
    } catch (err) {
        console.error('PATCH ERROR:', err);
        return NextResponse.json({ message: 'Server error' }, { status: 500 });
    }
}

// =========================
// DELETE debtor
// =========================
export async function DELETE(req, context) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        // getOrCreateUser upserts by email, so a real user whose stored
        // clerkId has drifted out of sync with Clerk's current session
        // gets it corrected here instead of a bare clerkId lookup 404ing.
        const user = await getOrCreateUser();

        if (!user) {
            return NextResponse.json({ message: 'User sync failed' }, { status: 500 });
        }

        if (user.role !== 'client' && user.role !== 'admin') {
            return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
        }

        const { id } = await context.params;

        const debtor = await prisma.debtor.findUnique({
            where: { id },
            select: { name: true, amountOwed: true, userId: true },
        });

        if (!debtor) {
            return NextResponse.json({ message: 'Debtor not found' }, { status: 404 });
        }

        // Ownership check applies to clients (deleting their own debtor
        // only) — admins delete on behalf of any client, so they skip it.
        // Both paths stay in this one route rather than a separate
        // admin-delete endpoint, specifically so they can't drift apart.
        if (user.role !== 'admin' && debtor.userId !== user.id) {
            return NextResponse.json(
                { message: 'Debtor not found or unauthorized' },
                { status: 404 }
            );
        }

        // Log BEFORE deleting so we still have the info. userId here is
        // always the ACTOR (whoever is authenticated and performed the
        // delete), not the debtor's owner — for an admin deleting another
        // account's data, that's the admin's own id, so the log reads as
        // "admin X deleted debtor Y" rather than attributing it to the
        // client who never touched it.
        const actorNote = user.role === 'admin' && debtor.userId !== user.id ? ' (admin action)' : '';
        await prisma.activityLog.create({
            data: {
                event: "DEBTOR_DELETED",
                detail: `Debtor deleted: ${debtor.name} (USD ${debtor.amountOwed})${actorNote}`,
                userId: user.id,
                debtorId: null, // null because debtor is about to be deleted
            },
        });

        await prisma.debtor.delete({
            where: { id },
        });

        return NextResponse.json(
            { message: 'Debtor deleted' },
            { status: 200 }
        );
    } catch (err) {
        console.error('DELETE ERROR:', err);
        return NextResponse.json({ message: 'Server error' }, { status: 500 });
    }
}