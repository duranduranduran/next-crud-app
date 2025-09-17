'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AdminSidebar() {
    const pathname = usePathname();

    const links = [
        { name: "Deudores", href: "/admin" },
        { name: "Logs", href: "/admin/logs" },
        { name: "Reportes", href: "/admin/reportes" },
        { name: "Configuración", href: "/admin/configuracion" },
    ];

    return (
        <aside className="w-64 h-screen bg-gray-800 text-white p-6 fixed left-0 top-0">
            <h2 className="text-2xl font-bold mb-6">Admin Panel</h2>
            <nav className="space-y-4">
                {links.map(link => (
                    <Link
                        key={link.href}
                        href={link.href}
                        className={`block px-2 py-1 rounded hover:bg-gray-700 ${
                            pathname === link.href ? "bg-gray-700 font-semibold" : ""
                        }`}
                    >
                        {link.name}
                    </Link>
                ))}
            </nav>
        </aside>
    );
}