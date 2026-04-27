"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";

const EVENT_LABELS = {
    STATUS_CHANGED:      { label: "Estado cambiado",   color: "#F59E0B", bg: "#FEF3C7" },
    NOTE_ADDED:          { label: "Nota agregada",      color: "#443CA3", bg: "#EEEDFE" },
    NOTE_DELETED:        { label: "Nota eliminada",     color: "#EF4444", bg: "#FEE2E2" },
    DEBTOR_CREATED:      { label: "Deudor creado",      color: "#10B981", bg: "#D1FAE5" },
    DEBTOR_DELETED:      { label: "Deudor eliminado",   color: "#EF4444", bg: "#FEE2E2" },
    REMINDER_SENT:       { label: "Recordatorio enviado", color: "#0EA5E9", bg: "#E0F2FE" },
    CALL_TRIGGERED:      { label: "Llamada realizada",  color: "#8B5CF6", bg: "#EDE9FE" },
    BULK_STATUS_CHANGED: { label: "Estado masivo",      color: "#F59E0B", bg: "#FEF3C7" },
};

const EVENT_FILTERS = [
    "All", "STATUS_CHANGED", "NOTE_ADDED", "NOTE_DELETED",
    "DEBTOR_CREATED", "DEBTOR_DELETED", "REMINDER_SENT",
    "CALL_TRIGGERED", "BULK_STATUS_CHANGED",
];

function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleString("es-EC", {
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit",
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

    const filteredLogs = logs.filter((log) => {
        const matchesSearch =
            log.detail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.debtor?.name?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesEvent = eventFilter === "All" || log.event === eventFilter;
        return matchesSearch && matchesEvent;
    });

    const totalPages = Math.max(1, Math.ceil(filteredLogs.length / ITEMS_PER_PAGE));
    const paginatedLogs = filteredLogs.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const stats = {
        total: logs.length,
        calls: logs.filter(l => l.event === "CALL_TRIGGERED").length,
        reminders: logs.filter(l => l.event === "REMINDER_SENT").length,
        statusChanges: logs.filter(l => l.event === "STATUS_CHANGED" || l.event === "BULK_STATUS_CHANGED").length,
        notes: logs.filter(l => l.event === "NOTE_ADDED").length,
    };

    if (loading) return (
        <div className="min-h-screen bg-[#F7F8FF] flex items-center justify-center">
            <div className="text-center">
                <div className="w-8 h-8 border-2 border-[#443CA3] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-sm text-[#443CA3]/50">Cargando...</p>
            </div>
        </div>
    );

    if (error) return (
        <div className="min-h-screen bg-white flex items-center justify-center">
            <p className="text-red-500 text-sm">{error}</p>
        </div>
    );

    return (
        <main className="min-h-screen bg-gray-50 px-8 py-8">

            {/* Header */}
            <div className="flex justify-between items-center bg-white px-6 py-4 rounded-2xl shadow-sm border border-gray-100 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Registro de Actividad</h1>
                    <p className="text-sm text-gray-400 mt-0.5">Historial completo de todas las acciones del sistema y usuarios</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-[#21FE83] rounded-full animate-pulse"></div>
                    <span className="text-sm text-gray-400">En vivo</span>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                {[
                    { label: "Total Eventos", value: stats.total, color: "text-gray-700" },
                    { label: "Llamadas Realizadas", value: stats.calls, color: "text-[#8B5CF6]" },
                    { label: "Recordatorios Enviados", value: stats.reminders, color: "text-[#0EA5E9]" },
                    { label: "Cambios de Estado", value: stats.statusChanges, color: "text-[#F59E0B]" },
                    { label: "Notas Agregadas", value: stats.notes, color: "text-[#443CA3]" },
                ].map((s, i) => (
                    <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all">
                        <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">{s.label}</p>
                        <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
                <div className="flex flex-wrap gap-3 items-center">
                    <input
                        type="text"
                        placeholder="Buscar detalle, deudor o usuario..."
                        value={searchTerm}
                        onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                        className="border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-600 focus:outline-none focus:border-[#443CA3] flex-1 min-w-[200px]"
                    />
                    <div className="flex flex-wrap gap-2">
                        {EVENT_FILTERS.map(f => (
                            <button
                                key={f}
                                onClick={() => { setEventFilter(f); setCurrentPage(1); }}
                                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                                    eventFilter === f
                                        ? "bg-[#443CA3] text-white shadow-sm"
                                        : "bg-gray-50 text-gray-500 border border-gray-200 hover:border-[#443CA3]/30 hover:text-[#443CA3]"
                                }`}
                            >
                                {f === "All" ? "Todos los eventos" : EVENT_LABELS[f]?.label || f}
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {/* Table */}
            <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
                <div className="grid grid-cols-[160px_160px_1fr_150px] px-6 py-3 border-b border-gray-100 bg-gray-50">
                    <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Fecha y Hora</span>
                    <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Evento</span>
                    <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Detalle</span>
                    <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Usuario</span>
                </div>

                {paginatedLogs.length === 0 ? (
                    <div className="text-center py-20 text-gray-300">
                        <p className="text-4xl mb-3">📋</p>
                        <p className="text-sm">No se encontraron registros de actividad</p>
                    </div>
                ) : (
                    paginatedLogs.map((log, i) => {
                        const meta = EVENT_LABELS[log.event] || { label: log.event, color: "#443CA3", bg: "#EEEDFE" };
                        return (
                            <div
                                key={log.id}
                                className={`grid grid-cols-[160px_160px_1fr_150px] px-6 py-4 border-b border-gray-50 items-center hover:bg-gray-50/50 transition-colors ${
                                    i % 2 === 1 ? "bg-gray-50/30" : ""
                                }`}
                            >
                                <span className="text-xs text-gray-400 font-mono">{formatDate(log.createdAt)}</span>
                                <div>
                                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full inline-block"
                                          style={{ color: meta.color, background: meta.bg }}>
                                        {meta.label}
                                    </span>
                                </div>
                                <span className="text-sm text-gray-600 px-4 overflow-hidden text-ellipsis whitespace-nowrap">
                                    {log.detail}
                                </span>
                                <span className="text-xs text-gray-400 truncate">
                                    {log.user?.name || log.user?.email || "Sistema"}
                                </span>
                            </div>
                        );
                    })
                )}
            </section>

            {/* Pagination */}
            <div className="flex items-center justify-center gap-4">
                <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-[#443CA3] hover:text-white hover:border-[#443CA3] transition disabled:opacity-30"
                >
                    ← Anterior
                </button>
                <span className="text-sm text-gray-400">Página {currentPage} de {totalPages}</span>
                <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-[#443CA3] hover:text-white hover:border-[#443CA3] transition disabled:opacity-30"
                >
                    Siguiente →
                </button>
            </div>

        </main>
    );
}