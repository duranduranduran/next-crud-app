'use client';

import { useState } from "react";
import Link from "next/link";
import { Menu, X, Sun, Moon } from "lucide-react";
import Logo from "../Logo";

const NAV_LINKS = [
    { href: "/", label: "Inicio" },
    { href: "/about", label: "Nosotros" },
    { href: "/planes", label: "Planes" },
];

export default function MarketingHeader({ theme, onToggleTheme }) {
    const [open, setOpen] = useState(false);
    const ThemeIcon = theme === "light" ? Moon : Sun;
    const themeLabel = theme === "light" ? "Cambiar a tema oscuro" : "Cambiar a tema claro";

    return (
        <header className="sticky top-0 z-50 border-b border-border-subtle bg-surface-page/90 backdrop-blur-md">
            <nav className="max-w-6xl mx-auto px-6 md:px-8 h-16 flex items-center justify-between">
                <Link href="/" className="flex-shrink-0" onClick={() => setOpen(false)}>
                    <Logo theme={theme} className="h-8 w-auto" />
                </Link>

                <ul className="hidden md:flex items-center gap-8 text-sm">
                    {NAV_LINKS.map(link => (
                        <li key={link.href}>
                            <Link href={link.href} className="text-text-secondary hover:text-text-primary transition">
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
                        className="w-9 h-9 rounded-lg flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-surface-hover transition"
                    >
                        <ThemeIcon size={17} />
                    </button>
                    <Link
                        href="/sign-in"
                        className="border border-border-default px-5 py-2 rounded-xl text-sm font-medium hover:bg-accent hover:text-accent-fg hover:border-accent transition"
                    >
                        Iniciar Sesión
                    </Link>
                </div>

                <div className="flex md:hidden items-center gap-1">
                    <button
                        onClick={onToggleTheme}
                        aria-label={themeLabel}
                        className="w-9 h-9 rounded-lg flex items-center justify-center text-text-secondary hover:bg-surface-hover transition"
                    >
                        <ThemeIcon size={17} />
                    </button>
                    <button
                        onClick={() => setOpen(v => !v)}
                        aria-label={open ? "Cerrar menú" : "Abrir menú"}
                        aria-expanded={open}
                        className="w-9 h-9 rounded-lg flex items-center justify-center text-text-secondary hover:bg-surface-hover transition"
                    >
                        {open ? <X size={19} /> : <Menu size={19} />}
                    </button>
                </div>
            </nav>

            {open && (
                <div className="md:hidden border-t border-border-subtle bg-surface-page px-6 py-4">
                    <ul className="flex flex-col gap-1">
                        {NAV_LINKS.map(link => (
                            <li key={link.href}>
                                <Link
                                    href={link.href}
                                    onClick={() => setOpen(false)}
                                    className="block py-2.5 text-base text-text-secondary hover:text-text-primary transition"
                                >
                                    {link.label}
                                </Link>
                            </li>
                        ))}
                    </ul>
                    <Link
                        href="/sign-in"
                        onClick={() => setOpen(false)}
                        className="mt-3 block text-center border border-border-default px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-accent hover:text-accent-fg hover:border-accent transition"
                    >
                        Iniciar Sesión
                    </Link>
                </div>
            )}
        </header>
    );
}
