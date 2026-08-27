"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import { LayoutGrid, List as ListIcon } from "lucide-react";
import { useClientData } from "./_lib/ClientDataContext";
import { StatusBadge, StatusLabel, STATUS_COLORS, exportDebtorsExcel } from "./_lib/shared";

const ITEMS_PER_PAGE = 9;
const VIEW_MODE_KEY = "clientDebtorViewMode";
const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

// Overlapping stack, Moxfield-style — same .debtor-stack-* mechanism as
// admin/page.jsx (see the full writeup in tokens.css). Client debtors have
// no bulk-select or notify toggle (those are admin-only concepts), so the
// peek row here is just name + status + amount; the "critical" checkbox/
// notify placement rule from the brief doesn't apply since there's nothing
// to misplace.
function DebtorCard({ debtor, onClick }) {
    return (
        <div
            className={`debtor-stack-card break-inside-avoid bg-surface-raised border rounded-xl overflow-hidden cursor-pointer ${focusRing} ring-offset-surface-page`}
            onClick={onClick}
            tabIndex={0}
            role="button"
            aria-label={`Ver detalles de ${debtor.name}`}
            onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } }}
        >
            <div className="h-9 px-3 flex items-center gap-2">
                <p className="flex-1 min-w-0 font-semibold text-text-primary text-sm truncate">{debtor.name}</p>
                <StatusLabel status={debtor.status} />
                <p className="text-sm font-bold font-mono text-text-primary text-right flex-shrink-0" style={{ width: "5.5rem" }}>
                    {Number(debtor.amountOwed).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
            </div>
            <div className="debtor-stack-detail px-3 pb-3 pt-1 border-t border-border-subtle mt-1">
                <div className="mt-1 mb-1.5"><StatusBadge status={debtor.status} /></div>
                <p className="text-xs text-text-tertiary font-mono truncate">
                    {debtor.ruc ? `RUC ${debtor.ruc}` : debtor.cedulaIdentidad ? `CI ${debtor.cedulaIdentidad}` : "—"}
                </p>
                <p className="text-xs text-text-tertiary truncate mt-0.5">{debtor.email || "Sin correo"}</p>
                <span className="text-xs font-medium text-text-secondary mt-2 inline-block">Ver detalles →</span>
            </div>
        </div>
    );
}

const ROW_STAGGER_STEP_MS = 50;
const ROW_STAGGER_CAP_MS = 500;

function DebtorTable({ debtors, onRowClick }) {
    if (debtors.length === 0) {
        return (
            <div className="bg-surface-raised rounded-2xl shadow-sm border border-border-subtle p-10 text-center text-sm text-text-tertiary">
                No hay deudores que coincidan con los filtros.
            </div>
        );
    }
    return (
        <div className="space-y-1.5">
            {debtors.map((debtor, i) => (
                <div
                    key={debtor.id}
                    onClick={() => onRowClick(debtor)}
                    className={`debtor-row-stagger h-10 flex items-center gap-3 px-3 rounded-lg bg-surface-raised border border-border-subtle hover:bg-surface-hover transition-colors cursor-pointer ${focusRing} ring-offset-surface-page`}
                    style={{ "--stack-delay": `${Math.min(i * ROW_STAGGER_STEP_MS, ROW_STAGGER_CAP_MS)}ms` }}
                    tabIndex={0}
                    role="button"
                    aria-label={`Ver detalles de ${debtor.name}`}
                    onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onRowClick(debtor); } }}
                >
                    <div className="min-w-0 flex-1">
                        <p className="text-text-primary font-medium text-sm truncate">{debtor.name}</p>
                        <p className="text-text-tertiary text-[11px] font-mono truncate">{debtor.cedulaIdentidad || debtor.ruc || "—"}</p>
                    </div>
                    <div className="flex-shrink-0"><StatusBadge status={debtor.status} /></div>
                    <p className="text-right font-mono text-text-primary font-semibold text-sm flex-shrink-0" style={{ width: "5.5rem" }}>
                        {Number(debtor.amountOwed).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <span className="text-text-tertiary flex-shrink-0" aria-hidden="true">›</span>
                </div>
            ))}
        </div>
    );
}

export default function DeudoresPage() {
    const router = useRouter();
    const { debtors, debtorsError, fetchDebtors, stats, setDraft } = useClientData();

    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedDebtor, setSelectedDebtor] = useState(null);
    const [message, setMessage] = useState("");
    const [viewMode, setViewMode] = useState("card");

    useEffect(() => {
        try {
            const stored = localStorage.getItem(VIEW_MODE_KEY);
            if (stored === "card" || stored === "list") setViewMode(stored);
        } catch {}
    }, []);

    const changeViewMode = (mode) => {
        setViewMode(mode);
        try { localStorage.setItem(VIEW_MODE_KEY, mode); } catch {}
    };

    useEffect(() => {
        const handleKey = (e) => { if (e.key === "Escape") setSelectedDebtor(null); };
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, []);

    const filteredDebtors = debtors.filter(d => {
        const matchesSearch = d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (d.email && d.email.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesStatus = statusFilter === "ALL" || d.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const totalPages = Math.max(1, Math.ceil(filteredDebtors.length / ITEMS_PER_PAGE));
    const paginatedDebtors = filteredDebtors.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const handleDownloadTemplate = () => {
        const headers = ["name", "email", "telephone", "address", "cedulaIdentidad", "amountOwed"];
        const exampleRow = ["Juan Perez", "juan@email.com", "0991234567", "Guayaquil", "0123456789", 150.50];
        const ws = XLSX.utils.aoa_to_sheet([headers, exampleRow]);
        ws["!cols"] = [{ wch: 20 }, { wch: 30 }, { wch: 16 }, { wch: 25 }, { wch: 16 }, { wch: 14 }];
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Debtors");
        XLSX.writeFile(wb, "debtors_template.xlsx");
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

    const handleDelete = async (id) => {
        if (!confirm("¿Eliminar este deudor?")) return;
        const res = await fetch(`/api/debtors/${id}`, { method: "DELETE", credentials: "include" });
        if (!res.ok) { console.error("Delete failed"); return; }
        setSelectedDebtor(null);
        fetchDebtors();
    };

    const handleEdit = (debtor) => {
        setDraft({
            editingId: debtor.id,
            name: debtor.name,
            email: debtor.email || "",
            telephone: debtor.telephone || "",
            address: debtor.address || "",
            cedulaIdentidad: debtor.cedulaIdentidad || "",
            ruc: debtor.ruc || "",
            invoiceNumber: debtor.invoiceNumber || "",
            amountOwed: String(debtor.amountOwed),
        });
        setSelectedDebtor(null);
        router.push("/client/agregar");
    };

    const metrics = [
        { label: "Total Deudores", value: stats.total, color: "var(--color-text-primary)" },
        { label: "Monto Total", value: `$${stats.totalOwed.toLocaleString()}`, color: "var(--color-text-primary)" },
        { label: "Recuperado", value: `$${stats.paid.toLocaleString()}`, color: "var(--color-success)", sub: "Deudores pagados" },
        { label: "Pendientes", value: stats.pending, color: "var(--color-neutral-event)", sub: "Sin gestionar" },
    ];

    return (
        <div data-density="compact" className="min-h-screen bg-surface-page">

            {/* DEBTOR MODAL */}
            {selectedDebtor && (
                <div className="fixed inset-0 bg-scrim/40 z-50 flex items-center justify-center p-4" onClick={() => setSelectedDebtor(null)}>
                    <div className="bg-surface-overlay rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-6 border-b border-border-subtle">
                            <div>
                                <h2 className="text-xl font-bold text-text-primary">{selectedDebtor.name}</h2>
                                <StatusBadge status={selectedDebtor.status} />
                            </div>
                            <button onClick={() => setSelectedDebtor(null)}
                                    className={`text-text-tertiary hover:text-text-primary text-2xl leading-none ${focusRing} ring-offset-surface-overlay rounded`}>✕</button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-surface-hover rounded-xl p-4">
                                    <p className="text-xs text-text-tertiary mb-1">Monto Adeudado</p>
                                    <p className="text-xl font-bold font-mono text-text-primary">${Number(selectedDebtor.amountOwed).toLocaleString()}</p>
                                </div>
                                <div className="bg-surface-hover rounded-xl p-4">
                                    <p className="text-xs text-text-tertiary mb-1">Cédula / RUC</p>
                                    <p className="font-medium font-mono text-sm text-text-primary">{selectedDebtor.ruc || selectedDebtor.cedulaIdentidad || "—"}</p>
                                </div>
                                <div className="bg-surface-hover rounded-xl p-4">
                                    <p className="text-xs text-text-tertiary mb-1">Email</p>
                                    <p className="font-medium text-sm text-text-primary truncate">{selectedDebtor.email || "—"}</p>
                                </div>
                                <div className="bg-surface-hover rounded-xl p-4">
                                    <p className="text-xs text-text-tertiary mb-1">Teléfono</p>
                                    <p className="font-medium text-sm text-text-primary">{selectedDebtor.telephone || "—"}</p>
                                </div>
                                {selectedDebtor.invoiceNumber && (
                                    <div className="bg-surface-hover rounded-xl p-4">
                                        <p className="text-xs text-text-tertiary mb-1">N° Factura</p>
                                        <p className="font-medium text-sm text-text-primary">{selectedDebtor.invoiceNumber}</p>
                                    </div>
                                )}
                                {selectedDebtor.address && (
                                    <div className="bg-surface-hover rounded-xl p-4 col-span-2">
                                        <p className="text-xs text-text-tertiary mb-1">Dirección</p>
                                        <p className="font-medium text-sm text-text-primary">{selectedDebtor.address}</p>
                                    </div>
                                )}
                            </div>
                            {selectedDebtor.documentUrl && (
                                <a href={selectedDebtor.documentUrl} target="_blank" rel="noopener noreferrer"
                                   className={`flex items-center gap-2 text-sm text-text-secondary border border-border-default rounded-xl px-4 py-3 hover:bg-surface-hover hover:text-text-primary transition ${focusRing} ring-offset-surface-overlay`}>
                                    📄 Ver Documento
                                </a>
                            )}
                            <div className="flex gap-3 pt-2 border-t border-border-subtle">
                                <button onClick={() => handleEdit(selectedDebtor)}
                                        className={`flex-1 border border-border-default text-text-secondary py-2 rounded-xl text-sm hover:bg-surface-hover hover:text-text-primary transition ${focusRing} ring-offset-surface-overlay`}>
                                    Editar
                                </button>
                                <button onClick={() => handleDelete(selectedDebtor.id)}
                                        className={`flex-1 border border-danger/25 text-danger py-2 rounded-xl text-sm hover:bg-danger hover:text-surface-page transition ${focusRing} ring-offset-surface-overlay`}>
                                    Eliminar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="max-w-6xl mx-auto px-8 py-8">

                {/* HEADER */}
                <div className="flex items-start justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-text-primary">Deudores</h1>
                        <p className="text-sm text-text-tertiary mt-0.5">{stats.total} registrados</p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                        <button onClick={handleDownloadTemplate}
                                className={`text-sm border border-border-default px-3 py-2 rounded-xl text-text-secondary hover:bg-surface-hover transition ${focusRing} ring-offset-surface-page`}>
                            📋 Plantilla
                        </button>
                        <button onClick={() => exportDebtorsExcel(debtors, XLSX)}
                                className={`text-sm bg-success text-surface-page px-3 py-2 rounded-xl font-bold hover:opacity-90 transition ${focusRing} ring-offset-surface-page`}>
                            ⬇ Exportar
                        </button>
                        <label className={`text-sm bg-accent text-accent-fg px-3 py-2 rounded-xl font-bold cursor-pointer hover:opacity-90 transition ${focusRing} ring-offset-surface-page`}>
                            📤 Importar
                            <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFileUpload} className="hidden" />
                        </label>
                    </div>
                </div>

                {debtorsError && <p className="text-sm text-danger mb-4 bg-danger-bg border border-danger/25 rounded-xl px-4 py-3">{debtorsError}</p>}
                {message && <p className="text-sm text-text-primary mb-4 bg-surface-raised border border-border-subtle rounded-xl px-4 py-3">{message}</p>}

                {/* METRIC STRIP */}
                <div className="flex items-stretch bg-surface-raised border border-border-subtle rounded-2xl mb-6 overflow-hidden">
                    {metrics.map((m, i) => (
                        <div key={m.label} className="flex-1 flex items-center">
                            {i > 0 && <div className="w-px self-stretch bg-border-subtle" />}
                            <div className="flex-1 px-5 py-3.5">
                                <p className="text-[11px] text-text-tertiary uppercase tracking-wide mb-1">{m.label}</p>
                                <p className="text-xl font-bold font-mono" style={{ color: m.color }}>{m.value}</p>
                                {m.sub && <p className="text-[10px] text-text-tertiary mt-0.5">{m.sub}</p>}
                            </div>
                        </div>
                    ))}
                </div>

                {/* SEARCH / FILTER / VIEW TOGGLE */}
                <div className="flex flex-wrap gap-3 items-center justify-between mb-4">
                    <div className="flex flex-wrap gap-3 flex-1">
                        <input type="text" placeholder="Buscar deudor..."
                               value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                               className={`border border-border-default rounded-xl px-4 py-2 text-sm text-text-primary bg-surface-raised focus:outline-none focus:border-accent min-w-[180px] ${focusRing} ring-offset-surface-page`} />
                        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                                className={`border border-border-default rounded-xl px-4 py-2 text-sm text-text-primary bg-surface-raised focus:outline-none ${focusRing} ring-offset-surface-page`}>
                            <option value="ALL">Todos los estados</option>
                            {Object.entries(STATUS_COLORS).map(([key, val]) => (
                                <option key={key} value={key}>{val.label}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-center gap-1 bg-surface-raised border border-border-default rounded-xl p-1">
                        <button onClick={() => changeViewMode("card")} aria-label="Vista de tarjetas"
                                className={`p-2 rounded-lg transition ${focusRing} ring-offset-surface-raised ${viewMode === "card" ? "bg-surface-hover text-text-primary" : "text-text-tertiary hover:text-text-primary"}`}>
                            <LayoutGrid size={16} />
                        </button>
                        <button onClick={() => changeViewMode("list")} aria-label="Vista de lista"
                                className={`p-2 rounded-lg transition ${focusRing} ring-offset-surface-raised ${viewMode === "list" ? "bg-surface-hover text-text-primary" : "text-text-tertiary hover:text-text-primary"}`}>
                            <ListIcon size={16} />
                        </button>
                    </div>
                </div>

                {/* DEBTOR DISPLAY */}
                {paginatedDebtors.length === 0 ? (
                    <div className="text-center py-20 text-text-tertiary">
                        <p className="text-4xl mb-3">📋</p>
                        <p>No hay deudores registrados</p>
                    </div>
                ) : viewMode === "card" ? (
                    <div className="debtor-stack-column columns-2 lg:columns-3 xl:columns-4 gap-3">
                        {paginatedDebtors.map(debtor => (
                            <DebtorCard key={debtor.id} debtor={debtor} onClick={() => setSelectedDebtor(debtor)} />
                        ))}
                    </div>
                ) : (
                    <DebtorTable debtors={paginatedDebtors} onRowClick={setSelectedDebtor} />
                )}

                {totalPages > 1 && (
                    <div className="flex justify-center gap-4 mt-8">
                        <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                                className={`px-4 py-2 border border-border-default rounded-xl text-sm text-text-secondary hover:bg-surface-hover hover:text-text-primary transition disabled:opacity-30 ${focusRing} ring-offset-surface-page`}>← Prev</button>
                        <span className="text-sm text-text-tertiary self-center">Página {currentPage} de {totalPages}</span>
                        <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                                className={`px-4 py-2 border border-border-default rounded-xl text-sm text-text-secondary hover:bg-surface-hover hover:text-text-primary transition disabled:opacity-30 ${focusRing} ring-offset-surface-page`}>Next →</button>
                    </div>
                )}
            </div>
        </div>
    );
}
