// Theme state for the marketing pages (/, /about, /planes) — deliberately
// separate from lib/theme.js (the app's shared "theme" key on <html>).
//
// Two differences from the app's theme system, both intentional:
//  1. Different localStorage key, so a dark toggle here can never affect
//     the admin/client app and vice versa — no shared state to drift.
//  2. Themes a wrapper <div id="marketing-root"> instead of <html>.
//     tokens.css scopes its theme blocks to the bare [data-theme]
//     attribute, not html[data-theme] specifically (see /p/[token]/page.jsx
//     for the existing precedent — it forces light on a wrapper div the
//     same way). That's what makes the separation actually airtight rather
//     than just conventional: the app's blocking script only ever touches
//     <html>, this one only ever touches its own div.
// Default is unconditionally "light" — not "auto"/system, per the brief.
// An existing app user's dark preference (stored under the OTHER key) must
// not leak into "light by default" here.

export const MARKETING_THEME_KEY = "theme-marketing";
export const MARKETING_ROOT_ID = "marketing-root";

/** @returns {"light"|"dark"} */
export function getStoredMarketingTheme() {
    try {
        return localStorage.getItem(MARKETING_THEME_KEY) === "dark" ? "dark" : "light";
    } catch {
        return "light";
    }
}

/** @param {"light"|"dark"} theme */
export function applyMarketingTheme(theme) {
    const el = document.getElementById(MARKETING_ROOT_ID);
    if (el) el.setAttribute("data-theme", theme);
    try {
        localStorage.setItem(MARKETING_THEME_KEY, theme);
    } catch {}
    return theme;
}

// Blocking script, rendered as the first child of #marketing-root so it
// executes (as a real parser-encountered <script>, not a React re-render)
// before the rest of the div's content paints — same no-flash mechanism as
// the root layout's script, just scoped to this div instead of <html>.
export const MARKETING_THEME_INIT_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem('${MARKETING_THEME_KEY}');
    var theme = stored === 'dark' ? 'dark' : 'light';
    document.getElementById('${MARKETING_ROOT_ID}').setAttribute('data-theme', theme);
  } catch (e) {}
})();
`;
