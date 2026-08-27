'use client';

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { usePrefersReducedMotion, ensureScrollTrigger } from "./fx";

// Retro window-chrome card: hard border, title bar with a double rule and
// a glyph at each end, offset zero-blur shadow. The shadow is a real
// separate DOM layer (not the CSS box-shadow used by tokens.css's static
// .frame-box/.frame-box-sm classes) specifically so it can be animated by
// transform — box-shadow itself doesn't tween reliably, translating a
// same-sized layer behind the box does.
//
// "Assembles on entry": border+box scale/fade in, then the shadow layer
// translates out from fully-hidden-behind-the-box to its resting 6px
// offset, then the content fades in — three GSAP timeline steps with
// small overlaps so it reads as one choreographed beat, not three
// separate pops. Reduced motion returns before any gsap.set() runs, so
// nothing is ever left at opacity:0 as a resting state — the box, shadow,
// and content just render at their normal (fully visible) styles.
export default function WindowBox({
    title,
    children,
    className = "",
    boxClassName = "bg-surface-raised",
    contentClassName = "",
    padded = true,
}) {
    const rootRef = useRef(null);
    const shadowRef = useRef(null);
    const boxRef = useRef(null);
    const contentRef = useRef(null);
    const reduced = usePrefersReducedMotion();

    useEffect(() => {
        if (reduced) return;
        const root = rootRef.current;
        const shadow = shadowRef.current;
        const box = boxRef.current;
        const content = contentRef.current;
        if (!root || !shadow || !box) return;
        ensureScrollTrigger();

        gsap.set(shadow, { x: 0, y: 0 });
        gsap.set(box, { scale: 0.96, opacity: 0 });
        if (content) gsap.set(content, { opacity: 0, y: 10 });

        const ctx = gsap.context(() => {
            const tl = gsap.timeline({
                scrollTrigger: { trigger: root, start: "top 88%", once: true },
            });
            tl.to(box, { scale: 1, opacity: 1, duration: 0.35, ease: "power2.out" })
                .to(shadow, { x: 6, y: 6, duration: 0.3, ease: "power2.out" }, "-=0.1")
                .to(content, { opacity: 1, y: 0, duration: 0.35, ease: "power2.out" }, "-=0.15");
        }, root);
        return () => ctx.revert();
    }, [reduced]);

    return (
        <div ref={rootRef} className={`relative ${className}`} style={{ paddingBottom: "6px", paddingRight: "6px" }}>
            <div
                ref={shadowRef}
                aria-hidden="true"
                className="absolute inset-0"
                style={{ background: "var(--color-frame-shadow)", borderRadius: "var(--radius-frame)" }}
            />
            <div
                ref={boxRef}
                className="relative bg-surface-raised"
                style={{ border: "1.5px solid var(--color-frame)", borderRadius: "var(--radius-frame)" }}
            >
                {/* Title bar always keeps the neutral surface-raised/
                    text-secondary pairing regardless of boxClassName below
                    — that combo is contrast-checked (7.2:1+ in both
                    themes). Letting boxClassName recolor it too would mean
                    a caller passing bg-accent silently makes the title bar
                    text unreadable (accent-fg is tuned for accent
                    backgrounds specifically, and text-secondary is tuned
                    for surface backgrounds — neither is safe on whatever
                    arbitrary color a caller might pass here). */}
                {title && (
                    <div className="px-3 pt-2">
                        <div className="flex items-center justify-between pb-2">
                            <span
                                aria-hidden="true"
                                className="w-4 h-4 flex items-center justify-center text-[9px] font-mono leading-none flex-shrink-0"
                                style={{ border: "1.5px solid var(--color-frame)" }}
                            >
                                ✕
                            </span>
                            <span className="text-[11px] font-mono uppercase tracking-widest text-text-secondary truncate px-2">
                                {title}
                            </span>
                            <span
                                aria-hidden="true"
                                className="w-4 h-4 flex items-center justify-center text-[9px] font-mono leading-none flex-shrink-0"
                                style={{ border: "1.5px solid var(--color-frame)" }}
                            >
                                ⧉
                            </span>
                        </div>
                        {/* Double rule */}
                        <div style={{ borderTop: "1.5px solid var(--color-frame)" }} />
                        <div className="mt-[3px]" style={{ borderTop: "1px solid var(--color-frame)", opacity: 0.55 }} />
                    </div>
                )}
                <div className={boxClassName}>
                    <div ref={contentRef} className={padded ? `p-6 ${contentClassName}` : contentClassName}>
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}

// Small flat-colored square with a letter — the "keyboard hint" chip next
// to nav items/CTAs. Purely decorative (this app has no real keybindings
// tied to these), so aria-hidden: a screen reader gets the surrounding
// link/button's own accessible name and nothing redundant on top of it.
export function KeyChip({ letter, tone = "mint", className = "" }) {
    const bgVar = tone === "yellow" ? "--color-brand-yellow" : "--color-brand-mint";
    const fgVar = tone === "yellow" ? "--color-brand-yellow-fg" : "--color-brand-mint-fg";
    return (
        <span
            aria-hidden="true"
            className={`inline-flex items-center justify-center w-5 h-5 text-[10px] font-mono font-bold flex-shrink-0 ${className}`}
            style={{
                background: `var(${bgVar})`,
                color: `var(${fgVar})`,
                borderRadius: "var(--radius-frame, 0px)",
            }}
        >
            {letter}
        </span>
    );
}
