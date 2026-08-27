'use client';

// Shared GSAP/ScrollTrigger primitives for the marketing pages.
//
// - ScrollTrigger is registered lazily, inside an effect, guarded by a
//   module-level flag — never at module scope (it touches `window`, which
//   doesn't exist during Next's server render of this file).
// - Every animated component uses gsap.context() scoped to its own DOM
//   node and reverts it on unmount/dep-change, so navigating between
//   marketing pages never leaves a dead ScrollTrigger watching a detached
//   element.
// - Every component checks prefers-reduced-motion and, when it's set,
//   skips the GSAP call entirely rather than animating opacity from 0 —
//   the elements' default (unset) opacity is 1, so "skip the animation"
//   IS the fully-visible fallback, not a separate code path that could
//   drift out of sync with it.

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

let scrollTriggerRegistered = false;
function ensureScrollTrigger() {
    if (scrollTriggerRegistered) return;
    gsap.registerPlugin(ScrollTrigger);
    scrollTriggerRegistered = true;
}

export function usePrefersReducedMotion() {
    const [reduced, setReduced] = useState(false);
    useEffect(() => {
        let mq;
        try {
            mq = window.matchMedia("(prefers-reduced-motion: reduce)");
        } catch {
            return;
        }
        setReduced(mq.matches);
        const onChange = () => setReduced(mq.matches);
        mq.addEventListener?.("change", onChange);
        return () => mq.removeEventListener?.("change", onChange);
    }, []);
    return reduced;
}

// Fonts and images both resize content after first paint — a ScrollTrigger
// computed before either has settled fires at the wrong scroll position.
// Call once, high up in the marketing shell.
export function useScrollTriggerRefresh() {
    useEffect(() => {
        ensureScrollTrigger();
        const refresh = () => ScrollTrigger.refresh();
        document.fonts?.ready?.then(refresh).catch(() => {});
        window.addEventListener("load", refresh);
        const pending = Array.from(document.images).filter(img => !img.complete);
        pending.forEach(img => img.addEventListener("load", refresh, { once: true }));
        return () => window.removeEventListener("load", refresh);
    }, []);
}

// Fade + translateY reveal on scroll. Pass `stagger` to animate direct
// children individually (e.g. a grid of cards) instead of the wrapper as
// one unit.
export function Reveal({
    children,
    as: Tag = "div",
    stagger = 0,
    y = 24,
    duration = 0.7,
    className = "",
    ...props
}) {
    const ref = useRef(null);
    const reduced = usePrefersReducedMotion();

    useEffect(() => {
        if (reduced) return;
        const el = ref.current;
        if (!el) return;
        ensureScrollTrigger();
        const targets = stagger ? Array.from(el.children) : el;
        const ctx = gsap.context(() => {
            gsap.fromTo(
                targets,
                { opacity: 0, y },
                {
                    opacity: 1,
                    y: 0,
                    duration,
                    ease: "power2.out",
                    stagger: stagger || 0,
                    scrollTrigger: { trigger: el, start: "top 85%", once: true },
                }
            );
        }, el);
        return () => ctx.revert();
    }, [reduced, stagger, y, duration]);

    return (
        <Tag ref={ref} className={className} {...props}>
            {children}
        </Tag>
    );
}

// Hero headline: words stagger in on mount (not scroll-triggered — it's
// above the fold on load). Splits on spaces and re-joins with real space
// text nodes (not  ) so the browser can still wrap the line normally.
export function SplitHeadline({ text, as: Tag = "h1", className = "" }) {
    const ref = useRef(null);
    const reduced = usePrefersReducedMotion();
    const words = text.split(" ");

    useEffect(() => {
        if (reduced) return;
        const el = ref.current;
        if (!el) return;
        const targets = el.querySelectorAll("[data-word]");
        const ctx = gsap.context(() => {
            gsap.fromTo(
                targets,
                { opacity: 0, y: 28 },
                { opacity: 1, y: 0, duration: 0.8, ease: "power3.out", stagger: 0.055, delay: 0.1 }
            );
        }, el);
        return () => ctx.revert();
    }, [reduced]);

    return (
        <Tag ref={ref} className={className}>
            {words.map((w, i) => (
                <span key={i}>
                    <span data-word className="inline-block">{w}</span>
                    {i < words.length - 1 ? " " : ""}
                </span>
            ))}
        </Tag>
    );
}

// Section number ("01", "02"...) counts up from 0 as it scrolls into view.
// With reduced motion (or before JS runs), it's just the static text
// already in the DOM — no separate fallback markup to keep in sync.
export function SectionNumber({ value, className = "" }) {
    const ref = useRef(null);
    const reduced = usePrefersReducedMotion();
    const target = parseInt(value, 10);

    useEffect(() => {
        if (reduced) return;
        const el = ref.current;
        if (!el || Number.isNaN(target)) return;
        ensureScrollTrigger();
        const counter = { n: 0 };
        const ctx = gsap.context(() => {
            gsap.to(counter, {
                n: target,
                duration: 1,
                ease: "power1.out",
                scrollTrigger: { trigger: el, start: "top 85%", once: true },
                onUpdate: () => {
                    el.textContent = String(Math.round(counter.n)).padStart(2, "0");
                },
            });
        });
        return () => ctx.revert();
    }, [reduced, target]);

    return <span ref={ref} className={className}>{value}</span>;
}

// One-off parallax wrapper — used exactly once (hero background element).
// Scrubbed to scroll position rather than time-based, so it can't run
// while off-screen or drift out of sync with where the user actually is.
export function Parallax({ children, speed = 0.25, className = "" }) {
    const ref = useRef(null);
    const reduced = usePrefersReducedMotion();

    useEffect(() => {
        if (reduced) return;
        const el = ref.current;
        if (!el) return;
        ensureScrollTrigger();
        const ctx = gsap.context(() => {
            gsap.to(el, {
                yPercent: speed * 100,
                ease: "none",
                scrollTrigger: {
                    trigger: el.parentElement || el,
                    start: "top bottom",
                    end: "bottom top",
                    scrub: true,
                },
            });
        });
        return () => ctx.revert();
    }, [reduced, speed]);

    return (
        <div ref={ref} className={className}>
            {children}
        </div>
    );
}
