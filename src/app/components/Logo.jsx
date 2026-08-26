"use client";

import { useEffect, useState } from "react";

/**
 * Full wordmark logo, swaps asset with the active theme. Reads the
 * <html data-theme> attribute set by the no-flash init script / ThemeToggle
 * and watches it via MutationObserver so it stays in sync without needing
 * its own click handler or context provider.
 */
export default function Logo({ className = "h-14" }) {
    const [theme, setTheme] = useState(null);

    useEffect(() => {
        const root = document.documentElement;
        setTheme(root.getAttribute("data-theme"));
        const observer = new MutationObserver(() => {
            setTheme(root.getAttribute("data-theme"));
        });
        observer.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
        return () => observer.disconnect();
    }, []);

    // Before mount, theme is unknown — render nothing to avoid a wrong-color
    // flash (the outer page already avoids flash via the blocking init script;
    // this just avoids a second, local flash for this component specifically).
    if (!theme) return <span className={className} />;

    const src = theme === "light" ? "/logo-recupera-purple.png" : "/logo-recupera-white.png";
    return <img src={src} alt="Recupera" className={className} />;
}
