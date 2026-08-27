// Shared across every /client/* route. Underscore-prefixed folder so
// Next's App Router ignores it as a route segment.

export const STATUS_COLORS = {
    PENDIENTE: { color: "var(--color-status-pendiente)", bg: "var(--color-status-pendiente-bg)", label: "Pendiente" },
    EN_GESTION: { color: "var(--color-status-en-gestion)", bg: "var(--color-status-en-gestion-bg)", label: "En Gestión" },
    ACUERDO_DE_PAGO: { color: "var(--color-status-acuerdo-de-pago)", bg: "var(--color-status-acuerdo-de-pago-bg)", label: "Acuerdo de Pago" },
    PAGADO: { color: "var(--color-status-pagado)", bg: "var(--color-status-pagado-bg)", label: "Pagado" },
    ESCALADO_JUDICIAL: { color: "var(--color-status-escalado-judicial)", bg: "var(--color-status-escalado-judicial-bg)", label: "Escalado Judicial" },
};

export function StatusBadge({ status }) {
    const meta = STATUS_COLORS[status] || { color: "var(--color-accent)", bg: "var(--color-accent-bg)", label: status };
    return (
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{ color: meta.color, background: meta.bg }}>
            {meta.label}
        </span>
    );
}

// Kept genuinely short (not STATUS_COLORS' label truncated) so the
// fixed-width column below stays narrow — "Judicial" reads fine alone
// without "Escalado" in front of it in a peek row this tight.
const SHORT_STATUS_LABELS = {
    PENDIENTE: "Pendiente",
    EN_GESTION: "En gestion",
    ACUERDO_DE_PAGO: "Acuerdo",
    PAGADO: "Pagado",
    ESCALADO_JUDICIAL: "Judicial",
};

// Scannable status signal for the card stack's peek row — colored TEXT,
// not a pill, since the badge's padding costs space the strip doesn't
// have. Fixed width (matches admin/page.jsx's StatusLabel column) so
// labels of different lengths don't jitter the amount column as you scan
// down a stack. The full StatusBadge stays in the hover-revealed detail.
export function StatusLabel({ status }) {
    const meta = STATUS_COLORS[status];
    const label = SHORT_STATUS_LABELS[status] || meta?.label || status;
    return (
        <span
            className="text-[11px] font-medium truncate flex-shrink-0"
            style={{ color: meta?.color || "var(--color-accent)", width: "4rem" }}
        >
            {label}
        </span>
    );
}

export function FormField({ icon, children }) {
    return (
        <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-accent/8 flex items-center justify-center flex-shrink-0 mt-0.5 text-base">
                {icon}
            </div>
            <div className="flex-1">{children}</div>
        </div>
    );
}

export function exportDebtorsExcel(debtors, XLSX) {
    const rows = debtors.map(d => ({
        Nombre: d.name, Email: d.email || "", Teléfono: d.telephone || "",
        Cédula: d.cedulaIdentidad, RUC: d.ruc || "", "N° Factura": d.invoiceNumber || "",
        Monto: d.amountOwed, Estado: d.status,
        Creado: new Date(d.createdAt).toLocaleDateString("es-EC"),
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Deudores");
    XLSX.writeFile(wb, "mis_deudores.xlsx");
}
