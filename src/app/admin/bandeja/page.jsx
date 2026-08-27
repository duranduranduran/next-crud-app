"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";

const STATUS_LABELS = {
    PENDIENTE: "Pendiente",
    EN_GESTION: "En Gestión",
    ACUERDO_DE_PAGO: "Acuerdo de Pago",
    PAGADO: "Pagado",
    ESCALADO_JUDICIAL: "Escalado Judicial",
};

const STATUS_COLORS = {
    // ACUERDO_DE_PAGO and PAGADO used to share identical color values here
    // (both #D1FAE5/#065F46) — two different statuses rendering visually
    // identical. Fixed as a side effect of mapping each to its own token.
    PENDIENTE: { bg: "var(--color-status-pendiente-bg)", color: "var(--color-status-pendiente)" },
    EN_GESTION: { bg: "var(--color-status-en-gestion-bg)", color: "var(--color-status-en-gestion)" },
    ACUERDO_DE_PAGO: { bg: "var(--color-status-acuerdo-de-pago-bg)", color: "var(--color-status-acuerdo-de-pago)" },
    PAGADO: { bg: "var(--color-status-pagado-bg)", color: "var(--color-status-pagado)" },
    ESCALADO_JUDICIAL: { bg: "var(--color-status-escalado-judicial-bg)", color: "var(--color-status-escalado-judicial)" },
};

const LOG_META = {
    // Generic tokens, not status ones — same rule as admin/page.jsx's
    // LOG_META (an activity-log event type is not a debtor status).
    STATUS_CHANGED: { label: "Estado cambiado", color: "var(--color-neutral-event)", bg: "var(--color-neutral-event-bg)" },
    NOTE_ADDED: { label: "Nota agregada", color: "var(--color-accent)", bg: "var(--color-accent-bg)" },
    NOTE_DELETED: { label: "Nota eliminada", color: "var(--color-danger)", bg: "var(--color-danger-bg)" },
    REMINDER_SENT: { label: "Recordatorio enviado", color: "var(--color-info)", bg: "var(--color-info-bg)" },
    CALL_TRIGGERED: { label: "Llamada realizada", color: "var(--color-info)", bg: "var(--color-info-bg)" },
    DEBTOR_CREATED: { label: "Deudor creado", color: "var(--color-success)", bg: "var(--color-success-bg)" },
    NOTIFICATION_SENT: { label: "Notificación enviada", color: "var(--color-accent)", bg: "var(--color-accent-bg)" },
    LEGAL_NOTICE_SENT: { label: "Aviso legal enviado", color: "var(--color-danger)", bg: "var(--color-danger-bg)" },
};

function timeAgo(isoStr) {
    const diff = Date.now() - new Date(isoStr).getTime();
    const mins = Math.floor(diff / 60000);
    const hrs = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 2) return "ahora";
    if (mins < 60) return `${mins}m`;
    if (hrs < 24) return `${hrs}h`;
    if (days === 1) return "ayer";
    return `${days}d`;
}

function getInitials(name) {
    return (name || "??").split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();
}

function Avatar({ name, size = "md" }) {
    // Neutral — avatars are not accented (per-name hash-hued avatars used to
    // include the now-retired accent color in the rotation; a single
    // neutral treatment everywhere is more consistent with "accent means
    // primary buttons and the active nav indicator, that's it").
    const sz = size === "lg" ? "w-12 h-12 text-sm" : size === "xl" ? "w-16 h-16 text-base" : "w-9 h-9 text-xs";
    return (
        <div className={`${sz} rounded-full flex items-center justify-center font-bold flex-shrink-0 bg-surface-hover text-text-primary`}>
            {getInitials(name)}
        </div>
    );
}

function DebtorSlidePanel({ debtor, onClose }) {
    const [closing, setClosing] = useState(false);
    const [logs, setLogs] = useState([]);
    const [logsLoading, setLogsLoading] = useState(false);

    const handleClose = useCallback(() => {
        setClosing(true);
        setTimeout(() => onClose(), 200);
    }, [onClose]);

    useEffect(() => {
        const handleKey = e => { if (e.key === "Escape") handleClose(); };
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [handleClose]);

    useEffect(() => {
        if (!debtor?.id) return;
        const fetchLogs = async () => {
            setLogsLoading(true);
            try {
                const res = await fetch(`/api/admin/debtors/${debtor.id}/logs`, { credentials: "include" });
                if (res.ok) setLogs(await res.json());
            } catch (err) { console.error(err); }
            finally { setLogsLoading(false); }
        };
        fetchLogs();
    }, [debtor?.id]);

    return (
        <>
            <style>{`
                @keyframes panelSlideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes panelSlideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
                @keyframes backdropIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes backdropOut {
                    from { opacity: 1; }
                    to { opacity: 0; }
                }
            `}</style>

            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-surface-page/20 z-40 backdrop-blur-sm"
                onClick={handleClose}
                style={{
                    animation: closing
                        ? "backdropOut 0.2s ease-in forwards"
                        : "backdropIn 0.2s ease-out"
                }}
            />

            {/* Panel */}
            <div
                className="fixed right-0 top-0 bottom-0 w-96 bg-surface-overlay shadow-2xl z-50 flex flex-col"
                style={{
                    animation: closing
                        ? "panelSlideOut 0.2s ease-in forwards"
                        : "panelSlideIn 0.2s ease-out"
                }}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-border-subtle">
                    <p className="text-sm font-semibold text-text-primary">Perfil del Deudor</p>
                    <button
                        onClick={handleClose}
                        className="w-7 h-7 rounded-full bg-surface-hover flex items-center justify-center text-text-tertiary hover:bg-border-default hover:text-text-secondary transition text-sm"
                    >
                        ✕
                    </button>
                </div>

                {/* Scrollable content */}
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

                    {/* Identity */}
                    <div className="flex items-start gap-4">
                        <Avatar name={debtor?.name} size="xl" />
                        <div className="flex-1 min-w-0">
                            <h2 className="text-base font-bold text-text-primary truncate">{debtor?.name}</h2>
                            {debtor?.status && (
                                <span className="inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
                                      style={{
                                          background: STATUS_COLORS[debtor.status]?.bg || "var(--color-surface-hover)",
                                          color: STATUS_COLORS[debtor.status]?.color || "var(--color-text-secondary)"
                                      }}>
                                    {STATUS_LABELS[debtor.status] || debtor.status}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Amount — data, not a status or a CTA, so plain neutral
                        text rather than the accent block this used to be. */}
                    <div className="bg-surface-hover rounded-2xl px-5 py-4 text-center">
                        <p className="text-xs text-text-tertiary uppercase tracking-wide mb-1">Monto Adeudado</p>
                        <p className="text-3xl font-bold font-mono text-text-primary">
                            USD {Number(debtor?.amountOwed || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </p>
                    </div>

                    {/* Details grid */}
                    <div className="grid grid-cols-2 gap-2">
                        {[
                            { label: "Email", value: debtor?.email || "—" },
                            { label: "Teléfono", value: debtor?.telephone || "—" },
                            { label: "Cédula", value: debtor?.cedulaIdentidad || "—" },
                            { label: "RUC", value: debtor?.ruc || "—" },
                            { label: "N° Factura", value: debtor?.invoiceNumber || "—" },
                            { label: "Creado", value: debtor?.createdAt ? new Date(debtor.createdAt).toLocaleDateString("es-EC") : "—" },
                        ].map((item, i) => (
                            <div key={i} className="bg-surface-hover rounded-xl px-3 py-2.5">
                                <p className="text-[9px] text-text-tertiary uppercase tracking-wide mb-0.5">{item.label}</p>
                                <p className="text-xs font-medium text-text-primary truncate">{item.value}</p>
                            </div>
                        ))}
                    </div>

                    {/* Address */}
                    {debtor?.address && (
                        <div className="bg-surface-hover rounded-xl px-3 py-2.5">
                            <p className="text-[9px] text-text-tertiary uppercase tracking-wide mb-0.5">Dirección</p>
                            <p className="text-xs font-medium text-text-primary">{debtor.address}</p>
                        </div>
                    )}

                    {/* Activity log */}
                    <div>
                        <p className="text-xs font-semibold text-text-secondary mb-3">Historial de Actividad</p>
                        {logsLoading ? (
                            <div className="flex justify-center py-4">
                                <div className="w-5 h-5 border-2 border-text-tertiary border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        ) : logs.length === 0 ? (
                            <p className="text-xs text-text-tertiary text-center py-4">Sin actividad registrada</p>
                        ) : (
                            <div className="space-y-2">
                                {logs.slice(0, 8).map(log => {
                                    const meta = LOG_META[log.event] || { label: log.event, color: "var(--color-accent)", bg: "var(--color-accent-bg)" };
                                    return (
                                        <div key={log.id} className="flex items-start gap-2.5 p-2.5 bg-surface-hover rounded-xl">
                                            <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0 mt-0.5"
                                                  style={{ color: meta.color, background: meta.bg }}>
                                                {meta.label}
                                            </span>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[10px] text-text-secondary truncate">{log.detail}</p>
                                                <p className="text-[9px] text-text-tertiary mt-0.5">
                                                    {new Date(log.createdAt).toLocaleString("es-EC")}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-border-subtle">
                    <a href="/admin"
                       className="block w-full text-center text-xs font-semibold text-text-secondary border border-border-default py-2.5 rounded-xl hover:bg-surface-hover hover:text-text-primary transition">
                        Ver en Panel Administrativo →
                    </a>
                </div>
            </div>
        </>
    );
}

export default function BandejaPage() {
    const { user, isLoaded } = useUser();
    const router = useRouter();

    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(null);
    const [filter, setFilter] = useState("all");
    const [replyText, setReplyText] = useState("");
    const [sending, setSending] = useState(false);
    const [error, setError] = useState("");
    const [replySuccess, setReplySuccess] = useState(false);
    const [slideDebtor, setSlideDebtor] = useState(null);

    useEffect(() => {
        if (!isLoaded) return;
        if (!user) { router.push("/sign-in"); return; }
        if (user.publicMetadata?.role !== "admin") router.push("/client");
    }, [isLoaded, user, router]);

    const fetchMessages = useCallback(async () => {
        try {
            const params = new URLSearchParams();
            if (filter === "unread") params.set("unread", "true");
            if (filter === "email") params.set("channel", "EMAIL");
            if (filter === "sms") params.set("channel", "SMS");
            const res = await fetch(`/api/admin/inbound-messages?${params}`, { credentials: "include" });
            if (!res.ok) throw new Error("Error al cargar mensajes");
            const data = await res.json();
            setMessages(data);
        } catch (err) {
            console.error(err);
            setError("Error al cargar mensajes");
        } finally {
            setLoading(false);
        }
    }, [filter]);

    useEffect(() => {
        if (!isLoaded || !user) return;
        fetchMessages();
    }, [isLoaded, user, fetchMessages]);

    useEffect(() => {
        const interval = setInterval(fetchMessages, 30000);
        return () => clearInterval(interval);
    }, [fetchMessages]);

    const handleSelect = (msg) => {
        setSelected(msg);
        setReplyText("");
        setReplySuccess(false);
        if (!msg.readByClientAt) handleMarkRead(msg.id, true);
    };

    const handleMarkRead = async (id, read) => {
        try {
            await fetch("/api/admin/inbound-messages", {
                method: "PATCH",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, read }),
            });
            setMessages(prev => prev.map(m => m.id === id
                ? { ...m, readByClientAt: read ? new Date().toISOString() : null }
                : m
            ));
            if (selected?.id === id) {
                setSelected(prev => ({ ...prev, readByClientAt: read ? new Date().toISOString() : null }));
            }
        } catch (err) { console.error(err); }
    };

    const handleSendReply = async () => {
        if (!replyText.trim() || !selected) return;
        setSending(true);
        try {
            const res = await fetch("/api/admin/inbound-messages/reply", {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messageId: selected.id,
                    content: replyText,
                    debtorId: selected.debtorId,
                }),
            });
            if (!res.ok) throw new Error("Error al enviar");
            setReplyText("");
            setReplySuccess(true);
            setTimeout(() => setReplySuccess(false), 3000);
            await fetchMessages();
        } catch (err) {
            console.error(err);
            setError("Error al enviar la respuesta");
        } finally {
            setSending(false);
        }
    };

    const unreadCount = messages.filter(m => !m.readByClientAt).length;

    const stats = useMemo(() => ({
        nuevas: messages.filter(m => !m.readByClientAt).length,
        total: messages.length,
        email: messages.filter(m => m.channel === "EMAIL").length,
        sms: messages.filter(m => m.channel === "SMS").length,
    }), [messages]);

    const filteredMessages = useMemo(() => {
        if (filter === "unread") return messages.filter(m => !m.readByClientAt);
        if (filter === "email") return messages.filter(m => m.channel === "EMAIL");
        if (filter === "sms") return messages.filter(m => m.channel === "SMS");
        return messages;
    }, [messages, filter]);

    if (loading) return (
        <div data-density="compact" className="min-h-screen bg-surface-page flex items-center justify-center">
            <div className="text-center">
                <div className="w-8 h-8 border-2 border-text-tertiary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-sm text-text-tertiary">Cargando bandeja...</p>
            </div>
        </div>
    );

    return (
        <main data-density="compact" className="min-h-screen bg-surface-page">

            {slideDebtor && (
                <DebtorSlidePanel
                    debtor={slideDebtor}
                    onClose={() => setSlideDebtor(null)}
                />
            )}

            {/* Top bar */}
            <div className="bg-surface-raised border-b border-border-subtle px-8 py-5">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-text-primary">Bandeja de Respuestas</h1>
                        <p className="text-xs text-text-tertiary mt-0.5">Mensajes recibidos de deudores · actualización cada 30s</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 text-xs text-success bg-success-bg px-3 py-1.5 rounded-full">
                            <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse"></div>
                            En vivo
                        </div>
                        <button onClick={fetchMessages}
                                className="text-xs text-text-secondary border border-border-default px-3 py-1.5 rounded-xl hover:bg-surface-hover transition">
                            ↻ Actualizar
                        </button>
                    </div>
                </div>
            </div>

            {error && (
                <div className="mx-8 mt-4 bg-danger-bg border border-danger/25 rounded-xl px-4 py-3 text-sm text-danger flex items-center justify-between">
                    {error}
                    <button onClick={() => setError("")} className="text-danger/60 hover:text-danger">✕</button>
                </div>
            )}

            {/* KPI strip */}
            <div className="grid grid-cols-4 gap-4 px-8 pt-6 pb-4">
                {[
                    { label: "Sin leer", value: stats.nuevas, color: "var(--color-accent)", bg: "var(--color-accent-bg)" },
                    { label: "Total", value: stats.total, color: "var(--color-text-secondary)", bg: "var(--color-surface-hover)" },
                    { label: "Email", value: stats.email, color: "var(--color-info)", bg: "var(--color-info-bg)" },
                    { label: "SMS", value: stats.sms, color: "var(--color-success)", bg: "var(--color-success-bg)" },
                ].map((k, i) => (
                    <div key={i} className="bg-surface-raised rounded-2xl px-5 py-4 border border-border-subtle shadow-sm flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold flex-shrink-0"
                             style={{ background: k.bg, color: k.color }}>
                            {k.value}
                        </div>
                        <p className="text-xs text-text-tertiary">{k.label}</p>
                    </div>
                ))}
            </div>

            {/* Main layout */}
            <div className="px-8 pb-8 grid gap-4" style={{ gridTemplateColumns: "300px 1fr", minHeight: "calc(100vh - 220px)" }}>

                {/* Left — message list */}
                <div className="bg-surface-raised rounded-2xl border border-border-subtle shadow-sm overflow-hidden flex flex-col">
                    <div className="px-4 pt-4 pb-3 border-b border-border-subtle">
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-sm font-semibold text-text-primary">Mensajes</p>
                            {unreadCount > 0 && (
                                <span className="bg-surface-hover text-text-primary text-[10px] font-bold px-2 py-0.5 rounded-full">
                                    {unreadCount} nuevos
                                </span>
                            )}
                        </div>
                        <div className="flex gap-1 bg-surface-hover p-1 rounded-xl">
                            {[
                                { id: "all", label: "Todos" },
                                { id: "unread", label: "Sin leer" },
                                { id: "email", label: "Email" },
                                { id: "sms", label: "SMS" },
                            ].map(f => (
                                <button key={f.id} onClick={() => setFilter(f.id)}
                                        className={`flex-1 text-[10px] py-1.5 rounded-lg font-medium transition-all ${
                                            filter === f.id
                                                ? "bg-surface-raised text-text-primary shadow-sm"
                                                : "text-text-tertiary hover:text-text-secondary"
                                        }`}>
                                    {f.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto divide-y divide-border-subtle">
                        {filteredMessages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-text-tertiary gap-3">
                                <span className="text-4xl">📭</span>
                                <p className="text-xs">{filter === "unread" ? "Todo al día" : "Sin mensajes"}</p>
                            </div>
                        ) : filteredMessages.map(msg => {
                            const isRead = !!msg.readByClientAt;
                            const isSel = selected?.id === msg.id;
                            return (
                                <div key={msg.id}
                                     onClick={() => handleSelect(msg)}
                                     className={`px-4 py-3.5 cursor-pointer transition-all relative ${
                                         isSel ? "bg-surface-hover" : "hover:bg-surface-hover/80"
                                     }`}>
                                    {isSel && <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-accent rounded-r-full"></div>}
                                    <div className="flex items-start gap-3">
                                        <Avatar name={msg.debtor?.name} />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <p className={`text-xs flex-1 truncate ${isRead ? "text-text-secondary font-normal" : "text-text-primary font-semibold"}`}>
                                                    {msg.debtor?.name || "Desconocido"}
                                                </p>
                                                <span className="text-[9px] text-text-tertiary flex-shrink-0">{timeAgo(msg.receivedAt)}</span>
                                            </div>
                                            {msg.subject && <p className="text-[10px] text-text-secondary truncate mb-0.5">{msg.subject}</p>}
                                            <p className="text-[11px] text-text-tertiary truncate">{msg.content}</p>
                                            <div className="flex items-center gap-1.5 mt-1.5">
                                                <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-md ${
                                                    msg.channel === "EMAIL" ? "bg-info-bg text-info" : "bg-success-bg text-success"
                                                }`}>
                                                    {msg.channel === "EMAIL" ? "✉ email" : "💬 sms"}
                                                </span>
                                                {!isRead && <div className="w-1.5 h-1.5 rounded-full bg-text-primary ml-auto flex-shrink-0"></div>}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Right — thread view */}
                <div className="bg-surface-raised rounded-2xl border border-border-subtle shadow-sm flex flex-col overflow-hidden">
                    {!selected ? (
                        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-text-disabled">
                            <div className="w-16 h-16 rounded-2xl bg-surface-hover flex items-center justify-center text-3xl">📬</div>
                            <p className="text-sm text-text-tertiary">Selecciona una conversación</p>
                        </div>
                    ) : (
                        <>
                            {/* Thread header */}
                            <div className="px-6 py-4 border-b border-border-subtle">
                                <div className="flex items-start gap-4">
                                    <button onClick={() => setSlideDebtor(selected.debtor)} className="group relative flex-shrink-0">
                                        <Avatar name={selected.debtor?.name} size="lg" />
                                        <div className="absolute inset-0 rounded-full bg-scrim/0 group-hover:bg-scrim/10 transition flex items-center justify-center">
                                            <span className="text-[8px] text-surface-page opacity-0 group-hover:opacity-100 font-bold">ver</span>
                                        </div>
                                    </button>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-1">
                                            <button onClick={() => setSlideDebtor(selected.debtor)}
                                                    className="text-base font-bold text-text-primary hover:underline transition truncate">
                                                {selected.debtor?.name || "Desconocido"}
                                            </button>
                                            {selected.debtor?.status && (
                                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                                                      style={{
                                                          background: STATUS_COLORS[selected.debtor.status]?.bg || "var(--color-surface-hover)",
                                                          color: STATUS_COLORS[selected.debtor.status]?.color || "var(--color-text-secondary)"
                                                      }}>
                                                    {STATUS_LABELS[selected.debtor.status] || selected.debtor.status}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-4 flex-wrap">
                                            <span className="text-[11px] text-text-tertiary">✉ {selected.sender}</span>
                                            {selected.debtor?.invoiceNumber && (
                                                <span className="text-[11px] text-text-tertiary">🧾 {selected.debtor.invoiceNumber}</span>
                                            )}
                                            {selected.debtor?.amountOwed && (
                                                <span className="text-[11px] font-semibold font-mono text-text-primary">
                                                    USD {Number(selected.debtor.amountOwed).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <button onClick={() => setSlideDebtor(selected.debtor)}
                                                className="text-[10px] border border-border-default text-text-secondary rounded-lg px-3 py-1.5 hover:bg-surface-hover hover:text-text-primary transition">
                                            👤 Ver perfil
                                        </button>
                                        {selected.readByClientAt ? (
                                            <button onClick={() => handleMarkRead(selected.id, false)}
                                                    className="text-[10px] border border-border-default rounded-lg px-3 py-1.5 text-text-tertiary hover:bg-surface-hover transition">
                                                ↩ No leído
                                            </button>
                                        ) : (
                                            <button onClick={() => handleMarkRead(selected.id, true)}
                                                    className="text-[10px] border border-success/30 rounded-lg px-3 py-1.5 text-success bg-success-bg hover:bg-success-bg/70 transition">
                                                ✓ Leído
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Message body */}
                            <div className="flex-1 px-6 py-6 overflow-y-auto">
                                <div className="flex gap-3 mb-6">
                                    <button onClick={() => setSlideDebtor(selected.debtor)} className="flex-shrink-0">
                                        <Avatar name={selected.debtor?.name} />
                                    </button>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <button onClick={() => setSlideDebtor(selected.debtor)}
                                                    className="text-xs font-semibold text-text-secondary hover:text-text-primary hover:underline transition">
                                                {selected.debtor?.name}
                                            </button>
                                            <span className="text-[9px] text-text-tertiary">
                                                {new Date(selected.receivedAt).toLocaleString("es-EC")}
                                            </span>
                                            <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-md ${
                                                selected.channel === "EMAIL" ? "bg-info-bg text-info" : "bg-success-bg text-success"
                                            }`}>
                                                {selected.channel === "EMAIL" ? "✉ email" : "💬 sms"}
                                            </span>
                                        </div>
                                        {selected.subject && (
                                            <p className="text-xs text-text-secondary font-medium mb-2">Asunto: {selected.subject}</p>
                                        )}
                                        <div className="bg-surface-hover border border-border-subtle rounded-2xl rounded-tl-sm px-5 py-4 text-sm text-text-primary leading-relaxed whitespace-pre-wrap max-w-2xl">
                                            {selected.content}
                                        </div>
                                    </div>
                                </div>

                                {replySuccess && (
                                    <div className="flex items-center gap-2 bg-success-bg border border-success/20 rounded-xl px-4 py-3 text-sm text-success mb-4">
                                        <span>✓</span> Respuesta enviada correctamente
                                    </div>
                                )}
                            </div>

                            {/* Reply bar */}
                            <div className="px-6 py-4 border-t border-border-subtle bg-surface-hover/50">
                                <div className="flex items-start gap-3">
                                    <Avatar name={user?.fullName || "Admin"} />
                                    <div className="flex-1">
                                        <textarea
                                            rows={3}
                                            placeholder={`Responder a ${selected.debtor?.name || "deudor"}...`}
                                            value={replyText}
                                            onChange={e => setReplyText(e.target.value)}
                                            onKeyDown={e => {
                                                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSendReply();
                                            }}
                                            className="w-full border border-border-default rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent bg-surface-raised resize-none leading-relaxed"
                                        />
                                        <div className="flex items-center justify-between mt-2">
                                            <p className="text-[10px] text-text-tertiary">⌘ + Enter para enviar</p>
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => setReplyText("")}
                                                        className="text-xs text-text-tertiary px-3 py-1.5 hover:text-text-secondary transition">
                                                    Limpiar
                                                </button>
                                                <button
                                                    onClick={handleSendReply}
                                                    disabled={!replyText.trim() || sending}
                                                    className="bg-accent text-accent-fg px-5 py-1.5 rounded-xl text-xs font-semibold hover:bg-accent-hover transition disabled:opacity-30 flex items-center gap-1.5">
                                                    {sending ? (
                                                        <>
                                                            <div className="w-3 h-3 border border-accent-fg border-t-transparent rounded-full animate-spin"></div>
                                                            Enviando...
                                                        </>
                                                    ) : "Enviar respuesta →"}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </main>
    );
}