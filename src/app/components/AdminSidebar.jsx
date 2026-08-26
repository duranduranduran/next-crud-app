'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SignOutButton, useUser } from "@clerk/nextjs";
import {
    Users,
    FileText,
    BarChart3,
    Settings,
    LogOut,
    Inbox,
    Bell,
} from 'lucide-react';
import ThemeToggle from './ThemeToggle';

function getInitials(name) {
    return (name || "??").split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();
}

export default function AdminSidebar() {

    const pathname = usePathname();
    const { user } = useUser();

    const links = [
        { name: "Deudores", href: "/admin", icon: Users },
        { name: "Logs", href: "/admin/logs", icon: FileText },
        { name: "Reportes", href: "/admin/reportes", icon: BarChart3 },
        { name: "Notificaciones", href: "/admin/notificaciones", icon: Bell },
        { name: "Bandeja", href: "/admin/bandeja", icon: Inbox, badge: true },
        // { name: "Configuración", href: "/admin/configuracion", icon: Settings },
    ];

    const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface-raised";
    const navItemClass = active => `flex items-center gap-4 p-3 rounded-xl border-l-2 transition ${focusRing} ${
        active
            ? "bg-surface-hover border-accent text-accent"
            : "border-transparent text-text-secondary hover:text-text-primary hover:bg-surface-hover"
    }`;

    return (
        <aside data-density="compact" className="group fixed left-0 top-0 h-screen w-20 hover:w-60 bg-surface-raised text-text-primary flex flex-col justify-between transition-all duration-300 z-40 overflow-hidden">

            {/* TOP */}
            <div>

                {/* LOGO */}
                <div className="flex items-center gap-3 p-6 font-bold text-lg">
                    {/* Only a white favicon asset exists (no purple variant), so
                        the mark sits on a fixed-dark chip to stay legible in
                        light mode too — see --color-logo-chip in tokens.css. */}
                    <div className="h-10 w-10 rounded-xl bg-logo-chip flex items-center justify-center flex-shrink-0">
                        <img src="/logo-favicon-white.png" alt="recupera" className="h-6 w-auto"/>
                    </div>
                    <span className="whitespace-nowrap opacity-0 group-hover:opacity-100 transition">
                        RECUPERA
                    </span>
                </div>

                {/* NAVIGATION — every item shares the same treatment, Bandeja included */}
                <nav className="flex flex-col gap-2 px-3">
                    {links.map(link => {
                        const Icon = link.icon;
                        const active = pathname === link.href;

                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={navItemClass(active)}
                            >
                                <span className="relative shrink-0">
                                    <Icon size={22} className="shrink-0"/>
                                    {link.badge && (
                                        // unread badge — wire up later
                                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-status-pagado rounded-full border border-surface-raised"/>
                                    )}
                                </span>
                                <span className="whitespace-nowrap opacity-0 group-hover:opacity-100 transition">
                                    {link.name}
                                </span>
                            </Link>
                        );
                    })}

                    <ThemeToggle variant="nav" />
                </nav>
            </div>

            {/* ACCOUNT / SIGN OUT — same single-element collapse pattern as the
                nav links above (icon always visible, label fades in on
                hover-expand). Two stacked rows rather than side-by-side:
                collapsed width (w-20/80px) only has room for one icon-sized
                element per row, not an avatar + button sharing a row. */}
            <div className="p-3 border-t border-border-subtle flex flex-col gap-1">
                <div className="flex items-center gap-4 p-1">
                    <div className="w-8 h-8 rounded-full bg-accent-bg text-accent flex items-center justify-center text-[11px] font-bold flex-shrink-0">
                        {getInitials(user?.fullName)}
                    </div>
                    <p className="text-xs font-medium text-text-primary truncate whitespace-nowrap opacity-0 group-hover:opacity-100 transition">
                        {user?.fullName || "Admin"}
                    </p>
                </div>
                <SignOutButton redirectUrl="/sign-in">
                    <button className={`flex items-center gap-4 p-3 rounded-xl border-l-2 border-transparent text-text-secondary hover:text-danger hover:bg-danger-bg transition ${focusRing}`}>
                        <LogOut size={22} className="shrink-0" />
                        <span className="whitespace-nowrap opacity-0 group-hover:opacity-100 transition">
                            Cerrar sesión
                        </span>
                    </button>
                </SignOutButton>
            </div>

        </aside>
    );
}
