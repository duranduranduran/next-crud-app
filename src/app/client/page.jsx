"use client";

import { useUser, useClerk } from "@clerk/nextjs";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import * as XLSX from "xlsx";
import {
    PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis
} from "recharts";

const STATUS_COLORS = {
    PENDIENTE: { color: "#F59E0B", bg: "#FEF3C7", label: "Pendiente" },
    EN_GESTION: { color: "#443CA3", bg: "#EEEDFE", label: "En Gestión" },
    ACUERDO_DE_PAGO: { color: "#8B5CF6", bg: "#EDE9FE", label: "Acuerdo de Pago" },
    PAGADO: { color: "#21FE83", bg: "#D1FAE5", label: "Pagado" },
    ESCALADO_JUDICIAL: { color: "#EF4444", bg: "#FEE2E2", label: "Escalado Judicial" },
};

function StatusBadge({ status }) {
    const meta = STATUS_COLORS[status] || { color: "#443CA3", bg: "#EEEDFE", label: status };
    return (
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{ color: meta.color, background: meta.bg }}>
            {meta.label}
        </span>
    );
}

function StatCard({ label, value, sub, accent }) {
    return (
        <div className="bg-white border border-[#443CA3]/10 p-6 rounded-2xl hover:shadow-md hover:border-[#443CA3]/20 transition-all duration-300">
            <p className="text-xs text-[#443CA3]/50 uppercase tracking-wide mb-2">{label}</p>
            <p className="text-3xl font-bold" style={{ color: accent || "#443CA3" }}>{value}</p>
            {sub && <p className="text-xs text-[#443CA3]/40 mt-1">{sub}</p>}
        </div>
    );
}

function FormField({ icon, children }) {
    return (
        <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#443CA3]/8 flex items-center justify-center flex-shrink-0 mt-0.5 text-base">
                {icon}
            </div>
            <div className="flex-1">{children}</div>
        </div>
    );
}

function InvoiceUploader({ onDebtorExtracted }) {
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

    return (
        <div className="max-w-xl">
            <div className="bg-white border border-[#443CA3]/10 rounded-2xl p-8">
                <h2 className="text-2xl font-bold text-[#443CA3] mb-2">Subir Factura</h2>
                <p className="text-sm text-[#443CA3]/50 mb-6">
                    Sube una factura en PDF y extraeremos automáticamente los datos del deudor.
                </p>
                <label className="block cursor-pointer">
                    <div className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
                        loading ? "border-[#443CA3]/30 bg-[#443CA3]/5" : "border-[#443CA3]/20 hover:border-[#443CA3]/50 hover:bg-[#443CA3]/5"
                    }`}>
                        {loading ? (
                            <div className="flex flex-col items-center gap-3">
                                <div className="w-8 h-8 border-2 border-[#443CA3] border-t-transparent rounded-full animate-spin" />
                                <p className="text-sm text-[#443CA3]/60">Analizando factura con IA...</p>
                                <p className="text-xs text-[#443CA3]/30">Esto puede tomar unos segundos</p>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-3">
                                <div className="w-12 h-12 bg-[#443CA3]/10 rounded-2xl flex items-center justify-center text-2xl">📄</div>
                                <p className="text-sm font-medium text-[#443CA3]">
                                    {fileName ? fileName : "Haz clic para subir una factura PDF"}
                                </p>
                                <p className="text-xs text-[#443CA3]/40">Solo archivos PDF</p>
                            </div>
                        )}
                    </div>
                    <input type="file" accept="application/pdf" onChange={handleFile} className="hidden" disabled={loading} />
                </label>
                {invoiceError && (
                    <div className="mt-4 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                        <p className="text-sm text-red-500">{invoiceError}</p>
                    </div>
                )}
                {result && (
                    <div className="mt-6 space-y-4">
                        <p className="text-sm font-semibold text-[#443CA3]">✅ Datos extraídos:</p>
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
                                <div key={i} className="bg-[#F7F8FF] rounded-xl p-3">
                                    <p className="text-xs text-[#443CA3]/40 mb-1">{field.label}</p>
                                    <p className="text-sm font-semibold text-[#443CA3]">
                                        {field.value || <span className="text-[#443CA3]/25 font-normal">No encontrado</span>}
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

export default function ClientPage() {
    const { user, isLoaded, isSignedIn } = useUser();
    const { signOut } = useClerk();
    const router = useRouter();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [amountOwed, setAmountOwed] = useState("");
    const [documentFile, setDocumentFile] = useState(null);
    const [telephone, setTelephone] = useState("");
    const [address, setAddress] = useState("");
    const [cedulaIdentidad, setCedulaIdentidad] = useState("");
    const [ruc, setRuc] = useState("");
    const [invoiceNumber, setInvoiceNumber] = useState("");
    const [success, setSuccess] = useState("");
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [debtors, setDebtors] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [emailError, setEmailError] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedDebtor, setSelectedDebtor] = useState(null);
    const [activeTab, setActiveTab] = useState("list");
    const ITEMS_PER_PAGE = 6;
    const [notifData, setNotifData] = useState(null);

    useEffect(() => {
        if (!isLoaded || !isSignedIn) return;
        const fetchNotifs = async () => {
            const res = await fetch("/api/debtors/logs", { credentials: "include" });
            if (res.ok) setNotifData(await res.json());
        };
        fetchNotifs();
    }, [isLoaded, isSignedIn]);

    useEffect(() => {
        if (!isLoaded) return;
        if (!isSignedIn) { router.replace("/sign-in"); return; }
        if (user?.publicMetadata?.role !== "client") { router.replace("/sign-in"); }
    }, [isLoaded, isSignedIn, user, router]);

    useEffect(() => {
        const handleKey = (e) => { if (e.key === "Escape") setSelectedDebtor(null); };
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, []);

    const fetchDebtors = async () => {
        try {
            const res = await fetch("/api/debtors", { credentials: "include" });
            if (!res.ok) throw new Error("Failed to fetch");
            const data = await res.json();
            setDebtors(data || []);
        } catch (err) {
            console.error(err);
            setError("Error loading debtors");
        }
    };

    useEffect(() => {
        if (!isLoaded || !isSignedIn) return;
        fetchDebtors();
    }, [isLoaded, isSignedIn]);

    const stats = useMemo(() => {
        const total = debtors.length;
        const totalOwed = debtors.reduce((acc, d) => acc + Number(d.amountOwed), 0);
        const paid = debtors.filter(d => d.status === "PAGADO").reduce((acc, d) => acc + Number(d.amountOwed), 0);
        const pending = debtors.filter(d => d.status === "PENDIENTE").length;
        const byStatus = Object.entries(
            debtors.reduce((acc, d) => {
                acc[d.status] = (acc[d.status] || 0) + 1;
                return acc;
            }, {})
        ).map(([name, value]) => ({ name, value, color: STATUS_COLORS[name]?.color || "#443CA3" }));
        return { total, totalOwed, paid, pending, byStatus };
    }, [debtors]);

    const filteredDebtors = debtors.filter(d => {
        const matchesSearch = d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (d.email && d.email.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesStatus = statusFilter === "ALL" || d.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const totalPages = Math.max(1, Math.ceil(filteredDebtors.length / ITEMS_PER_PAGE));
    const paginatedDebtors = filteredDebtors.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

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

    const handleDownloadTemplate = () => {
        const headers = ["name", "email", "telephone", "address", "cedulaIdentidad", "amountOwed"];
        const exampleRow = ["Juan Perez", "juan@email.com", "0991234567", "Guayaquil", "0123456789", 150.50];
        const ws = XLSX.utils.aoa_to_sheet([headers, exampleRow]);
        ws["!cols"] = [{ wch: 20 }, { wch: 30 }, { wch: 16 }, { wch: 25 }, { wch: 16 }, { wch: 14 }];
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Debtors");
        XLSX.writeFile(wb, "debtors_template.xlsx");
    };

    const handleExportExcel = () => {
        const rows = debtors.map(d => ({
            Nombre: d.name, Email: d.email || "", Teléfono: d.telephone || "",
            Cédula: d.cedulaIdentidad, RUC: d.ruc || "", "N° Factura": d.invoiceNumber || "",
            Monto: d.amountOwed, Estado: d.status,
            Creado: new Date(d.createdAt).toLocaleDateString("es-EC"),
        }));
        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Deudores");
        XLSX.writeFile(wb, "mis_deudores.xlsx");
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (event) => {
            const data = new Uint8Array(event.target.result);
            const workbook = XLSX.read(data, { type: "array" });
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
            const validRows = [];
            jsonData.forEach((row) => {
                const { name, amountOwed, cedulaIdentidad, email, telephone } = row;
                if (!name || !amountOwed || isNaN(amountOwed)) return;
                validRows.push({
                    name,
                    amountOwed: parseFloat(amountOwed),
                    cedulaIdentidad: cedulaIdentidad ? String(cedulaIdentidad).padStart(10, "0") : null,
                    email: email || null,
                    telephone: telephone ? String(telephone) : null,
                    address: row.address || null,
                    ruc: row.ruc || null,
                    invoiceNumber: row.invoiceNumber || null,
                });
            });
            if (!validRows.length) { setMessage("No valid rows found"); return; }
            try {
                const response = await fetch("/api/debtors/upload", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify(validRows) });
                const result = await response.json();
                setMessage(result.errors?.length ? "⚠️ Some rows failed" : `✅ ${validRows.length} debtors uploaded`);
                await fetchDebtors();
            } catch (err) { setMessage("Upload failed"); }
        };
        reader.readAsArrayBuffer(file);
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
            setSuccess(editingId ? "¡Deudor actualizado!" : "¡Deudor agregado!");
            resetForm();
            setActiveTab("list");
            await fetchDebtors();
        } catch (err) { console.error(err); setError("Error inesperado"); }
        finally { setLoading(false); }
    };

    const handleDelete = async (id) => {
        if (!confirm("¿Eliminar este deudor?")) return;
        const res = await fetch(`/api/debtors/${id}`, { method: "DELETE", credentials: "include" });
        if (!res.ok) { console.error("Delete failed"); return; }
        setSelectedDebtor(null);
        fetchDebtors();
    };

    if (!isLoaded || !isSignedIn) return null;

    return (
        <div className="min-h-screen bg-[#F7F8FF] text-[#443CA3]">

            {/* NAVBAR */}
            <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-[#443CA3]/10">
                <div className="max-w-7xl mx-auto px-8 py-4 flex justify-between items-center">
                    <img src="/logo-recupera-purple.png" alt="Recupera" className="h-14" />
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-[#443CA3]/60 font-medium">{user?.fullName || "Cliente"}</span>
                        <button onClick={() => signOut(() => router.push("/sign-in"))}
                                className="text-sm border border-[#443CA3]/20 px-4 py-2 rounded-xl hover:bg-[#443CA3] hover:text-white transition">
                            Cerrar Sesión
                        </button>
                    </div>
                </div>
            </nav>

            {/* DEBTOR MODAL */}
            {selectedDebtor && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setSelectedDebtor(null)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-6 border-b border-gray-100">
                            <div>
                                <h2 className="text-xl font-bold text-[#443CA3]">{selectedDebtor.name}</h2>
                                <StatusBadge status={selectedDebtor.status} />
                            </div>
                            <button onClick={() => setSelectedDebtor(null)} className="text-gray-400 hover:text-gray-700 text-2xl">✕</button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-[#F7F8FF] rounded-xl p-4">
                                    <p className="text-xs text-[#443CA3]/40 mb-1">Monto Adeudado</p>
                                    <p className="text-xl font-bold text-[#443CA3]">${Number(selectedDebtor.amountOwed).toLocaleString()}</p>
                                </div>
                                <div className="bg-[#F7F8FF] rounded-xl p-4">
                                    <p className="text-xs text-[#443CA3]/40 mb-1">Cédula / RUC</p>
                                    <p className="font-medium text-sm">{selectedDebtor.ruc || selectedDebtor.cedulaIdentidad || "—"}</p>
                                </div>
                                <div className="bg-[#F7F8FF] rounded-xl p-4">
                                    <p className="text-xs text-[#443CA3]/40 mb-1">Email</p>
                                    <p className="font-medium text-sm truncate">{selectedDebtor.email || "—"}</p>
                                </div>
                                <div className="bg-[#F7F8FF] rounded-xl p-4">
                                    <p className="text-xs text-[#443CA3]/40 mb-1">Teléfono</p>
                                    <p className="font-medium text-sm">{selectedDebtor.telephone || "—"}</p>
                                </div>
                                {selectedDebtor.invoiceNumber && (
                                    <div className="bg-[#F7F8FF] rounded-xl p-4">
                                        <p className="text-xs text-[#443CA3]/40 mb-1">N° Factura</p>
                                        <p className="font-medium text-sm">{selectedDebtor.invoiceNumber}</p>
                                    </div>
                                )}
                                {selectedDebtor.address && (
                                    <div className="bg-[#F7F8FF] rounded-xl p-4 col-span-2">
                                        <p className="text-xs text-[#443CA3]/40 mb-1">Dirección</p>
                                        <p className="font-medium text-sm">{selectedDebtor.address}</p>
                                    </div>
                                )}
                            </div>
                            {selectedDebtor.documentUrl && (
                                <a href={selectedDebtor.documentUrl} target="_blank" rel="noopener noreferrer"
                                   className="flex items-center gap-2 text-sm text-[#443CA3] border border-[#443CA3]/20 rounded-xl px-4 py-3 hover:bg-[#443CA3] hover:text-white transition">
                                    📄 Ver Documento
                                </a>
                            )}
                            <div className="flex gap-3 pt-2 border-t border-gray-100">
                                <button onClick={() => {
                                    setEditingId(selectedDebtor.id);
                                    setName(selectedDebtor.name);
                                    setEmail(selectedDebtor.email || "");
                                    setTelephone(selectedDebtor.telephone || "");
                                    setAddress(selectedDebtor.address || "");
                                    setCedulaIdentidad(selectedDebtor.cedulaIdentidad || "");
                                    setRuc(selectedDebtor.ruc || "");
                                    setInvoiceNumber(selectedDebtor.invoiceNumber || "");
                                    setAmountOwed(String(selectedDebtor.amountOwed));
                                    setSelectedDebtor(null);
                                    setActiveTab("add");
                                }} className="flex-1 border border-[#443CA3]/20 text-[#443CA3] py-2 rounded-xl text-sm hover:bg-[#443CA3] hover:text-white transition">
                                    Editar
                                </button>
                                <button onClick={() => handleDelete(selectedDebtor.id)}
                                        className="flex-1 border border-red-200 text-red-500 py-2 rounded-xl text-sm hover:bg-red-500 hover:text-white transition">
                                    Eliminar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="max-w-7xl mx-auto px-8 py-8">

                {/* HEADER */}
                <div className="mb-8">
                    <h1 className="text-4xl font-extrabold text-[#443CA3] mb-1">Panel de Cliente</h1>
                    <p className="text-[#443CA3]/50">Bienvenido, <span className="font-semibold text-[#443CA3]">{user?.fullName || "Cliente"}</span></p>
                </div>

                {/* KPI CARDS */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <StatCard label="Total Deudores" value={stats.total} accent="#443CA3" />
                    <StatCard label="Monto Total" value={`$${stats.totalOwed.toLocaleString()}`} accent="#443CA3" />
                    <StatCard label="Recuperado" value={`$${stats.paid.toLocaleString()}`} accent="#21FE83" sub="Deudores pagados" />
                    <StatCard label="Pendientes" value={stats.pending} accent="#F59E0B" sub="Sin gestionar" />
                </div>

                {/* TABS */}
                <div className="flex gap-2 mb-6 bg-white border border-[#443CA3]/10 rounded-2xl p-1.5 w-fit">
                    {[
                        { id: "list", label: "Mis Deudores" },
                        { id: "add", label: editingId ? "Editar Deudor" : "Agregar Deudor" },
                        { id: "reports", label: "Reportes" },
                        { id: "invoice", label: "📄 Subir Factura" },
                    ].map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                                className={`px-5 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === tab.id ? "bg-[#443CA3] text-white shadow-sm" : "text-[#443CA3]/60 hover:text-[#443CA3]"}`}>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* TAB: LIST */}
                {activeTab === "list" && (
                    <div>
                        <div className="bg-white border border-[#443CA3]/10 rounded-2xl p-4 mb-6 flex flex-wrap gap-3 items-center justify-between">
                            <div className="flex flex-wrap gap-3 flex-1">
                                <input type="text" placeholder="Buscar deudor..."
                                       value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                       className="border border-[#443CA3]/20 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-[#443CA3] min-w-[180px]" />
                                <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                                        className="border border-[#443CA3]/20 rounded-xl px-4 py-2 text-sm text-[#443CA3] focus:outline-none">
                                    <option value="ALL">Todos los estados</option>
                                    {Object.entries(STATUS_COLORS).map(([key, val]) => (
                                        <option key={key} value={key}>{val.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={handleDownloadTemplate}
                                        className="text-sm border border-[#443CA3]/20 px-4 py-2 rounded-xl text-[#443CA3] hover:bg-[#443CA3] hover:text-white transition">
                                    📋 Plantilla
                                </button>
                                <button onClick={handleExportExcel}
                                        className="text-sm bg-[#21FE83] text-[#443CA3] px-4 py-2 rounded-xl font-bold hover:bg-[#1edb70] transition">
                                    ⬇ Exportar
                                </button>
                                <label className="text-sm bg-[#443CA3] text-white px-4 py-2 rounded-xl font-bold cursor-pointer hover:opacity-90 transition">
                                    📤 Importar
                                    <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFileUpload} className="hidden" />
                                </label>
                            </div>
                        </div>

                        {message && <p className="text-sm text-[#443CA3] mb-4 bg-white border border-[#443CA3]/10 rounded-xl px-4 py-3">{message}</p>}

                        {paginatedDebtors.length === 0 ? (
                            <div className="text-center py-20 text-[#443CA3]/30">
                                <p className="text-4xl mb-3">📋</p>
                                <p>No hay deudores registrados</p>
                            </div>
                        ) : (
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {paginatedDebtors.map(debtor => (
                                    <div key={debtor.id} onClick={() => setSelectedDebtor(debtor)}
                                         className="bg-white border border-[#443CA3]/10 rounded-2xl p-5 hover:shadow-md hover:border-[#443CA3]/30 transition-all cursor-pointer">
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <p className="font-bold text-[#443CA3]">{debtor.name}</p>
                                                <p className="text-xs text-[#443CA3]/50 mt-0.5">{debtor.email || "Sin email"}</p>
                                            </div>
                                            <StatusBadge status={debtor.status} />
                                        </div>
                                        <p className="text-2xl font-bold text-[#443CA3] mb-3">
                                            ${Number(debtor.amountOwed).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </p>
                                        <div className="flex items-center justify-between text-xs text-[#443CA3]/40">
                                            <span>{debtor.ruc ? `RUC: ${debtor.ruc}` : debtor.cedulaIdentidad ? `CI: ${debtor.cedulaIdentidad}` : "—"}</span>
                                            <span className="text-[#443CA3] font-medium">Ver detalles →</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {totalPages > 1 && (
                            <div className="flex justify-center gap-4 mt-8">
                                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                                        className="px-4 py-2 border border-[#443CA3]/20 rounded-xl text-sm hover:bg-[#443CA3] hover:text-white transition disabled:opacity-30">← Prev</button>
                                <span className="text-sm text-[#443CA3]/50 self-center">Página {currentPage} de {totalPages}</span>
                                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                                        className="px-4 py-2 border border-[#443CA3]/20 rounded-xl text-sm hover:bg-[#443CA3] hover:text-white transition disabled:opacity-30">Next →</button>
                            </div>
                        )}
                    </div>
                )}

                {/* TAB: ADD/EDIT */}
                {activeTab === "add" && (
                    <div className="max-w-xl">
                        <div className="bg-white border border-[#443CA3]/10 rounded-2xl p-8">
                            <h2 className="text-2xl font-bold text-[#443CA3] mb-1">{editingId ? "Editar Deudor" : "Agregar Deudor"}</h2>
                            <p className="text-sm text-[#443CA3]/40 mb-6">Completa los datos del deudor. Solo nombre y monto son obligatorios.</p>

                            {error && <p className="text-red-500 text-sm mb-4 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{error}</p>}
                            {success && <p className="text-green-600 text-sm mb-4 bg-green-50 border border-green-100 rounded-xl px-4 py-3">{success}</p>}

                            <form onSubmit={handleSubmit} className="space-y-5">

                                {/* Section: Datos personales */}
                                <div>
                                    <p className="text-xs font-semibold text-[#443CA3]/40 uppercase tracking-widest mb-3">Datos personales</p>
                                    <div className="space-y-3">
                                        <FormField icon="👤">
                                            <input type="text" placeholder="Nombre completo o razón social *" value={name}
                                                   onChange={e => setName(e.target.value)}
                                                   className="w-full p-3 border border-[#443CA3]/20 rounded-xl focus:outline-none focus:border-[#443CA3] text-sm" required />
                                        </FormField>
                                        <FormField icon="📧">
                                            <input type="email" placeholder="Correo electrónico (opcional)" value={email}
                                                   onChange={e => { setEmail(e.target.value); validateEmail(e.target.value); }}
                                                   className="w-full p-3 border border-[#443CA3]/20 rounded-xl focus:outline-none focus:border-[#443CA3] text-sm" />
                                            {emailError && <p className="text-red-500 text-xs mt-1">{emailError}</p>}
                                        </FormField>
                                        <FormField icon="📱">
                                            <PhoneInput country={"ec"} value={telephone} onChange={phone => setTelephone(phone)}
                                                        enableSearch={true} inputClass="!w-full !p-3 !rounded-xl !border !border-[#443CA3]/20 !text-[#443CA3] !text-sm" />
                                        </FormField>
                                        <FormField icon="📍">
                                            <input type="text" placeholder="Dirección (opcional)" value={address}
                                                   onChange={e => setAddress(e.target.value)}
                                                   className="w-full p-3 border border-[#443CA3]/20 rounded-xl focus:outline-none focus:border-[#443CA3] text-sm" />
                                        </FormField>
                                    </div>
                                </div>

                                {/* Divider */}
                                <div className="border-t border-[#443CA3]/8" />

                                {/* Section: Identificación */}
                                <div>
                                    <p className="text-xs font-semibold text-[#443CA3]/40 uppercase tracking-widest mb-3">Identificación</p>
                                    <div className="space-y-3">
                                        <FormField icon="🪪">
                                            <input type="text" placeholder="Cédula de identidad (opcional)" value={cedulaIdentidad}
                                                   onChange={e => setCedulaIdentidad(e.target.value)}
                                                   className="w-full p-3 border border-[#443CA3]/20 rounded-xl focus:outline-none focus:border-[#443CA3] text-sm" />
                                        </FormField>
                                        <FormField icon="🏢">
                                            <input type="text" placeholder="RUC (opcional)" value={ruc}
                                                   onChange={e => setRuc(e.target.value)}
                                                   className="w-full p-3 border border-[#443CA3]/20 rounded-xl focus:outline-none focus:border-[#443CA3] text-sm" />
                                        </FormField>
                                    </div>
                                </div>

                                {/* Divider */}
                                <div className="border-t border-[#443CA3]/8" />

                                {/* Section: Deuda */}
                                <div>
                                    <p className="text-xs font-semibold text-[#443CA3]/40 uppercase tracking-widest mb-3">Información de la deuda</p>
                                    <div className="space-y-3">
                                        <FormField icon="💵">
                                            <input type="text" placeholder="Monto adeudado *" value={amountOwed}
                                                   onChange={e => setAmountOwed(e.target.value)}
                                                   className="w-full p-3 border border-[#443CA3]/20 rounded-xl focus:outline-none focus:border-[#443CA3] text-sm" required />
                                        </FormField>
                                        <FormField icon="🧾">
                                            <input type="text" placeholder="N° de factura (opcional)" value={invoiceNumber}
                                                   onChange={e => setInvoiceNumber(e.target.value)}
                                                   className="w-full p-3 border border-[#443CA3]/20 rounded-xl focus:outline-none focus:border-[#443CA3] text-sm" />
                                        </FormField>
                                        <FormField icon="📎">
                                            <input type="file" accept="image/*,application/pdf" onChange={e => setDocumentFile(e.target.files[0])}
                                                   className="block w-full text-sm file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border file:border-[#443CA3]/20 file:bg-white file:text-[#443CA3] hover:file:bg-[#443CA3] hover:file:text-white file:text-xs" />
                                        </FormField>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-3 pt-2">
                                    {editingId && (
                                        <button type="button"
                                                onClick={() => { resetForm(); setActiveTab("list"); }}
                                                className="flex-1 border border-[#443CA3]/20 text-[#443CA3] py-3 rounded-xl hover:bg-gray-50 transition text-sm">
                                            Cancelar
                                        </button>
                                    )}
                                    <button type="submit" disabled={loading}
                                            className="flex-1 bg-[#443CA3] text-white font-bold py-3 rounded-xl hover:opacity-90 transition disabled:opacity-50 text-sm">
                                        {loading ? "Procesando..." : editingId ? "Actualizar Deudor" : "Agregar Deudor"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* TAB: REPORTS */}
                {activeTab === "reports" && (
                    <div className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="bg-white border border-[#443CA3]/10 rounded-2xl p-6">
                                <h3 className="font-semibold text-[#443CA3] mb-4">Deudores por Estado</h3>
                                {stats.byStatus.length === 0 ? (
                                    <p className="text-[#443CA3]/30 text-sm text-center py-12">Sin datos</p>
                                ) : (
                                    <ResponsiveContainer width="100%" height={250}>
                                        <PieChart>
                                            <Pie data={stats.byStatus} dataKey="value" nameKey="name" outerRadius={90} innerRadius={50} paddingAngle={3}>
                                                {stats.byStatus.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                                            </Pie>
                                            <Tooltip formatter={(val, name) => [val, STATUS_COLORS[name]?.label || name]} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                            <div className="bg-white border border-[#443CA3]/10 rounded-2xl p-6">
                                <h3 className="font-semibold text-[#443CA3] mb-4">Distribución por Estado</h3>
                                <ResponsiveContainer width="100%" height={250}>
                                    <BarChart data={stats.byStatus} barSize={36}>
                                        <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#443CA3", opacity: 0.5 }} axisLine={false} tickLine={false}
                                               tickFormatter={name => STATUS_COLORS[name]?.label?.slice(0, 6) || name} />
                                        <YAxis hide />
                                        <Tooltip formatter={(val, name) => [val, STATUS_COLORS[name]?.label || name]} />
                                        <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                                            {stats.byStatus.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="bg-white border border-[#443CA3]/10 rounded-2xl p-6">
                            <h3 className="font-semibold text-[#443CA3] mb-4">Detalle por Estado</h3>
                            <div className="space-y-3">
                                {Object.entries(STATUS_COLORS).map(([key, meta]) => {
                                    const count = debtors.filter(d => d.status === key).length;
                                    const amount = debtors.filter(d => d.status === key).reduce((acc, d) => acc + Number(d.amountOwed), 0);
                                    const pct = stats.total > 0 ? ((count / stats.total) * 100).toFixed(0) : 0;
                                    return (
                                        <div key={key} className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: meta.color }} />
                                            <span className="text-sm text-[#443CA3]/70 w-36">{meta.label}</span>
                                            <span className="text-sm font-bold text-[#443CA3] w-8">{count}</span>
                                            <div className="flex-1 h-1.5 bg-[#443CA3]/10 rounded-full overflow-hidden">
                                                <div className="h-full rounded-full" style={{ width: `${pct}%`, background: meta.color }} />
                                            </div>
                                            <span className="text-xs text-[#443CA3]/40 w-16 text-right">${amount.toLocaleString()}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {notifData && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="bg-white border border-[#443CA3]/10 rounded-2xl p-5">
                                        <p className="text-xs text-[#443CA3]/40 uppercase tracking-wide mb-2">Emails Enviados</p>
                                        <p className="text-3xl font-bold text-[#0EA5E9]">{notifData.totalEmails}</p>
                                    </div>
                                    <div className="bg-white border border-[#443CA3]/10 rounded-2xl p-5">
                                        <p className="text-xs text-[#443CA3]/40 uppercase tracking-wide mb-2">Llamadas Realizadas</p>
                                        <p className="text-3xl font-bold text-[#8B5CF6]">{notifData.totalCalls}</p>
                                    </div>
                                    <div className="bg-white border border-[#443CA3]/10 rounded-2xl p-5">
                                        <p className="text-xs text-[#443CA3]/40 uppercase tracking-wide mb-2">Total Contactos</p>
                                        <p className="text-3xl font-bold text-[#443CA3]">{notifData.totalEmails + notifData.totalCalls}</p>
                                    </div>
                                </div>
                                <div className="bg-white border border-[#443CA3]/10 rounded-2xl p-6">
                                    <h3 className="font-semibold text-[#443CA3] mb-4">Historial de Notificaciones por Deudor</h3>
                                    {notifData.byDebtor.length === 0 ? (
                                        <p className="text-[#443CA3]/30 text-sm text-center py-8">Aún no se han enviado notificaciones</p>
                                    ) : (
                                        <div className="space-y-3">
                                            {notifData.byDebtor.map((d) => (
                                                <div key={d.id} className="flex items-center gap-4 p-3 bg-[#F7F8FF] rounded-xl">
                                                    <div className="flex-1">
                                                        <p className="text-sm font-semibold text-[#443CA3]">{d.name}</p>
                                                        <p className="text-xs text-[#443CA3]/40 mt-0.5">
                                                            Último contacto: {d.lastContact ? new Date(d.lastContact).toLocaleDateString("es-EC") : "—"}
                                                        </p>
                                                    </div>
                                                    <div className="flex gap-3 text-xs">
                                                        <span className="bg-[#E0F2FE] text-[#0EA5E9] px-2.5 py-1 rounded-full font-semibold">📧 {d.emails}</span>
                                                        <span className="bg-[#EDE9FE] text-[#8B5CF6] px-2.5 py-1 rounded-full font-semibold">📞 {d.calls}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="bg-white border border-[#443CA3]/10 rounded-2xl p-6">
                                    <h3 className="font-semibold text-[#443CA3] mb-4">Actividad Reciente</h3>
                                    <div className="space-y-2">
                                        {notifData.logs.slice(0, 8).map((log) => (
                                            <div key={log.id} className="flex items-center gap-3 text-sm py-2 border-b border-[#443CA3]/5 last:border-0">
                                                <span className="text-lg">{log.event === "CALL_TRIGGERED" ? "📞" : "📧"}</span>
                                                <span className="flex-1 text-[#443CA3]/70 text-xs">{log.detail}</span>
                                                <span className="text-xs text-[#443CA3]/30 whitespace-nowrap">
                                                    {new Date(log.createdAt).toLocaleDateString("es-EC")}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end">
                            <button onClick={handleExportExcel}
                                    className="bg-[#443CA3] text-white px-6 py-3 rounded-xl font-bold hover:opacity-90 transition text-sm">
                                ⬇ Exportar Reporte Excel
                            </button>
                        </div>
                    </div>
                )}

                {/* TAB: INVOICE */}
                {activeTab === "invoice" && (
                    <InvoiceUploader onDebtorExtracted={(data) => {
                        setName(data.name || "");
                        setEmail(data.email || "");
                        setCedulaIdentidad("");
                        setRuc(data.ruc || "");
                        setInvoiceNumber(data.invoiceNumber || "");
                        setAmountOwed(data.amount ? String(data.amount) : "");
                        setAddress(data.address || "");
                        setActiveTab("add");
                    }} />
                )}

            </div>
        </div>
    );
}
