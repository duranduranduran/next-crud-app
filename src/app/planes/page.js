'use client';

import Link from "next/link";
import { useRef, useState } from "react";
import MarketingShell from "../components/marketing/MarketingShell";
import SectionHeading from "../components/marketing/SectionHeading";
import WindowBox, { KeyChip } from "../components/marketing/WindowBox";
import { Reveal, SplitCharHeadline, useBatchReveal, useMagnetic } from "../components/marketing/fx";

const plans = [
    {
        id: "starter",
        name: "STARTER",
        price: 99,
        highlight: false,
        debtors: "Hasta 200 deudores",
        badge: null,
        note: "Fee de éxito 8% opcional",
        features: [
            { label: "Email automatizado", included: true },
            { label: "Dashboard básico", included: true },
            { label: "Trazabilidad legal", included: true },
            { label: "Reportes básicos", included: true },
            { label: "WhatsApp", included: false },
            { label: "SMS", included: false },
            { label: "Llamadas IA", included: false },
        ],
    },
    {
        id: "pro",
        name: "PRO",
        price: 249,
        highlight: true,
        debtors: "Hasta 1,000 deudores",
        badge: "Más popular",
        note: "Mismo precio que Moonflow — más valor incluido",
        features: [
            { label: "Email automatizado", included: true },
            { label: "SMS", included: true },
            { label: "Dashboard completo", included: true },
            { label: "Trazabilidad completa", included: true },
            { label: "Alertas inteligentes", included: true },
            { label: "Reportes avanzados", included: true },
            { label: "Llamadas IA", included: false },
        ],
    },
    {
        id: "corporate",
        name: "CORPORATE",
        price: 599,
        highlight: false,
        debtors: "Hasta 3,000 deudores",
        badge: null,
        note: "Sin fee de éxito — lo que recuperas es tuyo",
        features: [
            { label: "Email automatizado", included: true },
            { label: "SMS", included: true },
            { label: "Llamadas IA", included: true },
            { label: "Reportes avanzados", included: true },
            { label: "Métricas y analytics", included: true },
            { label: "Reporte para aseguradora", included: true },
            { label: "Soporte prioritario", included: true },
        ],
    },
    {
        id: "enterprise",
        name: "ENTERPRISE",
        price: null,
        highlight: false,
        debtors: "Deudores ilimitados + API",
        badge: null,
        note: "Sin fee de éxito — lo que recuperas es tuyo",
        features: [
            { label: "Todo lo de Corporate", included: true },
            { label: "API pública + webhooks", included: true },
            { label: "Integración con aseguradoras", included: true },
            { label: "Integración con ERP", included: true },
            { label: "Reportes personalizados", included: true },
            { label: "Gerente de cuenta asignado", included: true },
            { label: "SLA garantizado", included: true },
        ],
    },
];

const FAQS = [
    {
        q: "¿Puedo cambiar de plan en cualquier momento?",
        a: "Sí, puedes actualizar o bajar de plan cuando quieras. Los cambios se aplican en el siguiente ciclo de facturación.",
    },
    {
        q: "¿Qué pasa si supero el límite de deudores?",
        a: "Te notificaremos antes de llegar al límite. Puedes subir de plan o esperar al siguiente mes.",
    },
    {
        q: "¿Cómo funciona el fee de éxito?",
        a: "Solo aplica al plan Starter y es opcional. Es un 8% sobre lo que recuperes gracias a la plataforma.",
    },
    {
        q: "¿Mis datos están seguros?",
        a: "Sí. Usamos encriptación de nivel bancario y cumplimos con todas las normativas de protección de datos.",
    },
];

function CheckIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="8" fill="var(--color-brand-mint)" fillOpacity="0.2" />
            <path d="M5 8l2 2 4-4" stroke="var(--color-brand-mint)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function CrossIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="8" fill="var(--color-text-tertiary)" fillOpacity="0.12" />
            <path d="M5.5 10.5l5-5M10.5 10.5l-5-5" stroke="var(--color-text-tertiary)" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    );
}

function MagneticLink({ href, className, children }) {
    const ref = useMagnetic(0.3, 10);
    return (
        <Link ref={ref} href={href} className={className}>
            {children}
        </Link>
    );
}

function PlansGrid({ annual }) {
    const containerRef = useRef(null);
    useBatchReveal(containerRef, "[data-batch-plan]", { y: 24, stagger: 0.08 });

    return (
        <div ref={containerRef} className="grid md:grid-cols-2 xl:grid-cols-4 gap-6">
            {plans.map((plan) => (
                <div
                    key={plan.id}
                    data-batch-plan
                    className={`relative p-7 flex flex-col bg-surface-raised ${plan.highlight ? "border-2" : ""}`}
                    style={{
                        border: plan.highlight ? "2.5px solid var(--color-frame)" : "1.5px solid var(--color-frame)",
                        boxShadow: plan.highlight ? "6px 6px 0 0 var(--color-frame-shadow)" : "4px 4px 0 0 var(--color-frame-shadow)",
                    }}
                >
                    {plan.badge && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                            <span
                                className="bg-accent text-accent-fg text-xs font-mono font-bold px-4 py-1 whitespace-nowrap"
                                style={{ border: "1.5px solid var(--color-frame)" }}
                            >
                                {plan.badge}
                            </span>
                        </div>
                    )}

                    <p className="text-xs font-mono font-bold tracking-widest text-text-tertiary mb-3">{plan.name}</p>

                    <div className="mb-2">
                        {plan.price ? (
                            <div className="flex items-end gap-1">
                                <span className="text-5xl font-extrabold font-mono text-text-primary">
                                    ${annual ? Math.round(plan.price * 0.8) : plan.price}
                                </span>
                                <span className="text-text-tertiary mb-2">/mes</span>
                            </div>
                        ) : (
                            <p className="text-4xl font-extrabold text-text-primary">A consultar</p>
                        )}
                    </div>

                    <p className="text-sm font-semibold text-text-secondary mb-6 pb-6" style={{ borderBottom: "1px solid var(--color-border-subtle)" }}>
                        {plan.debtors}
                    </p>

                    <ul className="space-y-3 flex-1 mb-6">
                        {plan.features.map((feature, i) => (
                            <li key={i} className="flex items-center gap-3 text-sm">
                                {feature.included ? <CheckIcon /> : <CrossIcon />}
                                <span className={feature.included ? "text-text-primary" : "text-text-tertiary"}>
                                    {feature.label}
                                </span>
                            </li>
                        ))}
                    </ul>

                    {plan.note && (
                        <p className="text-xs text-text-secondary mb-4 text-center">{plan.note}</p>
                    )}

                    <Link
                        href={plan.id === "enterprise" ? "/about" : "/sign-up"}
                        className={`w-full text-center py-3 font-mono text-sm uppercase tracking-wide font-bold transition-all duration-200 flex items-center justify-center gap-2 ${
                            plan.highlight
                                ? "bg-accent text-accent-fg hover:opacity-90"
                                : "text-text-primary hover:bg-surface-hover"
                        }`}
                        style={!plan.highlight ? { border: "1.5px solid var(--color-frame)" } : undefined}
                    >
                        {plan.id === "enterprise" ? "Contactar" : "Empezar ahora"}
                        <span aria-hidden="true">→</span>
                    </Link>
                </div>
            ))}
        </div>
    );
}

export default function PlanesPage() {
    const [annual, setAnnual] = useState(false);

    return (
        <MarketingShell>
            {/* HEADER */}
            <section className="px-6 md:px-8 pt-16 md:pt-24 pb-14 text-center max-w-3xl mx-auto">
                <p className="text-sm font-mono font-medium tracking-widest text-text-secondary uppercase mb-4">Precios</p>
                <SplitCharHeadline
                    text="Un plan para cada tamaño de cartera"
                    as="h1"
                    className="text-4xl md:text-5xl font-extrabold leading-tight tracking-tight text-text-primary mb-6"
                />
                <p className="text-lg text-text-secondary mb-10">
                    Sin contratos largos. Sin sorpresas. Cancela cuando quieras.
                </p>

                <div className="inline-flex items-center gap-4 px-5 py-3" style={{ border: "1.5px solid var(--color-frame)" }}>
                    <span className={`text-sm font-mono font-medium ${!annual ? "text-text-primary" : "text-text-tertiary"}`}>Mensual</span>
                    <button
                        type="button"
                        role="switch"
                        aria-checked={annual}
                        aria-label="Alternar facturación anual"
                        onClick={() => setAnnual(!annual)}
                        className="relative w-12 h-6 cursor-pointer transition-colors duration-300"
                        style={{ background: annual ? "var(--color-accent)" : "var(--color-accent-bg)", border: "1.5px solid var(--color-frame)" }}
                    >
                        <span
                            className="absolute top-0.5 w-4 h-4 bg-surface-raised transition-all duration-300"
                            style={{ left: annual ? "26px" : "3px", border: "1px solid var(--color-frame)" }}
                        />
                    </button>
                    <span className={`text-sm font-mono font-medium ${annual ? "text-text-primary" : "text-text-tertiary"}`}>
                        Anual
                        <span className="ml-2 text-xs bg-brand-mint text-brand-mint-fg px-2 py-0.5 font-mono font-bold">-20%</span>
                    </span>
                </div>
            </section>

            {/* PLANS GRID (ScrollTrigger.batch) */}
            <section className="px-6 md:px-8 pb-20 max-w-6xl mx-auto">
                <PlansGrid annual={annual} />

                <p className="text-center text-sm text-text-secondary mt-10">
                    Todos los planes incluyen soporte por email · Datos seguros y encriptados · Cancela en cualquier momento
                </p>
            </section>

            {/* FAQ */}
            <section className="px-6 md:px-8 py-20 md:py-28 max-w-3xl mx-auto" style={{ borderTop: "1.5px solid var(--color-frame)" }}>
                <Reveal>
                    <SectionHeading index="01" kicker="Preguntas frecuentes" title="Lo que suelen preguntarnos" center />
                </Reveal>
                <Reveal stagger={0.06} className="space-y-4 mt-14">
                    {FAQS.map((faq, i) => (
                        <details
                            key={i}
                            className="group bg-surface-raised overflow-hidden"
                            style={{ border: "1.5px solid var(--color-frame)" }}
                        >
                            <summary className="p-6 flex items-center justify-between cursor-pointer list-none">
                                <span className="font-bold text-text-primary pr-4">{faq.q}</span>
                                <span
                                    className="w-6 h-6 flex items-center justify-center flex-shrink-0 text-text-secondary transition-transform duration-300 group-open:rotate-180"
                                    style={{ border: "1.5px solid var(--color-frame)" }}
                                >
                                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                        <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </span>
                            </summary>
                            <p className="px-6 pb-6 text-sm text-text-secondary leading-relaxed">{faq.a}</p>
                        </details>
                    ))}
                </Reveal>
            </section>

            {/* CTA */}
            <section className="px-6 md:px-8 pb-24 text-center">
                <WindowBox title="Recupera · Crear cuenta" className="max-w-md mx-auto" contentClassName="text-center">
                    <h2 className="text-2xl font-bold text-text-primary mb-6">¿Listo para recuperar tu liquidez?</h2>
                    <MagneticLink
                        href="/sign-up"
                        className="inline-flex items-center gap-2.5 bg-accent text-accent-fg px-10 py-4 font-mono text-sm uppercase tracking-wide font-bold"
                    >
                        <KeyChip letter="↵" />
                        Crear Cuenta Gratis
                    </MagneticLink>
                </WindowBox>
            </section>
        </MarketingShell>
    );
}
