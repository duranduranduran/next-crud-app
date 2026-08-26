// Pure, no server dependencies — safe to import from client components
// (the notifications composer needs it for live character-count/preview)
// and from server code alike. masiva.js re-exports these so its existing
// import surface doesn't change.

const SMS_MAX_LENGTH = 160; // Masiva does not concatenate/segment — hard cap, never split

/**
 * Masiva prohibits accented characters and ñ/Ñ in SMS content. Strips
 * diacritics via Unicode decomposition, maps ñ/Ñ explicitly (NFD already
 * reduces these to a bare n/N + combining tilde, so the combining-mark strip
 * below would catch them too — the explicit map is a documented safety net,
 * not redundant enough to skip), then drops anything still non-ASCII
 * (emoji, curly quotes, ¿¡, etc.) as a final catch-all.
 * @param {string} content
 * @returns {string}
 */
export function sanitizeSmsContent(content) {
    return String(content)
        .normalize("NFD")
        .replace(/\p{Mn}/gu, "")
        .replace(/ñ/g, "n")
        .replace(/Ñ/g, "N")
        .replace(/[^\x00-\x7F]/g, "");
}

function truncateAtWordBoundary(text, maxLength) {
    if (text.length <= maxLength) return text;
    const slice = text.slice(0, maxLength);
    const lastSpace = slice.lastIndexOf(" ");
    return lastSpace > 0 ? slice.slice(0, lastSpace) : slice;
}

/**
 * Sanitizes and enforces the 160-char hard cap (no concatenation on this
 * provider) for a single message. This is the one place every send path
 * funnels through, so nothing can bypass either requirement.
 * @param {string} content
 * @param {string} toNumber - for the truncation warning log only
 * @returns {string}
 */
export function prepareSmsContent(content, toNumber) {
    const sanitized = sanitizeSmsContent(content);
    if (sanitized.length <= SMS_MAX_LENGTH) return sanitized;
    console.warn(`[MASIVA] Message to ${toNumber} exceeded ${SMS_MAX_LENGTH} chars (${sanitized.length}) — truncated at word boundary.`);
    return truncateAtWordBoundary(sanitized, SMS_MAX_LENGTH);
}
