"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { AlertTriangle } from "lucide-react";
import { toE164Ec } from "@/lib/phone";
import { fillTemplate, deriveShortName, publicDebtorUrl, validateSmsTemplateBody } from "@/lib/sms/templates";

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

// Sample preview URL — the real one is derived per-debtor from
// publicDebtorUrl(debtor.publicToken), this is only for the Plantillas
// tab's live preview, which has no real debtor to draw a token from.
const SAMPLE_URL = publicDebtorUrl("abcdefgh");

/* ============================== COMPOSER ============================== */

function Composer({ clients, smsTemplates, emailTemplates, templatesLoading }) {
    const [channel, setChannel] = useState("SMS");
    const [search, setSearch] = useState("");
    const [selectedIds, setSelectedIds] = useState(() => new Set());
    const [templateId, setTemplateId] = useState(null);
    const [emailTemplateId, setEmailTemplateId] = useState("");
    const [subject, setSubject] = useState("");
    const [body, setBody] = useState("");
    const [sending, setSending] = useState(false);
    const [toast, setToast] = useState(null);
    const [showLegalConfirm, setShowLegalConfirm] = useState(false);

    // Default to the first active SMS template once the list loads —
    // can't do this at useState init time anymore since templates are
    // fetched from the DB, not a static array available at module load.
    useEffect(() => {
        if (!templateId && smsTemplates.length > 0) setTemplateId(smsTemplates[0].id);
    }, [smsTemplates, templateId]);

    const flatDebtors = useMemo(() =>
        clients.flatMap(c =>
            c.debtorRecords.map(d => ({
                ...d,
                clientName: c.name || c.email || "Cliente",
                clientId: c.id,
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
    // A missing client shortName no longer blocks the send: it falls back
    // to one derived from the client's name (deriveShortName), same as
    // the send route does, and is tracked separately so the composer can
    // warn about it without treating it as a hard stop. That's the fix —
    // blocking with no path forward was the bug.
    const breakdown = useMemo(() => {
        if (channel === "SMS") {
            let willSend = 0, noNumber = 0, optOut = 0, usingFallback = 0;
            for (const d of selectedDebtors) {
                if (d.smsOptOut) { optOut++; continue; }
                if (!toE164Ec(d.telephone)) { noNumber++; continue; }
                if (!d.clientShortName) usingFallback++;
                willSend++;
            }
            return { total: selectedDebtors.length, willSend, noNumber, optOut, usingFallback };
        }
        const withEmail = selectedDebtors.filter(d => d.email).length;
        return { total: selectedDebtors.length, willSend: withEmail, noEmail: selectedDebtors.length - withEmail };
    }, [selectedDebtors, channel]);

    const template = smsTemplates.find(t => t.id === templateId);

    // Preview substitutes the FULL debtor name (no degradation) so the
    // character count is an honest signal of budget pressure for this
    // specific template+debtor pairing. The actual send still runs the
    // allocator (two tokens -> one token -> truncate) independently — the
    // preview is authoring feedback, not a simulation of the send path.
    const previewDebtor = selectedDebtors[0];
    const previewUsesFallback = previewDebtor && !previewDebtor.clientShortName;
    const preview = useMemo(() => {
        if (channel !== "SMS" || !template || !previewDebtor) return null;
        const shortName = previewDebtor.clientShortName || deriveShortName(previewDebtor.clientName);
        return fillTemplate(template.body, {
            name: previewDebtor.name,
            amount: Number(previewDebtor.amountOwed).toFixed(2),
            shortName,
            date: todayEcDateString(),
            url: SAMPLE_URL,
        });
    }, [channel, template, previewDebtor]);

    const emailPreview = useMemo(() => {
        if (channel !== "EMAIL" || !previewDebtor) return { subject, body };
        const vars = {
            name: previewDebtor.name,
            amount: Number(previewDebtor.amountOwed).toFixed(2),
            client: previewDebtor.clientName,
            date: todayEcDateString(),
            url: SAMPLE_URL,
        };
        return { subject: fillTemplate(subject, vars), body: fillTemplate(body, vars) };
    }, [channel, subject, body, previewDebtor]);

    const applyEmailTemplate = (id) => {
        setEmailTemplateId(id);
        const t = emailTemplates.find(t => t.id === id);
        if (t) {
            setSubject(t.subject || "");
            setBody(t.body || "");
        }
    };

    const showToast = (type, text) => {
        setToast({ type, text });
        setTimeout(() => setToast(null), 6000);
    };

    const doSend = async (confirmed = false) => {
        setSending(true);
        try {
            const payload = channel === "SMS"
                ? { channel, debtorIds: [...selectedIds], templateId, confirmed }
                : { channel, debtorIds: [...selectedIds], subject, body, templateId: emailTemplateId || null };
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

            {/* TEMPLATE 3-STYLE CONFIRMATION DIALOG */}
            {showLegalConfirm && (
                <div className="fixed inset-0 bg-scrim/40 z-50 flex items-center justify-center p-4" onClick={() => setShowLegalConfirm(false)}>
                    <div className="bg-surface-overlay rounded-2xl shadow-2xl w-full max-w-md p-6 border-2 border-danger/40" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-3 mb-4">
                            <span className="text-2xl">⚠️</span>
                            <h2 className="text-lg font-bold text-danger">Plantilla restringida — requiere autorización</h2>
                        </div>
                        <p className="text-sm text-text-secondary mb-4">
                            Está a punto de enviar <strong>{template?.label}</strong> a{" "}
                            <strong>{breakdown.willSend}</strong> deudor(es). Esta acción queda registrada como{" "}
                            <code className="text-xs bg-danger-bg px-1.5 py-0.5 rounded">LEGAL_NOTICE_SENT</code> y
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
                                channel === c ? "bg-surface-hover text-text-primary" : "text-text-secondary hover:text-text-primary"
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
                                   className={`rounded accent-text-primary ${focusRing} ring-offset-surface-raised`} />
                            Seleccionar todos los visibles ({filteredDebtors.length})
                        </label>
                    </div>
                    <div className="max-h-[420px] overflow-y-auto divide-y divide-border-subtle">
                        {filteredDebtors.length === 0 ? (
                            <p className="text-sm text-text-tertiary text-center py-8">Sin resultados</p>
                        ) : filteredDebtors.map(d => (
                            <label key={d.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-hover cursor-pointer">
                                <input type="checkbox" checked={selectedIds.has(d.id)} onChange={() => toggleOne(d.id)}
                                       className={`rounded accent-text-primary flex-shrink-0 ${focusRing} ring-offset-surface-raised`} />
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm text-text-primary font-medium truncate">{d.name}</p>
                                    <p className="text-xs text-text-tertiary truncate">{d.clientName} · {d.telephone || "sin teléfono"} · {d.email || "sin email"}</p>
                                </div>
                                {d.smsOptOut && <span className="text-[10px] text-text-tertiary flex-shrink-0">opt-out</span>}
                                {!d.clientShortName && (
                                    <span title="Cliente sin shortName — se usará uno derivado del nombre" className="text-[10px] text-danger flex-shrink-0">
                                        <AlertTriangle size={11} />
                                    </span>
                                )}
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
                                    <div>
                                        <span className="text-text-tertiary">Sin shortName del cliente: </span>
                                        {breakdown.usingFallback > 0 ? (
                                            <Link href="/admin/clientes" className={`font-mono text-danger hover:underline underline-offset-2 ${focusRing} ring-offset-surface-raised rounded-sm`}>
                                                {breakdown.usingFallback} — usando nombre derivado, clic para corregir
                                            </Link>
                                        ) : (
                                            <span className="font-mono text-text-tertiary">0</span>
                                        )}
                                    </div>
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
                                {templatesLoading ? (
                                    <p className="text-sm text-text-tertiary">Cargando plantillas...</p>
                                ) : smsTemplates.length === 0 ? (
                                    <p className="text-sm text-text-tertiary">
                                        No hay plantillas SMS registradas — vaya a la pestaña <strong>Plantillas</strong> para registrar una.
                                    </p>
                                ) : (
                                    <div className="space-y-2">
                                        {smsTemplates.map(t => (
                                            <label key={t.id}
                                                   className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                                                       templateId === t.id
                                                           ? t.restricted ? "border-danger bg-danger-bg" : "border-text-primary bg-surface-hover"
                                                           : "border-border-default hover:border-text-tertiary"
                                                   }`}>
                                                <input type="radio" name="template" checked={templateId === t.id} onChange={() => setTemplateId(t.id)}
                                                       className={`mt-0.5 accent-text-primary ${focusRing} ring-offset-surface-raised`} />
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium text-text-primary flex items-center gap-2">
                                                        {t.label}
                                                        {t.restricted && (
                                                            <span className="text-[10px] font-bold uppercase tracking-wide text-danger bg-danger-bg px-1.5 py-0.5 rounded-full border border-danger/30">
                                                                Requiere autorización
                                                            </span>
                                                        )}
                                                    </p>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                )}
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
                                        {previewUsesFallback && (
                                            <p className="flex items-center gap-1.5 text-xs text-danger mt-1.5">
                                                <AlertTriangle size={12} />
                                                {previewDebtor.clientName} no tiene shortName — se usó &ldquo;{deriveShortName(previewDebtor.clientName)}&rdquo; (derivado del nombre).{" "}
                                                <Link href="/admin/clientes" className="underline underline-offset-2">Corregir</Link>
                                            </p>
                                        )}
                                    </>
                                ) : (
                                    <p className="text-sm text-text-tertiary">Seleccione al menos un destinatario para ver la vista previa.</p>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="space-y-4">
                            {emailTemplates.length > 0 && (
                                <div className="bg-surface-raised border border-border-subtle rounded-2xl p-4">
                                    <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wide mb-3">Usar plantilla (opcional)</p>
                                    <select value={emailTemplateId} onChange={e => applyEmailTemplate(e.target.value)}
                                            className={`w-full border border-border-default rounded-xl px-3 py-2 text-sm bg-surface-page text-text-primary focus:outline-none ${focusRing} ring-offset-surface-raised`}>
                                        <option value="">Composición libre</option>
                                        {emailTemplates.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                                    </select>
                                </div>
                            )}
                            <div className="bg-surface-raised border border-border-subtle rounded-2xl p-4 space-y-3">
                                <input type="text" placeholder="Asunto — puede usar {{name}} {{amount}} {{client}} {{date}} {{url}}" value={subject} onChange={e => setSubject(e.target.value)}
                                       className={`w-full border border-border-default rounded-xl px-3 py-2.5 text-sm bg-surface-page text-text-primary focus:outline-none focus:border-accent ${focusRing} ring-offset-surface-raised`} />
                                <textarea placeholder="Mensaje... variables: {{name}} {{amount}} {{client}} {{date}} {{url}}" value={body} onChange={e => setBody(e.target.value)} rows={8}
                                          className={`w-full border border-border-default rounded-xl px-3 py-2.5 text-sm bg-surface-page text-text-primary focus:outline-none focus:border-accent resize-none ${focusRing} ring-offset-surface-raised`} />
                            </div>
                            {previewDebtor && (subject || body) && (
                                <div className="bg-surface-raised border border-border-subtle rounded-2xl p-4">
                                    <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wide mb-3">
                                        Vista previa — {previewDebtor.name}
                                    </p>
                                    <p className="text-sm font-semibold text-text-primary mb-1">{emailPreview.subject}</p>
                                    <p className="text-sm text-text-secondary whitespace-pre-wrap">{emailPreview.body}</p>
                                </div>
                            )}
                        </div>
                    )}

                    <button
                        onClick={handleSendClick}
                        disabled={sending || breakdown.willSend === 0 || (channel === "EMAIL" && (!subject || !body)) || (channel === "SMS" && !templateId)}
                        className={`w-full bg-accent text-accent-fg py-3 rounded-xl text-sm font-bold hover:opacity-90 transition disabled:opacity-40 ${focusRing} ring-offset-surface-page`}>
                        {sending ? "Enviando..." : `Enviar a ${breakdown.willSend} destinatario(s)`}
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ============================== PLANTILLAS ============================== */

const EMAIL_VARS = ["name", "amount", "client", "date", "url"];

function SmsTemplateForm({ onCreated }) {
    const [label, setLabel] = useState("");
    const [body, setBody] = useState("");
    const [restricted, setRestricted] = useState(false);
    const [saving, setSaving] = useState(false);
    const [serverErrors, setServerErrors] = useState([]);

    const validation = useMemo(() => validateSmsTemplateBody(body), [body]);

    const save = async () => {
        if (!label.trim() || !validation.valid) return;
        setSaving(true);
        setServerErrors([]);
        try {
            const res = await fetch("/api/admin/templates", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ channel: "SMS", label: label.trim(), body, restricted }),
            });
            const data = await res.json();
            if (!res.ok) { setServerErrors(data.errors || [data.message]); return; }
            setLabel(""); setBody(""); setRestricted(false);
            onCreated(data);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="bg-surface-raised border border-border-subtle rounded-2xl p-5 space-y-3">
            <div>
                <p className="text-sm font-bold text-text-primary">Registrar plantilla aprobada</p>
                <p className="text-xs text-text-tertiary mt-0.5">
                    Esto registra en el sistema una plantilla que Masiva <strong>ya aprobó</strong> — no solicita una
                    aprobación nueva. Variables disponibles: <code className="font-mono">{"{{name}} {{amount}} {{shortName}} {{date}} {{url}}"}</code>
                </p>
            </div>
            <input type="text" placeholder="Etiqueta (ej. Recordatorio de pago)" value={label} onChange={e => setLabel(e.target.value)}
                   className={`w-full border border-border-default rounded-xl px-3 py-2 text-sm bg-surface-page text-text-primary focus:outline-none focus:border-accent ${focusRing} ring-offset-surface-raised`} />
            <textarea placeholder="RECUPERA: Hola {{name}}, tiene un saldo pendiente de ${{amount}} con {{shortName}} al {{date}}. Info: {{url}}"
                      value={body} onChange={e => setBody(e.target.value)} rows={4}
                      className={`w-full border border-border-default rounded-xl px-3 py-2 text-sm font-mono bg-surface-page text-text-primary focus:outline-none focus:border-accent resize-none ${focusRing} ring-offset-surface-raised`} />
            <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 text-text-secondary">
                    <input type="checkbox" checked={restricted} onChange={e => setRestricted(e.target.checked)}
                           className={`rounded accent-text-primary ${focusRing} ring-offset-surface-raised`} />
                    Restringida (requiere confirmación explícita al enviar, ej. avisos legales)
                </label>
                <span className={validation.worstCaseLength > 160 ? "text-danger font-bold font-mono" : "text-text-tertiary font-mono"}>
                    peor caso: {validation.worstCaseLength} / 160
                </span>
            </div>
            {body && !validation.valid && (
                <ul className="text-xs text-danger space-y-1 bg-danger-bg border border-danger/25 rounded-xl p-3">
                    {validation.errors.map((e, i) => <li key={i}>• {e}</li>)}
                </ul>
            )}
            {serverErrors.length > 0 && (
                <ul className="text-xs text-danger space-y-1 bg-danger-bg border border-danger/25 rounded-xl p-3">
                    {serverErrors.map((e, i) => <li key={i}>• {e}</li>)}
                </ul>
            )}
            <button onClick={save} disabled={saving || !label.trim() || !validation.valid}
                    className={`w-full bg-accent text-accent-fg py-2.5 rounded-xl text-sm font-bold hover:opacity-90 transition disabled:opacity-40 ${focusRing} ring-offset-surface-raised`}>
                {saving ? "Registrando..." : "Registrar plantilla aprobada"}
            </button>
        </div>
    );
}

function EmailTemplateForm({ onCreated }) {
    const [label, setLabel] = useState("");
    const [subject, setSubject] = useState("");
    const [body, setBody] = useState("");
    const [saving, setSaving] = useState(false);
    const [lastFocused, setLastFocused] = useState("body");
    const subjectRef = useRef(null);
    const bodyRef = useRef(null);

    const insertVar = (name) => {
        const ref = lastFocused === "subject" ? subjectRef : bodyRef;
        const setter = lastFocused === "subject" ? setSubject : setBody;
        const el = ref.current;
        const token = `{{${name}}}`;
        if (!el) { setter(prev => prev + token); return; }
        const start = el.selectionStart ?? el.value.length;
        const end = el.selectionEnd ?? el.value.length;
        const next = el.value.slice(0, start) + token + el.value.slice(end);
        setter(next);
        requestAnimationFrame(() => {
            el.focus();
            el.setSelectionRange(start + token.length, start + token.length);
        });
    };

    const previewVars = { name: "Elena Torres", amount: "558.03", client: "Grupo Atlas", date: todayEcDateString(), url: SAMPLE_URL };

    const save = async () => {
        if (!label.trim() || !subject.trim() || !body.trim()) return;
        setSaving(true);
        try {
            const res = await fetch("/api/admin/templates", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ channel: "EMAIL", label: label.trim(), subject, body }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Error al guardar");
            setLabel(""); setSubject(""); setBody("");
            onCreated(data);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="bg-surface-raised border border-border-subtle rounded-2xl p-5 space-y-3">
            <div>
                <p className="text-sm font-bold text-text-primary">Nueva plantilla de correo</p>
                <p className="text-xs text-text-tertiary mt-0.5">Composición libre, sin límite de caracteres.</p>
            </div>
            <input type="text" placeholder="Etiqueta (ej. Recordatorio mensual)" value={label} onChange={e => setLabel(e.target.value)}
                   className={`w-full border border-border-default rounded-xl px-3 py-2 text-sm bg-surface-page text-text-primary focus:outline-none focus:border-accent ${focusRing} ring-offset-surface-raised`} />

            <div className="flex flex-wrap gap-1.5">
                {EMAIL_VARS.map(v => (
                    <button key={v} type="button" onClick={() => insertVar(v)}
                            className={`text-xs font-mono px-2 py-1 rounded-lg border border-border-default text-text-secondary hover:bg-surface-hover transition ${focusRing} ring-offset-surface-raised`}>
                        {`{{${v}}}`}
                    </button>
                ))}
            </div>

            <input ref={subjectRef} type="text" placeholder="Asunto" value={subject}
                   onFocus={() => setLastFocused("subject")} onChange={e => setSubject(e.target.value)}
                   className={`w-full border border-border-default rounded-xl px-3 py-2 text-sm bg-surface-page text-text-primary focus:outline-none focus:border-accent ${focusRing} ring-offset-surface-raised`} />
            <textarea ref={bodyRef} placeholder="Mensaje..." value={body} rows={6}
                      onFocus={() => setLastFocused("body")} onChange={e => setBody(e.target.value)}
                      className={`w-full border border-border-default rounded-xl px-3 py-2 text-sm bg-surface-page text-text-primary focus:outline-none focus:border-accent resize-none ${focusRing} ring-offset-surface-raised`} />

            {(subject || body) && (
                <div className="bg-surface-page border border-border-subtle rounded-xl p-3">
                    <p className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wide mb-2">Vista previa (datos de ejemplo)</p>
                    <p className="text-sm font-semibold text-text-primary mb-1">{fillTemplate(subject, previewVars)}</p>
                    <p className="text-sm text-text-secondary whitespace-pre-wrap">{fillTemplate(body, previewVars)}</p>
                </div>
            )}

            <button onClick={save} disabled={saving || !label.trim() || !subject.trim() || !body.trim()}
                    className={`w-full bg-accent text-accent-fg py-2.5 rounded-xl text-sm font-bold hover:opacity-90 transition disabled:opacity-40 ${focusRing} ring-offset-surface-raised`}>
                {saving ? "Guardando..." : "Guardar plantilla"}
            </button>
        </div>
    );
}

function TemplateList({ templates, channel, onToggleActive }) {
    if (templates.length === 0) {
        return <p className="text-sm text-text-tertiary">Sin plantillas {channel === "SMS" ? "SMS" : "de correo"} registradas.</p>;
    }
    return (
        <div className="space-y-2">
            {templates.map(t => (
                <div key={t.id} className={`flex items-center justify-between gap-3 p-3 rounded-xl border ${t.active ? "border-border-default" : "border-border-subtle opacity-50"}`}>
                    <div className="min-w-0">
                        <p className="text-sm font-medium text-text-primary flex items-center gap-2">
                            {t.label}
                            {t.restricted && <span className="text-[10px] font-bold uppercase tracking-wide text-danger bg-danger-bg px-1.5 py-0.5 rounded-full border border-danger/30">Restringida</span>}
                            {!t.active && <span className="text-[10px] text-text-tertiary uppercase tracking-wide">Desactivada</span>}
                        </p>
                        <p className="text-xs text-text-tertiary truncate font-mono mt-0.5">{channel === "SMS" ? t.body : t.subject}</p>
                    </div>
                    <button onClick={() => onToggleActive(t)}
                            className={`text-xs font-medium px-3 py-1.5 rounded-lg border border-border-default text-text-secondary hover:bg-surface-hover transition flex-shrink-0 ${focusRing} ring-offset-surface-raised`}>
                        {t.active ? "Desactivar" : "Activar"}
                    </button>
                </div>
            ))}
        </div>
    );
}

function Plantillas({ smsTemplates, emailTemplates, loading, onChanged }) {
    const [channel, setChannel] = useState("SMS");

    const toggleActive = async (t) => {
        const res = await fetch(`/api/admin/templates/${t.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ active: !t.active }),
        });
        if (res.ok) onChanged();
    };

    return (
        <div className="space-y-5">
            <div className="flex items-center gap-1 bg-surface-raised border border-border-default rounded-xl p-1 w-fit">
                {["SMS", "EMAIL"].map(c => (
                    <button key={c} onClick={() => setChannel(c)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${focusRing} ring-offset-surface-raised ${
                                channel === c ? "bg-surface-hover text-text-primary" : "text-text-secondary hover:text-text-primary"
                            }`}>
                        {c === "SMS" ? "SMS" : "Correo"}
                    </button>
                ))}
            </div>

            <div className="grid lg:grid-cols-[1fr_1fr] gap-5">
                {channel === "SMS" ? <SmsTemplateForm onCreated={onChanged} /> : <EmailTemplateForm onCreated={onChanged} />}
                <div className="bg-surface-raised border border-border-subtle rounded-2xl p-5">
                    <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wide mb-3">
                        Plantillas registradas
                    </p>
                    {loading ? (
                        <p className="text-sm text-text-tertiary">Cargando...</p>
                    ) : (
                        <TemplateList templates={channel === "SMS" ? smsTemplates : emailTemplates} channel={channel} onToggleActive={toggleActive} />
                    )}
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

    // Full list (active + inactive) — the Plantillas management tab needs
    // both (a deactivated template must still show up there so it can be
    // reactivated), while the Composer's picker only ever wants active
    // ones. Derived subsets below, one fetch, not two separate endpoints.
    const [allTemplates, setAllTemplates] = useState([]);
    const [templatesLoading, setTemplatesLoading] = useState(true);

    const fetchTemplates = async () => {
        setTemplatesLoading(true);
        try {
            const res = await fetch("/api/admin/templates", { credentials: "include" });
            if (!res.ok) throw new Error();
            setAllTemplates(await res.json());
        } catch {
            // Composer/Plantillas both show their own empty/loading states —
            // no separate top-level error banner needed for this fetch.
        } finally {
            setTemplatesLoading(false);
        }
    };

    const activeSmsTemplates = allTemplates.filter(t => t.channel === "SMS" && t.active);
    const activeEmailTemplates = allTemplates.filter(t => t.channel === "EMAIL" && t.active);
    const allSmsTemplates = allTemplates.filter(t => t.channel === "SMS");
    const allEmailTemplates = allTemplates.filter(t => t.channel === "EMAIL");

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
        fetchTemplates();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isLoaded, user, router]);

    if (!isLoaded) return null;

    return (
        <main data-density="compact" className="min-h-screen bg-surface-page px-8 py-8">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">Notificaciones</h1>
                    <p className="text-sm text-text-tertiary mt-0.5">Envío manual de SMS y correo, plantillas, e historial de entregas</p>
                </div>
                <div className="flex items-center gap-1 bg-surface-raised border border-border-default rounded-xl p-1">
                    {[{ id: "enviar", label: "Enviar" }, { id: "plantillas", label: "Plantillas" }, { id: "historial", label: "Historial" }].map(t => (
                        <button key={t.id} onClick={() => setTab(t.id)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${focusRing} ring-offset-surface-raised ${
                                    tab === t.id ? "bg-surface-hover text-text-primary" : "text-text-secondary hover:text-text-primary"
                                }`}>
                            {t.label}
                        </button>
                    ))}
                </div>
            </div>

            {error && <p className="text-sm text-danger mb-4 bg-danger-bg border border-danger/25 rounded-xl px-4 py-3">{error}</p>}

            {tab === "enviar" && (
                loading ? <p className="text-sm text-text-tertiary">Cargando clientes...</p> : (
                    <Composer clients={clients} smsTemplates={activeSmsTemplates} emailTemplates={activeEmailTemplates} templatesLoading={templatesLoading} />
                )
            )}
            {tab === "plantillas" && (
                <Plantillas smsTemplates={allSmsTemplates} emailTemplates={allEmailTemplates} loading={templatesLoading} onChanged={fetchTemplates} />
            )}
            {tab === "historial" && <Historial />}
        </main>
    );
}
