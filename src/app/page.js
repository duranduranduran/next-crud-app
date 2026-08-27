'use client';

import Link from "next/link";
import MarketingShell from "./components/marketing/MarketingShell";
import SectionHeading from "./components/marketing/SectionHeading";
import HeroVisual from "./components/marketing/HeroVisual";
import HeroDots from "./components/marketing/HeroDots";
import { Reveal, SplitHeadline, Parallax } from "./components/marketing/fx";
import FeatureGuide from "./components/FeatureGuide";

const STATS = [
    { value: "+92%", label: "Tasa de contactabilidad" },
    { value: "24/7", label: "Automatización activa" },
    { value: "3", label: "Canales: email, SMS y llamada" },
];

const STEPS = [
    {
        n: "01",
        title: "Carga tus facturas",
        body: "Ingresa deudores uno por uno o sube cientos en segundos con una plantilla de Excel. Validamos cédula, monto y datos de contacto fila por fila.",
    },
    {
        n: "02",
        title: "Recordatorios automáticos",
        body: "Email, SMS y llamada con voz en español natural, activados por ti y ejecutados solos. Cada intento de contacto queda registrado.",
    },
    {
        n: "03",
        title: "Sigue la recuperación",
        body: "Un panel muestra qué se pagó, qué está en gestión y qué necesita escalarse — con la trazabilidad que exige un proceso legal, si llega a eso.",
    },
];

export default function LandingPage() {
    return (
        <MarketingShell>
            {/* HERO */}
            <section className="relative px-6 md:px-8 pt-16 md:pt-24 pb-20 md:pb-28 overflow-hidden">
                <HeroDots />
                <Parallax
                    className="absolute -top-24 right-[-10%] w-[36rem] h-[36rem] rounded-full pointer-events-none"
                    speed={0.35}
                >
                    <div
                        className="w-full h-full rounded-full opacity-[0.07]"
                        style={{ background: "radial-gradient(circle, var(--color-text-primary) 0%, transparent 70%)" }}
                        aria-hidden="true"
                    />
                </Parallax>

                <div className="relative max-w-6xl mx-auto grid lg:grid-cols-[1.1fr_0.9fr] gap-16 items-center">
                    <div className="min-w-0">
                        <div className="inline-flex items-center gap-2 border border-border-default px-4 py-1.5 rounded-full text-xs font-medium text-text-secondary mb-8">
                            <span className="w-1.5 h-1.5 bg-brand-mint rounded-full" />
                            Beta privada activa · Lanzamiento 2026
                        </div>

                        <SplitHeadline
                            text="Cobra sin perseguir a nadie"
                            className="text-5xl md:text-6xl xl:text-7xl font-extrabold leading-[0.98] tracking-tight text-text-primary mb-6"
                        />

                        <p className="text-lg text-text-secondary max-w-md leading-relaxed mb-10">
                            Recupera automatiza el seguimiento de tus deudores por email, SMS
                            y llamada, con trazabilidad completa desde el primer recordatorio
                            hasta el pago o el proceso legal.
                        </p>

                        <div className="flex flex-wrap gap-4 mb-14">
                            <Link
                                href="/sign-up"
                                className="bg-accent text-accent-fg px-8 py-3.5 rounded-xl font-bold hover:opacity-90 transition text-sm"
                            >
                                Crear Cuenta
                            </Link>
                            <Link
                                href="/planes"
                                className="border border-border-default px-8 py-3.5 rounded-xl hover:bg-surface-hover transition text-sm font-medium"
                            >
                                Ver Planes
                            </Link>
                        </div>

                        <div className="flex flex-wrap gap-x-8 gap-y-4">
                            {STATS.map((s, i) => (
                                <div key={i}>
                                    <p className="text-2xl font-bold text-text-primary">{s.value}</p>
                                    <p className="text-xs text-text-secondary mt-0.5">{s.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <HeroVisual />
                </div>
            </section>

            {/* 01 — SOCIAL PROOF */}
            <section className="border-y border-border-subtle px-6 md:px-8 py-10">
                <Reveal stagger={0.08} className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                    <div>
                        <p className="text-3xl font-extrabold text-text-primary">+92%</p>
                        <p className="text-xs text-text-secondary mt-1 uppercase tracking-wide">Contactabilidad</p>
                    </div>
                    <div>
                        <p className="text-3xl font-extrabold text-text-primary">24/7</p>
                        <p className="text-xs text-text-secondary mt-1 uppercase tracking-wide">Automatización</p>
                    </div>
                    <div>
                        <p className="text-3xl font-extrabold text-text-primary">100%</p>
                        <p className="text-xs text-text-secondary mt-1 uppercase tracking-wide">Cumplimiento legal</p>
                    </div>
                    <div>
                        <p className="text-3xl font-extrabold text-text-primary">LATAM</p>
                        <p className="text-xs text-text-secondary mt-1 uppercase tracking-wide">Diseñado para</p>
                    </div>
                </Reveal>
            </section>

            {/* 02 — CÓMO FUNCIONA */}
            <section id="como-funciona" className="px-6 md:px-8 py-24 md:py-32 max-w-6xl mx-auto">
                <Reveal>
                    <SectionHeading
                        index="02"
                        kicker="Cómo funciona"
                        title="De la factura vencida al pago, en tres pasos"
                        center
                    />
                </Reveal>

                <Reveal stagger={0.1} className="grid md:grid-cols-3 gap-10 mt-16">
                    {STEPS.map((s) => (
                        <div key={s.n} className="border-t border-border-default pt-6">
                            <p className="text-sm font-mono text-text-tertiary mb-3">{s.n}</p>
                            <h3 className="text-xl font-bold text-text-primary mb-3">{s.title}</h3>
                            <p className="text-sm text-text-secondary leading-relaxed">{s.body}</p>
                        </div>
                    ))}
                </Reveal>
            </section>

            {/* 03 — PRODUCTO */}
            <section className="px-6 md:px-8 py-24 md:py-32 bg-surface-hover">
                <div className="max-w-6xl mx-auto">
                    <Reveal>
                        <SectionHeading index="03" kicker="Producto" title="Todo lo que necesitas, en un solo lugar" center />
                    </Reveal>
                    <div className="mt-16">
                        <FeatureGuide />
                    </div>
                </div>
            </section>

            {/* 04 — PRECIOS (teaser, no duplica la grilla de /planes) */}
            <Reveal as="section" className="px-6 md:px-8 py-24 md:py-32 max-w-6xl mx-auto">
                <div className="grid md:grid-cols-2 gap-12 items-end">
                    <SectionHeading
                        index="04"
                        kicker="Precios"
                        title="Un plan para cada tamaño de cartera"
                        description="Desde 200 hasta deudores ilimitados. Sin contratos largos, sin sorpresas — cancela cuando quieras."
                    />
                    <div className="flex md:justify-end">
                        <Link
                            href="/planes"
                            className="inline-flex items-center gap-2 border border-border-default px-8 py-3.5 rounded-xl text-sm font-medium hover:bg-accent hover:text-accent-fg hover:border-accent transition"
                        >
                            Ver todos los planes
                            <span aria-hidden="true">→</span>
                        </Link>
                    </div>
                </div>
            </Reveal>

            {/* 05 — FILOSOFÍA (prosa larga) */}
            <Reveal as="section" className="px-6 md:px-8 py-24 md:py-32 border-t border-border-subtle">
                <div className="max-w-3xl mx-auto">
                    <SectionHeading index="05" kicker="Nuestra filosofía" title="Cobranza sin hostigamiento" />
                    <div className="mt-8 space-y-5 text-base md:text-lg text-text-secondary leading-relaxed">
                        <p>
                            La cobranza tradicional en Ecuador todavía depende de llamadas
                            insistentes y hojas de cálculo dispersas entre distintos
                            responsables. Ese modelo no solo es lento: desgasta la relación
                            entre la empresa y su cliente justo cuando más se necesita
                            mantenerla.
                        </p>
                        <p>
                            Construimos Recupera con una premisa distinta: automatizar el
                            seguimiento no significa perder el control ni la cortesía.
                            Cada recordatorio, cada llamada y cada cambio de estado queda
                            registrado con fecha y detalle, de modo que si un caso necesita
                            escalarse a proceso judicial, la evidencia de gestión ya existe
                            — completa y ordenada, sin reconstruir nada a último momento.
                        </p>
                        <p>
                            El resultado es una plataforma que recupera liquidez de forma
                            consistente sin convertir a tu equipo en un centro de llamadas,
                            y sin convertir a tus clientes en el objetivo de una campaña de
                            hostigamiento.
                        </p>
                    </div>
                    <Link
                        href="/about"
                        className="inline-flex items-center gap-2 text-sm font-medium text-text-primary mt-8 hover:underline underline-offset-4"
                    >
                        Conoce más sobre Recupera
                        <span aria-hidden="true">→</span>
                    </Link>
                </div>
            </Reveal>

            {/* CONTACTO / CTA FINAL */}
            <section className="px-6 md:px-8 pb-24 md:pb-32">
                <Reveal className="max-w-4xl mx-auto rounded-3xl bg-accent px-8 md:px-16 py-16 text-center">
                    <h2 className="text-3xl md:text-4xl font-bold text-accent-fg mb-4">
                        Activa tu sistema de recuperación hoy
                    </h2>
                    <p className="text-accent-fg/70 mb-8 text-sm max-w-md mx-auto">
                        Sin compromisos. Configura tu cuenta en minutos y empieza a
                        automatizar tus recordatorios.
                    </p>
                    <div className="flex flex-wrap justify-center gap-4">
                        <Link
                            href="/sign-up"
                            className="bg-brand-mint text-accent px-10 py-4 rounded-xl font-bold hover:opacity-90 transition"
                        >
                            Crear Cuenta Gratis
                        </Link>
                        <a
                            href="mailto:hola@recupera.app"
                            className="border border-accent-fg/25 text-accent-fg px-10 py-4 rounded-xl font-bold hover:bg-accent-fg/10 transition"
                        >
                            Hablar con nosotros
                        </a>
                    </div>
                </Reveal>
            </section>
        </MarketingShell>
    );
}
