'use client';

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import FeatureGuide from "./components/FeatureGuide";

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

function CheckIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="8" fill="#21FE83" fillOpacity="0.2"/>
            <path d="M5 8l2 2 4-4" stroke="#21FE83" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    );
}

function CrossIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="8" fill="#443CA3" fillOpacity="0.08"/>
            <path d="M5.5 10.5l5-5M10.5 10.5l-5-5" stroke="#443CA3" strokeOpacity="0.3" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
    );
}

function ArrowIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2.5 7h9M8 3.5L11.5 7 8 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    );
}

export default function LandingPage() {

    const particles = useMemo(() =>
        [...Array(30)].map(() => ({
            top: Math.random() * 100,
            left: Math.random() * 100,
        })), []
    );

    const [mouse, setMouse] = useState({ x: 0, y: 0 });
    const [annual, setAnnual] = useState(false);

    const handleMouseMove = (e) => {
        const { innerWidth, innerHeight } = window;
        const x = (e.clientX / innerWidth - 0.5) * 10;
        const y = (e.clientY / innerHeight - 0.5) * 10;
        setMouse({ x, y });
    };

    return (
        <div className="min-h-screen bg-white text-[#443CA3]">

            {/* NAVBAR */}
            <nav className="sticky top-0 z-50 flex items-center justify-between px-8 max-w-7xl mx-auto bg-white/90 backdrop-blur-md py-4 border-b border-[#443CA3]/10">
                <Link href="/">
                    <Image src="/logo-recupera-purple.png" alt="Recupera" width={130} height={22} />
                </Link>
                <ul className="flex space-x-6 items-center text-sm">
                    <li><Link href="/about" className="text-[#443CA3]/70 hover:text-[#443CA3] transition">Quiénes Somos</Link></li>
                    <li><Link href="/planes" className="text-[#443CA3]/70 hover:text-[#443CA3] transition">Servicios</Link></li>
                    <li><Link href="/planes" className="text-[#443CA3]/70 hover:text-[#443CA3] transition">Planes</Link></li>
                    <li><Link href="/about" className="text-[#443CA3]/70 hover:text-[#443CA3] transition">Contáctanos</Link></li>
                    <li>
                        <Link href="/sign-in" className="border border-[#443CA3]/30 px-5 py-2 rounded-xl hover:bg-[#443CA3] hover:text-white hover:border-[#443CA3] transition font-medium">
                            Iniciar Sesión
                        </Link>
                    </li>
                </ul>
            </nav>

            {/* HERO */}
            <section className="relative px-8 pt-20 pb-10" onMouseMove={handleMouseMove}>

                <div className="absolute inset-0 opacity-[0.06]">
                    {particles.map((p, i) => (
                        <div key={i} className="absolute w-1 h-1 bg-[#443CA3] rounded-full"
                             style={{ top: `${p.top}%`, left: `${p.left}%` }} />
                    ))}
                </div>

                <div className="relative max-w-7xl mx-auto">

                    <div className="grid md:grid-cols-2 gap-16 items-center mb-16">

                        {/* TEXT */}
                        <div className="space-y-8">
                            <div className="inline-flex items-center gap-2 bg-[#443CA3]/5 border border-[#443CA3]/10 px-4 py-1.5 rounded-full text-xs font-medium text-[#443CA3]/60">
                                <span className="w-1.5 h-1.5 bg-[#21FE83] rounded-full"></span>
                                Beta privada activa · Lanzamiento 2026
                            </div>

                            <h1 className="text-6xl md:text-7xl xl:text-8xl font-extrabold leading-[0.95] tracking-tight">
                                Recupera<br />Tu Liquidez
                            </h1>

                            <p className="text-lg text-[#443CA3]/60 max-w-md leading-relaxed">
                                Automatiza recordatorios, optimiza negociaciones y ejecuta
                                estrategias de cobranza inteligentes diseñadas para maximizar
                                tu flujo de caja.
                            </p>

                            <div className="flex gap-8 text-sm text-[#443CA3]/60">
                                <div>
                                    <p className="text-2xl font-bold text-[#443CA3]">+92%</p>
                                    <p>Contactabilidad</p>
                                </div>
                                <div className="w-px bg-[#443CA3]/10" />
                                <div>
                                    <p className="text-2xl font-bold text-[#443CA3]">24/7</p>
                                    <p>Automatización</p>
                                </div>
                                <div className="w-px bg-[#443CA3]/10" />
                                <div>
                                    <p className="text-2xl font-bold text-[#443CA3]">LATAM</p>
                                    <p>Diseñado para</p>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <Link href="/sign-up" className="bg-[#443CA3] text-white px-8 py-3.5 rounded-xl font-bold hover:opacity-90 transition text-sm">
                                    Crear Cuenta
                                </Link>
                                <Link href="/planes" className="border border-[#443CA3]/20 px-8 py-3.5 rounded-xl hover:bg-[#443CA3] hover:text-white hover:border-[#443CA3] transition text-sm font-medium">
                                    Ver Planes
                                </Link>
                            </div>
                        </div>

                        {/* UI CARD */}
                        <div className="relative flex justify-center items-center">

                            <div className="group absolute -top-8 -left-8 border border-[#443CA3]/15 p-4 rounded-2xl w-52 bg-white shadow-sm animate-floatSlow hover:bg-[#21FE83] transition-all duration-300 z-10">
                                <p className="text-[9px] font-semibold text-[#443CA3]/40 mb-0.5 group-hover:text-[#443CA3]">Recuperado · Ejemplo</p>
                                <p className="text-2xl font-bold text-[#443CA3] group-hover:text-[#443CA3]">$12,840</p>
                            </div>

                            <div className="group absolute -bottom-8 -right-8 border border-[#443CA3]/15 p-4 rounded-2xl w-52 bg-white shadow-sm animate-floatSlowReverse hover:bg-[#FFFF76] transition-all duration-300 z-10">
                                <p className="text-[9px] font-semibold text-[#443CA3]/40 mb-0.5 group-hover:text-[#443CA3]">Automatizaciones · Ejemplo</p>
                                <p className="text-2xl font-bold text-[#443CA3] group-hover:text-[#443CA3]">1,284</p>
                            </div>

                            <div
                                className="group bg-white border border-[#443CA3]/15 rounded-2xl p-6 w-[360px] shadow-sm transition-all duration-300 ease-out hover:bg-[#443CA3]"
                                style={{ transform: `translate(${mouse.x}px, ${mouse.y}px) scale(1.01)` }}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <h3 className="font-bold text-sm group-hover:text-white">Centro de Control</h3>
                                    <span className="text-[9px] text-[#443CA3]/30 border border-[#443CA3]/15 px-1.5 py-0.5 rounded-full group-hover:text-white/30 group-hover:border-white/20">
                                        Ejemplo
                                    </span>
                                </div>
                                <p className="text-xs text-[#443CA3]/40 mb-4 group-hover:text-white/50">Vista previa de la plataforma</p>
                                <div className="space-y-2.5 text-sm">
                                    {[
                                        { name: "Empresa Orion", status: "Pagado", color: "text-emerald-600 bg-emerald-50" },
                                        { name: "Grupo Atlas", status: "Pendiente", color: "text-amber-600 bg-amber-50" },
                                        { name: "Innova Tech", status: "En Gestión", color: "text-blue-600 bg-blue-50" },
                                    ].map((item, i) => (
                                        <div key={i} className="flex justify-between items-center group-hover:text-white">
                                            <span className="group-hover:text-white/80">{item.name}</span>
                                            <span className={`text-xs px-2.5 py-1 rounded-full font-medium group-hover:bg-white/20 group-hover:text-white ${item.color}`}>
                                                {item.status}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* FEATURE GUIDE */}
                    <div className="border-t border-[#443CA3]/8 pt-12">
                        <FeatureGuide />
                    </div>

                </div>

                <style jsx>{`
                    @keyframes floatSlow {
                        0% { transform: translateY(0px) rotate(0deg); }
                        50% { transform: translateY(-14px) rotate(1deg); }
                        100% { transform: translateY(0px) rotate(0deg); }
                    }
                    @keyframes floatSlowReverse {
                        0% { transform: translateY(0px) rotate(0deg); }
                        50% { transform: translateY(14px) rotate(-1deg); }
                        100% { transform: translateY(0px) rotate(0deg); }
                    }
                    .animate-floatSlow { animation: floatSlow 6s ease-in-out infinite; }
                    .animate-floatSlowReverse { animation: floatSlowReverse 7s ease-in-out infinite; }
                `}</style>
            </section>

            {/* TRUST STRIP */}
            <section className="border-y border-[#443CA3]/8 py-5 text-center text-xs text-[#443CA3]/40 tracking-wide">
                3 canales de comunicación · Automatización 24/7 · 100% cumplimiento legal · Diseñado para LATAM
            </section>

            {/* HOW */}
            <section id="how" className="px-8 py-20 max-w-7xl mx-auto">
                <h2 className="text-3xl font-bold text-center mb-14">Cómo Funciona</h2>
                <div className="grid md:grid-cols-4 gap-8 text-center">
                    {[
                        "Carga tus deudores",
                        "Activamos recordatorios",
                        "Seguimiento automatizado",
                        "Recuperas liquidez",
                    ].map((step, i) => (
                        <div key={i} className="space-y-3">
                            <div className="text-4xl font-black text-[#443CA3]/10">0{i + 1}</div>
                            <p className="font-medium">{step}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* PLANES */}
            <section className="px-8 py-20 bg-[#F7F8FF]">
                <div className="max-w-7xl mx-auto">

                    <div className="text-center mb-12">
                        <p className="text-xs font-semibold tracking-[0.2em] text-[#443CA3]/30 uppercase mb-4">Precios</p>
                        <h2 className="text-4xl md:text-5xl font-extrabold mb-4 leading-tight">
                            Elige el plan que impulsa<br />tu recuperación
                        </h2>
                        <p className="text-lg text-[#443CA3]/50 mb-8">
                            Sin contratos largos. Sin sorpresas. Cancela cuando quieras.
                        </p>

                        {/* Toggle */}
                        <div className="inline-flex items-center gap-4 border border-[#443CA3]/20 rounded-xl px-5 py-3 bg-white">
                            <span className={`text-sm font-medium ${!annual ? "text-[#443CA3]" : "text-[#443CA3]/40"}`}>Mensual</span>
                            <div
                                onClick={() => setAnnual(!annual)}
                                className="relative w-12 h-6 rounded-full cursor-pointer transition-colors duration-300"
                                style={{ background: annual ? "#443CA3" : "#443CA320" }}
                            >
                                <div
                                    className="absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300"
                                    style={{ left: annual ? "28px" : "4px" }}
                                />
                            </div>
                            <span className={`text-sm font-medium ${annual ? "text-[#443CA3]" : "text-[#443CA3]/40"}`}>
                                Anual
                                <span className="ml-2 text-xs bg-[#21FE83] text-[#443CA3] px-2 py-0.5 rounded-full font-bold">-20%</span>
                            </span>
                        </div>
                    </div>

                    {/* Plans grid */}
                    <div className="grid md:grid-cols-4 gap-6">
                        {plans.map((plan) => (
                            <div
                                key={plan.id}
                                className={`relative rounded-2xl p-7 flex flex-col transition-all duration-300 ${
                                    plan.highlight
                                        ? "border-2 border-[#443CA3] bg-white shadow-xl shadow-[#443CA3]/10"
                                        : "border border-[#443CA3]/20 bg-white hover:border-[#443CA3]/50 hover:shadow-lg hover:shadow-[#443CA3]/5"
                                }`}
                            >
                                {plan.badge && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                        <span className="bg-[#443CA3] text-white text-xs font-bold px-4 py-1 rounded-full whitespace-nowrap">
                                            {plan.badge}
                                        </span>
                                    </div>
                                )}

                                <p className="text-xs font-bold tracking-widest text-[#443CA3]/50 mb-3">{plan.name}</p>

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

                                <p className="text-sm font-semibold text-[#443CA3]/70 mb-6 pb-6 border-b border-[#443CA3]/10">
                                    {plan.debtors}
                                </p>

                                <ul className="space-y-3 flex-1 mb-6">
                                    {plan.features.map((feature, i) => (
                                        <li key={i} className="flex items-center gap-3 text-sm">
                                            {feature.included ? <CheckIcon /> : <CrossIcon />}
                                            <span className={feature.included ? "text-[#443CA3]" : "text-[#443CA3]/30"}>
                                                {feature.label}
                                            </span>
                                        </li>
                                    ))}
                                </ul>

                                {plan.note && (
                                    <p className="text-xs text-[#443CA3]/40 mb-4 text-center">{plan.note}</p>
                                )}

                                <Link
                                    href={plan.id === "enterprise" ? "/about" : "/sign-up"}
                                    className={`w-full text-center py-3 rounded-xl text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2 ${
                                        plan.highlight
                                            ? "bg-[#443CA3] text-white hover:opacity-90"
                                            : "border border-[#443CA3]/30 text-[#443CA3] hover:bg-[#443CA3] hover:text-white"
                                    }`}
                                >
                                    {plan.id === "enterprise" ? "Contactar" : "Empezar ahora"}
                                    <ArrowIcon />
                                </Link>
                            </div>
                        ))}
                    </div>

                    <p className="text-center text-sm text-[#443CA3]/40 mt-10">
                        Todos los planes incluyen soporte por email · Datos seguros y encriptados · Cancela en cualquier momento
                    </p>
                </div>
            </section>

            {/* FEATURES */}
            <section className="px-8 py-20 max-w-7xl mx-auto">
                <h2 className="text-3xl font-bold text-center mb-12">Tecnología Diseñada para Resultados</h2>
                <div className="grid md:grid-cols-3 gap-5">
                    {[
                        {
                            title: "Portal Cliente",
                            desc: "Cada cliente accede a su propia cartera de deudores, sube documentos, monitorea estados y descarga reportes sin depender del equipo administrativo.",
                        },
                        {
                            title: "Automatización IA",
                            desc: "Envía emails y llamadas de voz automatizadas en español natural. El sistema contacta a tus deudores por ti, 24/7, sin intervención manual.",
                        },
                        {
                            title: "Gestión Legal",
                            desc: "Escala casos críticos a proceso judicial con un clic. Registra acuerdos de pago, genera evidencia de contacto y mantén trazabilidad completa.",
                        },
                        {
                            title: "Reportes Inteligentes",
                            desc: "Visualiza tu tasa de recuperación, distribución por estado y actividad de notificaciones. Exporta a Excel o PDF para auditorías e informes.",
                        },
                        {
                            title: "Panel Administrativo",
                            desc: "Control total sobre todos tus clientes y carteras desde un solo lugar. Búsqueda global, filtros avanzados y acciones masivas en segundos.",
                        },
                        {
                            title: "Seguridad Empresarial",
                            desc: "Autenticación segura con Clerk, datos cifrados en tránsito y en reposo, y registro de auditoría completo para cumplimiento normativo.",
                        },
                    ].map((f, i) => (
                        <div key={i} className="border border-[#443CA3]/10 p-6 rounded-2xl hover:border-[#443CA3]/30 hover:shadow-sm transition-all">
                            <h3 className="font-bold mb-2">{f.title}</h3>
                            <p className="text-sm text-[#443CA3]/50 leading-relaxed">{f.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* CTA */}
            <section className="px-8 pb-24 text-center">
                <div className="bg-[#443CA3] rounded-3xl px-12 py-16 max-w-3xl mx-auto">
                    <h2 className="text-3xl font-bold text-white mb-4">Activa tu sistema de recuperación hoy</h2>
                    <p className="text-white/60 mb-8 text-sm">Sin compromisos. Configura tu cuenta en minutos.</p>
                    <Link href="/sign-up" className="bg-[#21FE83] text-[#443CA3] px-10 py-4 rounded-xl font-bold hover:opacity-90 transition inline-block">
                        Crear Cuenta Gratis
                    </Link>
                </div>
            </section>

            {/* FOOTER */}
            <footer className="border-t border-[#443CA3]/10 py-8 px-8 text-sm">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-[#443CA3]/50">© {new Date().getFullYear()} <span className="font-bold text-[#443CA3]">Recupera</span></p>
                    <div className="flex gap-6 text-[#443CA3]/50">
                        <Link href="#" className="hover:text-[#443CA3] transition">Privacidad</Link>
                        <Link href="#" className="hover:text-[#443CA3] transition">Términos</Link>
                        <Link href="#" className="hover:text-[#443CA3] transition">Contacto</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}