'use client';

import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { getStoredMode, resolveTheme, applyTheme, subscribeThemeChange } from '../lib/theme';

// The blocking script in the root layout already set data-theme on <html>
// before this component ever mounts (that's what prevents the flash) — this
// just reads it back to initialize React state. Can't read document during
// SSR, so this starts as null and corrects itself in the effect below; the
// brief mismatch is invisible since it resolves before the user can
// interact with the toggle.
//
// This is a binary click target (sun/moon), so clicking always sets an
// explicit light/dark mode — "auto" is only reachable from Ajustes'
// three-way control. Both stay in sync via subscribeThemeChange: whichever
// control changes the theme dispatches an event, every mounted toggle
// (this one included) updates to match, so there's one source of truth
// (the stored mode) with multiple views over it, not two independent state
// machines.
export default function ThemeToggle({ variant = "icon", className = "" }) {
    const [theme, setTheme] = useState(null);

    useEffect(() => {
        setTheme(resolveTheme(getStoredMode()));
        return subscribeThemeChange(({ resolved }) => setTheme(resolved));
    }, []);

    const toggle = () => {
        const next = theme === 'dark' ? 'light' : 'dark';
        setTheme(applyTheme(next));
    };

    const label = theme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro';
    const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";
    const Icon = theme === 'light' ? Moon : Sun;

    if (variant === "nav") {
        // Matches AdminSidebar's hover-expand nav-item layout: icon + label,
        // border-l-2 accent slot (never active, so always transparent), label
        // hidden until the ancestor .group is hovered.
        return (
            <button
                onClick={toggle}
                aria-label={label}
                className={`flex items-center gap-4 p-3 rounded-xl border-l-2 border-transparent text-text-secondary hover:text-text-primary hover:bg-surface-hover transition ${focusRing} ring-offset-surface-raised ${className}`}
            >
                <Icon size={22} className="shrink-0" />
                <span className="whitespace-nowrap opacity-0 group-hover:opacity-100 transition">
                    {theme === 'light' ? 'Tema oscuro' : 'Tema claro'}
                </span>
            </button>
        );
    }

    if (variant === "static") {
        // Same nav-item layout as "nav", but the label is always visible —
        // for sidebars that don't hover-expand (ClientSidebar is a fixed
        // width, always-expanded rail; there's no .group hover to reveal
        // an opacity-0 label, so "nav"'s pattern would leave it permanently
        // hidden here).
        return (
            <button
                onClick={toggle}
                aria-label={label}
                className={`flex items-center gap-4 p-3 rounded-xl border-l-2 border-transparent text-text-secondary hover:text-text-primary hover:bg-surface-hover transition ${focusRing} ring-offset-surface-raised ${className}`}
            >
                <Icon size={20} className="shrink-0" />
                <span className="whitespace-nowrap text-sm">
                    {theme === 'light' ? 'Tema oscuro' : 'Tema claro'}
                </span>
            </button>
        );
    }

    return (
        <button
            onClick={toggle}
            aria-label={label}
            className={`flex items-center justify-center flex-shrink-0 w-10 h-10 rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface-hover transition ${focusRing} ${className}`}
        >
            <Icon size={18} />
        </button>
    );
}
