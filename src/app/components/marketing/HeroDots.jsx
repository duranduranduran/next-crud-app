'use client';

import { useEffect, useState } from "react";
import { usePrefersReducedMotion } from "./fx";

// The old auth pages' ambient particle field, brought back for the landing
// hero: a scatter of small dots at low opacity. bg-accent is the theme-
// scoped token (near-black in light, near-white in dark), so the dots
// automatically read correctly in both themes with no per-theme branching.
//
// Positions are randomized client-side only (useEffect, not useMemo at
// render time) — Math.random() during SSR would produce different values
// server vs. client and trigger a hydration mismatch on every dot.
// Starting from an empty array means the very first paint has no dots,
// which is invisible in practice (they're 4px and 12% opacity) and avoids
// that mismatch entirely rather than papering over it.
const DOT_COUNT = 30;

export default function HeroDots({ className = "" }) {
    const [dots, setDots] = useState([]);
    const reduced = usePrefersReducedMotion();

    useEffect(() => {
        setDots(
            Array.from({ length: DOT_COUNT }, () => ({
                top: Math.random() * 100,
                left: Math.random() * 100,
                variant: Math.random() < 0.5 ? "drift-a" : "drift-b",
                duration: 6 + Math.random() * 3,
                delay: Math.random() * -6,
            }))
        );
    }, []);

    return (
        <div
            className={`absolute inset-0 opacity-[0.12] pointer-events-none overflow-hidden ${className}`}
            aria-hidden="true"
        >
            {dots.map((d, i) => (
                <span
                    key={i}
                    className={`absolute w-1 h-1 bg-accent ${reduced ? "" : d.variant}`}
                    style={{
                        top: `${d.top}%`,
                        left: `${d.left}%`,
                        animationDuration: reduced ? undefined : `${d.duration}s`,
                        animationDelay: reduced ? undefined : `${d.delay}s`,
                    }}
                />
            ))}
            <style jsx>{`
                .drift-a {
                    animation-name: heroDotDriftA;
                    animation-timing-function: ease-in-out;
                    animation-iteration-count: infinite;
                }
                .drift-b {
                    animation-name: heroDotDriftB;
                    animation-timing-function: ease-in-out;
                    animation-iteration-count: infinite;
                }
                @keyframes heroDotDriftA {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-14px); }
                }
                @keyframes heroDotDriftB {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(14px); }
                }
            `}</style>
        </div>
    );
}
