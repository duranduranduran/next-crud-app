'use client';

import Link from "next/link";
import { useRef } from "react";
import MarketingShell from "./components/marketing/MarketingShell";
import SectionHeading from "./components/marketing/SectionHeading";
import HeroVisual from "./components/marketing/HeroVisual";
import HeroDots from "./components/marketing/HeroDots";
import WindowBox, { KeyChip } from "./components/marketing/WindowBox";
import {
    Reveal,
    SplitCharHeadline,
    Parallax,
    CountUp,
    Marquee,
    useMagnetic,
    HorizontalPin,
    PinnedAdvance,
    useBatchReveal,
} from "./components/marketing/fx";

const MARQUEE_ITEMS = [
    "SIN HOSTIGAMIENTO", "✕", "AUTOMATIZACIÓN 24/7", "✕", "3 CANALES DE CONTACTO", "✕",
    "TRAZABILIDAD LEGAL COMPLETA", "✕", "DISEÑADO PARA ECUADOR", "✕",
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

const PRODUCT_STEPS = [
    {
        n: "01",
        title: "Agrega tus deudores",
        desc: "Manual o por carga masiva en Excel — cédula, monto y contacto validados al ingresar.",
        checks: ["Validación de cédula ecuatoriana", "Plantilla descargable lista para usar", "Errores señalados fila por fila"],
    },
    {
        n: "02",
        title: "Notificaciones automáticas",
        desc: "Email, SMS y llamada con voz en español natural, activadas con un clic.",
        checks: ["Envío desde tu dominio propio", "Llamada IA en español natural", "Procesamiento en segundo plano"],
    },
    {
        n: "03",
        title: "Reportes en tiempo real",
        desc: "Tasa de recuperación, estados y contactabilidad, siempre actualizados.",
        checks: ["Exporta a Excel con un clic", "Historial de notificaciones por deudor", "Tasa de contactabilidad calculada"],
    },
    {
        n: "04",
        title: "Trazabilidad total",
        desc: "Cada acción queda registrada — auditoría completa para cumplimiento legal.",
        checks: ["Registro de cambios de estado", "Historial de notas por deudor", "Evidencia lista para proceso judicial"],
    },
];

function ProductStepPanel({ step, index, total }) {
    return (
        <div className="max-w-2xl mx-auto w-full">
            <div
                className="bg-surface-raised"
                style={{
                    border: "1.5px solid var(--color-frame)",
                    borderRadius: "var(--radius-frame)",
                    boxShadow: "6px 6px 0 0 var(--color-frame-shadow)",
                }}
            >
                <div className="px-5 pt-3">
                    <div className="flex items-center justify-between pb-2">
                        <span aria-hidden="true" className="w-4 h-4 flex items-center justify-center text-[9px] font-mono leading-none" style={{ border: "1.5px solid var(--color-frame)" }}>✕</span>
                        <span className="font-mono text-[11px] uppercase tracking-widest text-text-secondary">Producto</span>
                        <span aria-hidden="true" className="w-4 h-4 flex items-center justify-center text-[9px] font-mono leading-none" style={{ border: "1.5px solid var(--color-frame)" }}>⧉</span>
                    </div>
                    <div style={{ borderTop: "1.5px solid var(--color-frame)" }} />
                    <div className="mt-[3px]" style={{ borderTop: "1px solid var(--color-frame)", opacity: 0.55 }} />
                </div>
                <div className="p-6 md:p-10">
                    <p className="text-xs font-mono uppercase tracking-widest text-text-tertiary mb-3">
                        {step.n} / {String(total).padStart(2, "0")}
                    </p>
                    <h3 className="text-2xl md:text-3xl font-extrabold text-text-primary mb-4">{step.title}</h3>
                    <p className="text-base text-text-secondary leading-relaxed mb-6 max-w-lg">{step.desc}</p>
                    <ul className="space-y-2">
                        {step.checks.map((c, j) => (
                            <li key={j} className="flex items-center gap-2.5 text-sm text-text-secondary">
                                <span className="font-mono text-xs flex-shrink-0" style={{ color: "var(--color-brand-mint)" }}>✓</span>
                                {c}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
            <div className="flex items-center justify-center gap-2 mt-6">
                {Array.from({ length: total }, (_, i) => (
                    <span
                        key={i}
                        className="h-1.5 transition-all duration-300"
                        style={{
                            width: i === index ? "1.75rem" : "0.75rem",
                            background: i === index ? "var(--color-frame)" : "var(--color-border-default)",
                        }}
                    />
                ))}
            </div>
        </div>
    );
}

function MagneticCTA({ href, className, children }) {
    const ref = useMagnetic(0.35, 12);
    return (
        <Link ref={ref} href={href} className={className}>
            {children}
        </Link>
    );
}

function ValuesBatch() {
    const containerRef = useRef(null);
    useBatchReveal(containerRef, "[data-batch-stat]", { y: 20, stagger: 0.1 });
    return (
        <div ref={containerRef} className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4">
            {[
                { render: () => <CountUp value={92} prefix="+" suffix="%" />, label: "Contactabilidad" },
                { render: () => "24/7", label: "Automatización" },
                { render: () => <CountUp value={100} suffix="%" />, label: "Cumplimiento legal" },
                { render: () => "LATAM", label: "Diseñado para" },
            ].map((s, i) => (
                <div
                    key={i}
                    data-batch-stat
                    className="text-center py-6 px-4"
                    style={{
                        borderRight: i % 2 === 0 ? "1.5px solid var(--color-frame)" : undefined,
                        borderBottom: i < 2 ? "1.5px solid var(--color-frame)" : undefined,
                    }}
                >
                    <p className="text-3xl font-extrabold font-mono text-text-primary">{s.render()}</p>
                    <p className="text-xs font-mono text-text-secondary mt-1 uppercase tracking-wide">{s.label}</p>
                </div>
            ))}
        </div>
    );
}

export default function LandingPage() {
    return (
        <MarketingShell>
            {/* HERO */}
            <section className="relative px-6 md:px-8 pt-16 md:pt-24 pb-20 md:pb-28 overflow-hidden">
                <HeroDots />
                <Parallax
                    className="absolute -top-24 right-[-10%] w-[36rem] h-[36rem] pointer-events-none"
                    speed={0.35}
                >
                    <div
                        className="w-full h-full opacity-[0.07]"
                        style={{ background: "radial-gradient(circle, var(--color-text-primary) 0%, transparent 70%)" }}
                        aria-hidden="true"
                    />
                </Parallax>

                <div className="relative max-w-6xl mx-auto grid lg:grid-cols-[1.1fr_0.9fr] gap-16 items-center">
                    <div className="min-w-0">
                        <div
                            className="inline-flex items-center gap-2 px-4 py-1.5 text-xs font-mono uppercase tracking-wide text-text-secondary mb-8"
                            style={{ border: "1.5px solid var(--color-frame)" }}
                        >
                            <span className="w-1.5 h-1.5 bg-brand-mint" />
                            Beta privada activa · Lanzamiento 2026
                        </div>

                        <SplitCharHeadline
                            text="Cobra sin perseguir a nadie"
                            className="text-5xl md:text-6xl xl:text-7xl font-extrabold leading-[0.98] tracking-tight text-text-primary mb-6"
                        />

                        <p className="text-lg text-text-secondary max-w-md leading-relaxed mb-10">
                            Recupera automatiza el seguimiento de tus deudores por email, SMS
                            y llamada, con trazabilidad completa desde el primer recordatorio
                            hasta el pago o el proceso legal.
                        </p>

                        <div className="flex flex-wrap gap-4 mb-14">
                            <MagneticCTA
                                href="/sign-up"
                                className="group flex items-center gap-2.5 bg-accent text-accent-fg px-8 py-3.5 font-mono text-sm uppercase tracking-wide font-bold"
                            >
                                <KeyChip letter="↵" />
                                Crear Cuenta
                            </MagneticCTA>
                            <Link
                                href="/planes"
                                className="flex items-center px-8 py-3.5 font-mono text-sm uppercase tracking-wide font-medium hover:bg-surface-hover transition"
                                style={{ border: "1.5px solid var(--color-frame)" }}
                            >
                                Ver Planes
                            </Link>
                        </div>

                        <div className="flex flex-wrap gap-x-8 gap-y-4">
                            <div>
                                <p className="text-2xl font-bold font-mono text-text-primary"><CountUp value={92} prefix="+" suffix="%" /></p>
                                <p className="text-xs text-text-secondary mt-0.5">Tasa de contactabilidad</p>
                            </div>
                            <div>
                                <p className="text-2xl font-bold font-mono text-text-primary">24/7</p>
                                <p className="text-xs text-text-secondary mt-0.5">Automatización activa</p>
                            </div>
                            <div>
                                <p className="text-2xl font-bold font-mono text-text-primary"><CountUp value={3} /></p>
                                <p className="text-xs text-text-secondary mt-0.5">Canales: email, SMS y llamada</p>
                            </div>
                        </div>
                    </div>

                    <HeroVisual />
                </div>
            </section>

            {/* MARQUEE */}
            <div className="py-3" style={{ borderTop: "1.5px solid var(--color-frame)", borderBottom: "1.5px solid var(--color-frame)" }}>
                <Marquee
                    items={MARQUEE_ITEMS}
                    speed={70}
                    itemClassName="font-mono text-xs uppercase tracking-widest text-text-secondary px-4 whitespace-nowrap"
                />
            </div>

            {/* 01 — SOCIAL PROOF (ScrollTrigger.batch + CountUp) */}
            <section className="px-6 md:px-8 py-10" style={{ borderBottom: "1.5px solid var(--color-frame)" }}>
                <ValuesBatch />
            </section>

            {/* 02 — CÓMO FUNCIONA (horizontal scroll driven by vertical scroll) */}
            <section id="como-funciona" className="py-24 md:py-32">
                <div className="px-6 md:px-8 max-w-6xl mx-auto mb-16">
                    <Reveal>
                        <SectionHeading
                            index="02"
                            kicker="Cómo funciona"
                            title="De la factura vencida al pago, en tres pasos"
                            center
                        />
                    </Reveal>
                </div>

                <HorizontalPin className="px-6 md:px-8" trackClassName="gap-8 max-w-none justify-center">
                    {STEPS.map((s) => (
                        <div
                            key={s.n}
                            className="w-full sm:w-[26rem] flex-shrink-0 bg-surface-raised p-8"
                            style={{
                                border: "1.5px solid var(--color-frame)",
                                borderRadius: "var(--radius-frame)",
                                boxShadow: "6px 6px 0 0 var(--color-frame-shadow)",
                            }}
                        >
                            <p className="text-sm font-mono text-text-tertiary mb-4">{s.n} /03</p>
                            <h3 className="text-xl font-bold text-text-primary mb-3">{s.title}</h3>
                            <p className="text-sm text-text-secondary leading-relaxed">{s.body}</p>
                        </div>
                    ))}
                </HorizontalPin>
            </section>

            {/* 03 — PRODUCTO (pinned, content advances as you scroll) */}
            <section className="bg-surface-hover" style={{ borderTop: "1.5px solid var(--color-frame)", borderBottom: "1.5px solid var(--color-frame)" }}>
                <div className="px-6 md:px-8 max-w-6xl mx-auto pt-24 md:pt-32">
                    <Reveal>
                        <SectionHeading index="03" kicker="Producto" title="Todo lo que necesitas, en un solo lugar" center />
                    </Reveal>
                </div>
                <div className="px-6 md:px-8 mt-16 pb-24 md:pb-32">
                    <PinnedAdvance
                        steps={PRODUCT_STEPS}
                        renderStep={(step, i) => <ProductStepPanel step={step} index={i} total={PRODUCT_STEPS.length} />}
                    />
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
                            className="inline-flex items-center gap-2 px-8 py-3.5 font-mono text-sm uppercase tracking-wide font-medium hover:bg-accent hover:text-accent-fg transition"
                            style={{ border: "1.5px solid var(--color-frame)" }}
                        >
                            Ver todos los planes
                            <span aria-hidden="true">→</span>
                        </Link>
                    </div>
                </div>
            </Reveal>

            {/* 05 — FILOSOFÍA (prosa larga) */}
            <Reveal as="section" className="px-6 md:px-8 py-24 md:py-32" style={{ borderTop: "1.5px solid var(--color-frame)" }}>
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

            {/* CONTACTO / CTA FINAL — the one spot using the real WindowBox
                component, whose "assemble" timeline (border → shadow →
                content) needs a single box scrolling into view in normal
                flow to read correctly; the pinned/horizontal sections above
                already have their own scroll-driven entrances and would
                fight a second independent trigger. */}
            <section className="px-6 md:px-8 pb-24 md:pb-32">
                <WindowBox
                    title="Recupera · Activar"
                    className="max-w-4xl mx-auto"
                    boxClassName="bg-accent"
                    contentClassName="px-8 md:px-16 py-16 text-center"
                >
                    <h2 className="text-3xl md:text-4xl font-bold text-accent-fg mb-4">
                        Activa tu sistema de recuperación hoy
                    </h2>
                    <p className="text-accent-fg/70 mb-8 text-sm max-w-md mx-auto">
                        Sin compromisos. Configura tu cuenta en minutos y empieza a
                        automatizar tus recordatorios.
                    </p>
                    <div className="flex flex-wrap justify-center gap-4">
                        <MagneticCTA
                            href="/sign-up"
                            className="flex items-center gap-2.5 bg-brand-mint text-brand-mint-fg px-10 py-4 font-mono text-sm uppercase tracking-wide font-bold"
                        >
                            <KeyChip letter="↵" tone="yellow" />
                            Crear Cuenta Gratis
                        </MagneticCTA>
                        <a
                            href="mailto:hola@recupera.app"
                            className="border border-accent-fg/25 text-accent-fg px-10 py-4 font-mono text-sm uppercase tracking-wide font-bold hover:bg-accent-fg/10 transition"
                        >
                            Hablar con nosotros
                        </a>
                    </div>
                </WindowBox>
            </section>
        </MarketingShell>
    );
}
