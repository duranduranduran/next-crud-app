import { SectionNumber } from "./fx";

// The dottxt.ai-style structural device: a numbered index + small kicker
// label above every section headline. Numbering restarts at 01 on each
// page — it's a per-page structural rhythm, not a running total across
// the site.
export default function SectionHeading({ index, kicker, title, description, center = false, id }) {
    return (
        <div id={id} className={center ? "text-center" : ""}>
            <div className={`flex items-center gap-3 mb-4 ${center ? "justify-center" : ""}`}>
                {index && (
                    <SectionNumber
                        value={index}
                        className="text-sm font-mono text-text-tertiary tabular-nums"
                    />
                )}
                <span className="text-xs font-mono font-semibold tracking-[0.2em] uppercase text-text-tertiary">
                    {kicker}
                </span>
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-text-primary leading-tight tracking-tight">
                {title}
            </h2>
            {description && (
                <p className={`text-base md:text-lg text-text-secondary mt-4 leading-relaxed ${center ? "max-w-xl mx-auto" : "max-w-xl"}`}>
                    {description}
                </p>
            )}
        </div>
    );
}
