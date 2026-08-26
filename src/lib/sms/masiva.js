// lib/sms/masiva.js
import { prisma } from "@/lib/prisma";
import { toE164Ec } from "../phone.js";
import { sanitizeSmsContent, prepareSmsContent } from "./sanitize.js";

// Re-exported so every existing import of these from "@/lib/sms/masiva"
// keeps working unchanged — the implementations moved to phone.js/
// sanitize.js so client components (the notifications composer) can import
// them directly without pulling in this file's Prisma dependency.
export { toE164Ec, sanitizeSmsContent, prepareSmsContent };

const BASE = "https://api.login-sms.com";
const TOKEN_SKEW_MS = 5 * 60 * 1000; // refresh 5 min before expiry

/**
 * @typedef {{ to_number: string, content: string }} SendListItem
 * @typedef {{ ok: boolean, sent: string[], failed: string[], errors: Array<{chunkStart: number, size: number, error: string}>, raw: any[] }} SendListResult
 * @typedef {{ ok: boolean, campaignId?: number, messageIds: number[], raw: any }} SingleResult
 * @typedef {{ providerId: string, fromNumber: string, content: string, receivedAt: Date }} InboundSms
 */

export class MasivaError extends Error {
    /**
     * @param {string} message
     * @param {number} status
     * @param {boolean} retryable
     * @param {any} [raw]
     */
    constructor(message, status, retryable, raw) {
        super(message);
        this.name = "MasivaError";
        this.status = status;
        this.retryable = retryable;
        this.raw = raw;
    }
}

/* ------------------------------------------------------------------ */
/* Token management                                                    */
/* ------------------------------------------------------------------ */

// Requires:
// model ProviderToken {
//   provider  String   @id
//   token     String
//   expiresAt DateTime
//   updatedAt DateTime @updatedAt
// }

async function requestToken() {
    const body = new URLSearchParams({
        client_id: requireEnv("MASIVA_CLIENT_ID"),
        client_secret: requireEnv("MASIVA_CLIENT_SECRET"),
        grant_type: "client_credentials",
    });

    const res = await fetch(`${BASE}/token`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
        cache: "no-store",
    });

    // NOTE: their Postman screenshots use form-data, not urlencoded. If this
    // 400s, swap to FormData and drop the Content-Type header so the boundary
    // is set automatically. Verify against staging before shipping.
    if (!res.ok) {
        throw new MasivaError("Token request failed", res.status, res.status >= 500);
    }

    const json = await res.json();

    if (!json?.access_token) {
        throw new MasivaError("Token response missing access_token", 500, true, json);
    }

    return {
        token: json.access_token,
        expiresAt: new Date(Date.now() + json.expires_in * 1000),
    };
}

/** @param {boolean} [forceRefresh] */
export async function getToken(forceRefresh = false) {
    if (!forceRefresh) {
        const cached = await prisma.providerToken.findUnique({
            where: { provider: "masiva" },
        });
        if (cached && cached.expiresAt.getTime() - TOKEN_SKEW_MS > Date.now()) {
            return cached.token;
        }
    }

    const { token, expiresAt } = await requestToken();

    await prisma.providerToken.upsert({
        where: { provider: "masiva" },
        create: { provider: "masiva", token, expiresAt },
        update: { token, expiresAt },
    });

    return token;
}

/* ------------------------------------------------------------------ */
/* Request helper — retries once on 401 with a fresh token             */
/* ------------------------------------------------------------------ */

/**
 * @param {string} path
 * @param {any} body
 * @param {"POST"|"GET"} [method]
 */
async function call(path, body, method = "POST") {
    const attempt = async (token) => {
        const res = await fetch(`${BASE}${path}`, {
            method,
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: method === "GET" ? undefined : JSON.stringify(body),
            cache: "no-store",
        });
        const text = await res.text();
        let json;
        try {
            json = text ? JSON.parse(text) : null;
        } catch {
            throw new MasivaError("Non-JSON response", res.status, res.status >= 500, text);
        }
        return { httpStatus: res.status, json };
    };

    let token = await getToken();
    let { httpStatus, json } = await attempt(token);

    if (httpStatus === 401 || httpStatus === 403) {
        token = await getToken(true);
        ({ httpStatus, json } = await attempt(token));
    }

    // Their docs: 400 = bad JSON (don't retry), 500 = ingest error (retry),
    // 200 = accepted. But received_sms returns status:500 with error:false and
    // valid data — so trust the `error` flag over `status` when present.
    const declaredError = json?.error === true;
    const code = json?.status ?? httpStatus;

    if (declaredError || (json?.error === undefined && httpStatus >= 400)) {
        throw new MasivaError(`Masiva ${path} failed`, code, code >= 500, json);
    }

    return json;
}

/* ------------------------------------------------------------------ */
/* Send: single                                                        */
/* ------------------------------------------------------------------ */

/**
 * @param {string} toNumber
 * @param {string} content
 * @returns {Promise<SingleResult>}
 */
export async function sendSms(toNumber, content) {
    const to = toE164Ec(toNumber);
    if (!to) throw new MasivaError(`Invalid EC number: ${toNumber}`, 400, false);

    const json = await call("/messages/send", { to_number: to, content: prepareSmsContent(content, to) });
    return parseIds(json);
}

/* ------------------------------------------------------------------ */
/* Send: personalized batch (the one Recupera actually needs)          */
/* ------------------------------------------------------------------ */

const CHUNK_SIZE = Number(process.env.MASIVA_CHUNK_SIZE ?? 100);

/**
 * @param {SendListItem[]} items
 * @returns {Promise<SendListResult>}
 */
export async function sendList(items) {
    const normalized = [];
    const invalid = [];

    for (const it of items) {
        const to = toE164Ec(it.to_number);
        if (!to) invalid.push(it.to_number);
        else normalized.push({ to_number: to, content: prepareSmsContent(it.content, to) });
    }

    const sent = [];
    const failed = [...invalid];
    const errors = [];
    const raws = [];
    let anyChunkSucceeded = false;

    for (let i = 0; i < normalized.length; i += CHUNK_SIZE) {
        const chunk = normalized.slice(i, i + CHUNK_SIZE);
        try {
            const json = await call("/messages/send-list", chunk);
            sent.push(...(json.exitoval ?? []));
            failed.push(...(json.errorval ?? []));
            raws.push(json);
            anyChunkSucceeded = true;
        } catch (err) {
            // A failure on this chunk must not discard the results already
            // accumulated from earlier chunks — record it as failed and move on.
            failed.push(...chunk.map((it) => it.to_number));
            errors.push({
                chunkStart: i,
                size: chunk.length,
                error: err instanceof MasivaError ? err.message : String(err),
            });
        }
    }

    // Only throw if every attempted chunk failed outright (e.g. token
    // acquisition itself is broken) — a partial success must come back as
    // data, never be discarded by an exception.
    if (normalized.length > 0 && !anyChunkSucceeded) {
        throw new MasivaError("All send-list chunks failed", 502, true, { errors });
    }

    return { ok: failed.length === 0, sent, failed, errors, raw: raws };
}

/* ------------------------------------------------------------------ */
/* Send: to a saved contact group                                      */
/* ------------------------------------------------------------------ */

/**
 * @param {number} contactGroupId
 * @param {string} content
 * @returns {Promise<SingleResult>}
 */
export async function sendToGroup(contactGroupId, content) {
    const json = await call("/messages/send-batch", {
        contact_group_id: contactGroupId,
        content,
    });
    return parseIds(json);
}

/** @returns {Promise<Array<{id: number, name: string}>>} */
export async function listContactGroups() {
    return call("/contacts-groups", null, "GET");
}

/* ------------------------------------------------------------------ */
/* Inbound                                                             */
/* ------------------------------------------------------------------ */

/**
 * Masiva returns naive datetimes with no offset — assume EC local (UTC-5).
 * @param {string} s
 */
function parseEcDate(s) {
    return new Date(`${s.replace(" ", "T")}-05:00`);
}

/**
 * Unused — inbound SMS is not provisioned on our Masiva account (outbound
 * only). Left in place in case that changes later; not called anywhere.
 * @param {Date} from
 * @param {Date} [to]
 * @returns {Promise<InboundSms[]>}
 */
export async function getReceivedSince(from, to = new Date()) {
    // parseEcDate() above treats the provider's naive `hora` values as EC
    // local time (-05:00), so the request window must be expressed in EC
    // local too — toISOString() is UTC and would query a window 5 hours in
    // the future, silently returning zero messages every call. Ecuador does
    // not observe DST, so a fixed -5h shift is safe.
    const fmt = (d) => new Date(d.getTime() - 5 * 60 * 60 * 1000).toISOString().replace("T", " ").slice(0, 19);

    const json = await call("/messages/received_sms", {
        fecha_inicial: fmt(from),
        fecha_fin: fmt(to),
    });

    return (json.data ?? []).map((m) => ({
        providerId: m.id,
        fromNumber: m.from_number,
        content: m.content,
        receivedAt: parseEcDate(m.hora),
    }));
}

/**
 * Unused — inbound SMS is not provisioned on our Masiva account (outbound
 * only). Left in place in case that changes later; not called anywhere.
 * One-shot backfill only — no pagination, returns the full history.
 * @returns {Promise<InboundSms[]>}
 */
export async function getAllReceived() {
    const json = await call("/messages/received_sms_all", { type: "all" });

    return (json.data ?? []).map((m) => ({
        providerId: m.id,
        fromNumber: m.from_number,
        content: m.content,
        receivedAt: parseEcDate(m.hora),
    }));
}

/**
 * Delivery-report poll: /messages/shipped tells us which sent messages
 * actually reached a handset, upgrading a NotificationLog row from "sent"
 * (accepted by Masiva — a 200 here is NOT the same as delivered) to
 * "delivered". Called by the poll-sms-delivery Inngest cron a few minutes
 * after a batch send.
 *
 * Masiva's date format for this endpoint is mm/dd/yyyy — yyyy-mm-dd 400s,
 * dd/mm/yyyy is accepted but silently returns an empty result. Do not
 * "fix" the format below without re-confirming against a real response;
 * this bit the reminder-delivery diagnosis once already.
 *
 * Response field names (to_number/hora) are inferred from this file's
 * other endpoints (received_sms, received_sms_all) since no separate docs
 * for /messages/shipped were available while writing this — verify against
 * a real response before depending on it further.
 * @param {Date} from
 * @param {Date} [to]
 * @returns {Promise<Array<{toNumber: string, shippedAt: Date, raw: any}>>}
 */
export async function getShipped(from, to = new Date()) {
    const fmtMmDdYyyy = (d) => {
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        return `${mm}/${dd}/${d.getFullYear()}`;
    };

    const json = await call("/messages/shipped", {
        fecha_inicial: fmtMmDdYyyy(from),
        fecha_fin: fmtMmDdYyyy(to),
    });

    return (json.data ?? []).map((m) => ({
        toNumber: m.to_number,
        shippedAt: parseEcDate(m.hora),
        raw: m,
    }));
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function parseIds(json) {
    const campaignId = json.ids?.find((e) => e.campaign_id != null)?.campaign_id;
    const messageIds = json.ids?.flatMap((e) => e.messages_id ?? []) ?? [];
    return { ok: true, campaignId, messageIds, raw: json };
}

function requireEnv(key) {
    const v = process.env[key];
    if (!v) throw new Error(`Missing env var: ${key}`);
    return v;
}