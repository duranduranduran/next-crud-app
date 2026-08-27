"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { useClientData } from "../_lib/ClientDataContext";
import { FormField } from "../_lib/shared";

const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-surface-raised";

export default function AgregarPage() {
    const router = useRouter();
    const { draft, setDraft, fetchDebtors } = useClientData();

    const [editingId, setEditingId] = useState(null);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [telephone, setTelephone] = useState("");
    const [address, setAddress] = useState("");
    const [cedulaIdentidad, setCedulaIdentidad] = useState("");
    const [ruc, setRuc] = useState("");
    const [invoiceNumber, setInvoiceNumber] = useState("");
    const [amountOwed, setAmountOwed] = useState("");
    const [documentFile, setDocumentFile] = useState(null);

    const [emailError, setEmailError] = useState("");
    const [success, setSuccess] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    // Picks up whatever landed in the shared draft — either "Editar" from a
    // debtor's detail modal on the Deudores page, or "Usar estos datos" after
    // invoice extraction on the Facturas page. Consumed once, then cleared,
    // so navigating back here later starts blank again.
    useEffect(() => {
        if (!draft) return;
        setEditingId(draft.editingId || null);
        setName(draft.name || "");
        setEmail(draft.email || "");
        setTelephone(draft.telephone || "");
        setAddress(draft.address || "");
        setCedulaIdentidad(draft.cedulaIdentidad || "");
        setRuc(draft.ruc || "");
        setInvoiceNumber(draft.invoiceNumber || "");
        setAmountOwed(draft.amountOwed || "");
        setDraft(null);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const validateEmail = (value) => {
        if (!value) { setEmailError(""); return; }
        setEmailError(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? "" : "Correo inválido");
    };

    const uploadDocument = async (file) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET);
        const isPdf = file.type === "application/pdf";
        try {
            const res = await fetch(
                `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/${isPdf ? "raw" : "auto"}/upload`,
                { method: "POST", body: formData }
            );
            const data = await res.json();
            if (!res.ok) throw new Error("Upload failed");
            return data.secure_url;
        } catch (err) { console.error(err); return null; }
    };

    const resetForm = () => {
        setEditingId(null);
        setName(""); setEmail(""); setTelephone(""); setAddress("");
        setCedulaIdentidad(""); setRuc(""); setInvoiceNumber("");
        setAmountOwed(""); setDocumentFile(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSuccess(""); setError("");
        if (email && emailError) { setError("Correo inválido"); return; }
        const amount = Number(amountOwed.replace(/,/g, ""));
        if (isNaN(amount) || amount <= 0) { setError("Monto inválido"); return; }
        setLoading(true);
        try {
            let documentUrl = null;
            if (documentFile) { documentUrl = await uploadDocument(documentFile); if (!documentUrl) throw new Error("Upload failed"); }
            const payload = {
                name, email, telephone, address,
                cedulaIdentidad: cedulaIdentidad || null,
                ruc: ruc || null,
                invoiceNumber: invoiceNumber || null,
                amountOwed: amount.toFixed(2),
                ...(documentUrl && { documentUrl })
            };
            const res = editingId
                ? await fetch(`/api/debtors/${editingId}`, { method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
                : await fetch("/api/debtors", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
            if (!res.ok) { const data = await res.json(); throw new Error(data.error || data.message || "Submit failed"); }
            resetForm();
            await fetchDebtors();
            router.push("/client");
        } catch (err) { console.error(err); setError("Error inesperado"); }
        finally { setLoading(false); }
    };

    return (
        <div data-density="compact" className="min-h-screen bg-surface-page">
            <div className="max-w-6xl mx-auto px-8 py-8">

                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-text-primary">{editingId ? "Editar Deudor" : "Agregar Deudor"}</h1>
                    <p className="text-sm text-text-tertiary mt-0.5">Completa los datos del deudor. Solo nombre y monto son obligatorios.</p>
                </div>

                <div className="max-w-xl">
                    <div className="bg-surface-raised border border-border-subtle rounded-2xl p-8">

                        {error && <p className="text-danger text-sm mb-4 bg-danger-bg border border-danger/25 rounded-xl px-4 py-3">{error}</p>}
                        {success && <p className="text-success text-sm mb-4 bg-success-bg border border-success/25 rounded-xl px-4 py-3">{success}</p>}

                        <form onSubmit={handleSubmit} className="space-y-5">

                            <div>
                                <p className="text-xs font-semibold text-text-tertiary uppercase tracking-widest mb-3">Datos personales</p>
                                <div className="space-y-3">
                                    <FormField icon="👤">
                                        <input type="text" placeholder="Nombre completo o razón social *" value={name}
                                               onChange={e => setName(e.target.value)}
                                               className={`w-full p-3 border border-border-default rounded-xl bg-surface-page text-text-primary focus:outline-none focus:border-accent text-sm ${focusRing}`} required />
                                    </FormField>
                                    <FormField icon="📧">
                                        <input type="email" placeholder="Correo electrónico (opcional)" value={email}
                                               onChange={e => { setEmail(e.target.value); validateEmail(e.target.value); }}
                                               className={`w-full p-3 border border-border-default rounded-xl bg-surface-page text-text-primary focus:outline-none focus:border-accent text-sm ${focusRing}`} />
                                        {emailError && <p className="text-danger text-xs mt-1">{emailError}</p>}
                                    </FormField>
                                    <FormField icon="📱">
                                        <PhoneInput country={"ec"} value={telephone} onChange={phone => setTelephone(phone)}
                                                    enableSearch={true} inputClass="!w-full !p-3 !rounded-xl !border !border-border-default !bg-surface-page !text-text-primary !text-sm" />
                                    </FormField>
                                    <FormField icon="📍">
                                        <input type="text" placeholder="Dirección (opcional)" value={address}
                                               onChange={e => setAddress(e.target.value)}
                                               className={`w-full p-3 border border-border-default rounded-xl bg-surface-page text-text-primary focus:outline-none focus:border-accent text-sm ${focusRing}`} />
                                    </FormField>
                                </div>
                            </div>

                            <div className="border-t border-border-subtle" />

                            <div>
                                <p className="text-xs font-semibold text-text-tertiary uppercase tracking-widest mb-3">Identificación</p>
                                <div className="space-y-3">
                                    <FormField icon="🪪">
                                        <input type="text" placeholder="Cédula de identidad (opcional)" value={cedulaIdentidad}
                                               onChange={e => setCedulaIdentidad(e.target.value)}
                                               className={`w-full p-3 border border-border-default rounded-xl bg-surface-page text-text-primary focus:outline-none focus:border-accent text-sm ${focusRing}`} />
                                    </FormField>
                                    <FormField icon="🏢">
                                        <input type="text" placeholder="RUC (opcional)" value={ruc}
                                               onChange={e => setRuc(e.target.value)}
                                               className={`w-full p-3 border border-border-default rounded-xl bg-surface-page text-text-primary focus:outline-none focus:border-accent text-sm ${focusRing}`} />
                                    </FormField>
                                </div>
                            </div>

                            <div className="border-t border-border-subtle" />

                            <div>
                                <p className="text-xs font-semibold text-text-tertiary uppercase tracking-widest mb-3">Información de la deuda</p>
                                <div className="space-y-3">
                                    <FormField icon="💵">
                                        <input type="text" placeholder="Monto adeudado *" value={amountOwed}
                                               onChange={e => setAmountOwed(e.target.value)}
                                               className={`w-full p-3 border border-border-default rounded-xl bg-surface-page text-text-primary focus:outline-none focus:border-accent text-sm ${focusRing}`} required />
                                    </FormField>
                                    <FormField icon="🧾">
                                        <input type="text" placeholder="N° de factura (opcional)" value={invoiceNumber}
                                               onChange={e => setInvoiceNumber(e.target.value)}
                                               className={`w-full p-3 border border-border-default rounded-xl bg-surface-page text-text-primary focus:outline-none focus:border-accent text-sm ${focusRing}`} />
                                    </FormField>
                                    <FormField icon="📎">
                                        <input type="file" accept="image/*,application/pdf" onChange={e => setDocumentFile(e.target.files[0])}
                                               className={`block w-full text-sm file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border file:border-border-default file:bg-surface-page file:text-text-secondary hover:file:bg-surface-hover hover:file:text-text-primary file:text-xs ${focusRing}`} />
                                    </FormField>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                {editingId && (
                                    <button type="button"
                                            onClick={() => { resetForm(); router.push("/client"); }}
                                            className={`flex-1 border border-border-default text-text-secondary py-3 rounded-xl hover:bg-surface-hover transition text-sm ${focusRing}`}>
                                        Cancelar
                                    </button>
                                )}
                                <button type="submit" disabled={loading}
                                        className={`flex-1 bg-accent text-accent-fg font-bold py-3 rounded-xl hover:opacity-90 transition disabled:opacity-50 text-sm ${focusRing}`}>
                                    {loading ? "Procesando..." : editingId ? "Actualizar Deudor" : "Agregar Deudor"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
