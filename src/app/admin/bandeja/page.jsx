"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";

const TAG_META = {
    ACUERDO: { label: "Acuerdo", bg: "#D1FAE5", color: "#065F46" },
    PAGO: { label: "Pago", bg: "#DBEAFE", color: "#1E3A8A" },
    DISPUTA: { label: "Disputa", bg: "#FEE2E2", color: "#991B1B" },
};

const STATUS_LABELS = {
    PENDIENTE: "Pendiente",
    EN_GESTION: "En Gestión",
    ACUERDO_DE_PAGO: "Acuerdo de Pago",
    PAGADO: "Pagado",
    ESCALADO_JUDICIAL: "Escalado Judicial",
};

function timeAgo(isoStr) {
    const diff = Date.now() - new Date(isoStr).getTime();
    const mins = Math.floor(diff / 60000);
    const hrs = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 60) return `${mins}m`;
    if (hrs < 24) return `${hrs}h`;
    return `${days}d`;
}

function getInitials(name) {
    return (name || "??").split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();
}

export default function BandejaPage() {
    const { user, isLoaded } = useUser();
    const router = useRouter();

    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(null);
    const [filter, setFilter] = useState("all");
    const [replyText, setReplyText] = useState("");
    const [error, setError] = useState("");

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

    // Poll for new messages every 30 seconds
    useEffect(() => {
        const interval = setInterval(fetchMessages, 30000);
        return () => clearInterval(interval);
    }, [fetchMessages]);

    const handleSelect = (msg) => {
        setSelected(msg);
        setReplyText("");
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
        } catch (err) {
            console.error(err);
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
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
                <div className="w-8 h-8 border-2 border-[#443CA3] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-sm text-[#443CA3]/50">Cargando mensajes...</p>
            </div>
        </div>
    );

    return (
        <main className="min-h-screen bg-gray-50 px-8 py-8">

            {/* Header */}
            <div className="flex items-center justify-between bg-white px-6 py-4 rounded-2xl shadow-sm border border-gray-100 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Bandeja de Respuestas</h1>
                    <p className="text-xs text-gray-400 mt-0.5">
                        Mensajes recibidos de deudores · actualización cada 30 seg
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                        <div className="w-2 h-2 rounded-full bg-[#21FE83] animate-pulse"></div>
                        En vivo
                    </div>
                    <button
                        onClick={fetchMessages}
                        className="border border-gray-200 text-gray-500 px-3 py-2 rounded-xl text-xs hover:bg-gray-50 transition"
                    >
                        ↻ Actualizar
                    </button>
                </div>
            </div>

            {error && (
                <div className="mb-4 bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-500">
                    {error}
                </div>
            )}

            {/* KPI Cards */}
            <div className="grid grid-cols-4 gap-4 mb-6">
                {[
                    { label: "No leídos", value: stats.nuevas, color: "#443CA3", sub: "pendientes de revisar" },
                    { label: "Total mensajes", value: stats.total, color: "#443CA3", sub: "todos los canales" },
                    { label: "Por email", value: stats.email, color: "#185FA5", sub: "respuestas email" },
                    { label: "Por SMS", value: stats.sms, color: "#065F46", sub: "respuestas SMS" },
                ].map((k, i) => (
                    <div key={i} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                        <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">{k.label}</p>
                        <p className="text-3xl font-bold" style={{ color: k.color }}>{k.value}</p>
                        <p className="text-xs text-gray-300 mt-1">{k.sub}</p>
                    </div>
                ))}
            </div>

            {/* Main inbox grid */}
            <div className="grid gap-4" style={{ gridTemplateColumns: "280px 1fr" }}>

                {/* Inbox list */}
                <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden flex flex-col">
                    <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-700 flex-1">Mensajes</p>
                        {unreadCount > 0 && (
                            <span className="bg-[#443CA3] text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
                                {unreadCount}
                            </span>
                        )}
                    </div>

                    {/* Filter tabs */}
                    <div className="flex gap-1 px-3 py-2 border-b border-gray-50">
                        {[
                            { id: "all", label: "Todos" },
                            { id: "unread", label: "No leídos" },
                            { id: "email", label: "Email" },
                            { id: "sms", label: "SMS" },
                        ].map(f => (
                            <button key={f.id} onClick={() => setFilter(f.id)}
                                    className={`text-[10px] px-2.5 py-1 rounded-lg transition-all ${
                                        filter === f.id ? "bg-[#443CA3] text-white" : "text-gray-400 hover:text-[#443CA3]"
                                    }`}>
                                {f.label}
                            </button>
                        ))}
                    </div>

                    {/* Message rows */}
                    <div className="flex-1 overflow-y-auto">
                        {filteredMessages.length === 0 ? (
                            <div className="text-center py-12 text-gray-300">
                                <p className="text-3xl mb-2">📭</p>
                                <p className="text-xs">
                                    {filter === "unread" ? "No hay mensajes sin leer" : "Sin mensajes"}
                                </p>
                            </div>
                        ) : filteredMessages.map(msg => {
                            const isRead = !!msg.readByClientAt;
                            return (
                                <div key={msg.id}
                                     onClick={() => handleSelect(msg)}
                                     className={`px-4 py-3 border-b border-gray-50 cursor-pointer transition-all ${
                                         selected?.id === msg.id
                                             ? "bg-[#F7F8FF] border-l-2 border-l-[#443CA3]"
                                             : "hover:bg-gray-50"
                                     }`}>
                                    <div className="flex items-center gap-2 mb-1">
                                        <p className={`text-xs flex-1 truncate ${
                                            isRead ? "text-gray-500 font-normal" : "text-[#443CA3] font-semibold"
                                        }`}>
                                            {msg.debtor?.name || "Desconocido"}
                                        </p>
                                        <span className="text-[10px] text-gray-300">
                                            {timeAgo(msg.receivedAt)}
                                        </span>
                                    </div>
                                    {msg.subject && (
                                        <p className="text-[10px] text-gray-400 truncate mb-0.5 font-medium">{msg.subject}</p>
                                    )}
                                    <p className="text-[11px] text-gray-400 truncate mb-1.5">{msg.content}</p>
                                    <div className="flex items-center gap-1.5">
                                        <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-md ${
                                            msg.channel === "EMAIL"
                                                ? "bg-blue-50 text-blue-700"
                                                : "bg-emerald-50 text-emerald-700"
                                        }`}>
                                            {msg.channel === "EMAIL" ? "email" : "sms"}
                                        </span>
                                        {msg.debtor?.user?.name && (
                                            <span className="text-[9px] text-gray-300">{msg.debtor.user.name}</span>
                                        )}
                                        {!isRead && (
                                            <div className="w-1.5 h-1.5 rounded-full bg-[#443CA3] ml-auto flex-shrink-0"></div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Thread panel */}
                <div className="bg-white border border-gray-100 rounded-2xl shadow-sm flex flex-col overflow-hidden" style={{ minHeight: "500px" }}>
                    {!selected ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-200 gap-3">
                            <p className="text-5xl">📬</p>
                            <p className="text-sm">Selecciona una conversación</p>
                        </div>
                    ) : (
                        <>
                            {/* Thread header */}
                            <div className="flex items-start gap-3 px-5 py-4 border-b border-gray-100">
                                <div className="w-10 h-10 rounded-full bg-[#EEEDFE] flex items-center justify-center text-[#443CA3] font-bold text-sm flex-shrink-0">
                                    {getInitials(selected.debtor?.name)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-800">
                                        {selected.debtor?.name || "Desconocido"}
                                    </p>
                                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                                        <span className="text-[10px] text-gray-400">
                                            ✉ {selected.sender}
                                        </span>
                                        {selected.debtor?.invoiceNumber && (
                                            <span className="text-[10px] text-gray-400">
                                                🧾 {selected.debtor.invoiceNumber}
                                            </span>
                                        )}
                                        {selected.debtor?.amountOwed && (
                                            <span className="text-[10px] text-gray-400">
                                                💵 USD {Number(selected.debtor.amountOwed).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </span>
                                        )}
                                        {selected.debtor?.status && (
                                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
                                                {STATUS_LABELS[selected.debtor.status] || selected.debtor.status}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    {selected.readByClientAt ? (
                                        <button
                                            onClick={() => handleMarkRead(selected.id, false)}
                                            className="text-[10px] border border-gray-200 rounded-lg px-3 py-1.5 text-gray-400 hover:bg-gray-50 transition"
                                        >
                                            ↩ No leído
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleMarkRead(selected.id, true)}
                                            className="text-[10px] border border-emerald-200 rounded-lg px-3 py-1.5 text-emerald-600 hover:bg-emerald-50 transition"
                                        >
                                            ✓ Marcar leído
                                        </button>
                                    )}
                                    <button
                                        onClick={() => router.push("/admin")}
                                        className="text-[10px] border border-gray-200 rounded-lg px-3 py-1.5 text-gray-400 hover:bg-gray-50 transition"
                                    >
                                        👤 Ver deudor
                                    </button>
                                </div>
                            </div>

                            {/* Message content */}
                            <div className="flex-1 px-5 py-5 flex flex-col gap-4 overflow-y-auto">
                                {/* Incoming message */}
                                <div className="flex justify-start">
                                    <div className="max-w-[76%]">
                                        <p className="text-[9px] text-gray-400 mb-1">
                                            {selected.debtor?.name} · {selected.channel === "EMAIL" ? "email" : "sms"} · {new Date(selected.receivedAt).toLocaleString("es-EC")}
                                        </p>
                                        {selected.subject && (
                                            <p className="text-xs font-semibold text-gray-600 mb-1">
                                                Asunto: {selected.subject}
                                            </p>
                                        )}
                                        <div className="px-4 py-3 rounded-2xl rounded-bl-sm text-xs leading-relaxed bg-gray-50 text-gray-700 border border-gray-100 whitespace-pre-wrap">
                                            {selected.content}
                                        </div>
                                        <p className="text-[9px] text-gray-300 mt-1">
                                            De: {selected.sender}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Reply bar */}
                            <div className="px-5 py-3 border-t border-gray-100 flex items-center gap-3">
                                <input
                                    type="text"
                                    placeholder={`Responder a ${selected.debtor?.name || "deudor"}...`}
                                    value={replyText}
                                    onChange={e => setReplyText(e.target.value)}
                                    className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[#443CA3] bg-gray-50"
                                />
                                <button className="border border-gray-200 text-gray-400 px-3 py-2.5 rounded-xl text-xs hover:bg-gray-50 transition">
                                    📎
                                </button>
                                <button
                                    disabled={!replyText.trim()}
                                    className="bg-[#443CA3] text-white px-4 py-2.5 rounded-xl text-xs font-medium hover:bg-[#3A3391] transition disabled:opacity-30"
                                >
                                    Enviar →
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </main>
    );
}