// Pure, no server dependencies — safe to import from client components
// (the notifications composer needs it for a live recipient breakdown)
// and from server code alike. masiva.js re-exports this so its existing
// import surface (`toE164Ec` from "@/lib/sms/masiva") doesn't change.

/**
 * Normalizes EC mobile numbers to E.164. Returns null if unusable.
 * @param {string} input
 * @returns {string|null}
 */
export function toE164Ec(input) {
    if (!input) return null;
    const d = String(input).replace(/[^\d+]/g, "").replace(/^\+/, "");

    if (/^5939\d{8}$/.test(d)) return `+${d}`;           // 593 9XXXXXXXX
    if (/^09\d{8}$/.test(d)) return `+593${d.slice(1)}`; // 09XXXXXXXX
    if (/^9\d{8}$/.test(d)) return `+593${d}`;           // 9XXXXXXXX
    return null;
}
