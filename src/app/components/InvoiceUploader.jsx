"use client";

import { useState } from "react";

export default function InvoiceUploader({ onDebtorExtracted }) {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [fileName, setFileName] = useState(null);

    const handleFile = async (e) => {
        const file = e.target.files[0];
        if (!file || file.type !== "application/pdf") {
            setError("Por favor sube un archivo PDF");
            return;
        }

        setFileName(file.name);
        setLoading(true);
        setError(null);
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
            setError(err.message || "Error inesperado");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-xl">
            <div className="bg-white border border-[#443CA3]/10 rounded-2xl p-8">
                <h2 className="text-2xl font-bold text-[#443CA3] mb-2">Subir Factura</h2>
                <p className="text-sm text-[#443CA3]/50 mb-6">
                    Sube una factura en PDF y extraeremos automáticamente los datos del deudor.
                </p>

                <label className="block cursor-pointer">
                    <div className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
                        loading
                            ? "border-[#443CA3]/30 bg-[#443CA3]/5"
                            : "border-[#443CA3]/20 hover:border-[#443CA3]/50 hover:bg-[#443CA3]/5"
                    }`}>
                        {loading ? (
                            <div className="flex flex-col items-center gap-3">
                                <div className="w-8 h-8 border-2 border-[#443CA3] border-t-transparent rounded-full animate-spin" />
                                <p className="text-sm text-[#443CA3]/60">Analizando factura con IA...</p>
                                <p className="text-xs text-[#443CA3]/30">Esto puede tomar unos segundos</p>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-3">
                                <div className="w-12 h-12 bg-[#443CA3]/10 rounded-2xl flex items-center justify-center text-2xl">
                                    📄
                                </div>
                                <p className="text-sm font-medium text-[#443CA3]">
                                    {fileName ? fileName : "Haz clic para subir una factura PDF"}
                                </p>
                                <p className="text-xs text-[#443CA3]/40">Solo archivos PDF</p>
                            </div>
                        )}
                    </div>
                    <input
                        type="file"
                        accept="application/pdf"
                        onChange={handleFile}
                        className="hidden"
                        disabled={loading}
                    />
                </label>

                {error && (
                    <div className="mt-4 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                        <p className="text-sm text-red-500">{error}</p>
                    </div>
                )}

                {result && (
                    <div className="mt-6 space-y-4">
                        <p className="text-sm font-semibold text-[#443CA3]">✅ Datos extraídos:</p>
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { label: "Nombre", value: result.name },
                                { label: "RUC / Cédula", value: result.ruc },
                                { label: "Monto", value: result.amount ? `$${result.amount}` : null },
                                { label: "Fecha", value: result.date },
                                { label: "N° Factura", value: result.invoiceNumber },
                                { label: "Dirección", value: result.address },
                            ].map((field, i) => (
                                <div key={i} className="bg-[#F7F8FF] rounded-xl p-3">
                                    <p className="text-xs text-[#443CA3]/40 mb-1">{field.label}</p>
                                    <p className="text-sm font-semibold text-[#443CA3]">
                                        {field.value || (
                                            <span className="text-[#443CA3]/25 font-normal">No encontrado</span>
                                        )}
                                    </p>
                                </div>
                            ))}
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={() => onDebtorExtracted(result)}
                                className="flex-1 bg-[#443CA3] text-white py-3 rounded-xl text-sm font-bold hover:opacity-90 transition"
                            >
                                Usar estos datos →
                            </button>
                            <button
                                onClick={() => { setResult(null); setFileName(null); }}
                                className="border border-[#443CA3]/20 text-[#443CA3] px-4 py-3 rounded-xl text-sm hover:bg-gray-50 transition"
                            >
                                Limpiar
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
