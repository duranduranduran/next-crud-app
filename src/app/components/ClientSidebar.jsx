'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SignOutButton, useUser } from "@clerk/nextjs";
import {
    Users,
    UserPlus,
    FileText,
    BarChart3,
    Settings,
    LogOut,
} from 'lucide-react';
import ThemeToggle from './ThemeToggle';

function getInitials(name) {
    return (name || "??").split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();
}

// Deliberately its own component, not AdminSidebar reused — clients have
// five items and open this occasionally, not all day, so the hover-expand
// interaction that pays off for admins (glanceable icons, expand on demand)
// is just friction here. Always expanded, fixed width, nothing to discover.
export default function ClientSidebar() {

    const pathname = usePathname();
    const { user } = useUser();

    const links = [
        { name: "Deudores", href: "/client", icon: Users },
        { name: "Agregar", href: "/client/agregar", icon: UserPlus },
        { name: "Facturas", href: "/client/facturas", icon: FileText },
        { name: "Reportes", href: "/client/reportes", icon: BarChart3 },
        { name: "Ajustes", href: "/client/ajustes", icon: Settings },
    ];

    const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface-raised";
    const navItemClass = active => `flex items-center gap-3 p-3 rounded-xl border-l-2 transition ${focusRing} ${
        active
            ? "bg-surface-hover border-accent text-accent"
            : "border-transparent text-text-secondary hover:text-text-primary hover:bg-surface-hover"
    }`;

    return (
        <aside data-density="compact" className="fixed left-0 top-0 h-screen w-[152px] bg-surface-raised text-text-primary flex flex-col justify-between z-40">

            {/* TOP */}
            <div>

                {/* LOGO — same fixed-dark chip as AdminSidebar (only a white
                    favicon asset exists, see --color-logo-chip in tokens.css),
                    always shown since this sidebar never collapses. */}
                <div className="flex items-center gap-2 p-4 font-bold text-sm">
                    <div className="h-9 w-9 rounded-xl bg-logo-chip flex items-center justify-center flex-shrink-0">
                        <img src="/logo-favicon-white.png" alt="recupera" className="h-5 w-auto"/>
                    </div>
                    <span className="whitespace-nowrap">RECUPERA</span>
                </div>

                {/* NAVIGATION — same left-border active pattern as AdminSidebar
                    so the two feel related, just always-expanded here. */}
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
                                <Icon size={20} className="shrink-0"/>
                                <span className="whitespace-nowrap text-sm">{link.name}</span>
                            </Link>
                        );
                    })}
                </nav>
            </div>

            {/* ACCOUNT / SIGN OUT / THEME */}
            <div className="p-3 border-t border-border-subtle flex flex-col gap-1">
                <div className="flex items-center gap-3 p-2">
                    <div className="w-8 h-8 rounded-full bg-surface-hover text-text-primary flex items-center justify-center text-[11px] font-bold flex-shrink-0">
                        {getInitials(user?.fullName)}
                    </div>
                    <div className="min-w-0">
                        <p className="text-xs font-medium text-text-primary truncate">{user?.fullName || "Cliente"}</p>
                        <p className="text-[10px] text-text-tertiary">Cliente</p>
                    </div>
                </div>

                <ThemeToggle variant="static" />

                <SignOutButton redirectUrl="/sign-in">
                    <button className={`flex items-center gap-3 p-3 rounded-xl border-l-2 border-transparent text-text-secondary hover:text-danger hover:bg-danger-bg transition ${focusRing}`}>
                        <LogOut size={20} className="shrink-0" />
                        <span className="whitespace-nowrap text-sm">Cerrar sesión</span>
                    </button>
                </SignOutButton>
            </div>

        </aside>
    );
}
