import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";

export async function getOrCreateUser() {
    const clerkUser = await currentUser();
    if (!clerkUser) return null;

    let user = await prisma.user.findUnique({
        where: { clerkId: clerkUser.id },
    });

    if (!user) {
        user = await prisma.user.create({
            data: {
                clerkId: clerkUser.id,
                email: clerkUser.emailAddresses[0].emailAddress,
                role: "client",
            },
        });
    }

    return user;
}
