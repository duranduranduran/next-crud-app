// The five Masiva-approved SMS templates and the adaptive allocator that
// fills them. Masiva silently drops content that doesn't match an approved
// template — this is the ONLY place template text is assembled, so nothing
// downstream can send freeform SMS content by accident.
//
// Every template ends with a public debtor page link
// (https://recupera.com.ec/p/[token], see src/app/p/[token]/page.jsx) —
// that's the whole reason Part 1 of this feature exists.
// Pure import — no Prisma dependency chain — so this whole module is safe
// to import from a "use client" component (the notifications composer uses
// it for a live preview + character count, not just the server send route).
import { sanitizeSmsContent } from "./sanitize.js";

const PUBLIC_URL_BASE = "https://recupera.com.ec/p/";
const SMS_MAX_LENGTH = 160;

export function publicDebtorUrl(publicToken) {
    return `${PUBLIC_URL_BASE}${publicToken}`;
}

// Every build() receives { name, amount, shortName, date, url } — all
// already-sanitized strings — and returns the assembled (not yet
// re-sanitized) message. amount is pre-formatted ("1234.56"), date is
// "dd/mm/yyyy".
export const SMS_TEMPLATES = [
    {
        id: "template_1",
        label: "Recordatorio de pago",
        description: "Aviso amistoso de saldo pendiente.",
        restricted: false,
        build: ({ name, amount, shortName, date, url }) =>
            `Recupera: Hola ${name}, tiene un saldo pendiente de $${amount} con ${shortName} al ${date}. Info: ${url}`,
    },
    {
        id: "template_2",
        label: "Segundo aviso",
        description: "Recordatorio mas firme, el saldo sigue pendiente.",
        restricted: false,
        build: ({ name, amount, shortName, date, url }) =>
            `Recupera: ${name}, su pago de $${amount} a ${shortName} sigue pendiente desde ${date}. Regularice: ${url}`,
    },
    {
        id: "template_3",
        label: "Aviso legal (5 dias)",
        description: "Notificacion de inicio de proceso legal en 5 dias. Requiere autorizacion del cliente.",
        restricted: true,
        build: ({ name, amount, shortName, date, url }) =>
            `Recupera: ${name}, si no regulariza $${amount} con ${shortName} en 5 dias desde ${date} se inicia proceso legal. ${url}`,
    },
    {
        id: "template_4",
        label: "Confirmacion de acuerdo",
        description: "Confirma que se registro un acuerdo de pago.",
        restricted: false,
        build: ({ name, amount, shortName, date, url }) =>
            `Recupera: ${name}, confirmamos su acuerdo de pago de $${amount} con ${shortName} al ${date}. Detalle: ${url}`,
    },
    {
        id: "template_5",
        label: "Recordatorio final",
        description: "Ultimo recordatorio antes de una gestion mas activa.",
        restricted: false,
        build: ({ name, amount, shortName, date, url }) =>
            `Recupera: ${name}, ultimo recordatorio: $${amount} pendiente con ${shortName} desde ${date}. Contacto: ${url}`,
    },
];

export function getSmsTemplate(templateId) {
    return SMS_TEMPLATES.find((t) => t.id === templateId) || null;
}

export class SmsTemplateFitError extends Error {
    constructor(debtorId, longestAttemptLength) {
        super(`SMS for debtor ${debtorId} does not fit ${SMS_MAX_LENGTH} chars even at a 1-char name (shortest attempt: ${longestAttemptLength} chars). Not sent.`);
        this.name = "SmsTemplateFitError";
        this.debtorId = debtorId;
    }
}

// "two tokens -> one token -> truncate token": the degradation ladder for
// the debtor NAME specifically, tried in order after the full name itself
// doesn't fit. Everything else in the template (fixed text, amount,
// shortName, date, url) is placed first / treated as non-negotiable — the
// name is the only field this allocator is allowed to shrink.
function nameCandidates(fullName) {
    const tokens = String(fullName || "").trim().split(/\s+/).filter(Boolean);
    const candidates = [];
    if (tokens.length > 0) candidates.push(tokens.join(" "));           // full name
    if (tokens.length >= 2) candidates.push(tokens.slice(0, 2).join(" ")); // two tokens
    if (tokens.length >= 1) candidates.push(tokens[0]);                  // one token
    const first = tokens[0] || fullName || "";
    for (let len = first.length - 1; len >= 1; len--) {
        candidates.push(first.slice(0, len));                            // truncate token, char by char
    }
    return candidates;
}

/**
 * Builds a ready-to-send SMS from an approved template, degrading only the
 * debtor name to fit the 160-char cap. Never truncates the assembled
 * message — tail truncation would delete the URL, the whole call to
 * action, so a message that doesn't fit even at a 1-char name is refused
 * outright (throws SmsTemplateFitError) rather than sent broken.
 *
 * @param {string} templateId
 * @param {{ debtor: {id: string, name: string, amountOwed: number|string, publicToken: string}, client: {shortName?: string|null}, date?: string }} args
 * @returns {string} the final, sanitized, <=160-char message
 */
export function buildSmsFromTemplate(templateId, { debtor, client, date }) {
    const template = getSmsTemplate(templateId);
    if (!template) throw new Error(`Unknown SMS template: ${templateId}`);

    const amount = Number(debtor.amountOwed).toFixed(2);
    // Sanitize every input BEFORE it's placed into the template and BEFORE
    // length is measured — sanitizing only the final assembled string could
    // shorten it in ways that make an earlier length check wrong (e.g. a
    // name candidate that "fits" pre-sanitize but produces a shorter,
    // still-fitting string post-sanitize would be silently skipped in
    // favor of a worse candidate if we sanitized late).
    const shortName = sanitizeSmsContent(client?.shortName || "");
    const dateStr = sanitizeSmsContent(date || "");
    const url = publicDebtorUrl(debtor.publicToken);

    let shortestAttemptLength = Infinity;
    for (const rawName of nameCandidates(debtor.name)) {
        const name = sanitizeSmsContent(rawName);
        const message = sanitizeSmsContent(template.build({ name, amount, shortName, date: dateStr, url }));
        shortestAttemptLength = Math.min(shortestAttemptLength, message.length);
        if (message.length <= SMS_MAX_LENGTH) return message;
    }

    throw new SmsTemplateFitError(debtor.id, shortestAttemptLength);
}
