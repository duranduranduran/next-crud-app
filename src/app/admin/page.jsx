"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useUser, SignOutButton } from "@clerk/nextjs";

function SendRemindersButton() {
    const [sending, setSending] = useState(false);
    const [toast, setToast] = useState(null);

    const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

    const showToast = (type, text) => {
        setToast({ type, text });
        setTimeout(() => setToast(null), 4000);
    };

    const handleSendReminders = async () => {
        setSending(true);
        try {
            const res = await fetch("/api/send-reminders", { method: "GET" });
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.message || "Algo salió mal.");
            }
            const data = await res.json();
            showToast("success", data.message || "¡Recordatorios enviados exitosamente!");
        } catch (err) {
            showToast("error", err.message || "Error al enviar recordatorios");
        } finally {
            setSending(false);
        }
    };

    return (
        <>
            {toast && (
                <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-xl border transition-all duration-300 max-w-sm bg-surface-overlay ${
                    toast.type === "success"
                        ? "border-success/25 text-success"
                        : "border-danger/25 text-danger"
                }`}>
                    <span className="text-xl">{toast.type === "success" ? "✅" : "❌"}</span>
                    <p className="text-sm font-medium">{toast.text}</p>
                    <button onClick={() => setToast(null)} className={`ml-2 text-text-tertiary hover:text-text-secondary text-lg leading-none ${focusRing} ring-offset-surface-overlay`}>✕</button>
                </div>
            )}
            <button
                onClick={handleSendReminders}
                disabled={sending}
                className={`bg-accent text-surface-page px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-accent-hover transition-all shadow-sm ${focusRing} ring-offset-surface-page ${
                    sending ? "opacity-50 cursor-not-allowed" : ""
                }`}
            >
                {sending ? "Enviando..." : "Enviar Recordatorios"}
            </button>
        </>
    );
}

function StatusBadge({ status }) {
    const colors =
        status === "PAGADO" ? "bg-status-pagado-bg text-status-pagado border border-status-pagado/25" :
            status === "EN_GESTION" ? "bg-status-en-gestion-bg text-status-en-gestion border border-status-en-gestion/25" :
                status === "ACUERDO_DE_PAGO" ? "bg-status-acuerdo-de-pago-bg text-status-acuerdo-de-pago border border-status-acuerdo-de-pago/25" :
                    status === "ESCALADO_JUDICIAL" ? "bg-status-escalado-judicial-bg text-status-escalado-judicial border border-status-escalado-judicial/25" :
                        "bg-status-pendiente-bg text-status-pendiente border border-status-pendiente/25";

    const labels = {
        PAGADO: "Pagado",
        EN_GESTION: "En Gestión",
        ACUERDO_DE_PAGO: "Acuerdo de Pago",
        ESCALADO_JUDICIAL: "Escalado Judicial",
        PENDIENTE: "Pendiente",
    };

    return (
        <span className={`inline-flex items-center text-xs font-medium px-2.5 py-0.5 rounded-full ${colors}`}>
            {labels[status] || status?.replace(/_/g, " ") || "Pendiente"}
        </span>
    );
}

// Flat dense table for list view. Reuses the exact same handlers the card
// grid uses (onRowClick -> setSelectedDebtor, onToggleAvailability,
// onOpenDocument) — same behaviors, different presentation only. Does NOT
// duplicate the "select all" checkbox — the existing Bulk Actions bar above
// already provides that (selecting across ALL clients, not just filtered/
// visible rows), and a second checkbox with different scope semantics would
// be confusing rather than helpful.
function DebtorTable({ debtors, selectedDebtors, setSelectedDebtors, clients, setSelectAll, onRowClick, onToggleAvailability, onOpenDocument, focusRing }) {
    const toggleOne = debtorId => {
        setSelectedDebtors(prev => {
            const exists = prev.includes(debtorId);
            const next = exists ? prev.filter(id => id !== debtorId) : [...prev, debtorId];
            const totalDebtors = clients.flatMap(c => c.debtorRecords.map(d => d.id));
            setSelectAll(next.length === totalDebtors.length);
            return next;
        });
    };

    if (debtors.length === 0) {
        return (
            <div className="bg-surface-raised rounded-2xl shadow-sm border border-border-subtle p-10 text-center text-sm text-text-tertiary">
                Sin deudores que coincidan con los filtros.
            </div>
        );
    }

    return (
        <div className="bg-surface-raised rounded-2xl shadow-sm border border-border-subtle overflow-hidden">
            <div className="overflow-x-auto max-h-[70vh] overflow-y-auto">
                <table className="w-full text-sm border-collapse">
                    <thead className="sticky top-0 bg-surface-raised z-10">
                        <tr className="border-b border-border-default text-left text-xs text-text-tertiary uppercase tracking-wide">
                            <th className="w-10 px-4 py-2.5"></th>
                            <th className="px-2 py-2.5 font-medium">Deudor</th>
                            <th className="px-2 py-2.5 font-medium">Cliente</th>
                            <th className="px-2 py-2.5 font-medium text-right">Monto</th>
                            <th className="px-2 py-2.5 font-medium">Estado</th>
                            <th className="w-16 px-2 py-2.5 font-medium">Doc</th>
                            <th className="w-24 px-2 py-2.5 font-medium">Notificar</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border-subtle">
                        {debtors.map(debtor => (
                            <tr
                                key={debtor.id}
                                onClick={() => onRowClick(debtor)}
                                className="h-10 hover:bg-surface-hover transition-colors cursor-pointer"
                            >
                                <td className="px-4" onClick={e => e.stopPropagation()}>
                                    <input
                                        type="checkbox"
                                        checked={selectedDebtors.includes(debtor.id)}
                                        onChange={() => toggleOne(debtor.id)}
                                        className={`rounded accent-accent ${focusRing} ring-offset-surface-raised`}
                                    />
                                </td>
                                <td className="px-2 min-w-0">
                                    <p className="text-text-primary font-medium truncate">{debtor.name}</p>
                                    <p className="text-text-tertiary text-xs font-mono">{debtor.cedulaIdentidad || "—"}</p>
                                </td>
                                <td className="px-2 text-text-secondary truncate max-w-[160px]">{debtor.clientName}</td>
                                <td className="px-2 text-right font-mono text-text-primary font-semibold">
                                    {Number(debtor.amountOwed).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                                <td className="px-2"><StatusBadge status={debtor.status} /></td>
                                <td className="px-2" onClick={e => e.stopPropagation()}>
                                    {debtor.documentUrl && (
                                        <button
                                            onClick={() => onOpenDocument(debtor.documentUrl)}
                                            className={`text-accent hover:underline ${focusRing} ring-offset-surface-raised`}
                                        >
                                            📄
                                        </button>
                                    )}
                                </td>
                                <td className="px-2" onClick={e => e.stopPropagation()}>
                                    <div
                                        onClick={() => onToggleAvailability(debtor.id)}
                                        className={`relative w-8 h-4 rounded-full cursor-pointer transition-colors duration-300 ${focusRing} ring-offset-surface-raised`}
                                        style={{ background: debtor.availableForNotify ? 'var(--color-success)' : 'var(--color-surface-hover)' }}
                                    >
                                        <div
                                            className="absolute top-0.5 w-3 h-3 bg-text-primary rounded-full shadow-sm transition-all duration-300"
                                            style={{ left: debtor.availableForNotify ? '17px' : '2px' }}
                                        />
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

const LOG_META = {
    STATUS_CHANGED: { label: "Estado cambiado", color: "var(--color-neutral-event)", bg: "var(--color-neutral-event-bg)" },
    NOTE_ADDED: { label: "Nota agregada", color: "var(--color-accent)", bg: "var(--color-accent-bg)" },
    NOTE_DELETED: { label: "Nota eliminada", color: "var(--color-danger)", bg: "var(--color-danger-bg)" },
    REMINDER_SENT: { label: "Recordatorio enviado", color: "var(--color-info)", bg: "var(--color-info-bg)" },
    CALL_TRIGGERED: { label: "Llamada realizada", color: "var(--color-info)", bg: "var(--color-info-bg)" },
    DEBTOR_CREATED: { label: "Deudor creado", color: "var(--color-success)", bg: "var(--color-success-bg)" },
    DEBTOR_DELETED: { label: "Deudor eliminado", color: "var(--color-danger)", bg: "var(--color-danger-bg)" },
    BULK_STATUS_CHANGED: { label: "Estado masivo", color: "var(--color-neutral-event)", bg: "var(--color-neutral-event-bg)" },
    NOTIFICATION_SENT: { label: "Notificación enviada", color: "var(--color-accent)", bg: "var(--color-accent-bg)" },
    LEGAL_NOTICE_SENT: { label: "Aviso legal enviado", color: "var(--color-danger)", bg: "var(--color-danger-bg)" },
};

// Debtor.documentUrl only stores the Cloudinary URL, no separate
// resourceType/format column — the path segment is the real signal (matches
// how client/page.jsx routes uploads: PDFs go through the "raw" endpoint,
// everything else through "auto"). Extension sniffing is unreliable because
// Cloudinary URLs carry transformation/version segments.
function getDocumentKind(url) {
    if (!url) return null;
    if (url.includes("/image/upload/")) return "image";
    if (url.includes("/raw/upload/")) return "pdf";
    return "unknown";
}

function DocumentOverlay({ url, onClose }) {
    useEffect(() => {
        if (!url) return;
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => { document.body.style.overflow = prevOverflow; };
    }, [url]);

    if (!url) return null;
    // "unknown" (path doesn't match either Cloudinary delivery type we use)
    // is treated as pdf, not image — an <img> on a non-image URL just shows
    // a broken icon, while the pdf branch degrades to a working download
    // link either way. Deliberate fallback, not a fallthrough.
    const kind = getDocumentKind(url) === "image" ? "image" : "pdf";

    const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

    return (
        <div className="fixed inset-0 bg-surface-page/70 flex items-center justify-center z-[60] p-4" onClick={onClose}>
            <div className="relative max-w-4xl w-full" style={{ maxHeight: "90vh" }} onClick={e => e.stopPropagation()}>
                <button
                    onClick={onClose}
                    className={`absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-surface-page/50 text-text-primary text-lg leading-none hover:bg-surface-page/70 transition ${focusRing} ring-offset-surface-overlay`}
                >
                    ✕
                </button>
                {kind === "image" ? (
                    <img
                        src={url}
                        alt="Documento"
                        className="w-full h-full max-h-[90vh] object-contain rounded-xl bg-surface-overlay"
                    />
                ) : (
                    <div className="bg-surface-overlay rounded-xl overflow-hidden flex flex-col" style={{ height: "90vh" }}>
                        <iframe src={url} title="Documento" className="flex-1 w-full border-0" />
                        <div className="px-4 py-3 border-t border-border-subtle flex justify-end flex-shrink-0">
                            <a href={url} target="_blank" rel="noopener noreferrer"
                               className={`text-sm text-accent hover:underline ${focusRing} ring-offset-surface-overlay rounded-sm`}>
                                Abrir en pestaña nueva ↗
                            </a>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function DebtorModal({
                         debtor, onClose, onDelete, onToggleAvailability, onUpdateStatus,
                         debtorNotes, setDebtorNotes, onSaveNote, onDeleteNote,
                         selectedDebtors, setSelectedDebtors, clients, setSelectAll,
                         debtorLogs, logsLoading, onOpenDocument,
                     }) {
    if (!debtor) return null;

    const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

    return (
        <div className="fixed inset-0 bg-surface-page/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-surface-overlay rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>

                <div className="flex items-center justify-between px-6 py-5 border-b border-border-subtle">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-surface-page font-bold text-sm">
                            {debtor.name?.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-text-primary">{debtor.name}</h2>
                            <StatusBadge status={debtor.status} />
                        </div>
                    </div>
                    <button onClick={onClose} className={`text-text-tertiary hover:text-text-secondary text-xl leading-none transition-colors ${focusRing} ring-offset-surface-overlay`}>✕</button>
                </div>

                <div className="p-6 space-y-5">

                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { label: "Monto Adeudado", value: `USD ${Number(debtor.amountOwed).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, accent: true },
                            { label: "Cédula", value: debtor.cedulaIdentidad || "—" },
                            { label: "Correo", value: debtor.email || "—" },
                            { label: "Teléfono", value: debtor.telephone || "—" },
                        ].map((item, i) => (
                            <div key={i} className="bg-surface-hover rounded-xl p-3.5">
                                <p className="text-xs text-text-tertiary mb-1">{item.label}</p>
                                <p className={`font-semibold text-sm ${item.accent ? "text-accent" : "text-text-primary"}`}>{item.value}</p>
                            </div>
                        ))}
                        <div className="bg-surface-hover rounded-xl p-3.5 col-span-2">
                            <p className="text-xs text-text-tertiary mb-1">Fecha de Creación</p>
                            <p className="font-semibold text-sm text-text-primary">{debtor.createdAt ? new Date(debtor.createdAt).toLocaleDateString("es-EC") : "—"}</p>
                        </div>
                    </div>

                    {debtor.documentUrl && (
                        <button
                            onClick={() => onOpenDocument(debtor.documentUrl)}
                            className={`w-full flex items-center gap-3 bg-surface-hover rounded-xl p-3.5 hover:bg-accent/10 transition text-left ${focusRing} ring-offset-surface-overlay`}
                        >
                            <span className="text-2xl">📄</span>
                            <div>
                                <p className="text-sm font-medium text-text-primary">Ver documento</p>
                                <p className="text-xs text-text-tertiary">Factura o comprobante adjunto</p>
                            </div>
                        </button>
                    )}

                    <div>
                        <p className="text-sm font-medium text-text-primary mb-2">Actualizar Estado</p>
                        <select
                            value={debtor.status || "PENDIENTE"}
                            onChange={e => onUpdateStatus(debtor.id, e.target.value)}
                            className={`border border-border-default rounded-xl px-3 py-2 text-sm w-full bg-surface-page focus:outline-none focus:border-accent text-text-primary ${focusRing} ring-offset-surface-overlay`}
                        >
                            <option value="PENDIENTE">Pendiente</option>
                            <option value="EN_GESTION">En Gestión</option>
                            <option value="ACUERDO_DE_PAGO">Acuerdo de Pago</option>
                            <option value="PAGADO">Pagado</option>
                            <option value="ESCALADO_JUDICIAL">Escalado Judicial</option>
                        </select>
                    </div>

                    <div className="flex items-center justify-between py-1">
                        <label className="flex items-center gap-2.5 text-sm text-text-secondary cursor-pointer">
                            <div
                                onClick={() => onToggleAvailability(debtor.id)}
                                className={`relative w-9 h-5 rounded-full cursor-pointer transition-colors duration-300 ${focusRing} ring-offset-surface-overlay`}
                                style={{ background: debtor.availableForNotify ? 'var(--color-success)' : 'var(--color-surface-hover)' }}
                            >
                                <div className="absolute top-0.5 w-4 h-4 bg-text-primary rounded-full shadow-sm transition-all duration-300"
                                     style={{ left: debtor.availableForNotify ? '18px' : '2px' }} />
                            </div>
                            Permitir notificaciones
                        </label>

                        <label className="flex items-center gap-2.5 text-sm text-text-secondary cursor-pointer">
                            <input
                                type="checkbox"
                                checked={selectedDebtors.includes(debtor.id)}
                                onChange={() => {
                                    setSelectedDebtors(prev => {
                                        const exists = prev.includes(debtor.id);
                                        const newSelected = exists ? prev.filter(id => id !== debtor.id) : [...prev, debtor.id];
                                        const totalDebtors = clients.flatMap(c => c.debtorRecords.map(d => d.id));
                                        setSelectAll(newSelected.length === totalDebtors.length);
                                        return newSelected;
                                    });
                                }}
                                className={`rounded accent-accent ${focusRing} ring-offset-surface-overlay`}
                            />
                            Seleccionar para acción masiva
                        </label>
                    </div>

                    <div>
                        <p className="text-sm font-medium text-text-primary mb-2">Notas</p>
                        <textarea
                            placeholder="Agregar nota..."
                            value={debtorNotes[debtor.id] || ""}
                            onChange={e => setDebtorNotes(prev => ({ ...prev, [debtor.id]: e.target.value }))}
                            className={`w-full border border-border-default rounded-xl p-3 text-sm bg-surface-page text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent resize-none ${focusRing} ring-offset-surface-overlay`}
                            rows={3}
                        />
                        <button
                            onClick={() => onSaveNote(debtor.id)}
                            className={`mt-2 bg-accent text-surface-page px-4 py-1.5 rounded-lg text-sm hover:bg-accent-hover transition ${focusRing} ring-offset-surface-overlay`}
                        >
                            Guardar Nota
                        </button>

                        <div className="mt-3 space-y-2 max-h-40 overflow-y-auto">
                            {debtor.notes?.length > 0 ? debtor.notes.map(note => (
                                <div key={note.id} className="bg-surface-hover border border-border-subtle p-3 rounded-xl text-sm flex justify-between items-start gap-2">
                                    <div>
                                        <p className="text-text-primary">{note.content}</p>
                                        <p className="text-xs text-text-tertiary mt-1">
                                            {note.user?.name || note.user?.email || "Desconocido"} · {new Date(note.createdAt).toLocaleString("es-EC")}
                                        </p>
                                    </div>
                                    <button onClick={() => onDeleteNote(note.id)} className={`text-danger/60 hover:text-danger transition text-sm shrink-0 ${focusRing} ring-offset-surface-hover`}>🗑️</button>
                                </div>
                            )) : <p className="text-xs text-text-tertiary">Sin notas aún</p>}
                        </div>
                    </div>

                    <div>
                        <p className="text-sm font-medium text-text-primary mb-3">Historial de Actividad</p>
                        {logsLoading ? (
                            <div className="flex justify-center py-4">
                                <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : debtorLogs.length === 0 ? (
                            <p className="text-xs text-text-tertiary">Sin actividad registrada</p>
                        ) : (
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                {debtorLogs.map(log => {
                                    const meta = LOG_META[log.event] || { label: log.event, color: "var(--color-accent)", bg: "var(--color-accent-bg)" };
                                    return (
                                        <div key={log.id} className="flex items-start gap-2.5 p-2.5 bg-surface-hover rounded-xl">
                                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0 mt-0.5"
                                                  style={{ color: meta.color, background: meta.bg }}>
                                                {meta.label}
                                            </span>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs text-text-secondary truncate">{log.detail}</p>
                                                <p className="text-[10px] text-text-tertiary mt-0.5">
                                                    {new Date(log.createdAt).toLocaleString("es-EC")} · {log.user?.name || log.user?.email || "Sistema"}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-border-subtle">
                        <button
                            onClick={() => onDelete(debtor.id)}
                            className={`text-sm px-4 py-1.5 border border-danger/25 rounded-lg text-danger hover:bg-danger-bg transition ${focusRing} ring-offset-surface-overlay`}
                        >
                            Eliminar Deudor
                        </button>
                        <button onClick={onClose} className={`text-sm px-4 py-1.5 bg-surface-hover rounded-lg text-text-secondary hover:brightness-125 transition ${focusRing} ring-offset-surface-overlay`}>
                            Cerrar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function AdminPage() {
    const { user, isLoaded } = useUser();
    const router = useRouter();

    const [statusFilter, setStatusFilter] = useState("ALL");
    const [amountFilter, setAmountFilter] = useState("ALL");
    const [bulkStatus, setBulkStatus] = useState("");
    const [selectedDebtors, setSelectedDebtors] = useState([]);
    const [selectAll, setSelectAll] = useState(false);
    const [bulkMessage, setBulkMessage] = useState(null);
    const [bulkLoading, setBulkLoading] = useState(false);
    const [selectedDebtor, setSelectedDebtor] = useState(null);
    const [documentOverlayUrl, setDocumentOverlayUrl] = useState(null);
    const [debtorLogs, setDebtorLogs] = useState([]);
    const [logsLoading, setLogsLoading] = useState(false);
    const [globalSearch, setGlobalSearch] = useState("");
    const [showGlobalSearch, setShowGlobalSearch] = useState(false);
    const ITEMS_PER_PAGE = 6;
    const [debtorPages, setDebtorPages] = useState({});
    const [debtorNotes, setDebtorNotes] = useState({});
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [viewMode, setViewMode] = useState("card");

    useEffect(() => {
        const stored = typeof window !== "undefined" ? localStorage.getItem("debtorViewMode") : null;
        if (stored === "card" || stored === "list") setViewMode(stored);
    }, []);

    const setViewModePersisted = mode => {
        setViewMode(mode);
        try { localStorage.setItem("debtorViewMode", mode); } catch {}
    };

    const handlePageChange = (clientId, page) => setDebtorPages(prev => ({ ...prev, [clientId]: page }));

    useEffect(() => {
        if (!isLoaded) return;
        if (!user) { router.push("/sign-in"); return; }
        if (user.publicMetadata?.role !== "admin") router.push("/client");
    }, [isLoaded, user, router]);

    useEffect(() => {
        const handleKeyDown = e => {
            if (e.key === "Escape") {
                // Overlay is visually on top of the modal — first Escape
                // should only close it, not both at once.
                if (documentOverlayUrl) {
                    setDocumentOverlayUrl(null);
                    return;
                }
                setSelectedDebtor(null);
                setShowGlobalSearch(false);
                setGlobalSearch("");
            }
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault();
                setShowGlobalSearch(true);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [documentOverlayUrl]);

    useEffect(() => {
        if (!selectedDebtor) { setDebtorLogs([]); return; }
        const fetchDebtorLogs = async () => {
            setLogsLoading(true);
            try {
                const res = await fetch(`/api/admin/debtors/${selectedDebtor.id}/logs`, { credentials: "include" });
                if (res.ok) setDebtorLogs(await res.json());
            } catch (err) {
                console.error(err);
            } finally {
                setLogsLoading(false);
            }
        };
        fetchDebtorLogs();
    }, [selectedDebtor?.id]);

    const fetchClients = async () => {
        try {
            const res = await fetch("/api/admin/clients", { credentials: "include" });
            if (!res.ok) { const text = await res.text(); throw new Error(text || "No autorizado"); }
            const data = await res.json();
            setClients(Array.isArray(data) ? data : data.clients || []);
        } catch (err) {
            console.error(err);
            setError("Error al cargar los clientes.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchClients(); }, []);

    const globalResults = useMemo(() => {
        if (!globalSearch.trim()) return [];
        const term = globalSearch.toLowerCase();
        return clients.flatMap(client =>
            client.debtorRecords
                .filter(d =>
                    d.name?.toLowerCase().includes(term) ||
                    d.cedulaIdentidad?.includes(term) ||
                    d.email?.toLowerCase().includes(term) ||
                    d.telephone?.includes(term)
                )
                .map(d => ({ ...d, clientName: client.name, clientEmail: client.email }))
        ).slice(0, 10);
    }, [globalSearch, clients]);

    const toggleDebtorAvailability = async debtorId => {
        try {
            const res = await fetch(`/api/admin/debtors/${debtorId}/toggle-availability`, { method: "PATCH" });
            if (!res.ok) throw new Error("Error al cambiar");
            setClients(prev => prev.map(client => ({
                ...client,
                debtorRecords: client.debtorRecords.map(debtor =>
                    debtor.id === debtorId ? { ...debtor, availableForNotify: !debtor.availableForNotify } : debtor
                ),
            })));
        } catch (err) { console.error(err); alert("Error al cambiar disponibilidad"); }
    };

    const updateDebtorStatus = async (debtorId, newStatus) => {
        try {
            const res = await fetch(`/api/admin/debtors/${debtorId}/status`, {
                method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: newStatus }),
            });
            if (!res.ok) throw new Error("Error al actualizar estado");
            await fetchClients();
        } catch (err) { console.error(err); alert("Error al actualizar estado"); }
    };

    const handleDeleteDebtor = async debtorId => {
        if (!confirm("¿Estás seguro de que deseas eliminar este deudor?")) return;
        try {
            const res = await fetch(`/api/debtors/${debtorId}`, { method: "DELETE", credentials: "include" });
            if (!res.ok) { const data = await res.json().catch(() => ({})); throw new Error(data.message || "Error al eliminar"); }
            setSelectedDebtor(null);
            await fetchClients();
        } catch (err) { console.error(err); alert("Error al eliminar"); }
    };

    const handleSaveNote = async debtorId => {
        const content = debtorNotes[debtorId];
        if (!content?.trim()) { alert("La nota no puede estar vacía"); return; }
        try {
            const res = await fetch(`/api/admin/debtors/${debtorId}/notes`, {
                method: "POST", credentials: "include",
                headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content }),
            });
            if (!res.ok) throw new Error("Error al guardar nota");
            setDebtorNotes(prev => ({ ...prev, [debtorId]: "" }));
            await fetchClients();
            const logsRes = await fetch(`/api/admin/debtors/${debtorId}/logs`, { credentials: "include" });
            if (logsRes.ok) setDebtorLogs(await logsRes.json());
        } catch (err) { console.error(err); alert("Error al guardar nota"); }
    };

    const handleDeleteNote = async noteId => {
        if (!confirm("¿Eliminar esta nota?")) return;
        try {
            const res = await fetch(`/api/admin/debtors/notes/${noteId}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Error al eliminar");
            await fetchClients();
            if (selectedDebtor) {
                const logsRes = await fetch(`/api/admin/debtors/${selectedDebtor.id}/logs`, { credentials: "include" });
                if (logsRes.ok) setDebtorLogs(await logsRes.json());
            }
        } catch (err) { console.error(err); alert("Error al eliminar nota"); }
    };

    const handleExportDebtors = () => {
        import("xlsx").then(XLSX => {
            const rows = filteredClients.flatMap(client =>
                client.debtorRecords.map(d => ({
                    "Cliente": client.name,
                    "Deudor": d.name,
                    "Cédula": d.cedulaIdentidad || "—",
                    "Email": d.email || "—",
                    "Teléfono": d.telephone || "—",
                    "Monto Adeudado": Number(d.amountOwed).toFixed(2),
                    "Estado": d.status,
                    "Notificar": d.availableForNotify ? "Sí" : "No",
                    "Notas": d.notes?.length || 0,
                }))
            );
            const ws = XLSX.utils.json_to_sheet(rows);
            ws["!cols"] = [
                { wch: 20 }, { wch: 22 }, { wch: 14 }, { wch: 28 },
                { wch: 14 }, { wch: 16 }, { wch: 20 }, { wch: 10 }, { wch: 8 },
            ];
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Deudores");
            XLSX.writeFile(wb, `deudores_${new Date().toISOString().split("T")[0]}.xlsx`);
        });
    };

    const filteredClients = clients.map(client => ({
        ...client,
        debtorRecords: client.debtorRecords.filter(debtor => {
            const matchesStatus = statusFilter === "ALL" || debtor.status === statusFilter;
            let matchesAmount = true;
            if (amountFilter === "<500") matchesAmount = debtor.amountOwed < 500;
            if (amountFilter === "500-1000") matchesAmount = debtor.amountOwed >= 500 && debtor.amountOwed <= 1000;
            if (amountFilter === ">1000") matchesAmount = debtor.amountOwed > 1000;
            return matchesStatus && matchesAmount;
        }),
    }));

    // List view goes flat with a client column rather than per-client
    // grouping+pagination — 167+ rows across 20+ small paginated tables is
    // worse to scan than one flat, scrollable, sortable-by-eye table. Card
    // view keeps the existing per-client grouping/pagination unchanged.
    const flatDebtors = filteredClients.flatMap(client =>
        client.debtorRecords.map(d => ({ ...d, clientName: client.name || client.email, clientId: client.id }))
    );

    useEffect(() => {
        if (!selectedDebtor) return;
        const updated = clients.flatMap(c => c.debtorRecords).find(d => d.id === selectedDebtor.id);
        if (updated) setSelectedDebtor(updated);
    }, [clients]);

    if (loading) return (
        <div data-density="compact" className="min-h-screen bg-surface-page flex items-center justify-center">
            <div className="text-center">
                <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-sm text-text-secondary">Cargando...</p>
            </div>
        </div>
    );

    if (error) return (
        <div data-density="compact" className="min-h-screen bg-surface-page flex items-center justify-center text-danger">
            {error}
        </div>
    );

    const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

    return (
        <main data-density="compact" className="min-h-screen bg-surface-page px-8 py-8">

            {/* GLOBAL SEARCH MODAL */}
            {showGlobalSearch && (
                <div className="fixed inset-0 bg-surface-page/40 z-50 flex items-start justify-center pt-24 px-4"
                     onClick={() => { setShowGlobalSearch(false); setGlobalSearch(""); }}>
                    <div className="bg-surface-overlay rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden"
                         onClick={e => e.stopPropagation()}>

                        {/* Search input — accent header */}
                        <div className="flex items-center gap-3 px-5 py-4 border-b border-border-default bg-accent">
                            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="text-surface-page">
                                <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeOpacity="0.6" strokeWidth="1.5"/>
                                <path d="M12.5 12.5L15.5 15.5" stroke="currentColor" strokeOpacity="0.6" strokeWidth="1.5" strokeLinecap="round"/>
                            </svg>
                            <input
                                autoFocus
                                type="text"
                                placeholder="Buscar por nombre, cédula, correo o teléfono..."
                                value={globalSearch}
                                onChange={e => setGlobalSearch(e.target.value)}
                                className={`flex-1 text-sm text-surface-page focus:outline-none bg-transparent placeholder-surface-page/40 ${focusRing} ring-offset-accent rounded-sm`}
                            />
                            <kbd className="text-[10px] text-surface-page/50 border border-surface-page/25 rounded px-1.5 py-0.5">ESC</kbd>
                        </div>

                        {/* Results */}
                        <div className="max-h-96 overflow-y-auto bg-surface-page">
                            {globalSearch.trim() === "" ? (
                                <div className="px-5 py-10 text-center text-sm text-text-tertiary">
                                    Escribe para buscar deudores en todas las carteras
                                </div>
                            ) : globalResults.length === 0 ? (
                                <div className="px-5 py-10 text-center text-sm text-text-tertiary">
                                    No se encontraron resultados para &quot;{globalSearch}&quot;
                                </div>
                            ) : (
                                <div className="py-2">
                                    <p className="px-5 py-2 text-[10px] text-text-tertiary uppercase tracking-widest">
                                        {globalResults.length} resultado{globalResults.length !== 1 ? "s" : ""}
                                    </p>
                                    {globalResults.map(debtor => (
                                        <button
                                            key={debtor.id}
                                            onClick={() => {
                                                setSelectedDebtor(debtor);
                                                setShowGlobalSearch(false);
                                                setGlobalSearch("");
                                            }}
                                            className={`w-full flex items-center justify-between px-5 py-3.5 hover:bg-accent/10 transition text-left border-b border-border-subtle last:border-0 ${focusRing} ring-offset-surface-page`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center text-surface-page font-bold text-xs flex-shrink-0">
                                                    {debtor.name?.slice(0, 2).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-text-primary">{debtor.name}</p>
                                                    <p className="text-xs text-text-secondary mt-0.5">
                                                        {debtor.cedulaIdentidad && <span className="mr-2">CI: {debtor.cedulaIdentidad}</span>}
                                                        {debtor.email && <span className="mr-2">{debtor.email}</span>}
                                                        {debtor.telephone && <span>{debtor.telephone}</span>}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right flex-shrink-0 ml-4">
                                                <p className="text-sm font-bold text-accent">
                                                    USD {Number(debtor.amountOwed).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </p>
                                                <p className="text-[10px] text-accent/60 mt-0.5 font-medium">{debtor.clientName}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="px-5 py-3 border-t border-border-subtle flex items-center justify-between bg-surface-hover">
                            <p className="text-[10px] text-text-tertiary">Busca en todas las carteras de clientes</p>
                            <div className="flex items-center gap-3 text-[10px] text-text-tertiary">
                                <span>↵ abrir</span>
                                <span>ESC cerrar</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <DebtorModal
                debtor={selectedDebtor}
                onClose={() => setSelectedDebtor(null)}
                onDelete={handleDeleteDebtor}
                onToggleAvailability={toggleDebtorAvailability}
                onUpdateStatus={updateDebtorStatus}
                debtorNotes={debtorNotes}
                setDebtorNotes={setDebtorNotes}
                onSaveNote={handleSaveNote}
                onDeleteNote={handleDeleteNote}
                selectedDebtors={selectedDebtors}
                setSelectedDebtors={setSelectedDebtors}
                clients={clients}
                setSelectAll={setSelectAll}
                debtorLogs={debtorLogs}
                logsLoading={logsLoading}
                onOpenDocument={setDocumentOverlayUrl}
            />

            <DocumentOverlay url={documentOverlayUrl} onClose={() => setDocumentOverlayUrl(null)} />

            {/* Top Bar */}
            <div className="flex justify-between items-center bg-surface-raised px-6 py-4 rounded-2xl shadow-sm border border-border-subtle mb-8">
                <img src="/logo-recupera-white.png" alt="recupera" className="h-14" />

                {/* Global Search Trigger */}
                <button
                    onClick={() => setShowGlobalSearch(true)}
                    className={`flex items-center gap-3 border border-border-default rounded-xl px-4 py-2.5 text-sm text-text-tertiary hover:border-accent/40 hover:text-accent transition w-72 ${focusRing} ring-offset-surface-raised`}
                >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.5"/>
                        <path d="M10 10L12.5 12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                    <span className="flex-1 text-left">Buscar deudor...</span>
                    <kbd className="text-[10px] border border-border-default rounded px-1.5 py-0.5 text-text-tertiary">⌘K</kbd>
                </button>

                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-accent/15 flex items-center justify-center text-accent font-bold text-sm">
                        {user?.firstName?.slice(0, 1) || "A"}
                    </div>
                    <div>
                        <p className="text-sm font-medium text-text-primary">{user?.fullName || "Admin"}</p>
                        <p className="text-xs text-text-tertiary">Panel Administrativo</p>
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-text-primary">Mis Deudores</h1>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 bg-surface-raised border border-border-default rounded-xl p-1">
                        <button
                            onClick={() => setViewModePersisted("card")}
                            aria-pressed={viewMode === "card"}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${focusRing} ring-offset-surface-raised ${
                                viewMode === "card" ? "bg-accent text-surface-page" : "text-text-secondary hover:text-text-primary"
                            }`}
                        >
                            Tarjetas
                        </button>
                        <button
                            onClick={() => setViewModePersisted("list")}
                            aria-pressed={viewMode === "list"}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${focusRing} ring-offset-surface-raised ${
                                viewMode === "list" ? "bg-accent text-surface-page" : "text-text-secondary hover:text-text-primary"
                            }`}
                        >
                            Lista
                        </button>
                    </div>
                    <button
                        onClick={handleExportDebtors}
                        className={`border border-accent/30 text-accent px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-accent hover:text-surface-page transition flex items-center gap-2 ${focusRing} ring-offset-surface-page`}
                    >
                        ⬇ Exportar Excel
                    </button>
                    <SendRemindersButton />
                </div>
            </div>

            {/* Filter Bar — status and amount only, no text search */}
            <section className="bg-surface-raised p-4 rounded-2xl shadow-sm border border-border-subtle mb-6">
                <div className="flex flex-wrap gap-3">
                    <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                            className={`border border-border-default rounded-xl px-4 py-2 text-sm bg-surface-page focus:outline-none focus:border-accent text-text-secondary ${focusRing} ring-offset-surface-raised`}>
                        <option value="ALL">Todos los estados</option>
                        <option value="PENDIENTE">Pendiente</option>
                        <option value="EN_GESTION">En Gestión</option>
                        <option value="ACUERDO_DE_PAGO">Acuerdo de Pago</option>
                        <option value="PAGADO">Pagado</option>
                        <option value="ESCALADO_JUDICIAL">Escalado Judicial</option>
                    </select>
                    <select value={amountFilter} onChange={e => setAmountFilter(e.target.value)}
                            className={`border border-border-default rounded-xl px-4 py-2 text-sm bg-surface-page focus:outline-none focus:border-accent text-text-secondary ${focusRing} ring-offset-surface-raised`}>
                        <option value="ALL">Todos los montos</option>
                        <option value="<500">Menos de $500</option>
                        <option value="500-1000">$500 - $1000</option>
                        <option value=">1000">Más de $1000</option>
                    </select>
                </div>
            </section>

            {/* Bulk Actions */}
            <section className="mb-6 flex flex-wrap items-center justify-between gap-4 bg-surface-raised px-5 py-3.5 rounded-2xl shadow-sm border border-border-subtle">
                <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
                        <input type="checkbox" checked={selectAll} onChange={() => {
                            const currently = !selectAll;
                            setSelectAll(currently);
                            setSelectedDebtors(currently ? clients.flatMap(c => c.debtorRecords.map(d => d.id)) : []);
                        }} className={`rounded accent-accent ${focusRing} ring-offset-surface-raised`} />
                        Seleccionar todos
                    </label>
                    <span className="text-sm text-text-tertiary">Seleccionados: {selectedDebtors.length}</span>
                </div>

                <div className="flex items-center gap-3">
                    <select value={bulkStatus} onChange={e => setBulkStatus(e.target.value)}
                            className={`border border-border-default rounded-xl px-4 py-2 text-sm bg-surface-page text-text-secondary focus:outline-none ${focusRing} ring-offset-surface-raised`}>
                        <option value="">Seleccionar estado</option>
                        <option value="PENDIENTE">Pendiente</option>
                        <option value="EN_GESTION">En Gestión</option>
                        <option value="ACUERDO_DE_PAGO">Acuerdo de Pago</option>
                        <option value="PAGADO">Pagado</option>
                        <option value="ESCALADO_JUDICIAL">Escalado Judicial</option>
                    </select>
                    <button
                        onClick={async () => {
                            setBulkMessage(null);
                            if (!bulkStatus) { setBulkMessage({ type: "error", text: "Selecciona un estado" }); return; }
                            if (!selectedDebtors.length) { setBulkMessage({ type: "error", text: "Selecciona al menos un deudor" }); return; }
                            setBulkLoading(true);
                            try {
                                const res = await fetch("/api/admin/debtors/bulk-status", {
                                    method: "POST", headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ debtorIds: selectedDebtors, status: bulkStatus }),
                                });
                                const data = await res.json().catch(() => ({}));
                                if (!res.ok) throw new Error(data.message || "Error al actualizar");
                                setBulkMessage({ type: "success", text: "Estados actualizados" });
                                await fetchClients();
                                setSelectedDebtors([]); setBulkStatus(""); setSelectAll(false);
                            } catch (err) {
                                setBulkMessage({ type: "error", text: err.message || "Error al actualizar estados" });
                            } finally { setBulkLoading(false); }
                        }}
                        disabled={bulkLoading}
                        className={`bg-accent text-surface-page px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-50 hover:bg-accent-hover transition ${focusRing} ring-offset-surface-raised`}
                    >
                        {bulkLoading ? "Actualizando..." : "Aplicar a seleccionados"}
                    </button>
                </div>
            </section>

            {bulkMessage && (
                <p className={`mb-4 text-sm px-4 py-2 rounded-xl ${bulkMessage.type === "success" ? "bg-success-bg text-success" : "bg-danger-bg text-danger"}`}>
                    {bulkMessage.text}
                </p>
            )}

            {/* Clients — card view (unchanged behavior: per-client grouping + pagination) */}
            {viewMode === "card" && (
            <section className="space-y-6">
                {filteredClients.map(client => {
                    const currentPage = debtorPages[client.id] || 1;
                    const totalPages = Math.max(1, Math.ceil(client.debtorRecords.length / ITEMS_PER_PAGE));
                    const paginatedDebtors = client.debtorRecords.slice(
                        (currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE
                    );
                    // client.name is frequently empty/unset for accounts synced
                    // without one — fall back to the email's local part rather
                    // than rendering a blank heading or leaning on the email as
                    // if it were the name.
                    const displayName = client.name || client.email?.split("@")[0] || "Cliente";

                    // Empty clients get a single compact row instead of the
                    // full card treatment — the full card (header + padding)
                    // cost ~250px combined for two empty clients before any
                    // real data appeared.
                    if (client.debtorRecords.length === 0) {
                        return (
                            <div key={client.id} className="flex items-center justify-between px-5 py-2.5 rounded-xl border border-border-subtle text-sm">
                                <div className="flex items-baseline gap-2 min-w-0">
                                    <span className="font-medium text-text-primary truncate">{displayName}</span>
                                    <span className="text-text-tertiary truncate">{client.email}</span>
                                </div>
                                <span className="text-text-tertiary text-xs flex-shrink-0 ml-3">Sin deudores</span>
                            </div>
                        );
                    }

                    return (
                        <div key={client.id} className="bg-surface-raised rounded-2xl shadow-sm border border-border-subtle p-6">
                            <div className="flex items-center justify-between mb-5">
                                <div>
                                    <h3 className="font-semibold text-text-primary">{displayName}</h3>
                                    <p className="text-sm text-text-tertiary">{client.email}</p>
                                </div>
                                <span className="text-xs text-text-tertiary bg-surface-hover border border-border-subtle px-3 py-1 rounded-full">
                                    {client.debtorRecords.length} deudores
                                </span>
                            </div>

                            <>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                                        {paginatedDebtors.map(debtor => (
                                            <div
                                                key={debtor.id}
                                                onClick={() => setSelectedDebtor(debtor)}
                                                className="border border-border-subtle rounded-xl p-3 hover:shadow-md hover:border-accent/30 transition-all cursor-pointer"
                                            >
                                                <div className="flex items-start justify-between mb-2">
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-semibold text-text-primary text-sm truncate">{debtor.name}</p>
                                                        <p className="text-[11px] text-text-tertiary mt-0.5 truncate">{debtor.email || "Sin correo"}</p>
                                                        <p className="text-[11px] text-text-tertiary font-mono truncate">
                                                            {debtor.cedulaIdentidad || "—"} · {debtor.telephone || "—"}
                                                        </p>
                                                    </div>
                                                    <div className="text-right ml-2 flex-shrink-0">
                                                        <p className="text-sm font-bold text-accent font-mono">
                                                            {Number(debtor.amountOwed).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </p>
                                                        <div className="mt-1">
                                                            <StatusBadge status={debtor.status} />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between mt-2 pt-2 border-t border-border-subtle">
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-[11px] text-text-tertiary">
                                                            {debtor.notes?.length || 0} nota{debtor.notes?.length !== 1 ? "s" : ""}
                                                        </span>
                                                        {debtor.documentUrl && (
                                                            <button
                                                                onClick={e => { e.stopPropagation(); setDocumentOverlayUrl(debtor.documentUrl); }}
                                                                className={`text-[11px] text-accent hover:underline flex items-center gap-1 ${focusRing} ring-offset-surface-raised`}
                                                            >
                                                                📄 Documento
                                                            </button>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                                                        <span className="text-[11px] text-text-tertiary">Notificar</span>
                                                        <div
                                                            onClick={() => toggleDebtorAvailability(debtor.id)}
                                                            className={`relative w-8 h-4 rounded-full cursor-pointer transition-colors duration-300 ${focusRing} ring-offset-surface-raised`}
                                                            style={{ background: debtor.availableForNotify ? 'var(--color-success)' : 'var(--color-surface-hover)' }}
                                                        >
                                                            <div
                                                                className="absolute top-0.5 w-3 h-3 bg-text-primary rounded-full shadow-sm transition-all duration-300"
                                                                style={{ left: debtor.availableForNotify ? '17px' : '2px' }}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {totalPages > 1 && (
                                        <div className="flex items-center justify-center gap-3 mt-5">
                                            <button onClick={() => handlePageChange(client.id, Math.max(1, currentPage - 1))} disabled={currentPage === 1}
                                                    className={`px-3 py-1.5 border border-border-default rounded-lg text-sm text-text-secondary disabled:opacity-40 hover:bg-surface-hover transition ${focusRing} ring-offset-surface-raised`}>
                                                ← Anterior
                                            </button>
                                            <span className="text-sm text-text-tertiary">Página {currentPage} de {totalPages}</span>
                                            <button onClick={() => handlePageChange(client.id, Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages}
                                                    className={`px-3 py-1.5 border border-border-default rounded-lg text-sm text-text-secondary disabled:opacity-40 hover:bg-surface-hover transition ${focusRing} ring-offset-surface-raised`}>
                                                Siguiente →
                                            </button>
                                        </div>
                                    )}
                                </>
                        </div>
                    );
                })}
            </section>
            )}

            {/* Clients — list view: flat dense table, client column instead
                of per-client grouping (167+ rows across 20+ small paginated
                tables doesn't scan well; one flat scrollable table does). */}
            {viewMode === "list" && (
                <DebtorTable
                    debtors={flatDebtors}
                    selectedDebtors={selectedDebtors}
                    setSelectedDebtors={setSelectedDebtors}
                    clients={clients}
                    setSelectAll={setSelectAll}
                    onRowClick={setSelectedDebtor}
                    onToggleAvailability={toggleDebtorAvailability}
                    onOpenDocument={setDocumentOverlayUrl}
                    focusRing={focusRing}
                />
            )}

            <div className="mt-10 flex justify-end">
                <SignOutButton redirectUrl="/sign-in">
                    <button className={`text-sm text-danger border border-danger/25 px-5 py-2 rounded-xl hover:bg-danger-bg transition ${focusRing} ring-offset-surface-page`}>
                        Cerrar Sesión
                    </button>
                </SignOutButton>
            </div>

        </main>
    );
}