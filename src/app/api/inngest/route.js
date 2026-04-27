import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { sendRemindersFunction } from "@/inngest/functions";

export const { GET, POST, PUT } = serve({
    client: inngest,
    functions: [sendRemindersFunction],
    signingKey: process.env.INNGEST_SIGNING_KEY,
});