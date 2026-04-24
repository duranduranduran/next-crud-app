"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser, SignOutButton } from "@clerk/nextjs";

/* --------------------------------------
Send Reminders Button
-------------------------------------- */
function SendRemindersButton() {
    const [sending, setSending] = useState(false);
    const [message, setMessage] = useState(null);

    const handleSendReminders = async () => {
        setSending(true);
        setMessage(null);

        try {
            const res = await fetch("/api/send-reminders", { method: "GET" });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.message || "Something went wrong.");
            }

            setMessage({ type: "success", text: "Reminders sent successfully!" });

        } catch (err) {
            setMessage({ type: "error", text: err.message });
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="mt-10">
            <button
                onClick={handleSendReminders}
                disabled={sending}
                className={`bg-[#443CA3] text-white px-4 py-2 rounded-lg hover:bg-[#3A3391] shadow-sm ${
                    sending ? "opacity-50 cursor-not-allowed" : ""
                }`}
            >
                {sending ? "Sending Reminders..." : "Send Reminders"}
            </button>

            {message && (
                <p className={`mt-2 text-sm ${message.type === "success" ? "text-green-600" : "text-red-600"}`}>
                    {message.text}
                </p>
            )}
        </div>
    );
}

/* --------------------------------------
STATUS BADGE
-------------------------------------- */
function StatusBadge({ status }) {
    const colors =
        status === "PAGADO" ? "bg-green-100 text-green-700" :
            status === "EN_GESTION" ? "bg-emerald-100 text-emerald-700" :
                status === "ACUERDO_DE_PAGO" ? "bg-indigo-100 text-indigo-700" :
                    status === "ESCALADO_JUDICIAL" ? "bg-red-100 text-red-700" :
                        "bg-yellow-100 text-yellow-700";

    return (
        <span className={`inline-flex items-center text-xs font-semibold px-3 py-1 rounded-full ${colors}`}>
            {status ? status.replace(/_/g, " ") : "PENDIENTE"}
        </span>
    );
}

/* --------------------------------------
DEBTOR MODAL
-------------------------------------- */
function DebtorModal({
                         debtor,
                         onClose,
                         onDelete,
                         onToggleAvailability,
                         onUpdateStatus,
                         debtorNotes,
                         setDebtorNotes,
                         onSaveNote,
                         onDeleteNote,
                         selectedDebtors,
                         setSelectedDebtors,
                         clients,
                         setSelectAll,
                     }) {
    if (!debtor) return null;

    return (
        <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Modal Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-[#443CA3] flex items-center justify-center text-white font-bold text-lg">
                            {debtor.name?.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-gray-800">{debtor.name}</h2>
                            <StatusBadge status={debtor.status} />
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-700 text-2xl leading-none"
                    >
                        ✕
                    </button>
                </div>

                <div className="p-6 space-y-6">

                    {/* Info Grid */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="bg-gray-50 rounded-xl p-4">
                            <p className="text-xs text-gray-400 mb-1">Amount Owed</p>
                            <p className="text-lg font-semibold text-[#443CA3]">
                                USD {Number(debtor.amountOwed).toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                            })}
                            </p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-4">
                            <p className="text-xs text-gray-400 mb-1">Cédula</p>
                            <p className="font-medium text-gray-700">{debtor.cedulaIdentidad || "—"}</p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-4">
                            <p className="text-xs text-gray-400 mb-1">Email</p>
                            <p className="font-medium text-gray-700">{debtor.email || "—"}</p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-4">
                            <p className="text-xs text-gray-400 mb-1">Teléfono</p>
                            <p className="font-medium text-gray-700">{debtor.telephone || "—"}</p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-4 col-span-2">
                            <p className="text-xs text-gray-400 mb-1">Creado</p>
                            <p className="font-medium text-gray-700">{debtor.createdAt || "—"}</p>
                        </div>
                    </div>

                    {/* Status Update */}
                    <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Update Status</p>
                        <select
                            value={debtor.status || "PENDIENTE"}
                            onChange={(e) => onUpdateStatus(debtor.id, e.target.value)}
                            className="border rounded-lg px-3 py-2 text-sm w-full"
                        >
                            <option value="PENDIENTE">Pendiente</option>
                            <option value="EN_GESTION">En Gestión</option>
                            <option value="ACUERDO_DE_PAGO">Acuerdo de Pago</option>
                            <option value="PAGADO">Pagado</option>
                            <option value="ESCALADO_JUDICIAL">Escalado Judicial</option>
                        </select>
                    </div>

                    {/* Toggles */}
                    <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                            <input
                                type="checkbox"
                                checked={!!debtor.availableForNotify}
                                onChange={() => onToggleAvailability(debtor.id)}
                            />
                            <span>Notify Allowed</span>
                        </label>

                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                            <input
                                type="checkbox"
                                checked={selectedDebtors.includes(debtor.id)}
                                onChange={() => {
                                    setSelectedDebtors((prev) => {
                                        const exists = prev.includes(debtor.id);
                                        const newSelected = exists
                                            ? prev.filter((id) => id !== debtor.id)
                                            : [...prev, debtor.id];
                                        const totalDebtors = clients.flatMap((c) =>
                                            c.debtorRecords.map((d) => d.id)
                                        );
                                        setSelectAll(newSelected.length === totalDebtors.length);
                                        return newSelected;
                                    });
                                }}
                            />
                            <span>Select for Bulk</span>
                        </label>
                    </div>

                    {/* Notes Section */}
                    <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Notes</p>
                        <textarea
                            placeholder="Add note..."
                            value={debtorNotes[debtor.id] || ""}
                            onChange={(e) =>
                                setDebtorNotes((prev) => ({ ...prev, [debtor.id]: e.target.value }))
                            }
                            className="w-full border rounded-lg p-2 text-sm shadow-sm"
                            rows={3}
                        />
                        <button
                            onClick={() => onSaveNote(debtor.id)}
                            className="mt-2 bg-gray-800 text-white px-3 py-1 rounded-md text-sm hover:bg-gray-900"
                        >
                            Save Note
                        </button>

                        <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
                            {debtor.notes?.length > 0 ? (
                                debtor.notes.map((note) => (
                                    <div
                                        key={note.id}
                                        className="bg-gray-50 border border-gray-100 p-3 rounded-lg text-sm flex justify-between items-start gap-2"
                                    >
                                        <div>
                                            <p className="text-gray-800">{note.content}</p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                {note.user?.name || note.user?.email || "Unknown"} •{" "}
                                                {new Date(note.createdAt).toLocaleString()}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => onDeleteNote(note.id)}
                                            className="text-red-400 hover:text-red-600 text-sm shrink-0"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <p className="text-xs text-gray-400">No notes yet</p>
                            )}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                        <div className="flex gap-2">
                            <button
                                onClick={() => console.log("Edit", debtor.id)}
                                className="text-sm px-3 py-1 border rounded text-gray-700 hover:bg-gray-50"
                            >
                                Edit
                            </button>
                            <button
                                onClick={() => onDelete(debtor.id)}
                                className="text-sm px-3 py-1 border rounded text-red-600 hover:bg-red-50"
                            >
                                Delete
                            </button>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-sm px-4 py-1.5 bg-gray-100 rounded-lg text-gray-600 hover:bg-gray-200"
                        >
                            Close
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
}

/* --------------------------------------
MAIN PAGE
-------------------------------------- */
export default function AdminPage() {

    const { user, isLoaded } = useUser();
    const router = useRouter();

    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [amountFilter, setAmountFilter] = useState("ALL");

    const [bulkStatus, setBulkStatus] = useState("");
    const [selectedDebtors, setSelectedDebtors] = useState([]);
    const [selectAll, setSelectAll] = useState(false);
    const [bulkMessage, setBulkMessage] = useState(null);
    const [bulkLoading, setBulkLoading] = useState(false);
    const [selectedDebtor, setSelectedDebtor] = useState(null);

    const ITEMS_PER_PAGE = 6;
    const [debtorPages, setDebtorPages] = useState({});
    const [debtorNotes, setDebtorNotes] = useState({});

    const handlePageChange = (clientId, page) => {
        setDebtorPages((prev) => ({ ...prev, [clientId]: page }));
    };

    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    /* AUTH CHECK */
    useEffect(() => {
        if (!isLoaded) return;
        if (!user) { router.push("/sign-in"); return; }
        const role = user.publicMetadata?.role;
        if (role !== "admin") router.push("/client");
    }, [isLoaded, user, router]);

    /* ESC TO CLOSE MODAL */
    useEffect(() => {
        const handleKeyDown = (e) => { if (e.key === "Escape") setSelectedDebtor(null); };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    /* FETCH CLIENTS */
    const fetchClients = async () => {
        try {
            const res = await fetch("/api/admin/clients", { credentials: "include" });
            if (!res.ok) { const text = await res.text(); throw new Error(text || "Unauthorized"); }
            const data = await res.json();
            const clientData = Array.isArray(data) ? data : data.clients;
            setClients(clientData || []);
        } catch (err) {
            console.error("Error fetching clients:", err);
            setError("Failed to load clients.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchClients(); }, []);

    /* TOGGLE NOTIFY */
    const toggleDebtorAvailability = async (debtorId) => {
        try {
            const res = await fetch(`/api/admin/debtors/${debtorId}/toggle-availability`, { method: "PATCH" });
            if (!res.ok) throw new Error("Failed to toggle");
            await fetchClients();
        } catch (err) {
            console.error(err);
            alert("Failed to toggle availability");
        }
    };

    /* UPDATE STATUS */
    const updateDebtorStatus = async (debtorId, newStatus) => {
        try {
            const res = await fetch(`/api/admin/debtors/${debtorId}/status`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            });
            if (!res.ok) throw new Error("Failed to update status");
            await fetchClients();
        } catch (err) {
            console.error(err);
            alert("Failed to update status");
        }
    };

    /* DELETE DEBTOR */
    const handleDeleteDebtor = async (debtorId) => {
        if (!confirm("Are you sure you want to delete this debtor?")) return;
        try {
            const res = await fetch(`/api/debtors/${debtorId}`, { method: "DELETE", credentials: "include" });
            if (!res.ok) { const data = await res.json().catch(() => ({})); throw new Error(data.message || "Failed to delete"); }
            setSelectedDebtor(null);
            await fetchClients();
        } catch (err) {
            console.error(err);
            alert("Failed to delete");
        }
    };

    /* SAVE NOTE */
    const handleSaveNote = async (debtorId) => {
        const content = debtorNotes[debtorId];
        if (!content || content.trim() === "") { alert("Note cannot be empty"); return; }
        try {
            const res = await fetch(`/api/admin/debtors/${debtorId}/notes`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content }),
            });
            if (!res.ok) throw new Error("Failed to save note");
            setDebtorNotes((prev) => ({ ...prev, [debtorId]: "" }));
            await fetchClients();
        } catch (err) {
            console.error(err);
            alert("Error saving note");
        }
    };

    /* DELETE NOTE */
    const handleDeleteNote = async (noteId) => {
        if (!confirm("Delete this note?")) return;
        try {
            const res = await fetch(`/api/admin/debtors/notes/${noteId}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed to delete");
            await fetchClients();
        } catch (err) {
            console.error(err);
            alert("Error deleting note");
        }
    };

    /* FILTER LOGIC */
    const filteredClients = clients.map((client) => {
        const filteredDebtors = client.debtorRecords.filter((debtor) => {
            const matchesSearch =
                debtor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (debtor.email && debtor.email.toLowerCase().includes(searchTerm.toLowerCase()));
            const matchesStatus = statusFilter === "ALL" ? true : debtor.status === statusFilter;
            let matchesAmount = true;
            if (amountFilter === "<500") matchesAmount = debtor.amountOwed < 500;
            if (amountFilter === "500-1000") matchesAmount = debtor.amountOwed >= 500 && debtor.amountOwed <= 1000;
            if (amountFilter === ">1000") matchesAmount = debtor.amountOwed > 1000;
            return matchesSearch && matchesStatus && matchesAmount;
        });
        return { ...client, debtorRecords: filteredDebtors };
    });

    // Keep selectedDebtor in sync with latest fetched data
    useEffect(() => {
        if (!selectedDebtor) return;
        const updated = clients
            .flatMap((c) => c.debtorRecords)
            .find((d) => d.id === selectedDebtor.id);
        if (updated) setSelectedDebtor(updated);
    }, [clients]);

    if (loading) return <p className="text-center mt-20">Loading...</p>;
    if (error) return <p className="text-red-500">{error}</p>;

    return (
        <main className="min-h-screen bg-white px-10 py-8">

            {/* DEBTOR MODAL */}
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
            />

            {/* Top Bar */}
            <div className="flex justify-between items-center bg-white px-6 py-4 rounded-2xl shadow-sm border border-gray-100 mb-10">
                <img src="/logo-recupera-purple.png" alt="recupera" className="h-16" />
                <div className="flex items-center gap-3 text-gray-700">
                    <div className="w-10 h-10 rounded-full bg-gray-200"></div>
                    <span className="font-medium">Admin Dashboard</span>
                </div>
            </div>

            <h1 className="text-3xl font-semibold text-gray-700 mb-6">My Debtors</h1>

            {/* FILTER BAR */}
            <section className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-8">
                <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    <input
                        type="text"
                        placeholder="Search..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="border rounded-lg px-3 py-2"
                    />
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border rounded-lg px-3 py-2">
                        <option value="ALL">All Statuses</option>
                        <option value="PENDIENTE">Pendiente</option>
                        <option value="EN_GESTION">En Gestión</option>
                        <option value="ACUERDO_DE_PAGO">Acuerdo de Pago</option>
                        <option value="PAGADO">Pagado</option>
                        <option value="ESCALADO_JUDICIAL">Escalado Judicial</option>
                    </select>
                    <select value={amountFilter} onChange={(e) => setAmountFilter(e.target.value)} className="border rounded-lg px-3 py-2">
                        <option value="ALL">All Amounts</option>
                        <option value="<500">Less than $500</option>
                        <option value="500-1000">$500 - $1000</option>
                        <option value=">1000">More than $1000</option>
                    </select>
                </div>
            </section>

            {/* BULK ACTIONS */}
            <section className="mb-6 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 text-sm">
                        <input
                            type="checkbox"
                            checked={selectAll}
                            onChange={() => {
                                const currently = !selectAll;
                                setSelectAll(currently);
                                if (currently) {
                                    const allIds = clients.flatMap((c) => c.debtorRecords.map((d) => d.id));
                                    setSelectedDebtors(allIds);
                                } else {
                                    setSelectedDebtors([]);
                                }
                            }}
                        />
                        <span>Select all</span>
                    </label>
                    <span className="text-sm text-gray-600">Selected: {selectedDebtors.length}</span>
                </div>

                <div className="flex items-center gap-3">
                    <select value={bulkStatus} onChange={(e) => setBulkStatus(e.target.value)} className="border rounded-lg px-3 py-2">
                        <option value="">Select Status</option>
                        <option value="PENDIENTE">Pendiente</option>
                        <option value="EN_GESTION">En Gestión</option>
                        <option value="ACUERDO_DE_PAGO">Acuerdo de Pago</option>
                        <option value="PAGADO">Pagado</option>
                        <option value="ESCALADO_JUDICIAL">Escalado Judicial</option>
                    </select>
                    <button
                        onClick={async () => {
                            setBulkMessage(null);
                            if (!bulkStatus) { setBulkMessage({ type: "error", text: "Please select a status" }); return; }
                            if (selectedDebtors.length === 0) { setBulkMessage({ type: "error", text: "Please select at least one debtor" }); return; }
                            setBulkLoading(true);
                            try {
                                const res = await fetch("/api/admin/debtors/bulk-status", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ debtorIds: selectedDebtors, status: bulkStatus }),
                                });
                                const data = await res.json().catch(() => ({}));
                                if (!res.ok) throw new Error(data.message || "Failed to update status");
                                setBulkMessage({ type: "success", text: "Statuses updated successfully" });
                                await fetchClients();
                                setSelectedDebtors([]);
                                setBulkStatus("");
                                setSelectAll(false);
                            } catch (err) {
                                console.error(err);
                                setBulkMessage({ type: "error", text: err.message || "Error updating statuses" });
                            } finally {
                                setBulkLoading(false);
                            }
                        }}
                        disabled={bulkLoading}
                        className="bg-[#443CA3] text-white px-4 py-2 rounded-lg disabled:opacity-50"
                    >
                        {bulkLoading ? "Updating..." : "Apply to Selected"}
                    </button>
                </div>
            </section>

            {bulkMessage && (
                <p className={`mb-4 text-sm ${bulkMessage.type === "success" ? "text-green-600" : "text-red-600"}`}>
                    {bulkMessage.text}
                </p>
            )}

            {/* CLIENTS */}
            <section className="space-y-8">
                {filteredClients.map((client) => {
                    const currentPage = debtorPages[client.id] || 1;
                    const totalPages = Math.max(1, Math.ceil(client.debtorRecords.length / ITEMS_PER_PAGE));
                    const paginatedDebtors = client.debtorRecords.slice(
                        (currentPage - 1) * ITEMS_PER_PAGE,
                        currentPage * ITEMS_PER_PAGE
                    );

                    return (
                        <div key={client.id} className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-all">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-800">{client.name}</h3>
                                    <p className="text-sm text-gray-500">{client.email}</p>
                                </div>
                                <div className="text-sm text-gray-600">Debtors: {client.debtorRecords.length}</div>
                            </div>

                            {client.debtorRecords.length === 0 ? (
                                <p className="text-gray-500">No debtors.</p>
                            ) : (
                                <>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {paginatedDebtors.map((debtor) => (
                                            <div
                                                key={debtor.id}
                                                onClick={() => setSelectedDebtor(debtor)}
                                                className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md hover:border-[#443CA3]/30 transition-all duration-200 cursor-pointer"
                                            >
                                                {/* Card Summary */}
                                                <div className="flex items-start justify-between mb-3">
                                                    <div>
                                                        <p className="text-sm font-semibold text-gray-800">{debtor.name}</p>
                                                        <p className="text-xs text-gray-500 mt-1">Email: {debtor.email || "—"}</p>
                                                        <p className="text-xs text-gray-500">Cédula: {debtor.cedulaIdentidad || "—"}</p>
                                                        <p className="text-xs text-gray-500">Teléfono: {debtor.telephone || "—"}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-base font-semibold text-[#443CA3]">
                                                            USD {Number(debtor.amountOwed).toLocaleString(undefined, {
                                                            minimumFractionDigits: 2,
                                                            maximumFractionDigits: 2,
                                                        })}
                                                        </div>
                                                        <div className="mt-2">
                                                            <StatusBadge status={debtor.status} />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
                                                    <span>{debtor.notes?.length || 0} note{debtor.notes?.length !== 1 ? "s" : ""}</span>
                                                    <span className="text-[#443CA3] font-medium">Click to open →</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="flex items-center justify-center gap-3 mt-6">
                                        <button
                                            onClick={() => handlePageChange(client.id, Math.max(1, currentPage - 1))}
                                            disabled={currentPage === 1}
                                            className="px-3 py-1 border rounded disabled:opacity-50"
                                        >
                                            Prev
                                        </button>
                                        <div className="text-sm text-gray-600">Page {currentPage} of {totalPages}</div>
                                        <button
                                            onClick={() => handlePageChange(client.id, Math.min(totalPages, currentPage + 1))}
                                            disabled={currentPage === totalPages}
                                            className="px-3 py-1 border rounded disabled:opacity-50"
                                        >
                                            Next
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    );
                })}
            </section>

            <div className="mt-8">
                <SendRemindersButton />
            </div>

            <div className="mt-12 flex justify-end">
                <SignOutButton redirectUrl="/sign-in">
                    <button className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600">
                        Logout
                    </button>
                </SignOutButton>
            </div>

        </main>
    );
}
