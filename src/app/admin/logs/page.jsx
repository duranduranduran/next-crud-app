"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";

const EVENT_LABELS = {
    STATUS_CHANGED:      { label: "Estado cambiado",      color: "var(--color-neutral-event)", bg: "var(--color-neutral-event-bg)" },
    NOTE_ADDED:          { label: "Nota agregada",         color: "var(--color-accent)", bg: "var(--color-accent-bg)" },
    NOTE_DELETED:        { label: "Nota eliminada",        color: "var(--color-danger)", bg: "var(--color-danger-bg)" },
    DEBTOR_CREATED:      { label: "Deudor creado",         color: "var(--color-success)", bg: "var(--color-success-bg)" },
    DEBTOR_DELETED:      { label: "Deudor eliminado",      color: "var(--color-danger)", bg: "var(--color-danger-bg)" },
    REMINDER_SENT:       { label: "Recordatorio enviado",  color: "var(--color-info)", bg: "var(--color-info-bg)" },
    CALL_TRIGGERED:      { label: "Llamada realizada",     color: "var(--color-info)", bg: "var(--color-info-bg)" },
    BULK_STATUS_CHANGED: { label: "Estado masivo",         color: "var(--color-neutral-event)", bg: "var(--color-neutral-event-bg)" },
    NOTIFICATION_SENT:   { label: "Notificación enviada",  color: "var(--color-accent)", bg: "var(--color-accent-bg)" },
    LEGAL_NOTICE_SENT:   { label: "Aviso legal enviado",   color: "var(--color-danger)", bg: "var(--color-danger-bg)" },
};

const EVENT_FILTERS = [
    "All",
    "STATUS_CHANGED",
    "NOTE_ADDED",
    "NOTE_DELETED",
    "DEBTOR_CREATED",
    "DEBTOR_DELETED",
    "REMINDER_SENT",
    "CALL_TRIGGERED",
    "BULK_STATUS_CHANGED",
    "NOTIFICATION_SENT",
    "LEGAL_NOTICE_SENT",
];

function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleString("es-EC", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export default function LogsPage() {
    const { user, isLoaded } = useUser();
    const router = useRouter();

    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [eventFilter, setEventFilter] = useState("All");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [userFilter, setUserFilter] = useState("ALL");
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    useEffect(() => {
        if (!isLoaded) return;
        if (!user) { router.push("/sign-in"); return; }
        if (user.publicMetadata?.role !== "admin") { router.push("/client"); return; }
    }, [isLoaded, user, router]);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const res = await fetch("/api/admin/logs", { credentials: "include" });
                if (!res.ok) throw new Error("Error al cargar logs");
                const data = await res.json();
                setLogs(data);
            } catch (err) {
                console.error(err);
                setError("Error al cargar el registro de actividad.");
            } finally {
                setLoading(false);
            }
        };
        if (isLoaded && user) fetchLogs();
    }, [isLoaded, user]);

    const uniqueUsers = useMemo(() => {
        const seen = new Set();
        return logs
            .filter(l => l.user)
            .filter(l => {
                const key = l.user.name || l.user.email;
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
            })
            .map(l => ({ label: l.user.name || l.user.email, value: l.user.name || l.user.email }));
    }, [logs]);

    const filteredLogs = logs.filter((log) => {
        const matchesSearch =
            log.detail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.debtor?.name?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesEvent = eventFilter === "All" || log.event === eventFilter;

        const matchesUser = userFilter === "ALL" ||
            log.user?.name === userFilter ||
            log.user?.email === userFilter;

        const logDate = new Date(log.createdAt);
        const matchesFrom = !dateFrom || logDate >= new Date(dateFrom);
        const matchesTo = !dateTo || logDate <= new Date(dateTo + "T23:59:59");

        return matchesSearch && matchesEvent && matchesUser && matchesFrom && matchesTo;
    });

    const totalPages = Math.max(1, Math.ceil(filteredLogs.length / ITEMS_PER_PAGE));
    const paginatedLogs = filteredLogs.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const stats = {
        total: filteredLogs.length,
        calls: filteredLogs.filter(l => l.event === "CALL_TRIGGERED").length,
        reminders: filteredLogs.filter(l => l.event === "REMINDER_SENT").length,
        statusChanges: filteredLogs.filter(l => l.event === "STATUS_CHANGED" || l.event === "BULK_STATUS_CHANGED").length,
        notes: filteredLogs.filter(l => l.event === "NOTE_ADDED").length,
    };

    const hasActiveFilters = dateFrom || dateTo || userFilter !== "ALL" || searchTerm || eventFilter !== "All";

    const clearFilters = () => {
        setDateFrom("");
        setDateTo("");
        setUserFilter("ALL");
        setSearchTerm("");
        setEventFilter("All");
        setCurrentPage(1);
    };

    const handleExportLogsExcel = () => {
        import("xlsx").then(XLSX => {
            const rows = filteredLogs.map(log => ({
                "Fecha": new Date(log.createdAt).toLocaleString("es-EC"),
                "Evento": EVENT_LABELS[log.event]?.label || log.event,
                "Detalle": log.detail,
                "Usuario": log.user?.name || log.user?.email || "Sistema",
                "Deudor": log.debtor?.name || "—",
            }));
            const ws = XLSX.utils.json_to_sheet(rows);
            ws["!cols"] = [{ wch: 20 }, { wch: 22 }, { wch: 50 }, { wch: 20 }, { wch: 20 }];
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Actividad");
            XLSX.writeFile(wb, `actividad_${new Date().toISOString().split("T")[0]}.xlsx`);
        });
    };

    const handleExportLogsPDF = async () => {
        const { default: jsPDF } = await import("jspdf");
        const { default: autoTable } = await import("jspdf-autotable");

        const doc = new jsPDF({ orientation: "landscape" });
        doc.setFontSize(16);
        doc.setTextColor(68, 60, 163);
        doc.text("Recupera — Registro de Actividad", 14, 16);
        doc.setFontSize(10);
        doc.setTextColor(120, 120, 120);
        doc.text(`Generado: ${new Date().toLocaleString("es-EC")}`, 14, 23);
        if (dateFrom || dateTo) {
            doc.text(`Período: ${dateFrom || "—"} → ${dateTo || "—"}`, 14, 29);
        }

        autoTable(doc, {
            startY: dateFrom || dateTo ? 34 : 28,
            head: [["Fecha", "Evento", "Detalle", "Usuario", "Deudor"]],
            body: filteredLogs.map(log => [
                new Date(log.createdAt).toLocaleString("es-EC"),
                EVENT_LABELS[log.event]?.label || log.event,
                log.detail,
                log.user?.name || log.user?.email || "Sistema",
                log.debtor?.name || "—",
            ]),
            headStyles: { fillColor: [68, 60, 163], textColor: 255, fontSize: 9 },
            bodyStyles: { fontSize: 8 },
            alternateRowStyles: { fillColor: [247, 248, 255] },
            columnStyles: { 2: { cellWidth: 80 } },
        });

        doc.save(`actividad_${new Date().toISOString().split("T")[0]}.pdf`);
    };

    if (loading) return (
        <div data-density="compact" className="min-h-screen bg-surface-page flex items-center justify-center">
            <div className="text-center">
                <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-sm text-accent/50">Cargando...</p>
            </div>
        </div>
    );

    if (error) return (
        <div className="min-h-screen bg-surface-page flex items-center justify-center">
            <p className="text-danger text-sm">{error}</p>
        </div>
    );

    return (
        <main data-density="compact" className="min-h-screen bg-surface-page px-8 py-8">

            {/* Header */}
            <div className="flex justify-between items-center bg-surface-raised px-6 py-4 rounded-2xl shadow-sm border border-border-subtle mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">Registro de Actividad</h1>
                    <p className="text-sm text-text-tertiary mt-0.5">Historial completo de todas las acciones del sistema y usuarios</p>
                </div>
                <div className="flex items-center gap-3">

                    <button onClick={handleExportLogsExcel}
                            className="border border-border-default text-text-secondary px-3 py-2 rounded-xl text-xs font-medium hover:bg-accent hover:text-surface-page hover:border-accent transition">
                        ⬇ Excel
                    </button>
                    <button onClick={handleExportLogsPDF}
                            className="border border-border-default text-text-secondary px-3 py-2 rounded-xl text-xs font-medium hover:bg-accent hover:text-surface-page hover:border-accent transition">
                        ⬇ PDF
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                {[
                    { label: "Total Eventos", value: stats.total, color: "text-text-primary" },
                    { label: "Llamadas Realizadas", value: stats.calls, color: "text-info" },
                    { label: "Recordatorios Enviados", value: stats.reminders, color: "text-info" },
                    { label: "Cambios de Estado", value: stats.statusChanges, color: "text-neutral-event" },
                    { label: "Notas Agregadas", value: stats.notes, color: "text-accent" },
                ].map((s, i) => (
                    <div key={i} className="bg-surface-raised rounded-2xl shadow-sm border border-border-subtle p-5 hover:shadow-md transition-all">
                        <p className="text-xs text-text-tertiary uppercase tracking-wide mb-2">{s.label}</p>
                        <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <section className="bg-surface-raised rounded-2xl shadow-sm border border-border-subtle p-4 mb-6">

                {/* Row 1 — search, dates, user, clear */}
                <div className="flex flex-wrap gap-3 items-center">
                    <input
                        type="text"
                        placeholder="Buscar detalle, deudor o usuario..."
                        value={searchTerm}
                        onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                        className="border border-border-default rounded-xl px-4 py-2 text-sm text-text-secondary focus:outline-none focus:border-accent flex-1 min-w-[200px]"
                    />

                    <div className="flex items-center gap-2">
                        <span className="text-xs text-text-tertiary whitespace-nowrap">Desde</span>
                        <input
                            type="date"
                            value={dateFrom}
                            onChange={e => { setDateFrom(e.target.value); setCurrentPage(1); }}
                            className="border border-border-default rounded-xl px-3 py-2 text-sm text-text-secondary focus:outline-none focus:border-accent"
                        />
                        <span className="text-xs text-text-tertiary whitespace-nowrap">Hasta</span>
                        <input
                            type="date"
                            value={dateTo}
                            onChange={e => { setDateTo(e.target.value); setCurrentPage(1); }}
                            className="border border-border-default rounded-xl px-3 py-2 text-sm text-text-secondary focus:outline-none focus:border-accent"
                        />
                    </div>

                    <select
                        value={userFilter}
                        onChange={e => { setUserFilter(e.target.value); setCurrentPage(1); }}
                        className="border border-border-default rounded-xl px-4 py-2 text-sm text-text-secondary focus:outline-none focus:border-accent"
                    >
                        <option value="ALL">Todos los usuarios</option>
                        {uniqueUsers.map((u, i) => (
                            <option key={i} value={u.value}>{u.label}</option>
                        ))}
                    </select>

                    {hasActiveFilters && (
                        <button
                            onClick={clearFilters}
                            className="text-xs text-danger border border-danger/25 px-3 py-2 rounded-xl hover:bg-danger-bg transition whitespace-nowrap"
                        >
                            ✕ Limpiar filtros
                        </button>
                    )}
                </div>

                {/* Row 2 — event type pills */}
                <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-border-subtle">
                    {EVENT_FILTERS.map(f => (
                        <button
                            key={f}
                            onClick={() => { setEventFilter(f); setCurrentPage(1); }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                                eventFilter === f
                                    ? "bg-accent text-surface-page shadow-sm"
                                    : "bg-surface-hover text-text-secondary border border-border-default hover:border-accent/30 hover:text-accent"
                            }`}
                        >
                            {f === "All" ? "Todos los eventos" : EVENT_LABELS[f]?.label || f}
                        </button>
                    ))}
                </div>
            </section>

            {/* Table */}
            <section className="bg-surface-raised rounded-2xl shadow-sm border border-border-subtle overflow-hidden mb-6">
                <div className="grid grid-cols-[160px_160px_1fr_150px] px-6 py-3 border-b border-border-subtle bg-surface-hover">
                    <span className="text-xs font-medium text-text-tertiary uppercase tracking-wide">Fecha y Hora</span>
                    <span className="text-xs font-medium text-text-tertiary uppercase tracking-wide">Evento</span>
                    <span className="text-xs font-medium text-text-tertiary uppercase tracking-wide">Detalle</span>
                    <span className="text-xs font-medium text-text-tertiary uppercase tracking-wide">Usuario</span>
                </div>

                {paginatedLogs.length === 0 ? (
                    <div className="text-center py-20 text-text-tertiary">
                        <p className="text-4xl mb-3">📋</p>
                        <p className="text-sm">No se encontraron registros</p>
                        {hasActiveFilters && (
                            <button onClick={clearFilters} className="mt-3 text-xs text-accent underline">
                                Limpiar filtros
                            </button>
                        )}
                    </div>
                ) : (
                    paginatedLogs.map((log, i) => {
                        const meta = EVENT_LABELS[log.event] || { label: log.event, color: "var(--color-accent)", bg: "var(--color-accent-bg)" };
                        return (
                            <div
                                key={log.id}
                                className={`grid grid-cols-[160px_160px_1fr_150px] px-6 py-4 border-b border-border-subtle items-center hover:bg-surface-hover/50 transition-colors ${
                                    i % 2 === 1 ? "bg-surface-hover/30" : ""
                                }`}
                            >
                                <span className="text-xs text-text-tertiary font-mono">{formatDate(log.createdAt)}</span>
                                <div>
                                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full inline-block"
                                          style={{ color: meta.color, background: meta.bg }}>
                                        {meta.label}
                                    </span>
                                </div>
                                <span className="text-sm text-text-secondary px-4 overflow-hidden text-ellipsis whitespace-nowrap">
                                    {log.detail}
                                </span>
                                <span className="text-xs text-text-tertiary truncate">
                                    {log.user?.name || log.user?.email || "Sistema"}
                                </span>
                            </div>
                        );
                    })
                )}
            </section>

            {/* Pagination */}
            <div className="flex items-center justify-between">
                <p className="text-xs text-text-tertiary">
                    Mostrando {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, filteredLogs.length)}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredLogs.length)} de {filteredLogs.length} registros
                </p>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-4 py-2 border border-border-default rounded-xl text-sm text-text-secondary hover:bg-accent hover:text-surface-page hover:border-accent transition disabled:opacity-30"
                    >
                        ← Anterior
                    </button>
                    <span className="text-sm text-text-tertiary">Página {currentPage} de {totalPages}</span>
                    <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 border border-border-default rounded-xl text-sm text-text-secondary hover:bg-accent hover:text-surface-page hover:border-accent transition disabled:opacity-30"
                    >
                        Siguiente →
                    </button>
                </div>
            </div>

        </main>
    );
}
