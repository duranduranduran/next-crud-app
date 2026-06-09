import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";

export async function getOrCreateUser() {
    const clerkUser = await currentUser();
    if (!clerkUser) return null;

    const email = clerkUser.emailAddresses[0]?.emailAddress;
    if (!email) return null;

    const role = clerkUser.publicMetadata?.role || "client";
    const name = clerkUser.fullName || clerkUser.firstName || email;

    const user = await prisma.user.upsert({
        where: { email },
        update: {
            clerkId: clerkUser.id,
            name,
            role,
        },
        create: {
            clerkId: clerkUser.id,
            email,
            name,
            role,
        },
    });

    return user;
}