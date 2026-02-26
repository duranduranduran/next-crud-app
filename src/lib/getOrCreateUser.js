// import { prisma } from "@/lib/prisma";
// import { currentUser } from "@clerk/nextjs/server";
//
// export async function getOrCreateUser() {
//     const clerkUser = await currentUser();
//     if (!clerkUser) return null;
//
//     let user = await prisma.user.findUnique({
//         where: { clerkId: clerkUser.id },
//     });
//
//     if (!user) {
//         user = await prisma.user.create({
//             data: {
//                 clerkId: clerkUser.id,
//                 email: clerkUser.emailAddresses[0].emailAddress,
//                 role: "client",
//             },
//         });
//     }
//
//     return user;
// }
//

import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";

export async function getOrCreateUser() {
    const clerkUser = await currentUser();
    if (!clerkUser) return null;

    const email = clerkUser.emailAddresses[0]?.emailAddress;
    if (!email) return null;

    const user = await prisma.user.upsert({
        where: {
            email, // email is unique
        },
        update: {
            clerkId: clerkUser.id, // ensure it stays synced
        },
        create: {
            clerkId: clerkUser.id,
            email,
            role: "client",
        },
    });

    return user;
}