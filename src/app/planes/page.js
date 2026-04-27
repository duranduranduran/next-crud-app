'use client';

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

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

export default function PlanesPage() {
    const [annual, setAnnual] = useState(false);

    return (
        <div className="min-h-screen bg-white text-[#443CA3]">

            {/* NAVBAR */}
            <nav
                className="sticky top-0 z-50 flex items-center justify-between px-8 max-w-7xl mx-auto bg-white py-4 border-b border-[#443CA3]/10">
                <Link href="/">
                    <Image
                        src="/logo-recupera-purple.png"
                        alt="Recupera"
                        width={150}
                        height={25}
                    />
                </Link>
                <ul className="flex space-x-6 items-center">
                    <li><Link href="/about" className="hover:underline">Quienes Somos</Link></li>
                    <li><Link href="/services" className="hover:underline">Servicios</Link></li>
                    <li><Link href="/planes" className="font-bold underline underline-offset-4">Planes</Link></li>
                    <li><Link href="/contact" className="hover:underline">Contactanos</Link></li>
                    <li>
                        <Link
                            href="/sign-in"
                            className="border border-[#443CA3] px-5 py-2 rounded-lg hover:bg-[#443CA3] hover:text-white transition"
                        >
                            Iniciar Sesión
                        </Link>
                    </li>
                </ul>
            </nav>

            {/* HEADER */}
            <section className="pt-20 pb-12 px-8 text-center max-w-3xl mx-auto">
                <p className="text-sm font-medium tracking-widest text-[#443CA3]/50 uppercase mb-4">Precios</p>
                <h1 className="text-5xl md:text-6xl font-extrabold leading-tight mb-6">
                    Elige el plan que impulsa tu recuperación
                </h1>
                <p className="text-lg text-[#443CA3]/60 mb-10">
                    Sin contratos largos. Sin sorpresas. Cancela cuando quieras.
                </p>

                {/* Toggle */}
                <div className="inline-flex items-center gap-4 border border-[#443CA3]/20 rounded-xl px-5 py-3">
                    <span
                        className={`text-sm font-medium ${!annual ? 'text-[#443CA3]' : 'text-[#443CA3]/40'}`}>Mensual</span>
                    <div
                        onClick={() => setAnnual(!annual)}
                        className="relative w-12 h-6 rounded-full cursor-pointer transition-colors duration-300"
                        style={{background: annual ? '#443CA3' : '#443CA320'}}
                    >
                        <div
                            className="absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300"
                            style={{left: annual ? '28px' : '4px'}}
                        />
                    </div>
                    <span className={`text-sm font-medium ${annual ? 'text-[#443CA3]' : 'text-[#443CA3]/40'}`}>
                        Anual
                        <span
                            className="ml-2 text-xs bg-[#21FE83] text-[#443CA3] px-2 py-0.5 rounded-full font-bold">-20%</span>
                    </span>
                </div>
            </section>

            {/* PLANS GRID */}
            <section className="px-8 pb-24 max-w-7xl mx-auto">
                <div className="grid md:grid-cols-4 gap-6">
                    {plans.map((plan) => (
                        <div
                            key={plan.id}
                            className={`relative rounded-2xl p-7 flex flex-col transition-all duration-300 ${
                                plan.highlight
                                    ? 'border-2 border-[#443CA3] bg-white shadow-xl shadow-[#443CA3]/10'
                                    : 'border border-[#443CA3]/20 bg-white hover:border-[#443CA3]/50 hover:shadow-lg hover:shadow-[#443CA3]/5'
                            }`}
                        >
                            {/* Badge */}
                            {plan.badge && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                    <span
                                        className="bg-[#443CA3] text-white text-xs font-bold px-4 py-1 rounded-full whitespace-nowrap">
                                        {plan.badge}
                                    </span>
                                </div>
                            )}

                            {/* Plan name */}
                            <p className="text-xs font-bold tracking-widest text-[#443CA3]/50 mb-3">{plan.name}</p>

                            {/* Price */}
                            <div className="mb-2">
                                {plan.price ? (
                                    <div className="flex items-end gap-1">
                                        <span className="text-5xl font-extrabold">
                                            ${annual ? Math.round(plan.price * 0.8) : plan.price}
                                        </span>
                                        <span className="text-[#443CA3]/50 mb-2">/mes</span>
                                    </div>
                                ) : (
                                    <p className="text-4xl font-extrabold">A consultar</p>
                                )}
                            </div>

                            {/* Debtors */}
                            <p className="text-sm font-semibold text-[#443CA3]/70 mb-6 pb-6 border-b border-[#443CA3]/10">
                                {plan.debtors}
                            </p>

                            {/* Features */}
                            <ul className="space-y-3 flex-1 mb-6">
                                {plan.features.map((feature, i) => (
                                    <li key={i} className="flex items-center gap-3 text-sm">
                                        {feature.included ? (
                                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                                <circle cx="8" cy="8" r="8" fill="#21FE83" fillOpacity="0.2"/>
                                                <path d="M5 8l2 2 4-4" stroke="#21FE83" strokeWidth="1.5"
                                                      strokeLinecap="round" strokeLinejoin="round"/>
                                            </svg>
                                        ) : (
                                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                                <circle cx="8" cy="8" r="8" fill="#443CA3" fillOpacity="0.08"/>
                                                <path d="M5.5 10.5l5-5M10.5 10.5l-5-5" stroke="#443CA3"
                                                      strokeOpacity="0.3" strokeWidth="1.5" strokeLinecap="round"/>
                                            </svg>
                                        )}
                                        <span className={feature.included ? 'text-[#443CA3]' : 'text-[#443CA3]/30'}>
                                            {feature.label}
                                        </span>
                                    </li>
                                ))}
                            </ul>

                            {/* Note */}
                            {plan.note && (
                                <p className="text-xs text-[#443CA3]/40 mb-4 text-center">{plan.note}</p>
                            )}

                            {/* CTA */}
                            <Link
                                href={plan.id === 'enterprise' ? '/contact' : '/sign-up'}
                                className={`w-full text-center py-3 rounded-xl text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2 ${
                                    plan.highlight
                                        ? 'bg-[#443CA3] text-white hover:opacity-90'
                                        : 'border border-[#443CA3]/30 text-[#443CA3] hover:bg-[#443CA3] hover:text-white'
                                }`}
                            >
                                {plan.id === 'enterprise' ? 'Contactar' : 'Ver detalles'}
                                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                    <path d="M2.5 7h9M8 3.5L11.5 7 8 10.5" stroke="currentColor" strokeWidth="1.5"
                                          strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </Link>
                        </div>
                    ))}
                </div>

                {/* Bottom note */}
                <p className="text-center text-sm text-[#443CA3]/40 mt-10">
                    Todos los planes incluyen soporte por email · Datos seguros y encriptados · Cancela en cualquier
                    momento
                </p>
            </section>

            {/* FAQ */}
            <section className="border-t border-[#443CA3]/10 px-8 py-20 max-w-3xl mx-auto">
                <h2 className="text-3xl font-bold text-center mb-12">Preguntas frecuentes</h2>
                <div className="space-y-4">
                    {[
                        {
                            q: "¿Puedo cambiar de plan en cualquier momento?",
                            a: "Sí, puedes actualizar o bajar de plan cuando quieras. Los cambios se aplican en el siguiente ciclo de facturación."
                        },
                        {
                            q: "¿Qué pasa si supero el límite de deudores?",
                            a: "Te notificaremos antes de llegar al límite. Puedes subir de plan o esperar al siguiente mes."
                        },
                        {
                            q: "¿Cómo funciona el fee de éxito?",
                            a: "Solo aplica al plan Starter y es opcional. Es un 8% sobre lo que recuperes gracias a la plataforma."
                        },
                        {
                            q: "¿Mis datos están seguros?",
                            a: "Sí. Usamos encriptación de nivel bancario y cumplimos con todas las normativas de protección de datos."
                        },
                    ].map((faq, i) => (
                        <div
                            key={i}
                            className="group border border-[#443CA3]/10 rounded-xl overflow-hidden cursor-pointer hover:border-[#443CA3]/40 hover:shadow-md hover:shadow-[#443CA3]/5 transition-all duration-300"
                        >
                            <div className="p-6">
                                <div className="flex items-center justify-between">
                                    <p className="font-bold group-hover:text-[#443CA3]">{faq.q}</p>
                                    <div
                                        className="w-6 h-6 rounded-full border border-[#443CA3]/20 flex items-center justify-center flex-shrink-0 ml-4 group-hover:bg-[#443CA3] group-hover:border-[#443CA3] transition-all duration-300">
                                        <svg
                                            width="12"
                                            height="12"
                                            viewBox="0 0 12 12"
                                            fill="none"
                                            className="transition-transform duration-300 group-hover:rotate-180"
                                        >
                                            <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5"
                                                  strokeLinecap="round" strokeLinejoin="round"
                                                  className="group-hover:stroke-white"/>
                                        </svg>
                                    </div>
                                </div>
                                <div
                                    className="grid grid-rows-[0fr] group-hover:grid-rows-[1fr] transition-all duration-300 ease-in-out">
                                    <div className="overflow-hidden">
                                        <p className="text-sm text-[#443CA3]/60 mt-4 pt-4 border-t border-[#443CA3]/10">
                                            {faq.a}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* CTA */}
            <section className="px-8 pb-24 text-center">
                <h2 className="text-3xl font-bold mb-6">¿Listo para recuperar tu liquidez?</h2>
                <Link href="/sign-up"
                      className="bg-[#443CA3] text-white px-10 py-4 rounded-lg font-bold hover:opacity-90 inline-block">
                    Crear Cuenta Gratis
                </Link>
            </section>

            {/* FOOTER */}
            <footer className="border-t border-[#443CA3]/10 py-8 px-8 text-sm">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-[#443CA3]/70">© {new Date().getFullYear()} <span
                        className="font-bold">Recupera</span></p>
                    <div className="flex gap-6 text-[#443CA3]/70">
                        <Link href="#">Privacidad</Link>
                        <Link href="#">Términos</Link>
                        <Link href="#">Contacto</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
