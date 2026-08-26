"use client";

import { useState, useEffect, useRef } from "react";

const STEPS = [
    {
        label: "01",
        title: "Agrega tus deudores",
        desc: "Ingresa deudores manualmente con todos sus datos: nombre, cédula, teléfono, email y monto adeudado.",
        checks: ["Validación de cédula ecuatoriana", "Adjunta documentos o contratos", "Seguimiento de estado en tiempo real"],
    },
    {
        label: "02",
        title: "Carga masiva por Excel",
        desc: "Sube cientos de deudores en segundos. Validación automática fila por fila con reporte de errores.",
        checks: ["Plantilla descargable lista para usar", "Soporta .xlsx, .xls y .csv", "Errores señalados fila por fila"],
    },
    {
        label: "03",
        title: "Notificaciones automáticas",
        desc: "Con un clic, envía email y llamada automatizada a todos tus deudores habilitados.",
        checks: ["Email desde tu dominio propio", "Llamada IA en español natural", "Procesamiento en segundo plano"],
    },
    {
        label: "04",
        title: "Reportes en tiempo real",
        desc: "Visualiza tu portafolio completo con métricas de recuperación, estados y tasa de contactabilidad.",
        checks: ["Tasa de recuperación calculada", "Exporta a Excel con un clic", "Historial de notificaciones por deudor"],
    },
    {
        label: "05",
        title: "Trazabilidad total",
        desc: "Cada acción queda registrada. Auditoría completa para cumplimiento legal.",
        checks: ["Registro de cambios de estado", "Historial de notas por deudor", "Auditoría para cumplimiento legal"],
    },
];

function MockStep1() {
    return (
        <div className="bg-surface-raised rounded-2xl p-5 shadow-sm border border-accent/8">
            <p className="text-xs font-semibold text-accent/40 uppercase tracking-widest mb-4">Agregar Deudor</p>
            <div className="flex flex-col gap-2">
                {[
                    { label: "Nombre", value: "Elena Torres" },
                    { label: "Correo", value: "elena@email.com" },
                    { label: "Teléfono", value: "0989 626 111" },
                    { label: "Cédula", value: "0109473017" },
                    { label: "Monto", value: "$ 558.03" },
                ].map((f, i) => (
                    <div key={i} className="flex items-center gap-3">
                        <span className="text-[10px] text-accent/30 w-14 flex-shrink-0">{f.label}</span>
                        <div className="flex-1 bg-surface-hover rounded-lg px-3 py-2 text-xs text-accent/80 border border-accent/6">{f.value}</div>
                    </div>
                ))}
            </div>
            <div className="mt-4 bg-accent text-surface-page text-center text-xs font-medium py-2.5 rounded-xl">Agregar Deudor</div>
        </div>
    );
}

function MockStep2() {
    return (
        <div className="bg-surface-raised rounded-2xl p-5 shadow-sm border border-accent/8">
            <p className="text-xs font-semibold text-accent/40 uppercase tracking-widest mb-4">Importar Excel</p>
            <div className="bg-surface-hover border-2 border-dashed border-accent/15 rounded-xl p-5 text-center mb-4">
                <div className="w-8 h-8 bg-brand-mint/20 rounded-lg mx-auto mb-2 flex items-center justify-center">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 2v8M3.5 6.5L7 10l3.5-3.5" stroke="var(--color-brand-mint)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M1.5 12h11" stroke="var(--color-brand-mint)" strokeWidth="1.5" strokeLinecap="round"/></svg>
                </div>
                <p className="text-xs text-accent/40">Arrastra tu archivo aquí</p>
                <p className="text-[10px] text-accent/25 mt-1">.xlsx · .xls · .csv</p>
            </div>
            <div className="flex flex-col gap-1.5 mb-4">
                {[
                    { n: "Elena Torres", a: "$558", ok: true },
                    { n: "David López", a: "$1,007", ok: true },
                    { n: "Juan Pérez", a: "$320", ok: false },
                ].map((r, i) => (
                    <div key={i} className={`flex justify-between items-center px-3 py-2 rounded-xl text-xs border ${r.ok ? "bg-surface-hover border-accent/6" : "bg-danger-bg border-danger/20"}`}>
                        <span className="text-accent/60">{r.n}</span>
                        <div className="flex items-center gap-2">
                            <span className="font-semibold text-accent">{r.a}</span>
                            <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] text-surface-page ${r.ok ? "bg-brand-mint" : "bg-danger"}`}>{r.ok ? "✓" : "!"}</div>
                        </div>
                    </div>
                ))}
            </div>
            <div className="flex gap-2">
                <div className="flex-1 border border-accent/15 rounded-xl py-2 text-xs text-center text-accent/60">Plantilla</div>
                <div className="flex-1 bg-accent rounded-xl py-2 text-xs text-center text-surface-page font-medium">Importar 2 filas</div>
            </div>
        </div>
    );
}

function MockStep3() {
    return (
        <div className="bg-surface-raised rounded-2xl p-5 shadow-sm border border-accent/8">
            <div className="flex justify-between items-center mb-4">
                <p className="text-xs font-semibold text-accent/40 uppercase tracking-widest">Mis Deudores</p>
                <div className="bg-accent text-surface-page text-[10px] px-3 py-1.5 rounded-lg font-medium">Enviar Recordatorios</div>
            </div>
            <div className="flex flex-col gap-2">
                {[
                    { n: "Elena Torres", a: "$558", on: true, s: "Pendiente", sc: "var(--color-status-pendiente)", sb: "var(--color-status-pendiente-bg)" },
                    { n: "David López", a: "$1,007", on: true, s: "En Gestión", sc: "var(--color-status-en-gestion)", sb: "var(--color-status-en-gestion-bg)" },
                    { n: "Lucía Sánchez", a: "$897", on: false, s: "Pendiente", sc: "var(--color-status-pendiente)", sb: "var(--color-status-pendiente-bg)" },
                ].map((d, i) => (
                    <div key={i} className="border border-accent/8 rounded-xl px-3 py-2.5 flex justify-between items-center">
                        <div>
                            <p className="text-xs font-semibold text-accent mb-1">{d.n}</p>
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ color: d.sc, background: d.sb }}>{d.s}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-xs font-bold text-accent">{d.a}</span>
                            <div className="w-8 h-4 rounded-full relative flex-shrink-0 transition-colors" style={{ background: d.on ? "var(--color-brand-mint)" : "var(--color-border-default)" }}>
                                <div className="absolute top-0.5 w-3 h-3 bg-surface-page rounded-full shadow-sm transition-all" style={{ left: d.on ? "18px" : "2px" }} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function MockStep4() {
    return (
        <div className="bg-surface-raised rounded-2xl p-5 shadow-sm border border-accent/8">
            <p className="text-xs font-semibold text-accent/40 uppercase tracking-widest mb-4">Reportes</p>
            <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="bg-surface-hover rounded-xl p-3.5">
                    <p className="text-[10px] text-accent/30 uppercase tracking-wide mb-1">Deudores</p>
                    <p className="text-2xl font-bold text-accent">25</p>
                </div>
                <div className="bg-accent rounded-xl p-3.5">
                    <p className="text-[10px] text-surface-page/40 uppercase tracking-wide mb-1">Recuperado</p>
                    <p className="text-2xl font-bold text-brand-mint">$4.2K</p>
                </div>
            </div>
            <div className="mb-4">
                <div className="flex justify-between text-[10px] text-accent/30 mb-1.5"><span>Progreso de recuperación</span><span>34%</span></div>
                <div className="bg-accent/8 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-brand-mint h-full rounded-full" style={{ width: "34%" }} />
                </div>
            </div>
            <div className="flex items-end gap-1.5 h-14">
                {[4, 7, 3, 9, 5, 8, 6].map((h, i) => (
                    <div key={i} className="flex-1 rounded-t-sm" style={{ height: `${h * 5}px`, background: `color-mix(in srgb, var(--color-accent) ${Math.round((0.3 + i * 0.07) * 100)}%, transparent)` }} />
                ))}
            </div>
            <p className="text-[9px] text-accent/25 text-center mt-2">Llamadas · últimos 7 días</p>
        </div>
    );
}

function MockStep5() {
    return (
        <div className="bg-surface-raised rounded-2xl p-5 shadow-sm border border-accent/8">
            <p className="text-xs font-semibold text-accent/40 uppercase tracking-widest mb-4">Registro de Actividad</p>
            <div className="flex flex-col gap-2">
                {[
                    { e: "Llamada", d: "Elena Torres — $558", sc: "var(--color-danger)", sb: "var(--color-danger-bg)", t: "18:04" },
                    { e: "Email", d: "David López — $1,007", sc: "var(--color-info)", sb: "var(--color-info-bg)", t: "17:49" },
                    { e: "Estado", d: "Pedro → Acuerdo de Pago", sc: "var(--color-neutral-event)", sb: "var(--color-neutral-event-bg)", t: "09:55" },
                    { e: "Nota", d: "\"Prometió pagar el viernes\"", sc: "var(--color-accent)", sb: "var(--color-accent-bg)", t: "Ayer" },
                ].map((l, i) => (
                    <div key={i} className="flex items-center gap-2.5 px-3 py-2 bg-surface-hover rounded-xl">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0" style={{ color: l.sc, background: l.sb }}>{l.e}</span>
                        <span className="text-[11px] text-accent/50 flex-1 truncate">{l.d}</span>
                        <span className="text-[10px] text-accent/25 whitespace-nowrap">{l.t}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

const MOCK_SCREENS = [<MockStep1 />, <MockStep2 />, <MockStep3 />, <MockStep4 />, <MockStep5 />];

export default function FeatureGuide() {
    const [current, setCurrent] = useState(0);
    const [paused, setPaused] = useState(false);
    const [animating, setAnimating] = useState(false);
    const timerRef = useRef(null);

    const goTo = (n, manual = false) => {
        if (animating || n === current) return;
        if (manual) setPaused(true);
        setAnimating(true);
        setCurrent(n);
        setTimeout(() => setAnimating(false), 600);
    };

    const navigate = (dir, manual = false) => {
        const next = Math.max(0, Math.min(STEPS.length - 1, current + dir));
        goTo(next, manual);
    };

    useEffect(() => {
        if (paused) return;
        timerRef.current = setInterval(() => {
            setCurrent(c => {
                const next = c + 1 >= STEPS.length ? 0 : c + 1;
                return next;
            });
        }, 4500);
        return () => clearInterval(timerRef.current);
    }, [paused]);

    const step = STEPS[current];

    return (
        <section className="px-8 pt-0 pb-16 max-w-7xl mx-auto">
            <div className="text-center mb-10">
                <p className="text-xs font-semibold tracking-[0.2em] text-accent/30 uppercase mb-5">Cómo funciona</p>
                <h2 className="text-4xl md:text-5xl font-extrabold text-accent mb-5 leading-[1.05]">
                    Todo lo que necesitas,<br/>en un solo lugar
                </h2>
                <p className="text-lg text-accent/40 max-w-md mx-auto">Gestiona, notifica y recupera. Así de
                    simple.</p>
            </div>

            {/* Step indicators */}
            <div className="flex justify-center gap-2 mb-12">
                {STEPS.map((s, i) => (
                    <button
                        key={i}
                        onClick={() => goTo(i, true)}
                        className="group flex flex-col items-center gap-2 px-4 py-2 rounded-2xl transition-all duration-500"
                        style={{background: i === current ? "var(--color-accent-bg)" : "transparent"}}
                    >
                        <span
                            className={`text-xs font-bold transition-all duration-500 ${i === current ? "text-accent" : "text-accent/25"}`}>
                            {s.label}
                        </span>
                        <div
                            className={`h-0.5 rounded-full transition-all duration-500 ${i === current ? "w-8 bg-accent" : "w-4 bg-accent/15"}`}/>
                    </button>
                ))}
            </div>

            {/* Main content */}
            <div className="grid md:grid-cols-2 gap-16 items-center min-h-[420px]">

                {/* Left — text */}
                <div
                    key={`text-${current}`}
                    style={{animation: "fadeUp 0.5s cubic-bezier(0.4,0,0.2,1) forwards"}}
                >
                    <div className="inline-flex items-center gap-2 mb-6">
                        <span className="text-4xl font-black text-accent/8">{step.label}</span>
                    </div>
                    <h3 className="text-3xl font-extrabold text-accent mb-4 leading-tight">{step.title}</h3>
                    <p className="text-base text-accent/50 leading-relaxed mb-8">{step.desc}</p>
                    <div className="flex flex-col gap-3.5">
                        {step.checks.map((c, i) => (
                            <div
                                key={i}
                                className="flex items-center gap-3"
                                style={{
                                    animation: `fadeUp 0.5s cubic-bezier(0.4,0,0.2,1) ${i * 80}ms forwards`,
                                    opacity: 0
                                }}
                            >
                                <div
                                    className="w-5 h-5 rounded-full bg-brand-mint flex items-center justify-center flex-shrink-0">
                                    <svg width="9" height="9" viewBox="0 0 9 9">
                                        <path d="M1.5 4.5l2 2 4-4" stroke="var(--color-accent)" strokeWidth="1.5"
                                              strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                                    </svg>
                                </div>
                                <span className="text-sm text-accent/60">{c}</span>
                            </div>
                        ))}
                    </div>

                    {/* Nav arrows */}
                    <div className="flex items-center gap-3 mt-10">
                        <button
                            onClick={() => navigate(-1, true)}
                            disabled={current === 0}
                            className="w-10 h-10 rounded-full border border-accent/15 flex items-center justify-center text-accent/40 hover:border-accent/40 hover:text-accent transition-all disabled:opacity-20"
                        >
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                <path d="M9 3L5 7l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
                                      strokeLinejoin="round"/>
                            </svg>
                        </button>
                        <button
                            onClick={() => navigate(1, true)}
                            disabled={current === STEPS.length - 1}
                            className="w-10 h-10 rounded-full border border-accent/15 flex items-center justify-center text-accent/40 hover:border-accent/40 hover:text-accent transition-all disabled:opacity-20"
                        >
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
                                      strokeLinejoin="round"/>
                            </svg>
                        </button>
                        <span className="text-xs text-accent/25 ml-2">{current + 1} / {STEPS.length}</span>
                    </div>
                </div>

                {/* Right — mock screen */}
                <div
                    key={`mock-${current}`}
                    style={{animation: "fadeUpMock 0.55s cubic-bezier(0.4,0,0.2,1) forwards"}}
                >
                    {MOCK_SCREENS[current]}
                </div>

            </div>

            {/* Progress bar */}
            <div className="flex gap-1.5 mt-16 max-w-xs mx-auto">
                {STEPS.map((_, i) => (
                    <div key={i} className="flex-1 h-0.5 rounded-full overflow-hidden bg-accent/10">
                        <div
                            className="h-full rounded-full bg-accent transition-all duration-500"
                            style={{
                                width: i === current ? "100%" : i < current ? "100%" : "0%",
                                opacity: i < current ? 0.3 : 1
                            }}
                        />
                    </div>
                ))}
            </div>

            <style>{`
                @keyframes fadeUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes fadeUpMock {
                    from { opacity: 0; transform: translateY(24px) scale(0.98); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
            `}</style>
        </section>
    );
}
