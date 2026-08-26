// Single source of truth for theme state, shared by every control that can
// change or display it (sidebar toggles, Ajustes' Apariencia section).
// Storage/DOM contract intentionally matches the existing no-flash init
// script in the root layout — it treats a missing/invalid localStorage
// value as "follow system", so "auto" needs no explicit stored value, and
// this module never has to touch that already-hardened script.

export const THEME_KEY = "theme";

/** @returns {"light"|"dark"|"auto"} */
export function getStoredMode() {
    try {
        const v = localStorage.getItem(THEME_KEY);
        return v === "light" || v === "dark" ? v : "auto";
    } catch {
        return "auto";
    }
}

export function systemPrefersDark() {
    try {
        return window.matchMedia("(prefers-color-scheme: dark)").matches;
    } catch {
        return true;
    }
}

/** @param {"light"|"dark"|"auto"} mode @returns {"light"|"dark"} */
export function resolveTheme(mode) {
    return mode === "auto" ? (systemPrefersDark() ? "dark" : "light") : mode;
}

/**
 * Sets the theme, persists the choice (or clears it for "auto"), and
 * notifies every other mounted control via a window event so two
 * independent UIs (e.g. the sidebar toggle and the Ajustes page) never
 * drift out of sync with each other.
 * @param {"light"|"dark"|"auto"} mode
 * @returns {"light"|"dark"} the resolved theme that was applied
 */
export function applyTheme(mode) {
    const resolved = resolveTheme(mode);
    document.documentElement.setAttribute("data-theme", resolved);
    try {
        if (mode === "auto") localStorage.removeItem(THEME_KEY);
        else localStorage.setItem(THEME_KEY, mode);
    } catch {}
    window.dispatchEvent(new CustomEvent("themechange", { detail: { mode, resolved } }));
    return resolved;
}

/**
 * Calls cb whenever the theme changes — either from another control
 * (applyTheme elsewhere) or, while in "auto" mode, from a live OS
 * theme switch. Returns an unsubscribe function.
 * @param {(state: {mode: "light"|"dark"|"auto", resolved: "light"|"dark"}) => void} cb
 */
export function subscribeThemeChange(cb) {
    const onCustom = (e) => cb(e.detail);
    window.addEventListener("themechange", onCustom);

    let mq;
    try {
        mq = window.matchMedia("(prefers-color-scheme: dark)");
    } catch {
        mq = null;
    }
    const onSystemChange = () => {
        if (getStoredMode() !== "auto") return;
        const resolved = resolveTheme("auto");
        document.documentElement.setAttribute("data-theme", resolved);
        cb({ mode: "auto", resolved });
    };
    mq?.addEventListener?.("change", onSystemChange);

    return () => {
        window.removeEventListener("themechange", onCustom);
        mq?.removeEventListener?.("change", onSystemChange);
    };
}
