"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useClientData } from "../_lib/ClientDataContext";

export default function FacturasPage() {
    const router = useRouter();
    const { setDraft } = useClientData();

    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [invoiceError, setInvoiceError] = useState(null);
    const [fileName, setFileName] = useState(null);

    const handleFile = async (e) => {
        const file = e.target.files[0];
        if (!file || file.type !== "application/pdf") {
            setInvoiceError("Por favor sube un archivo PDF");
            return;
        }
        setFileName(file.name);
        setLoading(true);
        setInvoiceError(null);
        setResult(null);
        try {
            const base64 = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result.split(",")[1]);
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
            const res = await fetch("/api/parse-invoice", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ base64 }),
            });
            if (!res.ok) throw new Error("Error al procesar la factura");
            const data = await res.json();
            setResult(data);
        } catch (err) {
            setInvoiceError(err.message || "Error inesperado");
        } finally {
            setLoading(false);
        }
    };

    const useExtractedData = () => {
        setDraft({
            editingId: null,
            name: result.name || "",
            email: result.email || "",
            cedulaIdentidad: "",
            ruc: result.ruc || "",
            invoiceNumber: result.invoiceNumber || "",
            amountOwed: result.amount ? String(result.amount) : "",
            address: result.address || "",
        });
        router.push("/client/agregar");
    };

    return (
        <div data-density="compact" className="min-h-screen bg-surface-page">
            <div className="max-w-6xl mx-auto px-8 py-8">

                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-text-primary">Facturas</h1>
                    <p className="text-sm text-text-tertiary mt-0.5">Sube una factura en PDF y extraeremos automáticamente los datos del deudor.</p>
                </div>

                <div className="max-w-xl">
                    <div className="bg-surface-raised border border-border-subtle rounded-2xl p-8">
                        <label className="block cursor-pointer">
                            <div className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
                                loading ? "border-accent/30 bg-accent/5" : "border-accent/20 hover:border-accent/50 hover:bg-accent/5"
                            }`}>
                                {loading ? (
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                                        <p className="text-sm text-text-secondary">Analizando factura con IA...</p>
                                        <p className="text-xs text-text-tertiary">Esto puede tomar unos segundos</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="w-12 h-12 bg-accent/10 rounded-2xl flex items-center justify-center text-2xl">📄</div>
                                        <p className="text-sm font-medium text-text-primary">
                                            {fileName ? fileName : "Haz clic para subir una factura PDF"}
                                        </p>
                                        <p className="text-xs text-text-tertiary">Solo archivos PDF</p>
                                    </div>
                                )}
                            </div>
                            <input type="file" accept="application/pdf" onChange={handleFile} className="hidden" disabled={loading} />
                        </label>
                        {invoiceError && (
                            <div className="mt-4 bg-danger-bg border border-danger/25 rounded-xl px-4 py-3">
                                <p className="text-sm text-danger">{invoiceError}</p>
                            </div>
                        )}
                        {result && (
                            <div className="mt-6 space-y-4">
                                <p className="text-sm font-semibold text-text-primary">✅ Datos extraídos:</p>
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { label: "Nombre", value: result.name },
                                        { label: "RUC / Cédula", value: result.ruc },
                                        { label: "Email", value: result.email },
                                        { label: "Monto", value: result.amount ? `$${result.amount}` : null },
                                        { label: "Fecha", value: result.date },
                                        { label: "N° Factura", value: result.invoiceNumber },
                                        { label: "Dirección", value: result.address },
                                    ].map((field, i) => (
                                        <div key={i} className="bg-surface-hover rounded-xl p-3">
                                            <p className="text-xs text-text-tertiary mb-1">{field.label}</p>
                                            <p className="text-sm font-semibold text-text-primary">
                                                {field.value || <span className="text-text-disabled font-normal">No encontrado</span>}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <button
                                        onClick={useExtractedData}
                                        className="flex-1 bg-accent text-surface-page py-3 rounded-xl text-sm font-bold hover:opacity-90 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-surface-raised"
                                    >
                                        Usar estos datos →
                                    </button>
                                    <button
                                        onClick={() => { setResult(null); setFileName(null); }}
                                        className="border border-border-default text-text-secondary px-4 py-3 rounded-xl text-sm hover:bg-surface-hover transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-surface-raised"
                                    >
                                        Limpiar
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
