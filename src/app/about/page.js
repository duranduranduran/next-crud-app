'use client';

import Link from "next/link";
import MarketingShell from "../components/marketing/MarketingShell";
import SectionHeading from "../components/marketing/SectionHeading";
import { Reveal, SplitHeadline } from "../components/marketing/fx";

const VALUES = [
    {
        title: "Eficiencia",
        body: "Automatizamos el seguimiento repetitivo para que tu equipo se enfoque en los casos que de verdad requieren una decisión humana.",
    },
    {
        title: "Seguridad",
        body: "Cifrado de nivel bancario en tránsito y en reposo, y autenticación segura en cada cuenta que administra una cartera de deudores.",
    },
    {
        title: "Ética",
        body: "Sin hostigamiento. La cobranza automatizada protege la relación entre tu empresa y tu cliente, no la deteriora.",
    },
    {
        title: "Respaldo legal",
        body: "Cada acción queda registrada con fecha y detalle — la trazabilidad que necesitas si un caso llega a proceso judicial.",
    },
];

export default function QuienesSomosPage() {
    return (
        <MarketingShell>
            {/* HERO */}
            <section className="px-6 md:px-8 pt-16 md:pt-24 pb-16 md:pb-20">
                <div className="max-w-3xl mx-auto text-center">
                    <p className="text-xs font-semibold tracking-[0.2em] text-text-tertiary uppercase mb-5">
                        Quiénes somos
                    </p>
                    <SplitHeadline
                        text="Recuperar lo que es tuyo, sin perder la relación"
                        className="text-4xl md:text-6xl font-extrabold leading-[1.02] tracking-tight text-text-primary mb-6"
                    />
                    <p className="text-lg text-text-secondary leading-relaxed max-w-xl mx-auto">
                        Somos la plataforma que combina tecnología, ética y respaldo legal
                        para transformar la cobranza empresarial en Ecuador y Latinoamérica.
                    </p>
                </div>

                <Reveal
                    as="div"
                    stagger={0.08}
                    className="max-w-3xl mx-auto mt-16 grid grid-cols-2 md:grid-cols-4 gap-0 border border-border-default rounded-2xl overflow-hidden"
                >
                    {[
                        { value: "+92%", label: "Contactabilidad" },
                        { value: "24/7", label: "Automatización" },
                        { value: "+500", label: "Clientes activos" },
                        { value: "LATAM", label: "Alcance" },
                    ].map((s, i) => (
                        <div
                            key={i}
                            className={`py-6 px-4 text-center border-border-default ${i % 2 === 0 ? "border-r" : ""} ${i < 2 ? "border-b md:border-b-0" : ""} ${i < 3 ? "md:border-r" : ""}`}
                        >
                            <p className="text-2xl font-extrabold text-text-primary">{s.value}</p>
                            <p className="text-xs text-text-secondary mt-1 uppercase tracking-wide">{s.label}</p>
                        </div>
                    ))}
                </Reveal>
            </section>

            {/* 01 — MISIÓN (prosa larga) */}
            <Reveal as="section" className="px-6 md:px-8 py-20 md:py-28 border-t border-border-subtle">
                <div className="max-w-3xl mx-auto">
                    <SectionHeading index="01" kicker="Nuestra misión" title="Recuperar liquidez sin desgastar la relación comercial" />
                    <div className="mt-8 space-y-5 text-base md:text-lg text-text-secondary leading-relaxed">
                        <p>
                            Impulsamos la recuperación de liquidez de empresas y
                            emprendedores ecuatorianos a través de una plataforma digital
                            inteligente y ética, que combina automatización con respaldo
                            legal para transformar la cobranza en un proceso eficiente,
                            seguro y sin hostigamientos.
                        </p>
                        <p>
                            Sabemos que cobrar una factura vencida es, muchas veces, una
                            conversación incómoda que ningún equipo quiere tener a diario.
                            Por eso construimos un sistema que hace ese seguimiento por ti
                            — de forma consistente, documentada y respetuosa — dejando el
                            contacto humano para los casos que de verdad lo necesitan.
                        </p>
                    </div>
                </div>
            </Reveal>

            {/* 02 — VISIÓN (prosa larga) */}
            <Reveal as="section" className="px-6 md:px-8 py-20 md:py-28 bg-surface-hover">
                <div className="max-w-3xl mx-auto">
                    <SectionHeading index="02" kicker="Nuestra visión" title="Líderes en cobranza inteligente en Latinoamérica" />
                    <div className="mt-8 space-y-5 text-base md:text-lg text-text-secondary leading-relaxed">
                        <p>
                            Queremos ser la plataforma líder en Latinoamérica en la
                            recuperación de liquidez empresarial mediante gestión de
                            cobranza inteligente, reconocida por su innovación, su
                            eficiencia y, sobre todo, por la ética con la que protege la
                            relación entre acreedores y clientes.
                        </p>
                        <p>
                            Empezamos en Ecuador, con el mercado y la normativa que mejor
                            conocemos, y construimos Recupera pensando desde el inicio en
                            crecer hacia el resto de la región sin sacrificar esa premisa.
                        </p>
                    </div>
                </div>
            </Reveal>

            {/* 03 — VALORES */}
            <section className="px-6 md:px-8 py-20 md:py-28">
                <div className="max-w-5xl mx-auto">
                    <Reveal>
                        <SectionHeading index="03" kicker="Nuestros valores" title="Lo que nos define" center />
                    </Reveal>
                    <Reveal stagger={0.08} className="grid md:grid-cols-2 gap-6 mt-14">
                        {VALUES.map((v, i) => (
                            <div key={i} className="border border-border-default rounded-2xl p-7">
                                <h3 className="font-bold text-lg text-text-primary mb-2">{v.title}</h3>
                                <p className="text-sm text-text-secondary leading-relaxed">{v.body}</p>
                            </div>
                        ))}
                    </Reveal>
                </div>
            </section>

            {/* CTA */}
            <Reveal as="section" className="px-6 md:px-8 py-20 md:py-28 text-center border-t border-border-subtle">
                <div className="max-w-xl mx-auto">
                    <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">¿Listo para comenzar?</h2>
                    <p className="text-text-secondary mb-10">
                        Únete a las empresas ecuatorianas que ya recuperan su liquidez con Recupera.
                    </p>
                    <div className="flex flex-wrap gap-4 justify-center">
                        <Link href="/sign-up" className="bg-accent text-accent-fg px-8 py-4 rounded-xl font-bold hover:opacity-90 transition">
                            Crear Cuenta
                        </Link>
                        <Link href="/planes" className="border border-border-default px-8 py-4 rounded-xl font-bold hover:bg-surface-hover transition">
                            Ver Planes
                        </Link>
                    </div>
                </div>
            </Reveal>
        </MarketingShell>
    );
}
