import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

// Server Component, no "use client" — no auth (see middleware.js: plain
// clerkMiddleware() with no createRouteMatcher/protect() call, so nothing
// blocks this route; confirmed, not assumed). A debtor opens this from an
// SMS link on their phone, so: forced light theme regardless of their
// device's stored/system preference (data-theme="light" on a wrapper div —
// tokens.css scopes the theme blocks to the bare [data-theme] attribute,
// not html[data-theme], so this overrides the root layout's choice for
// every element inside it without touching <html> or needing client JS),
// and deliberately no data-density="compact" — this needs large, readable
// type on a small screen, not the admin app's dense scale.
export async function generateMetadata({ params }) {
    const { token } = await params;
    const debtor = await prisma.debtor.findUnique({
        where: { publicToken: token },
        select: { name: true },
    });
    return { title: debtor ? `Recupera — ${debtor.name}` : "Recupera" };
}

export default async function PublicDebtorPage({ params }) {
    const { token } = await params;

    const debtor = await prisma.debtor.findUnique({
        where: { publicToken: token },
        select: {
            name: true,
            amountOwed: true,
            invoiceNumber: true,
            // Deliberately NOT selected: cedulaIdentidad, ruc, status, notes,
            // activityLogs — none of that belongs on a page reachable by
            // anyone with the link. Only what's needed to identify the debt
            // and let the debtor act on it.
            user: { select: { name: true, email: true } },
        },
    });

    // 404, not a "token invalid" error page — the latter would leak whether
    // a given token exists at all, which is itself information disclosure
    // on an unauthenticated route.
    if (!debtor) notFound();

    const amount = Number(debtor.amountOwed).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const creditorName = debtor.user?.name || "el acreedor";

    return (
        <div data-theme="light" className="min-h-screen bg-surface-page flex items-center justify-center px-6 py-12">
            <div className="w-full max-w-md">

                <div className="text-center mb-8">
                    <p className="text-sm font-semibold tracking-widest text-accent/50 uppercase">Recupera</p>
                </div>

                <div className="bg-surface-raised border border-border-subtle rounded-3xl shadow-sm p-8 text-center">
                    <p className="text-base text-text-secondary mb-1">Hola {debtor.name},</p>
                    <p className="text-base text-text-secondary mb-6">
                        tiene un saldo pendiente con <span className="font-semibold text-text-primary">{creditorName}</span>
                    </p>

                    <div className="bg-accent rounded-2xl px-6 py-8 mb-6">
                        <p className="text-xs font-medium text-surface-page/60 uppercase tracking-widest mb-2">Monto adeudado</p>
                        <p className="text-5xl font-extrabold text-surface-page">${amount}</p>
                    </div>

                    {debtor.invoiceNumber && (
                        <p className="text-sm text-text-tertiary mb-6">N° de factura: <span className="font-medium text-text-secondary">{debtor.invoiceNumber}</span></p>
                    )}

                    <div className="border-t border-border-subtle pt-6">
                        <p className="text-sm font-semibold text-text-primary mb-2">Para regularizar su situación</p>
                        {debtor.user?.email ? (
                            <p className="text-sm text-text-secondary">
                                Contacte a {creditorName} escribiendo a{" "}
                                <a href={`mailto:${debtor.user.email}`} className="text-accent font-medium underline underline-offset-2">
                                    {debtor.user.email}
                                </a>
                            </p>
                        ) : (
                            <p className="text-sm text-text-secondary">
                                Contacte a {creditorName} para coordinar su pago.
                            </p>
                        )}
                    </div>
                </div>

                <p className="text-center text-xs text-text-tertiary mt-6">
                    Este enlace es personal — no lo comparta con terceros.
                </p>
            </div>
        </div>
    );
}
