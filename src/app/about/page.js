'use client';

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function QuienesSomosPage() {

    const [particles, setParticles] = useState([]);
    const [mouse, setMouse] = useState({ x: 0, y: 0 });

    useEffect(() => {
        setParticles(
            [...Array(30)].map(() => ({
                top: Math.random() * 100,
                left: Math.random() * 100,
            }))
        );
    }, []);

    const handleMouseMove = (e) => {
        const { innerWidth, innerHeight } = window;
        const x = (e.clientX / innerWidth - 0.5) * 8;
        const y = (e.clientY / innerHeight - 0.5) * 8;
        setMouse({ x, y });
    };

    const timeline = [
        {
            tag: "Quiénes somos",
            title: "Una plataforma inteligente y ética",
            body: "Impulsamos la recuperación de liquidez de empresas y emprendedores a través de tecnología y respaldo legal, transformando la cobranza en un proceso eficiente, seguro y sin hostigamientos.",
            accent: "#443CA3",
            light: "#EEEDFE",
            side: "left",
            float: { label: "Clientes activos", value: "+500" },
        },
        {
            tag: "Nuestra Misión",
            title: "Recuperar lo que es tuyo",
            body: "Impulsar la recuperación de liquidez de empresas y emprendedores a través de una plataforma digital inteligente y ética, que combina tecnología y respaldo legal para transformar la cobranza en un proceso eficiente, seguro y sin hostigamientos.",
            accent: "#21FE83",
            light: "#E6FFF2",
            side: "right",
            float: { label: "Tasa de contactabilidad", value: "+92%" },
        },
        {
            tag: "Nuestra Visión",
            title: "Líderes en Latinoamérica",
            body: "Ser la plataforma líder en Latinoamérica en la recuperación de liquidez empresarial mediante gestión de cobranza inteligente, reconocida por su innovación, eficiencia y ética en la protección de la relación entre acreedores y clientes.",
            accent: "#443CA3",
            light: "#EEEDFE",
            side: "left",
            float: { label: "Automatización", value: "24/7" },
        },
    ];

    const values = [
        { icon: "⚡", title: "Eficiencia", desc: "Automatizamos procesos para que tu equipo se enfoque en lo que importa." },
        { icon: "🔒", title: "Seguridad", desc: "Encriptación de nivel bancario en cada operación." },
        { icon: "⚖️", title: "Ética", desc: "Sin hostigamientos. Cobranza que protege la relación acreedor-cliente." },
        { icon: "🤝", title: "Respaldo Legal", desc: "Tecnología combinada con soporte legal para maximizar resultados." },
    ];

    return (
        <div className="min-h-screen bg-white text-[#443CA3] overflow-x-hidden">

            {/* NAVBAR */}
            <nav className="sticky top-0 z-50 flex items-center justify-between px-8 max-w-7xl mx-auto bg-white py-4 border-b border-[#443CA3]/10">
                <Link href="/">
                    <Image src="/logo-recupera-purple.png" alt="Recupera" width={150} height={25} />
                </Link>
                <ul className="flex space-x-6 items-center">
                    <li><Link href="/about" className="font-bold underline underline-offset-4">Quienes Somos</Link></li>
                    <li><Link href="/services" className="hover:underline">Servicios</Link></li>
                    <li><Link href="/planes" className="hover:underline">Planes</Link></li>
                    <li><Link href="/contact" className="hover:underline">Contactanos</Link></li>
                    <li>
                        <Link href="/sign-in" className="border border-[#443CA3] px-5 py-2 rounded-lg hover:bg-[#443CA3] hover:text-white transition">
                            Iniciar Sesión
                        </Link>
                    </li>
                </ul>
            </nav>

            {/* HERO */}
            <section className="relative pt-24 pb-16 px-8 text-center overflow-hidden" onMouseMove={handleMouseMove}>
                <div className="absolute inset-0 opacity-5 pointer-events-none">
                    {particles.map((p, i) => (
                        <div key={i} className="absolute w-1 h-1 bg-[#443CA3] rounded-full"
                             style={{ top: `${p.top}%`, left: `${p.left}%` }} />
                    ))}
                </div>

                {/* Floating cards */}
                <div className="group absolute top-28 left-12 border border-[#443CA3]/20 p-4 rounded-xl w-48 bg-white animate-floatSlow hover:bg-[#21FE83] transition-all duration-300 hidden lg:block text-left">
                    <p className="text-xs text-[#443CA3]/50 mb-1 group-hover:text-[#443CA3]">Casos activos</p>
                    <p className="text-xl font-bold group-hover:text-[#443CA3]">+10,000</p>
                </div>
                <div className="group absolute top-40 right-12 border border-[#443CA3]/20 p-4 rounded-xl w-48 bg-white animate-floatSlowReverse hover:bg-[#FFFF76] transition-all duration-300 hidden lg:block text-left">
                    <p className="text-xs text-[#443CA3]/50 mb-1 group-hover:text-[#443CA3]">Alcance</p>
                    <p className="text-xl font-bold group-hover:text-[#443CA3]">LATAM 🌎</p>
                </div>

                <div className="relative max-w-2xl mx-auto">
                    <p className="text-xs font-bold tracking-widest text-[#443CA3]/30 uppercase mb-5">Quienes Somos</p>
                    <h1 className="text-6xl md:text-7xl font-extrabold leading-[0.95] mb-6">
                        Recupera<br />
                        <span className="relative inline-block">
                            tu liquidez
                            <span className="absolute -bottom-1 left-0 w-full h-1 bg-[#21FE83] rounded-full"></span>
                        </span>
                    </h1>
                    <p className="text-lg text-[#443CA3]/60 leading-relaxed">
                        Somos la plataforma que combina tecnología, ética y respaldo legal para transformar la cobranza empresarial en Latinoamérica.
                    </p>
                </div>

                {/* Stats strip */}
                <div className="max-w-3xl mx-auto mt-16 grid grid-cols-4 gap-0 border border-[#443CA3]/10 rounded-2xl overflow-hidden">
                    {[
                        { value: "+92%", label: "Contactabilidad" },
                        { value: "24/7", label: "Automatización" },
                        { value: "+10K", label: "Casos activos" },
                        { value: "LATAM", label: "Alcance" },
                    ].map((s, i) => (
                        <div key={i} className={`group py-6 px-4 cursor-default hover:bg-[#F7F8FF] transition-colors duration-300 ${i < 3 ? 'border-r border-[#443CA3]/10' : ''}`}>
                            <p className="text-2xl font-extrabold group-hover:text-[#443CA3] transition-colors">{s.value}</p>
                            <p className="text-xs text-[#443CA3]/40 mt-1 uppercase tracking-wide">{s.label}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* TIMELINE */}
            <section className="px-8 py-24 max-w-5xl mx-auto relative">

                {/* Center line */}
                <div className="absolute left-1/2 top-24 bottom-24 w-px bg-[#443CA3]/10 -translate-x-1/2 hidden md:block"></div>

                <div className="space-y-24">
                    {timeline.map((item, i) => (
                        <div key={i} className={`relative grid md:grid-cols-2 gap-12 items-center`}>

                            {/* Center dot */}
                            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:block z-10">
                                <div className="w-4 h-4 rounded-full border-2 bg-white"
                                     style={{ borderColor: item.accent }}>
                                </div>
                            </div>

                            {/* Content — alternates sides */}
                            <div className={`${item.side === 'right' ? 'md:col-start-2' : ''} group`}>
                                <div
                                    className="border border-[#443CA3]/10 rounded-2xl p-8 hover:shadow-xl transition-all duration-500 hover:-translate-y-1 relative overflow-hidden"
                                    style={{ '--accent': item.accent }}
                                >
                                    {/* Accent corner */}
                                    <div className="absolute top-0 left-0 w-1 h-full rounded-l-2xl transition-all duration-300"
                                         style={{ background: item.accent }}></div>

                                    <span className="inline-block text-xs font-bold px-3 py-1 rounded-full mb-4 ml-4"
                                          style={{ background: item.light, color: item.accent }}>
                                        {item.tag}
                                    </span>
                                    <h2 className="text-2xl font-bold mb-4 ml-4">{item.title}</h2>
                                    <p className="text-[#443CA3]/60 leading-relaxed ml-4">{item.body}</p>
                                </div>
                            </div>

                            {/* Floating stat — opposite side */}
                            <div className={`${item.side === 'right' ? 'md:col-start-1 md:row-start-1' : ''} flex ${item.side === 'right' ? 'md:justify-end' : 'md:justify-start'} items-center`}>
                                <div
                                    className="group border border-[#443CA3]/10 rounded-2xl p-8 w-48 hover:scale-105 transition-all duration-300 cursor-default animate-floatSlow text-center"
                                    style={{ animationDelay: `${i * 0.5}s` }}
                                >
                                    <p className="text-4xl font-extrabold mb-2" style={{ color: item.accent }}>{item.float.value}</p>
                                    <p className="text-xs text-[#443CA3]/40 uppercase tracking-wide">{item.float.label}</p>
                                </div>
                            </div>

                        </div>
                    ))}
                </div>
            </section>

            {/* VALUES */}
            <section className="bg-[#F7F8FF] px-8 py-24">
                <div className="max-w-5xl mx-auto">
                    <p className="text-xs font-bold tracking-widest text-[#443CA3]/30 uppercase text-center mb-3">Nuestros valores</p>
                    <h2 className="text-4xl font-bold text-center mb-14">Lo que nos define</h2>
                    <div className="grid md:grid-cols-4 gap-6">
                        {values.map((v, i) => (
                            <div key={i}
                                 className="group bg-white border border-[#443CA3]/10 rounded-2xl p-7 hover:border-[#443CA3]/40 hover:-translate-y-2 hover:shadow-lg hover:shadow-[#443CA3]/5 transition-all duration-300 cursor-default text-center">
                                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300 inline-block">{v.icon}</div>
                                <h3 className="font-bold text-lg mb-2">{v.title}</h3>
                                <p className="text-sm text-[#443CA3]/50 leading-relaxed">{v.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="px-8 py-24 text-center">
                <div className="max-w-xl mx-auto">
                    <h2 className="text-4xl font-bold mb-4">¿Listo para comenzar?</h2>
                    <p className="text-[#443CA3]/60 mb-10">Únete a miles de empresas que ya recuperan su liquidez con Recupera.</p>
                    <div className="flex gap-4 justify-center">
                        <Link href="/sign-up" className="bg-[#443CA3] text-white px-8 py-4 rounded-xl font-bold hover:opacity-90 transition">
                            Crear Cuenta
                        </Link>
                        <Link href="/planes" className="border border-[#443CA3] px-8 py-4 rounded-xl font-bold hover:bg-[#443CA3] hover:text-white transition">
                            Ver Planes
                        </Link>
                    </div>
                </div>
            </section>

            {/* FOOTER */}
            <footer className="border-t border-[#443CA3]/10 py-8 px-8 text-sm">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-[#443CA3]/70">© {new Date().getFullYear()} <span className="font-bold">Recupera</span></p>
                    <div className="flex gap-6 text-[#443CA3]/70">
                        <Link href="#">Privacidad</Link>
                        <Link href="#">Términos</Link>
                        <Link href="#">Contacto</Link>
                    </div>
                </div>
            </footer>

            <style jsx>{`
                @keyframes floatSlow {
                    0% { transform: translateY(0px); }
                    50% { transform: translateY(-12px); }
                    100% { transform: translateY(0px); }
                }
                @keyframes floatSlowReverse {
                    0% { transform: translateY(0px); }
                    50% { transform: translateY(12px); }
                    100% { transform: translateY(0px); }
                }
                .animate-floatSlow { animation: floatSlow 6s ease-in-out infinite; }
                .animate-floatSlowReverse { animation: floatSlowReverse 7s ease-in-out infinite; }
            `}</style>

        </div>
    );
}