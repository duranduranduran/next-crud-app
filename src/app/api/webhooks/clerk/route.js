import { Webhook } from "svix";
import { headers } from "next/headers";
import { clerkClient } from "@clerk/nextjs/server";

export async function POST(req) {
    const payload = await req.text();
    const headersList = headers();

    const svix_id = headersList.get("svix-id");
    const svix_timestamp = headersList.get("svix-timestamp");
    const svix_signature = headersList.get("svix-signature");

    const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET);

    let evt;
    try {
        evt = wh.verify(payload, {
            "svix-id": svix_id,
            "svix-timestamp": svix_timestamp,
            "svix-signature": svix_signature,
        });
    } catch (err) {
        return new Response("Webhook verification failed", { status: 400 });
    }

    if (evt.type === "user.created") {
        const userId = evt.data.id;

        await clerkClient.users.updateUser(userId, {
            publicMetadata: {
                role: "client", // 👈 DEFAULT
            },
        });
    }

    return new Response("OK");
}
