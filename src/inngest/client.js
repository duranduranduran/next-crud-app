import { Inngest } from "inngest";

export const inngest = new Inngest({
    id: "recupera",
    eventKey: process.env.NODE_ENV === "production"
        ? process.env.INNGEST_EVENT_KEY
        : undefined, // 👈 no event key in dev
});