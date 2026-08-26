'use client';

import { SignIn } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import Link from "next/link";
import Image from "next/image";
import { useMemo } from "react";

// Clerk doesn't read our CSS — it themes through the appearance prop.
// variables map to our tokens by CSS var() reference (not retyped hexes),
// which resolve correctly because <html> carries data-theme globally
// block wraps this whole page and is an ancestor of Clerk's rendered DOM.
const clerkAppearance = {
    baseTheme: dark,
    variables: {
        colorPrimary: "var(--color-accent)",
        colorBackground: "var(--color-surface-raised)",
        colorText: "var(--color-text-primary)",
        colorTextSecondary: "var(--color-text-secondary)",
        colorInputBackground: "var(--color-surface-page)",
        colorInputText: "var(--color-text-primary)",
        borderRadius: "var(--radius-md)",
    },
    elements: {
        // Not reachable via `variables` — Clerk has no border-color or
        // focus-ring variable, so these stay as element class overrides.
        card: "shadow-none border border-border-default",
        headerTitle: "text-text-primary font-bold",
        headerSubtitle: "text-text-secondary",
        formButtonPrimary:
            "text-surface-page font-bold hover:bg-accent-hover " +
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface-raised",
        socialButtonsBlockButton:
            "border border-border-default hover:bg-surface-hover text-text-primary " +
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface-raised",
        formFieldInput:
            "border border-border-default focus:border-accent " +
            "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-surface-page",
        footerActionLink: "text-accent hover:underline",
    },
};

export default function SignInPage() {

    // particles
    const particles = useMemo(() =>
        [...Array(30)].map(() => ({
            top: Math.random() * 100,
            left: Math.random() * 100,
        })), []
    );

    return (
        <div data-density="compact" className="min-h-screen bg-surface-page text-text-primary relative overflow-hidden">

            {/* ================= NAVBAR ================= */}
            <nav
                className="sticky top-0 z-50 flex items-center justify-between px-8 max-w-7xl mx-auto bg-surface-page py-4 border-b border-border-subtle">
                <Link href="/">
                    <Image
                        src="/logo-recupera-white.png"
                        alt="Recupera"
                        width={140}
                        height={43}
                    />
                </Link>

                <ul className="flex space-x-6">
                    <li>
                        <Link href="/about" className="hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface-page rounded-sm">
                            Quienes Somos
                        </Link>
                    </li>
                    <li>
                        <Link href="/services" className="hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface-page rounded-sm">
                            Servicios
                        </Link>
                    </li>
                    <li>
                        <Link href="/contact" className="hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface-page rounded-sm">
                            Contactanos
                        </Link>
                    </li>
                    <li>
                        <Link
                            href="/sign-in"
                            className="border border-accent px-5 py-2 rounded-lg hover:bg-accent hover:text-surface-page transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface-page"
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
                            className="absolute w-1 h-1 bg-accent rounded-full"
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

                        <p className="text-text-secondary max-w-md">
                            Automatiza tu cobranza, optimiza tus flujos y transforma
                            deudas en ingresos con una plataforma diseñada para escalar.
                        </p>

                        {/* Floating mini cards */}
                        <div className="relative mt-10">

                            <div
                                className="absolute -left-6 top-0 border border-border-default p-4 rounded-lg bg-surface-raised animate-floatSlow text-sm">
                                +92% recuperación
                            </div>

                            <div
                                className="absolute left-32 top-16 border border-border-default p-4 rounded-lg bg-surface-raised animate-floatSlowReverse text-sm">
                                Automatización 24/7
                            </div>

                        </div>
                    </div>

                    {/* RIGHT SIDE — CLERK */}
                    <div className="flex justify-center">

                        <SignIn
                            forceRedirectUrl="/redirect"
                            appearance={clerkAppearance}
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
