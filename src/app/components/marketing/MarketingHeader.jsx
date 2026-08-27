'use client';

import { useState } from "react";
import Link from "next/link";
import { Menu, X, Sun, Moon } from "lucide-react";
import Logo from "../Logo";
import { KeyChip } from "./WindowBox";

const NAV_LINKS = [
    { href: "/", label: "Inicio", key: "I" },
    { href: "/about", label: "Nosotros", key: "N" },
    { href: "/planes", label: "Planes", key: "P" },
];

export default function MarketingHeader({ theme, onToggleTheme }) {
    const [open, setOpen] = useState(false);
    const ThemeIcon = theme === "light" ? Moon : Sun;
    const themeLabel = theme === "light" ? "Cambiar a tema oscuro" : "Cambiar a tema claro";
    const frameBorder = { borderBottom: "1.5px solid var(--color-frame)" };

    return (
        <header className="sticky top-0 z-50 bg-surface-page/90 backdrop-blur-md" style={frameBorder}>
            <nav className="max-w-6xl mx-auto px-6 md:px-8 h-16 flex items-center justify-between">
                <Link href="/" className="flex-shrink-0" onClick={() => setOpen(false)}>
                    <Logo theme={theme} className="h-8 w-auto" />
                </Link>

                <ul className="hidden md:flex items-center gap-7 text-sm font-mono uppercase tracking-wide">
                    {NAV_LINKS.map(link => (
                        <li key={link.href}>
                            <Link href={link.href} className="group flex items-center gap-2 text-text-secondary hover:text-text-primary transition">
                                <KeyChip letter={link.key} className="opacity-0 group-hover:opacity-100 transition" />
                                {link.label}
                            </Link>
                        </li>
                    ))}
                </ul>

                <div className="hidden md:flex items-center gap-3">
                    <button
                        onClick={onToggleTheme}
                        aria-label={themeLabel}
                        title={themeLabel}
                        className="w-9 h-9 flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-surface-hover transition"
                        style={{ border: "1.5px solid var(--color-frame)" }}
                    >
                        <ThemeIcon size={17} />
                    </button>
                    <Link
                        href="/sign-in"
                        className="group flex items-center gap-2 px-4 py-2 font-mono text-xs uppercase tracking-wide hover:bg-accent hover:text-accent-fg transition"
                        style={{ border: "1.5px solid var(--color-frame)" }}
                    >
                        <KeyChip letter="S" tone="yellow" />
                        Iniciar Sesión
                    </Link>
                </div>

                <div className="flex md:hidden items-center gap-1">
                    <button
                        onClick={onToggleTheme}
                        aria-label={themeLabel}
                        className="w-9 h-9 flex items-center justify-center text-text-secondary hover:bg-surface-hover transition"
                        style={{ border: "1.5px solid var(--color-frame)" }}
                    >
                        <ThemeIcon size={17} />
                    </button>
                    <button
                        onClick={() => setOpen(v => !v)}
                        aria-label={open ? "Cerrar menú" : "Abrir menú"}
                        aria-expanded={open}
                        className="w-9 h-9 flex items-center justify-center text-text-secondary hover:bg-surface-hover transition"
                        style={{ border: "1.5px solid var(--color-frame)" }}
                    >
                        {open ? <X size={19} /> : <Menu size={19} />}
                    </button>
                </div>
            </nav>

            {open && (
                <div className="md:hidden bg-surface-page px-6 py-4" style={{ borderTop: "1.5px solid var(--color-frame)" }}>
                    <ul className="flex flex-col gap-1 font-mono uppercase tracking-wide">
                        {NAV_LINKS.map(link => (
                            <li key={link.href}>
                                <Link
                                    href={link.href}
                                    onClick={() => setOpen(false)}
                                    className="flex items-center gap-3 py-2.5 text-base text-text-secondary hover:text-text-primary transition"
                                >
                                    <KeyChip letter={link.key} />
                                    {link.label}
                                </Link>
                            </li>
                        ))}
                    </ul>
                    <Link
                        href="/sign-in"
                        onClick={() => setOpen(false)}
                        className="mt-3 flex items-center justify-center gap-2 py-2.5 font-mono text-xs uppercase tracking-wide hover:bg-accent hover:text-accent-fg transition"
                        style={{ border: "1.5px solid var(--color-frame)" }}
                    >
                        <KeyChip letter="S" tone="yellow" />
                        Iniciar Sesión
                    </Link>
                </div>
            )}
        </header>
    );
}
