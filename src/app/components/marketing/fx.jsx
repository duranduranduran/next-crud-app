'use client';

// Shared GSAP/ScrollTrigger primitives for the marketing pages.
//
// - ScrollTrigger (and SplitText) are registered lazily, inside an effect,
//   guarded by a module-level flag — never at module scope (they touch
//   `window`/the DOM, neither of which exists during Next's server render
//   of this file).
// - Every animated component uses gsap.context() scoped to its own DOM
//   node and reverts it on unmount/dep-change, so navigating between
//   marketing pages never leaves a dead ScrollTrigger watching a detached
//   element.
// - Every component checks prefers-reduced-motion and, when it's set,
//   skips the GSAP call entirely rather than animating opacity from 0 —
//   the elements' default (unset) opacity is 1, so "skip the animation"
//   IS the fully-visible fallback, not a separate code path that could
//   drift out of sync with it.
// - Pin and horizontal-scroll components additionally gate on viewport
//   width (checked live, via resize listener) — those two techniques are
//   the ones that break on small screens, so below their breakpoint they
//   render the plain, fully-visible, non-pinned fallback instead of a
//   half-working pin.

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

let scrollTriggerRegistered = false;
export function ensureScrollTrigger() {
    if (scrollTriggerRegistered) return;
    gsap.registerPlugin(ScrollTrigger);
    scrollTriggerRegistered = true;
}

let splitTextRegistered = false;
function ensureSplitText() {
    if (splitTextRegistered) return;
    gsap.registerPlugin(SplitText);
    splitTextRegistered = true;
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

// Tracks whether the viewport is at least `minWidth` wide, live (resize-
// aware). Used to gate pin/horizontal-scroll techniques off below the
// width they were actually tested at, per the brief: disable rather than
// ship broken on small screens.
export function useMinWidth(minWidth) {
    const [ok, setOk] = useState(false);
    useEffect(() => {
        const check = () => setOk(window.innerWidth >= minWidth);
        check();
        window.addEventListener("resize", check);
        return () => window.removeEventListener("resize", check);
    }, [minWidth]);
    return ok;
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

// Batched scroll reveal for many similar elements (a grid of plan cards, a
// values grid) — ONE ScrollTrigger watching all of them via
// ScrollTrigger.batch, instead of Reveal's approach of one trigger per
// instance. Cheaper at scale and groups near-simultaneous entries into a
// single staggered batch rather than firing N independent callbacks.
// Usage: give a ref to the container and a data-attribute selector for the
// items; each item keeps its own markup, this just drives their reveal.
export function useBatchReveal(containerRef, selector, { y = 24, stagger = 0.08 } = {}) {
    const reduced = usePrefersReducedMotion();
    useEffect(() => {
        if (reduced) return;
        const root = containerRef.current;
        if (!root) return;
        const targets = root.querySelectorAll(selector);
        if (!targets.length) return;
        ensureScrollTrigger();
        gsap.set(targets, { opacity: 0, y });
        const ctx = gsap.context(() => {
            ScrollTrigger.batch(targets, {
                start: "top 88%",
                once: true,
                onEnter: batch =>
                    gsap.to(batch, {
                        opacity: 1,
                        y: 0,
                        duration: 0.6,
                        ease: "power2.out",
                        stagger,
                        overwrite: true,
                    }),
            });
        }, root);
        return () => ctx.revert();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [reduced, selector, y, stagger]);
}

// Character-by-character reveal via real GSAP SplitText (ships free with
// core GSAP as of 3.13 — verified against the installed package before
// using it here, not assumed). Renders plain server-side text first — full
// text is in the DOM and readable before any JS runs or if it never does —
// then SplitText wraps each character client-side on mount and reverts
// that wrapping on unmount, so it never leaves stray markup behind across
// a navigation. Each char gets a small random rotation for texture, per
// the brief ("slight y and rotation per char").
//
// `text` is a string for natural CSS wrapping, or an array of strings for
// a HARD line break between them (rendered as real <br> tags) — needed
// wherever a headline's line break is a deliberate content choice rather
// than however the viewport happens to wrap it. SplitText still walks the
// full element and splits every text run into chars regardless of the
// <br> in between, so the stagger runs across both lines as one sequence.
export function SplitCharHeadline({ text, as: Tag = "h1", className = "" }) {
    const ref = useRef(null);
    const reduced = usePrefersReducedMotion();
    const lines = Array.isArray(text) ? text : [text];

    useEffect(() => {
        if (reduced) return;
        const el = ref.current;
        if (!el) return;
        ensureSplitText();
        let split;
        const ctx = gsap.context(() => {
            split = SplitText.create(el, { type: "chars", charsClass: "split-char" });
            gsap.fromTo(
                split.chars,
                { opacity: 0, y: 34, rotation: () => gsap.utils.random(-14, 14) },
                {
                    opacity: 1,
                    y: 0,
                    rotation: 0,
                    duration: 0.65,
                    ease: "back.out(1.6)",
                    stagger: 0.018,
                    delay: 0.1,
                }
            );
        }, el);
        return () => {
            ctx.revert();
            split?.revert();
        };
    }, [reduced]);

    return (
        <Tag ref={ref} className={className}>
            {lines.map((line, i) => (
                <span key={i}>
                    {line}
                    {i < lines.length - 1 && <br />}
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

// General numeric stat counter with optional prefix/suffix ("+92%",
// "100%"). Server-rendered children are the already-correct final text
// (prefix+value+suffix), so reduced-motion / pre-hydration / no-JS all
// show the right number without a separate fallback path.
export function CountUp({ value, prefix = "", suffix = "", duration = 1.4, className = "" }) {
    const ref = useRef(null);
    const reduced = usePrefersReducedMotion();

    useEffect(() => {
        if (reduced) return;
        const el = ref.current;
        if (!el) return;
        ensureScrollTrigger();
        const counter = { n: 0 };
        const ctx = gsap.context(() => {
            gsap.to(counter, {
                n: value,
                duration,
                ease: "power2.out",
                scrollTrigger: { trigger: el, start: "top 88%", once: true },
                onUpdate: () => {
                    el.textContent = `${prefix}${Math.round(counter.n)}${suffix}`;
                },
            });
        });
        return () => ctx.revert();
    }, [reduced, value, prefix, suffix, duration]);

    return (
        <span ref={ref} className={className}>
            {prefix}{value}{suffix}
        </span>
    );
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

// Magnetic hover: the element translates slightly toward the cursor while
// hovered, capped in range, spring-eased back to rest on leave. Attach the
// returned ref to a button/link.
export function useMagnetic(strength = 0.4, max = 14) {
    const ref = useRef(null);
    const reduced = usePrefersReducedMotion();

    useEffect(() => {
        if (reduced) return;
        const el = ref.current;
        if (!el) return;
        const xTo = gsap.quickTo(el, "x", { duration: 0.35, ease: "power3" });
        const yTo = gsap.quickTo(el, "y", { duration: 0.35, ease: "power3" });
        const onMove = e => {
            const rect = el.getBoundingClientRect();
            const relX = e.clientX - (rect.left + rect.width / 2);
            const relY = e.clientY - (rect.top + rect.height / 2);
            xTo(gsap.utils.clamp(-max, max, relX * strength));
            yTo(gsap.utils.clamp(-max, max, relY * strength));
        };
        const onLeave = () => {
            xTo(0);
            yTo(0);
        };
        el.addEventListener("mousemove", onMove);
        el.addEventListener("mouseleave", onLeave);
        return () => {
            el.removeEventListener("mousemove", onMove);
            el.removeEventListener("mouseleave", onLeave);
        };
    }, [reduced, strength, max]);

    return ref;
}

// Seamless GSAP marquee. Content is duplicated once so the loop can wrap
// from -50% back to 0 invisibly; reduced motion renders the list a single
// time (no duplicate) and skips the animation rather than leaving a
// visibly doubled, motionless strip. Decorative/reinforcing content only —
// aria-hidden, so it must never be the only place information appears.
export function Marquee({ items, speed = 60, className = "", itemClassName = "" }) {
    const trackRef = useRef(null);
    const reduced = usePrefersReducedMotion();

    useEffect(() => {
        if (reduced) return;
        const track = trackRef.current;
        if (!track) return;
        const ctx = gsap.context(() => {
            const width = track.scrollWidth / 2;
            gsap.fromTo(
                track,
                { x: 0 },
                { x: -width, duration: width / speed, ease: "none", repeat: -1 }
            );
        }, track);
        return () => ctx.revert();
    }, [reduced, speed]);

    const rendered = reduced ? items : [...items, ...items];

    return (
        <div className={`overflow-hidden ${className}`} aria-hidden="true">
            <div ref={trackRef} className="flex w-max">
                {rendered.map((item, i) => (
                    <span key={i} className={itemClassName}>
                        {item}
                    </span>
                ))}
            </div>
        </div>
    );
}

// Horizontal scroll driven by vertical scroll: pins the section and
// translates an inner track sideways as the user scrolls down through it.
// Gated on both prefers-reduced-motion AND a minimum viewport width — pin
// + horizontal-scroll is the technique that breaks on small screens
// (viewport-relative pin math, awkward touch-scroll interaction), so below
// minWidth it never creates the ScrollTrigger at all and the track falls
// back to a normal wrapping flex layout instead.
export function HorizontalPin({ children, className = "", trackClassName = "", minWidth = 1024 }) {
    const sectionRef = useRef(null);
    const trackRef = useRef(null);
    const reduced = usePrefersReducedMotion();
    const wide = useMinWidth(minWidth);
    const active = wide && !reduced;

    useEffect(() => {
        if (!active) return;
        const section = sectionRef.current;
        const track = trackRef.current;
        if (!section || !track) return;
        ensureScrollTrigger();
        const ctx = gsap.context(() => {
            const distance = Math.max(0, track.scrollWidth - section.clientWidth);
            if (distance <= 0) return;
            gsap.to(track, {
                x: -distance,
                ease: "none",
                scrollTrigger: {
                    trigger: section,
                    start: "top top",
                    end: () => `+=${distance}`,
                    scrub: 0.6,
                    pin: true,
                    pinSpacing: true,
                    invalidateOnRefresh: true,
                },
            });
        }, section);
        return () => ctx.revert();
    }, [active]);

    return (
        <div ref={sectionRef} className={`relative overflow-hidden ${className}`}>
            <div
                ref={trackRef}
                className={active ? `flex ${trackClassName}` : `flex flex-wrap ${trackClassName}`}
            >
                {children}
            </div>
        </div>
    );
}

// Pinned section whose active step advances as the user scrolls through
// it, rather than the whole section simply appearing — "content advances
// as you scroll" per the brief, distinct from HorizontalPin (which moves
// existing content sideways) in that this drives which CHILD is shown.
// Same small-screen/reduced-motion gate as HorizontalPin: below minWidth
// (or with reduced motion) it never pins, and instead stacks every step
// in normal document flow so all of it is reachable by plain scrolling.
// Default minWidth is 1024, not a smaller "tablet" width — this pins a
// full h-screen block, and plenty of phones exceed 768px WIDTH in
// landscape while having very little HEIGHT (a ~400px-tall viewport),
// exactly where a pinned h-screen section breaks worst. Width is a proxy
// for "probably has the height to spare too," which only holds once
// you're past phone-landscape territory.
export function PinnedAdvance({ steps, renderStep, className = "", minWidth = 1024, stepScrollPx = 420 }) {
    const sectionRef = useRef(null);
    const reduced = usePrefersReducedMotion();
    const wide = useMinWidth(minWidth);
    const active = wide && !reduced;
    const [index, setIndex] = useState(0);

    useEffect(() => {
        if (!active) return;
        const section = sectionRef.current;
        if (!section) return;
        ensureScrollTrigger();
        const ctx = gsap.context(() => {
            ScrollTrigger.create({
                trigger: section,
                start: "top top",
                end: () => `+=${steps.length * stepScrollPx}`,
                pin: true,
                pinSpacing: true,
                scrub: 0.4,
                invalidateOnRefresh: true,
                onUpdate: self => {
                    const idx = Math.min(steps.length - 1, Math.floor(self.progress * steps.length));
                    setIndex(idx);
                },
            });
        }, section);
        return () => ctx.revert();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [active, steps.length, stepScrollPx]);

    if (!active) {
        return (
            <div className={className}>
                <div className="flex flex-col gap-16">
                    {steps.map((step, i) => (
                        <div key={i}>{renderStep(step, i, i)}</div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div ref={sectionRef} className={`relative h-screen flex items-center ${className}`}>
            <div className="w-full">{renderStep(steps[index], index, index)}</div>
        </div>
    );
}
