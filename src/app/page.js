
'use client';

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import FeatureGuide from "./components/FeatureGuide";

export default function LandingPage() {

    const particles = useMemo(() =>
        [...Array(40)].map(() => ({
            top: Math.random() * 100,
            left: Math.random() * 100,
        })), []
    );

    const [mouse, setMouse] = useState({ x: 0, y: 0 });

    const handleMouseMove = (e) => {
        const { innerWidth, innerHeight } = window;

        const x = (e.clientX / innerWidth - 0.5) * 10;
        const y = (e.clientY / innerHeight - 0.5) * 10;

        setMouse({ x, y });
    };

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
                    <li><Link href="/planes" className="hover:underline">Planes</Link></li>
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

            {/* HERO */}
            <section className="relative min-h-screen flex items-center px-8" onMouseMove={handleMouseMove}>

                <div className="absolute inset-0 opacity-10">
                    {particles.map((p, i) => (
                        <div
                            key={i}
                            className="absolute w-1 h-1 bg-[#443CA3] rounded-full"
                            style={{top: `${p.top}%`, left: `${p.left}%`}}
                        />
                    ))}
                </div>

                <div className="relative max-w-7xl mx-auto grid md:grid-cols-2 gap-20 items-center">

                    {/* TEXT */}
                    <div className="space-y-10">

                        <h1 className="text-7xl md:text-8xl xl:text-[110px] font-extrabold leading-[0.95]">
                            Recupera Tu Liquidez
                            <br />

                        </h1>

                        <p className="text-lg max-w-xl text-[#443CA3]/70">
                            Automatiza recordatorios, optimiza negociaciones y ejecuta
                            estrategias de cobranza inteligentes con una plataforma diseñada
                            para maximizar tu flujo de caja.
                        </p>

                        {/* Metrics */}
                        <div className="flex gap-10 text-sm text-[#443CA3]/70">
                            <div>
                                <p className="text-3xl font-bold">+92%</p>
                                <p>Contactabilidad</p>
                            </div>
                            <div>
                                <p className="text-3xl font-bold">24/7</p>
                                <p>Automatización</p>
                            </div>
                            <div>
                                <p className="text-3xl font-bold">+10K</p>
                                <p>Casos activos</p>
                            </div>
                        </div>

                        {/* CTA FIXED */}
                        <div className="flex gap-6">

                            <Link
                                href="/sign-up"
                                className="bg-[#443CA3] text-white px-10 py-4 rounded-lg font-bold hover:opacity-90 transition"
                            >
                                Crear Cuenta
                            </Link>

                            <Link
                                href="#how"
                                className="border border-[#443CA3] px-10 py-4 rounded-lg hover:bg-[#443CA3] hover:text-white transition"
                            >
                                Ver Plataforma
                            </Link>

                        </div>
                    </div>

                    {/* UI */}
                    <div className="relative flex justify-center items-center">

                        <div className="group absolute -top-10 -left-10 border border-[#443CA3]/20 p-5 rounded-lg w-56 bg-white animate-floatSlow hover:bg-[#21FE83] transition-all duration-300">
                            <p className="text-sm font-bold group-hover:text-[#443CA3]">Recuperado Hoy</p>
                            <p className="text-2xl font-bold group-hover:text-[#443CA3]">$12,840</p>
                        </div>

                        <div className="group absolute -bottom-10 -right-10 border border-[#443CA3]/20 p-5 rounded-lg w-56 bg-white animate-floatSlowReverse hover:bg-[#FFFF76] transition-all duration-300">
                            <p className="text-sm font-bold group-hover:text-[#443CA3]">Automatizaciones</p>
                            <p className="text-2xl font-bold group-hover:text-[#443CA3]">1,284</p>
                        </div>

                        <div
                            className="group bg-white border border-[#443CA3]/20 rounded-xl p-7 w-[380px] transition-all duration-300 ease-out hover:bg-[#443CA3]"
                            style={{
                                transform: `translate(${mouse.x}px, ${mouse.y}px) scale(1.01)`
                            }}
                        >
                            <h3 className="font-bold mb-4 group-hover:text-white">Centro de Control</h3>

                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between group-hover:text-white">
                                    <span>Empresa Orion</span>
                                    <span className="border px-2 py-1 rounded text-xs group-hover:border-white">Pagado</span>
                                </div>
                                <div className="flex justify-between group-hover:text-white">
                                    <span>Grupo Atlas</span>
                                    <span className="border px-2 py-1 rounded text-xs group-hover:border-white">Pendiente</span>
                                </div>
                                <div className="flex justify-between group-hover:text-white">
                                    <span>Innova Tech</span>
                                    <span className="border px-2 py-1 rounded text-xs group-hover:border-white">En Gestión</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <style jsx>{`
                    @keyframes floatSlow {
                        0% { transform: translateY(0px) rotate(0deg); }
                        50% { transform: translateY(-18px) rotate(1deg); }
                        100% { transform: translateY(0px) rotate(0deg); }
                    }
                    @keyframes floatSlowReverse {
                        0% { transform: translateY(0px) rotate(0deg); }
                        50% { transform: translateY(18px) rotate(-1deg); }
                        100% { transform: translateY(0px) rotate(0deg); }
                    }
                    .animate-floatSlow { animation: floatSlow 6s ease-in-out infinite; }
                    .animate-floatSlowReverse { animation: floatSlowReverse 7s ease-in-out infinite; }
                `}</style>

            </section>



            {/* TRUST */}
            <section className="border-y border-[#443CA3]/10 py-8 text-center text-[#443CA3]/70">

                <p>+10,000 deudores gestionados · Automatización 24/7 · Seguridad empresarial</p>
            </section>
            <FeatureGuide />
            {/* HOW */}
            <section id="how" className="px-8 py-24 max-w-7xl mx-auto">
                <h2 className="text-3xl font-bold text-center mb-16">Cómo Funciona</h2>
                <div className="grid md:grid-cols-4 gap-8 text-center">
                    {["Carga tus deudores","Activamos recordatorios","Seguimiento automatizado","Recuperas liquidez"].map((step, i) => (
                        <div key={i}>
                            <div className="text-3xl font-bold">0{i + 1}</div>
                            <p>{step}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* FEATURES */}
            <section className="px-8 pb-24 max-w-7xl mx-auto">
                <h2 className="text-3xl font-bold text-center mb-12">Tecnología Diseñada para Resultados</h2>
                <div className="grid md:grid-cols-3 gap-8">
                    {["Portal Cliente","Automatización IA","Gestión Legal","Reportes Inteligentes","Panel Administrativo","Seguridad Empresarial"].map((f,i)=>(
                        <div key={i} className="border border-[#443CA3]/20 p-6 rounded-xl">
                            <h3 className="font-bold">{f}</h3>
                            <p className="text-sm text-[#443CA3]/70 mt-2">Módulo avanzado diseñado para optimizar la recuperación.</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* CTA */}
            <section className="px-8 pb-24 text-center">
                <h2 className="text-3xl font-bold mb-6">Activa tu sistema de recuperación hoy</h2>
                <Link href="/sign-up" className="bg-[#443CA3] text-white px-10 py-4 rounded-lg font-bold hover:opacity-90">
                    Crear Cuenta
                </Link>
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
        </div>
    );
}