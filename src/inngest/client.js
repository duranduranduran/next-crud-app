import { Inngest } from "inngest";

export const inngest = new Inngest({
    id: "recupera",
    eventKey: process.env.INNGEST_EVENT_KEY,
});