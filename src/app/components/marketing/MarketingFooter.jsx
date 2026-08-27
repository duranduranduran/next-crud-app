import Link from "next/link";

export default function MarketingFooter() {
    return (
        <footer className="mt-24" style={{ borderTop: "1.5px solid var(--color-frame)" }}>
            <div className="max-w-6xl mx-auto px-6 md:px-8 py-14 grid gap-10 md:grid-cols-4">
                <div className="md:col-span-2">
                    <p className="font-mono uppercase tracking-wide font-bold text-lg text-text-primary mb-3">Recupera</p>
                    <p className="text-sm text-text-secondary max-w-xs leading-relaxed">
                        Cobranza inteligente para empresas ecuatorianas. Automatización,
                        trazabilidad y respaldo legal en una sola plataforma.
                    </p>
                </div>

                <div>
                    <p className="text-xs font-mono font-semibold uppercase tracking-widest text-text-tertiary mb-4">Producto</p>
                    <ul className="flex flex-col gap-2.5 text-sm text-text-secondary">
                        <li><Link href="/#como-funciona" className="hover:text-text-primary transition">Cómo funciona</Link></li>
                        <li><Link href="/planes" className="hover:text-text-primary transition">Planes</Link></li>
                        <li><Link href="/about" className="hover:text-text-primary transition">Nosotros</Link></li>
                    </ul>
                </div>

                <div>
                    <p className="text-xs font-mono font-semibold uppercase tracking-widest text-text-tertiary mb-4">Contacto</p>
                    <ul className="flex flex-col gap-2.5 text-sm text-text-secondary">
                        <li>
                            <a href="mailto:hola@recupera.app" className="hover:text-text-primary transition">
                                hola@recupera.app
                            </a>
                        </li>
                        <li><Link href="/sign-in" className="hover:text-text-primary transition">Iniciar sesión</Link></li>
                    </ul>
                </div>
            </div>

            <div style={{ borderTop: "1.5px solid var(--color-frame)" }}>
                <div className="max-w-6xl mx-auto px-6 md:px-8 py-6 flex flex-col md:flex-row justify-between items-center gap-3 text-xs font-mono text-text-tertiary">
                    <p>© {new Date().getFullYear()} Recupera. Todos los derechos reservados.</p>
                    <div className="flex gap-6">
                        <Link href="#" className="hover:text-text-secondary transition">Privacidad</Link>
                        <Link href="#" className="hover:text-text-secondary transition">Términos</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
