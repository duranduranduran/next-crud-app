"use client";

import { useEffect, useState } from "react";

/**
 * Full wordmark logo, swaps asset with the active theme. Reads the
 * <html data-theme> attribute set by the no-flash init script / ThemeToggle
 * and watches it via MutationObserver so it stays in sync without needing
 * its own click handler or context provider.
 *
 * `theme` lets a caller pass the resolved theme directly instead of relying
 * on the <html> watcher — marketing pages theme a wrapper div (not <html>,
 * see marketingTheme.js) precisely so a dark toggle there can never affect
 * the app, which also means the MutationObserver below can't see it. Every
 * existing call site omits this prop, so their behavior is unchanged.
 */
export default function Logo({ className = "h-14", theme: themeOverride }) {
    const [theme, setTheme] = useState(themeOverride ?? null);

    useEffect(() => {
        if (themeOverride) return;
        const root = document.documentElement;
        setTheme(root.getAttribute("data-theme"));
        const observer = new MutationObserver(() => {
            setTheme(root.getAttribute("data-theme"));
        });
        observer.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
        return () => observer.disconnect();
    }, [themeOverride]);

    const resolved = themeOverride ?? theme;

    // Before mount, theme is unknown — render nothing to avoid a wrong-color
    // flash (the outer page already avoids flash via the blocking init script;
    // this just avoids a second, local flash for this component specifically).
    if (!resolved) return <span className={className} />;

    // Both are the horizontal wordmark (1200x371, 3.23:1) — logo-recupera-purple.png
    // (968x600, a vertical/stacked lockup) was wired here before and rendered
    // tiny and cramped at header height because it was being sized for a
    // horizontal aspect it doesn't have. No horizontal asset exists in the
    // brand's purple/blue, so light theme uses the horizontal green wordmark
    // instead — same green as --color-brand-mint, already the marketing
    // pages' accent color (CTA buttons, hero dots).
    const src = resolved === "light" ? "/logo-recupera-green.png" : "/logo-recupera-white.png";
    return <img src={src} alt="Recupera" className={className} />;
}
