'use client';

import { useRef } from "react";
import { usePrefersReducedMotion } from "./fx";

// The one 3D element, per the brief. A true Three.js scene is heavy for a
// landing page (minimum viable bundle is well into six figures of bytes);
// three flat cards positioned at different translateZ depths inside one
// perspective container, tilted together by mouse position, reads as
// genuinely three-dimensional — the rotation reveals real depth separation
// between the layers, not just one card tilting in place — at effectively
// zero bundle cost (pure CSS transforms + a mousemove handler already
// shipped as part of this component).
//
// prefers-reduced-motion disables the interactive tilt (the actual motion)
// but leaves the layered composition itself in place at its resting
// rotation — a fixed arrangement isn't motion, so there's nothing here to
// suppress for that case beyond not attaching the mousemove handler.
export default function HeroVisual() {
    const wrapRef = useRef(null);
    const cardRef = useRef(null);
    const reduced = usePrefersReducedMotion();

    const handleMove = (e) => {
        if (reduced) return;
        const wrap = wrapRef.current;
        const card = cardRef.current;
        if (!wrap || !card) return;
        const rect = wrap.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width - 0.5;
        const py = (e.clientY - rect.top) / rect.height - 0.5;
        card.style.transform = `rotateX(${(-py * 9).toFixed(2)}deg) rotateY(${(px * 13).toFixed(2)}deg)`;
    };

    const handleLeave = () => {
        if (cardRef.current) cardRef.current.style.transform = "rotateX(0deg) rotateY(0deg)";
    };

    const rows = [
        { name: "Empresa Orion", amount: "$4,820", status: "Pagado", color: "var(--color-status-pagado)", bg: "var(--color-status-pagado-bg)" },
        { name: "Grupo Atlas", amount: "$1,205", status: "Pendiente", color: "var(--color-status-pendiente)", bg: "var(--color-status-pendiente-bg)" },
        { name: "Innova Tech", amount: "$3,140", status: "En Gestión", color: "var(--color-status-en-gestion)", bg: "var(--color-status-en-gestion-bg)" },
    ];

    return (
        <div
            ref={wrapRef}
            onMouseMove={handleMove}
            onMouseLeave={handleLeave}
            className="relative w-full max-w-md min-w-0 mx-auto"
            style={{ perspective: "1400px" }}
        >
            {/* pt-20 on the 3D group reserves a band above the front card
                that the mid card lives in entirely — top-20 below matches
                it exactly. That's what guarantees the two cards never
                overlap at all (previously the mid card was tucked -6px
                into the front card's own top-left corner, so the front
                card covered all but a sliver of it). Zero overlap plus the
                z-depth/rotation still reads as a deliberate stack, just
                fanned instead of buried. */}
            <div
                ref={cardRef}
                className="relative pt-20 transition-transform duration-300 ease-out"
                style={{ transformStyle: "preserve-3d" }}
            >
                {/* Back layer — a soft depth plane, no content of its own */}
                <div
                    className="absolute top-20 left-4 right-4 bottom-4 rounded-3xl border border-border-subtle bg-surface-hover"
                    style={{ transform: "translateZ(-48px)" }}
                    aria-hidden="true"
                />

                {/* Mid layer — recovery stat chip, fully above the front
                    card (see pt-20/top-20 note), rotated so it reads as a
                    second card fanned out behind, not a mis-clipped one */}
                <div
                    className="absolute top-0 right-2 w-40 rounded-2xl border border-border-default bg-surface-raised p-4 shadow-lg"
                    style={{ transform: "translateZ(32px) rotate(-6deg)" }}
                    aria-hidden="true"
                >
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-text-secondary mb-1">Recuperado</p>
                    <p className="text-2xl font-bold text-text-primary">$9,165</p>
                </div>

                {/* Front layer — the actual card, real content for a11y */}
                <div
                    className="relative rounded-3xl border border-border-default bg-surface-raised p-6 shadow-xl"
                    style={{ transform: "translateZ(56px)" }}
                >
                    <div className="flex items-center justify-between mb-5">
                        <h3 className="font-bold text-sm text-text-primary">Cartera activa</h3>
                        <span className="text-[10px] text-text-tertiary border border-border-default px-2 py-0.5 rounded-full">
                            Vista previa
                        </span>
                    </div>
                    <div className="flex flex-col gap-2.5">
                        {rows.map((r, i) => (
                            <div key={i} className="flex items-center justify-between rounded-xl bg-surface-hover px-3 py-2.5">
                                <span className="text-sm text-text-secondary truncate flex-1 min-w-0">{r.name}</span>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <span className="text-sm font-semibold font-mono text-text-primary">{r.amount}</span>
                                    <span
                                        className="text-[10px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap"
                                        style={{ color: r.color, background: r.bg }}
                                    >
                                        {r.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
