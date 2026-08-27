'use client';

import { useEffect, useState } from "react";
import {
    getStoredMarketingTheme,
    applyMarketingTheme,
    MARKETING_THEME_INIT_SCRIPT,
    MARKETING_ROOT_ID,
} from "../../lib/marketingTheme";
import { useScrollTriggerRefresh } from "./fx";
import MarketingHeader from "./MarketingHeader";
import MarketingFooter from "./MarketingFooter";

// Wraps every marketing page (/, /about, /planes). Owns the light/dark
// toggle and the theming div — see marketingTheme.js for why this themes
// its own div instead of <html>. data-theme="light" here is the literal
// SSR value (matches the default); the blocking script below may correct
// it to "dark" for a returning visitor before the div's content ever
// paints, which is exactly the >html< root layout does for the app —
// same reason this needs suppressHydrationWarning: the blocking script
// intentionally makes the live DOM diverge from what React rendered on
// the server, on purpose, before hydration ever compares the two.
export default function MarketingShell({ children }) {
    const [theme, setTheme] = useState("light");

    useEffect(() => {
        setTheme(getStoredMarketingTheme());
    }, []);

    useScrollTriggerRefresh();

    const toggleTheme = () => {
        const next = theme === "dark" ? "light" : "dark";
        applyMarketingTheme(next);
        setTheme(next);
    };

    return (
        <div
            id={MARKETING_ROOT_ID}
            data-theme="light"
            data-surface="marketing"
            suppressHydrationWarning
            className="min-h-screen bg-surface-page text-text-primary overflow-x-hidden"
            style={{
                borderLeft: "3px solid var(--color-frame)",
                borderRight: "3px solid var(--color-frame)",
            }}
        >
            <script dangerouslySetInnerHTML={{ __html: MARKETING_THEME_INIT_SCRIPT }} />
            <MarketingHeader theme={theme} onToggleTheme={toggleTheme} />
            {children}
            <MarketingFooter />
        </div>
    );
}
