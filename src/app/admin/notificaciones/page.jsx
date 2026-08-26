"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { toE164Ec } from "@/lib/phone";
import { SMS_TEMPLATES, buildSmsFromTemplate } from "@/lib/sms/templates";

const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

const NOTIF_STATUS_META = {
    SENT: { label: "Enviado", color: "var(--color-info)", bg: "var(--color-info-bg)" },
    DELIVERED: { label: "Entregado", color: "var(--color-success)", bg: "var(--color-success-bg)" },
    FAILED: { label: "Fallido", color: "var(--color-danger)", bg: "var(--color-danger-bg)" },
    INVALID_NUMBER: { label: "N° inválido", color: "var(--color-neutral-event)", bg: "var(--color-neutral-event-bg)" },
    OPT_OUT: { label: "Opt-out", color: "var(--color-text-tertiary)", bg: "var(--color-surface-hover)" },
};

function NotifStatusBadge({ status }) {
    const meta = NOTIF_STATUS_META[status] || { label: status, color: "var(--color-accent)", bg: "var(--color-accent-bg)" };
    return (
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ color: meta.color, background: meta.bg }}>
            {meta.label}
        </span>
    );
}

function todayEcDateString() {
    return new Date().toLocaleDateString("es-EC", { timeZone: "America/Guayaquil" });
}

/* ============================== COMPOSER ============================== */

function Composer({ clients }) {
    const [channel, setChannel] = useState("SMS");
    const [search, setSearch] = useState("");
    const [selectedIds, setSelectedIds] = useState(() => new Set());
    const [templateId, setTemplateId] = useState(SMS_TEMPLATES[0].id);
    const [subject, setSubject] = useState("");
    const [body, setBody] = useState("");
    const [sending, setSending] = useState(false);
    const [toast, setToast] = useState(null);
    const [showLegalConfirm, setShowLegalConfirm] = useState(false);

    const flatDebtors = useMemo(() =>
        clients.flatMap(c =>
            c.debtorRecords.map(d => ({
                ...d,
                clientName: c.name || c.email || "Cliente",
                clientShortName: c.shortName || null,
            }))
        ), [clients]
    );

    const filteredDebtors = useMemo(() => {
        const term = search.toLowerCase();
        if (!term) return flatDebtors;
        return flatDebtors.filter(d =>
            d.name.toLowerCase().includes(term) || d.clientName.toLowerCase().includes(term)
        );
    }, [flatDebtors, search]);

    const selectedDebtors = useMemo(
        () => flatDebtors.filter(d => selectedIds.has(d.id)),
        [flatDebtors, selectedIds]
    );

    const toggleOne = (id) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    const allFilteredSelected = filteredDebtors.length > 0 && filteredDebtors.every(d => selectedIds.has(d.id));
    const toggleAllFiltered = () => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (allFilteredSelected) filteredDebtors.forEach(d => next.delete(d.id));
            else filteredDebtors.forEach(d => next.add(d.id));
            return next;
        });
    };

    // Recipient breakdown — must reflect only who will actually receive.
    // SMS: opt-out and unparsable numbers block a send outright; a client
    // with no shortName also blocks it (shortName is a hard prerequisite,
    // not a cosmetic default) even though the number itself is fine.
    const breakdown = useMemo(() => {
        if (channel === "SMS") {
            let willSend = 0, noNumber = 0, optOut = 0, missingShortName = 0;
            for (const d of selectedDebtors) {
                if (d.smsOptOut) { optOut++; continue; }
                if (!toE164Ec(d.telephone)) { noNumber++; continue; }
                if (!d.clientShortName) { missingShortName++; continue; }
                willSend++;
            }
            return { total: selectedDebtors.length, willSend, noNumber, optOut, missingShortName };
        }
        const withEmail = selectedDebtors.filter(d => d.email).length;
        return { total: selectedDebtors.length, willSend: withEmail, noEmail: selectedDebtors.length - withEmail };
    }, [selectedDebtors, channel]);

    const template = SMS_TEMPLATES.find(t => t.id === templateId);

    // Preview substitutes the FULL debtor name (no degradation) so the
    // character count is an honest signal of budget pressure for this
    // specific template+debtor pairing. The actual send still runs the
    // allocator (two tokens -> one token -> truncate) independently — the
    // preview is authoring feedback, not a simulation of the send path.
    const previewDebtor = selectedDebtors[0];
    const preview = useMemo(() => {
        if (channel !== "SMS" || !template || !previewDebtor) return null;
        try {
            return template.build({
                name: previewDebtor.name,
                amount: Number(previewDebtor.amountOwed).toFixed(2),
                shortName: previewDebtor.clientShortName || "(sin shortName)",
                date: todayEcDateString(),
                url: "https://recupera.com.ec/p/abcdefgh",
            });
        } catch {
            return null;
        }
    }, [channel, template, previewDebtor]);

    const showToast = (type, text) => {
        setToast({ type, text });
        setTimeout(() => setToast(null), 6000);
    };

    const doSend = async (confirmed = false) => {
        setSending(true);
        try {
            const payload = channel === "SMS"
                ? { channel, debtorIds: [...selectedIds], templateId, confirmed }
                : { channel, debtorIds: [...selectedIds], subject, body };
            const res = await fetch("/api/admin/notifications/send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Error al enviar");
            showToast("success", `${data.sent?.length ?? 0} enviado(s), ${data.failed?.length ?? 0} fallido(s), ${data.skipped?.length ?? 0} omitido(s).`);
            setSelectedIds(new Set());
        } catch (err) {
            showToast("error", err.message || "Error al enviar");
        } finally {
            setSending(false);
            setShowLegalConfirm(false);
        }
    };

    const handleSendClick = () => {
        if (breakdown.willSend === 0) return;
        if (channel === "SMS" && template?.restricted) {
            setShowLegalConfirm(true);
            return;
        }
        doSend(false);
    };

    return (
        <div className="space-y-5">
            {toast && (
                <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-xl border max-w-sm bg-surface-overlay ${
                    toast.type === "success" ? "border-success/25 text-success" : "border-danger/25 text-danger"
                }`}>
                    <span className="text-xl">{toast.type === "success" ? "✅" : "❌"}</span>
                    <p className="text-sm font-medium">{toast.text}</p>
                    <button onClick={() => setToast(null)} className={`ml-2 text-text-tertiary hover:text-text-secondary text-lg leading-none ${focusRing} ring-offset-surface-overlay`}>✕</button>
                </div>
            )}

            {/* TEMPLATE 3 CONFIRMATION DIALOG */}
            {showLegalConfirm && (
                <div className="fixed inset-0 bg-scrim/40 z-50 flex items-center justify-center p-4" onClick={() => setShowLegalConfirm(false)}>
                    <div className="bg-surface-overlay rounded-2xl shadow-2xl w-full max-w-md p-6 border-2 border-danger/40" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-3 mb-4">
                            <span className="text-2xl">⚠️</span>
                            <h2 className="text-lg font-bold text-danger">Aviso legal — requiere autorización</h2>
                        </div>
                        <p className="text-sm text-text-secondary mb-4">
                            Está a punto de enviar el <strong>aviso de inicio de proceso legal</strong> a{" "}
                            <strong>{breakdown.willSend}</strong> deudor(es). Este mensaje informa que se iniciará un
                            proceso legal en 5 días. Esta acción queda registrada como <code className="text-xs bg-danger-bg px-1.5 py-0.5 rounded">LEGAL_NOTICE_SENT</code> y
                            requiere autorización explícita del cliente.
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setShowLegalConfirm(false)}
                                    className={`flex-1 border border-border-default text-text-secondary py-2.5 rounded-xl text-sm hover:bg-surface-hover transition ${focusRing} ring-offset-surface-overlay`}>
                                Cancelar
                            </button>
                            <button onClick={() => doSend(true)} disabled={sending}
                                    className={`flex-1 bg-danger text-surface-page py-2.5 rounded-xl text-sm font-bold hover:opacity-90 transition disabled:opacity-50 ${focusRing} ring-offset-surface-overlay`}>
                                {sending ? "Enviando..." : "Confirmar y enviar"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* CHANNEL TOGGLE */}
            <div className="flex items-center gap-1 bg-surface-raised border border-border-default rounded-xl p-1 w-fit">
                {["SMS", "EMAIL"].map(c => (
                    <button key={c} onClick={() => setChannel(c)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${focusRing} ring-offset-surface-raised ${
                                channel === c ? "bg-accent text-surface-page" : "text-text-secondary hover:text-text-primary"
                            }`}>
                        {c === "SMS" ? "SMS" : "Correo"}
                    </button>
                ))}
            </div>

            <div className="grid lg:grid-cols-[1fr_1.2fr] gap-5">

                {/* RECIPIENT PICKER */}
                <div className="bg-surface-raised border border-border-subtle rounded-2xl overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-border-subtle space-y-3">
                        <input type="text" placeholder="Buscar deudor o cliente..." value={search}
                               onChange={e => setSearch(e.target.value)}
                               className={`w-full border border-border-default rounded-xl px-3 py-2 text-sm bg-surface-page text-text-primary focus:outline-none focus:border-accent ${focusRing} ring-offset-surface-raised`} />
                        <label className="flex items-center gap-2 text-xs text-text-secondary">
                            <input type="checkbox" checked={allFilteredSelected} onChange={toggleAllFiltered}
                                   className={`rounded accent-accent ${focusRing} ring-offset-surface-raised`} />
                            Seleccionar todos los visibles ({filteredDebtors.length})
                        </label>
                    </div>
                    <div className="max-h-[420px] overflow-y-auto divide-y divide-border-subtle">
                        {filteredDebtors.length === 0 ? (
                            <p className="text-sm text-text-tertiary text-center py-8">Sin resultados</p>
                        ) : filteredDebtors.map(d => (
                            <label key={d.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-hover cursor-pointer">
                                <input type="checkbox" checked={selectedIds.has(d.id)} onChange={() => toggleOne(d.id)}
                                       className={`rounded accent-accent flex-shrink-0 ${focusRing} ring-offset-surface-raised`} />
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm text-text-primary font-medium truncate">{d.name}</p>
                                    <p className="text-xs text-text-tertiary truncate">{d.clientName} · {d.telephone || "sin teléfono"} · {d.email || "sin email"}</p>
                                </div>
                                {d.smsOptOut && <span className="text-[10px] text-text-tertiary flex-shrink-0">opt-out</span>}
                            </label>
                        ))}
                    </div>
                </div>

                {/* COMPOSER PANEL */}
                <div className="space-y-4">

                    {/* BREAKDOWN */}
                    <div className="bg-surface-raised border border-border-subtle rounded-2xl p-4">
                        <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wide mb-3">Destinatarios</p>
                        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                            <div><span className="text-text-tertiary">Seleccionados: </span><span className="font-mono font-semibold text-text-primary">{breakdown.total}</span></div>
                            <div><span className="text-text-tertiary">Recibirán: </span><span className="font-mono font-semibold text-success">{breakdown.willSend}</span></div>
                            {channel === "SMS" ? (
                                <>
                                    <div><span className="text-text-tertiary">Sin número válido: </span><span className="font-mono text-neutral-event">{breakdown.noNumber}</span></div>
                                    <div><span className="text-text-tertiary">Opt-out: </span><span className="font-mono text-text-tertiary">{breakdown.optOut}</span></div>
                                    <div><span className="text-text-tertiary">Sin shortName del cliente: </span><span className="font-mono text-danger">{breakdown.missingShortName}</span></div>
                                </>
                            ) : (
                                <div><span className="text-text-tertiary">Sin email: </span><span className="font-mono text-neutral-event">{breakdown.noEmail}</span></div>
                            )}
                        </div>
                    </div>

                    {channel === "SMS" ? (
                        <>
                            {/* TEMPLATE PICKER */}
                            <div className="bg-surface-raised border border-border-subtle rounded-2xl p-4">
                                <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wide mb-3">Plantilla (obligatoria — sin texto libre)</p>
                                <div className="space-y-2">
                                    {SMS_TEMPLATES.map(t => (
                                        <label key={t.id}
                                               className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                                                   templateId === t.id
                                                       ? t.restricted ? "border-danger bg-danger-bg" : "border-accent bg-accent-bg"
                                                       : "border-border-default hover:border-accent/30"
                                               }`}>
                                            <input type="radio" name="template" checked={templateId === t.id} onChange={() => setTemplateId(t.id)}
                                                   className={`mt-0.5 accent-accent ${focusRing} ring-offset-surface-raised`} />
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-text-primary flex items-center gap-2">
                                                    {t.label}
                                                    {t.restricted && (
                                                        <span className="text-[10px] font-bold uppercase tracking-wide text-danger bg-danger-bg px-1.5 py-0.5 rounded-full border border-danger/30">
                                                            Requiere autorización
                                                        </span>
                                                    )}
                                                </p>
                                                <p className="text-xs text-text-tertiary mt-0.5">{t.description}</p>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* LIVE PREVIEW */}
                            <div className="bg-surface-raised border border-border-subtle rounded-2xl p-4">
                                <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wide mb-3">
                                    Vista previa {previewDebtor ? `— ${previewDebtor.name}` : ""}
                                </p>
                                {preview ? (
                                    <>
                                        <p className="text-sm text-text-primary bg-surface-hover rounded-xl p-3 font-mono leading-relaxed">{preview}</p>
                                        <p className={`text-xs font-mono mt-2 ${preview.length > 160 ? "text-danger font-bold" : "text-text-tertiary"}`}>
                                            {preview.length} / 160 caracteres
                                            {preview.length > 160 && " — el nombre se acortará automáticamente al enviar"}
                                        </p>
                                    </>
                                ) : (
                                    <p className="text-sm text-text-tertiary">Seleccione al menos un destinatario para ver la vista previa.</p>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="bg-surface-raised border border-border-subtle rounded-2xl p-4 space-y-3">
                            <input type="text" placeholder="Asunto" value={subject} onChange={e => setSubject(e.target.value)}
                                   className={`w-full border border-border-default rounded-xl px-3 py-2.5 text-sm bg-surface-page text-text-primary focus:outline-none focus:border-accent ${focusRing} ring-offset-surface-raised`} />
                            <textarea placeholder="Mensaje..." value={body} onChange={e => setBody(e.target.value)} rows={10}
                                      className={`w-full border border-border-default rounded-xl px-3 py-2.5 text-sm bg-surface-page text-text-primary focus:outline-none focus:border-accent resize-none ${focusRing} ring-offset-surface-raised`} />
                        </div>
                    )}

                    <button
                        onClick={handleSendClick}
                        disabled={sending || breakdown.willSend === 0 || (channel === "EMAIL" && (!subject || !body))}
                        className={`w-full bg-accent text-surface-page py-3 rounded-xl text-sm font-bold hover:opacity-90 transition disabled:opacity-40 ${focusRing} ring-offset-surface-page`}>
                        {sending ? "Enviando..." : `Enviar a ${breakdown.willSend} destinatario(s)`}
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ============================== HISTORIAL ============================== */

function Historial() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [channelFilter, setChannelFilter] = useState("ALL");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [search, setSearch] = useState("");

    useEffect(() => {
        const fetchLogs = async () => {
            const res = await fetch("/api/admin/notifications", { credentials: "include" });
            if (res.ok) setLogs(await res.json());
            setLoading(false);
        };
        fetchLogs();
    }, []);

    const filtered = logs.filter(l => {
        if (channelFilter !== "ALL" && l.channel !== channelFilter) return false;
        if (statusFilter !== "ALL" && l.status !== statusFilter) return false;
        const term = search.toLowerCase();
        if (term && !(l.recipient.toLowerCase().includes(term) || l.debtor?.name.toLowerCase().includes(term))) return false;
        return true;
    });

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap gap-3 items-center">
                <input type="text" placeholder="Buscar destinatario o deudor..." value={search}
                       onChange={e => setSearch(e.target.value)}
                       className={`border border-border-default rounded-xl px-4 py-2 text-sm bg-surface-raised text-text-primary focus:outline-none focus:border-accent min-w-[220px] ${focusRing} ring-offset-surface-page`} />
                <select value={channelFilter} onChange={e => setChannelFilter(e.target.value)}
                        className={`border border-border-default rounded-xl px-4 py-2 text-sm bg-surface-raised text-text-primary focus:outline-none ${focusRing} ring-offset-surface-page`}>
                    <option value="ALL">Todos los canales</option>
                    <option value="SMS">SMS</option>
                    <option value="EMAIL">Correo</option>
                </select>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                        className={`border border-border-default rounded-xl px-4 py-2 text-sm bg-surface-raised text-text-primary focus:outline-none ${focusRing} ring-offset-surface-page`}>
                    <option value="ALL">Todos los estados</option>
                    {Object.entries(NOTIF_STATUS_META).map(([key, m]) => (
                        <option key={key} value={key}>{m.label}</option>
                    ))}
                </select>
            </div>

            <div className="bg-surface-raised rounded-2xl shadow-sm border border-border-subtle overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                        <thead>
                            <tr className="border-b border-border-default text-left text-xs text-text-tertiary uppercase tracking-wide">
                                <th className="px-4 py-2.5 font-medium">Canal</th>
                                <th className="px-2 py-2.5 font-medium">Destinatario</th>
                                <th className="px-2 py-2.5 font-medium">Deudor</th>
                                <th className="px-2 py-2.5 font-medium">Plantilla</th>
                                <th className="px-2 py-2.5 font-medium">Estado</th>
                                <th className="px-2 py-2.5 font-medium">Fecha</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-subtle">
                            {loading ? (
                                <tr><td colSpan={6} className="text-center py-10 text-text-tertiary">Cargando...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={6} className="text-center py-10 text-text-tertiary">Sin registros</td></tr>
                            ) : filtered.map(l => (
                                <tr key={l.id} className="h-10 hover:bg-surface-hover transition-colors">
                                    <td className="px-4 text-text-secondary">{l.channel === "SMS" ? "SMS" : "Correo"}</td>
                                    <td className="px-2 font-mono text-text-primary">{l.recipient}</td>
                                    <td className="px-2 text-text-secondary truncate max-w-[160px]">{l.debtor?.name || "—"}</td>
                                    <td className="px-2 text-text-tertiary">{l.template}</td>
                                    <td className="px-2"><NotifStatusBadge status={l.status} /></td>
                                    <td className="px-2 text-text-tertiary text-xs font-mono whitespace-nowrap">{new Date(l.sentAt).toLocaleString("es-EC")}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

/* ============================== PAGE ============================== */

export default function NotificacionesPage() {
    const { user, isLoaded } = useUser();
    const router = useRouter();

    const [tab, setTab] = useState("enviar");
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!isLoaded) return;
        if (user?.publicMetadata?.role !== "admin") { router.replace("/sign-in"); return; }
        const fetchClients = async () => {
            try {
                const res = await fetch("/api/admin/clients", { credentials: "include" });
                if (!res.ok) throw new Error();
                setClients(await res.json());
            } catch {
                setError("Error al cargar clientes");
            } finally {
                setLoading(false);
            }
        };
        fetchClients();
    }, [isLoaded, user, router]);

    if (!isLoaded) return null;

    return (
        <main data-density="compact" className="min-h-screen bg-surface-page px-8 py-8">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">Notificaciones</h1>
                    <p className="text-sm text-text-tertiary mt-0.5">Envío manual de SMS y correo, e historial de entregas</p>
                </div>
                <div className="flex items-center gap-1 bg-surface-raised border border-border-default rounded-xl p-1">
                    {[{ id: "enviar", label: "Enviar" }, { id: "historial", label: "Historial" }].map(t => (
                        <button key={t.id} onClick={() => setTab(t.id)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${focusRing} ring-offset-surface-raised ${
                                    tab === t.id ? "bg-accent text-surface-page" : "text-text-secondary hover:text-text-primary"
                                }`}>
                            {t.label}
                        </button>
                    ))}
                </div>
            </div>

            {error && <p className="text-sm text-danger mb-4 bg-danger-bg border border-danger/25 rounded-xl px-4 py-3">{error}</p>}

            {tab === "enviar" ? (
                loading ? <p className="text-sm text-text-tertiary">Cargando clientes...</p> : <Composer clients={clients} />
            ) : (
                <Historial />
            )}
        </main>
    );
}
