'use client';

import { SignIn } from "@clerk/nextjs";
import Link from "next/link";
import Image from "next/image";
import { useMemo } from "react";

export default function SignInPage() {

    // particles
    const particles = useMemo(() =>
        [...Array(30)].map(() => ({
            top: Math.random() * 100,
            left: Math.random() * 100,
        })), []
    );

    return (
        <div className="min-h-screen bg-white text-[#443CA3] relative overflow-hidden">

            {/* ================= NAVBAR ================= */}
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

                <ul className="flex space-x-6">
                    <li>
                        <Link href="/about" className="hover:underline">
                            Quienes Somos
                        </Link>
                    </li>
                    <li>
                        <Link href="/services" className="hover:underline">
                            Servicios
                        </Link>
                    </li>
                    <li>
                        <Link href="/contact" className="hover:underline">
                            Contactanos
                        </Link>
                    </li>
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

            {/* ================= CONTENT ================= */}
            <div className="flex items-center justify-center px-6 py-20 pt-40">

                {/* Particles */}
                <div className="absolute inset-0 opacity-10 pointer-events-none">
                    {particles.map((p, i) => (
                        <div
                            key={i}
                            className="absolute w-1 h-1 bg-[#443CA3] rounded-full"
                            style={{
                                top: `${p.top}%`,
                                left: `${p.left}%`,
                            }}
                        />
                    ))}
                </div>

                <div className="relative w-full max-w-6xl grid md:grid-cols-2 gap-16 items-center">

                    {/* LEFT SIDE */}
                    <div className="space-y-8 hidden md:block">

                        <h1 className="text-5xl font-extrabold leading-tight">
                            Recupera tu liquidez
                            <br/>
                            sin fricción
                        </h1>

                        <p className="text-[#443CA3]/70 max-w-md">
                            Automatiza tu cobranza, optimiza tus flujos y transforma
                            deudas en ingresos con una plataforma diseñada para escalar.
                        </p>

                        {/* Floating mini cards */}
                        <div className="relative mt-10">

                            <div
                                className="absolute -left-6 top-0 border border-[#443CA3]/20 p-4 rounded-lg bg-white animate-floatSlow text-sm">
                                +92% recuperación
                            </div>

                            <div
                                className="absolute left-32 top-16 border border-[#443CA3]/20 p-4 rounded-lg bg-white animate-floatSlowReverse text-sm">
                                Automatización 24/7
                            </div>

                        </div>
                    </div>

                    {/* RIGHT SIDE — CLERK */}
                    <div className="flex justify-center">

                        <SignIn
                            forceRedirectUrl="/redirect"
                            appearance={{
                                elements: {
                                    card: "bg-white border border-[#443CA3]/20 shadow-none rounded-xl",
                                    headerTitle: "text-[#443CA3] font-bold",
                                    headerSubtitle: "text-[#443CA3]/70",
                                    formButtonPrimary:
                                        "bg-[#443CA3] hover:opacity-90 text-white font-bold",
                                    socialButtonsBlockButton:
                                        "border border-[#443CA3]/20 hover:bg-[#443CA3] hover:text-white",
                                    formFieldInput:
                                        "border border-[#443CA3]/20 focus:border-[#443CA3] focus:ring-0",
                                    footerActionLink:
                                        "text-[#443CA3] hover:underline",
                                },
                            }}
                        />

                    </div>
                </div>
            </div>

            {/* Floating Animations */}
            <style jsx>{`
                @keyframes floatSlow {
                    0% {
                        transform: translateY(0px);
                    }
                    50% {
                        transform: translateY(-12px);
                    }
                    100% {
                        transform: translateY(0px);
                    }
                }

                @keyframes floatSlowReverse {
                    0% {
                        transform: translateY(0px);
                    }
                    50% {
                        transform: translateY(12px);
                    }
                    100% {
                        transform: translateY(0px);
                    }
                }

                .animate-floatSlow {
                    animation: floatSlow 6s ease-in-out infinite;
                }

                .animate-floatSlowReverse {
                    animation: floatSlowReverse 7s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
}