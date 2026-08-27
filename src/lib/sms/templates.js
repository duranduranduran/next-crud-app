// SMS/email template assembly, shared by the composer ("use client") and
// the send route (server). Pure import — no Prisma dependency chain — so
// this whole module is safe to import from a client component for a live
// preview + character count, not just the server send path.
//
// Templates themselves now live in the DB (Template model) rather than
// being hardcoded here — this file only holds the assembly/validation
// logic that's generic across any template body: variable substitution,
// the SMS name-degradation allocator, and the SMS save-time validator.
import { sanitizeSmsContent } from "./sanitize.js";

// Bare domain, no scheme — SMS clients linkify a bare domain on their own,
// and the scheme was costing 8 characters that matter at a 160 cap (Masiva
// approved the bare form). Driven by NEXT_PUBLIC_BASE_URL rather than a
// hardcoded domain: the previous hardcoded value (recupera.com.ec) doesn't
// match any domain actually used elsewhere in this codebase — the only
// domain with real, live infrastructure (the email reply-routing address,
// already in production) is recupera.it.com. NEXT_PUBLIC_BASE_URL is
// inlined at build time (that's what the NEXT_PUBLIC_ prefix does), so
// reading it here is safe in both server and client bundles. Confirm the
// actual value Vercel has configured for production — it was localhost in
// the local .env last checked, which would ship broken links if that's
// also what's set there.
const RAW_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://recupera.it.com";
const BARE_BASE_URL = RAW_BASE_URL.replace(/^https?:\/\//, "").replace(/\/+$/, "");
const PUBLIC_URL_BASE = `${BARE_BASE_URL}/p/`;
const SMS_MAX_LENGTH = 160;
const SHORT_NAME_MAX_LENGTH = 12;

export function publicDebtorUrl(publicToken) {
    return `${PUBLIC_URL_BASE}${publicToken}`;
}

// First word of the client's name, capped at the same 12 chars shortName
// itself is capped at — used as the send-time fallback when a client has
// no shortName set, instead of blocking the send outright (the bug this
// whole fallback exists to fix: every debtor for a shortName-less client
// used to be silently filtered out, with no path forward from the
// composer). Callers are expected to flag when this was used rather than
// a real shortName — this function only computes the value.
export function deriveShortName(clientName) {
    const first = String(clientName || "").trim().split(/\s+/)[0] || "";
    return first.slice(0, SHORT_NAME_MAX_LENGTH);
}

// {{var}} substitution. Unknown placeholders are left as literal text
// (not blanked) so a typo'd variable name is visible in the preview
// instead of silently disappearing.
export function fillTemplate(text, vars) {
    return String(text || "").replace(/\{\{(\w+)\}\}/g, (match, key) =>
        Object.prototype.hasOwnProperty.call(vars, key) ? String(vars[key]) : match
    );
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
 * Builds a ready-to-send SMS from a registered Template row, degrading
 * only the debtor name to fit the 160-char cap. Never truncates the
 * assembled message — tail truncation would delete the URL, the whole
 * call to action, so a message that doesn't fit even at a 1-char name is
 * refused outright (throws SmsTemplateFitError) rather than sent broken.
 *
 * @param {{id: string, body: string}} template
 * @param {{ debtor: {id: string, name: string, amountOwed: number|string, publicToken: string}, client: {shortName?: string|null}, date?: string }} args
 * @returns {string} the final, sanitized, <=160-char message
 */
export function buildSmsFromTemplateRow(template, { debtor, client, date }) {
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
        const message = sanitizeSmsContent(
            fillTemplate(template.body, { name, amount, shortName, date: dateStr, url })
        );
        shortestAttemptLength = Math.min(shortestAttemptLength, message.length);
        if (message.length <= SMS_MAX_LENGTH) return message;
    }

    throw new SmsTemplateFitError(debtor.id, shortestAttemptLength);
}

// Worst-case substitution values for save-time validation — NOT "assume
// the name is enormous" (the allocator above already handles shrinking
// the name at send time, down to 1 character as an absolute last resort).
// Using that same 1-char floor here means "validates OK" is exactly the
// guarantee buildSmsFromTemplateRow already provides: if a 1-char name
// plus every other field at its realistic maximum still fits, the
// allocator can always find SOME fitting message: nothing shorter than
// this floor exists for it to fall back to. The other fields use
// realistic maximums since the allocator never shrinks them.
const SMS_WORST_CASE_VARS = {
    name: "X",
    amount: "999999.99",
    shortName: "X".repeat(SHORT_NAME_MAX_LENGTH),
    date: "31/12/2026",
    url: `${PUBLIC_URL_BASE}${"X".repeat(8)}`,
};

/**
 * Save-time validation for a newly-registered (or edited) SMS template.
 * Three checks, all required per the Masiva-approval workflow this
 * registers rather than requests:
 *   1. Must survive sanitizeSmsContent unchanged — if it doesn't, the
 *      template as typed contains accents/ñ/other non-ASCII that Masiva
 *      would silently strip, changing the approved wording without the
 *      admin necessarily noticing.
 *   2. Must start with "RECUPERA" (case-insensitive) after sanitizing.
 *   3. Must fit in 160 chars with every placeholder at its worst-case
 *      length (see SMS_WORST_CASE_VARS above).
 * @param {string} body
 * @returns {{ valid: boolean, errors: string[], worstCaseLength: number }}
 */
export function validateSmsTemplateBody(body) {
    const errors = [];
    const trimmed = String(body || "").trim();

    if (!trimmed) {
        return { valid: false, errors: ["La plantilla no puede estar vacía."], worstCaseLength: 0 };
    }

    const sanitized = sanitizeSmsContent(trimmed);
    if (sanitized !== trimmed) {
        errors.push("El texto contiene acentos, la letra ñ, u otros caracteres que Masiva no acepta — revise el mensaje (se removerían automáticamente al enviar, cambiando el texto aprobado).");
    }
    if (!sanitized.toUpperCase().startsWith("RECUPERA")) {
        errors.push('La plantilla debe iniciar con el prefijo "RECUPERA".');
    }

    const filled = sanitizeSmsContent(fillTemplate(sanitized, SMS_WORST_CASE_VARS));
    if (filled.length > SMS_MAX_LENGTH) {
        errors.push(`En el peor caso (variables al máximo) el mensaje mide ${filled.length} caracteres — el máximo es ${SMS_MAX_LENGTH}.`);
    }

    return { valid: errors.length === 0, errors, worstCaseLength: filled.length };
}
