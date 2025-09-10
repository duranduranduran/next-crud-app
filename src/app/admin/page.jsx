'use client';

import { useEffect, useState } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

// ========== Send Reminders Button ==========
function SendRemindersButton() {
    const [sending, setSending] = useState(false);
    const [message, setMessage] = useState(null);

    const handleSendReminders = async () => {
        setSending(true);
        setMessage(null);

        try {
            const res = await fetch('/api/send-reminders', { method: 'GET' });
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.message || 'Something went wrong.');
            }
            setMessage({ type: 'success', text: 'Reminders sent successfully!' });
        } catch (err) {
            setMessage({ type: 'error', text: err.message });
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="mt-6">
            <button
                onClick={handleSendReminders}
                disabled={sending}
                className={`bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 ${
                    sending ? 'opacity-50 cursor-not-allowed' : ''
                }`}
            >
                {sending ? 'Sending Reminders...' : 'Send Reminders'}
            </button>

            {message && (
                <p
                    className={`mt-2 ${
                        message.type === 'success' ? 'text-green-600' : 'text-red-600'
                    }`}
                >
                    {message.text}
                </p>
            )}
        </div>
    );
}

// ========== Admin Page ==========
export default function AdminPage() {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { data: session, status } = useSession();
    const router = useRouter();

    // Cron form state
    const [hour, setHour] = useState('');
    const [minute, setMinute] = useState('');
    const [statusMessage, setStatusMessage] = useState('');

    // ✅ Bulk status update state
    const [selectedDebtors, setSelectedDebtors] = useState([]);
    const [bulkStatus, setBulkStatus] = useState('');
    const [bulkLoading, setBulkLoading] = useState(false);
    const [bulkMessage, setBulkMessage] = useState(null);


// Boton de selct all
    const [selectAll, setSelectAll] = useState(false);

// Barra de busqueda y filtros
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [amountFilter, setAmountFilter] = useState("ALL");



    // Auth & client data fetching
    useEffect(() => {
        if (status === 'loading') return;

        if (!session) {
            router.push('/login');
        } else if (session.user.role !== 'admin') {
            router.push('/client');
        }
    }, [status, session, router]);

    const fetchClients = async () => {
        try {
            const res = await fetch('/api/admin/clients');
            const data = await res.json().catch(() => ({}));
            const clientData = Array.isArray(data) ? data : data.clients;
            setClients(clientData || []);
        } catch (err) {
            console.error('Error fetching clients:', err);
            setError('Failed to load clients.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClients();
        fetchReminderTime();
    }, []);

    const toggleDebtorAvailability = async (debtorId) => {
        try {
            const res = await fetch(`/api/admin/debtors/${debtorId}/toggle-availability`, {
                method: 'PATCH',
            });
            if (!res.ok) throw new Error('Failed to toggle');
            await fetchClients(); // refresh data
        } catch (err) {
            console.error(err);
            alert('Failed to toggle availability');
        }
    };

    const filteredClients = clients.map(client => {
        const filteredDebtors = client.debtorRecords.filter((debtor) => {
            // search by name or email
            const matchesSearch =
                debtor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (debtor.email && debtor.email.toLowerCase().includes(searchTerm.toLowerCase()));

            // status filter
            const matchesStatus =
                statusFilter === "ALL" ? true : debtor.status === statusFilter;

            // amount filter
            let matchesAmount = true;
            if (amountFilter === "<500") matchesAmount = debtor.amountOwed < 500;
            if (amountFilter === "500-1000")
                matchesAmount = debtor.amountOwed >= 500 && debtor.amountOwed <= 1000;
            if (amountFilter === ">1000") matchesAmount = debtor.amountOwed > 1000;

            return matchesSearch && matchesStatus && matchesAmount;
        });

        return { ...client, debtorRecords: filteredDebtors };
    });


    const updateDebtorStatus = async (debtorId, newStatus) => {
        try {
            const res = await fetch(`/api/admin/debtors/${debtorId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });
            if (!res.ok) throw new Error('Failed to update status');
            await fetchClients(); // refresh
        } catch (err) {
            console.error(err);
            alert('Failed to update status');
        }
    };

    const fetchReminderTime = async () => {
        try {
            const res = await fetch('/api/get-reminder-time');
            const data = await res.json().catch(() => ({}));
            setHour(data.hour || '');
            setMinute(data.minute || '');
        } catch (err) {
            console.error('Failed to fetch reminder time');
        }
    };

    const handleCronTimeSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/set-reminder-time', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ hour, minute }),
            });
            const data = await res.json().catch(() => ({}));
            if (res.ok) {
                setStatusMessage('✅ Reminder time updated!');
            } else {
                setStatusMessage(`❌ Error: ${data.message || 'Unknown error'}`);
            }
        } catch (err) {
            console.error(err);
            setStatusMessage('❌ Failed to update reminder time');
        }
    };

    const handleSelectAll = () => {
        if (selectAll) {
            setSelectedDebtors([]);
        } else {
            const allIds = clients.flatMap(client => client.debtorRecords.map(d => d.id));
            setSelectedDebtors(allIds);
        }
        setSelectAll(!selectAll);
    };



    // ========== Bulk selection (per-debtor only; no select-all yet) ==========
    const handleSelectDebtor = (debtorId) => {
        setSelectedDebtors((prev) => {
            const newSelected = prev.includes(debtorId)
                ? prev.filter(id => id !== debtorId)
                : [...prev, debtorId];

            // Sync selectAll state
            const totalDebtors = clients.flatMap(client => client.debtorRecords.map(d => d.id));
            setSelectAll(newSelected.length === totalDebtors.length);

            return newSelected;
        });
    };


    // ========== Bulk update ==========
    const handleBulkUpdate = async () => {
        setBulkMessage(null);

        if (!bulkStatus) {
            setBulkMessage({ type: 'error', text: 'Please select a status' });
            return;
        }
        if (selectedDebtors.length === 0) {
            setBulkMessage({ type: 'error', text: 'Please select at least one debtor' });
            return;
        }

        setBulkLoading(true);
        try {
            const res = await fetch('/api/admin/debtors/bulk-status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    debtorIds: selectedDebtors, // <-- must be an array of IDs
                    status: bulkStatus,        // <-- must be one of your enum values
                }),
            });

            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(data.message || data.error || 'Failed to update status');
            }

            setBulkMessage({ type: 'success', text: 'Statuses updated successfully' });
            await fetchClients(); // refresh list
            setSelectedDebtors([]);
            setBulkStatus('');
        } catch (error) {
            console.error(error);
            setBulkMessage({ type: 'error', text: error.message || 'Error updating statuses' });
        } finally {
            setBulkLoading(false);
        }
    };

    if (loading) return <p>Loading...</p>;
    if (error) return <p className="text-red-500">{error}</p>;

    return (
        <main className="p-6 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-6 text-red-600">Admin Dashboard</h1>
            {/* 🔍 Search + Filters */}
            <div className="mb-6 flex flex-wrap gap-4">
                <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="p-2 border rounded w-64"
                />

                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="p-2 border rounded"
                >
                    <option value="ALL">All Statuses</option>
                    <option value="PENDIENTE">Pendiente</option>
                    <option value="EN_GESTION">En Gestión</option>
                    <option value="ACUERDO_DE_PAGO">Acuerdo de Pago</option>
                    <option value="PAGADO">Pagado</option>
                    <option value="ESCALADO_JUDICIAL">Escalado judicial</option>
                </select>

                <select
                    value={amountFilter}
                    onChange={(e) => setAmountFilter(e.target.value)}
                    className="p-2 border rounded"
                >
                    <option value="ALL">All Amounts</option>
                    <option value="<500">Less than $500</option>
                    <option value="500-1000">$500 - $1000</option>
                    <option value=">1000">More than $1000</option>
                </select>
            </div>

            {/* ✅ Bulk update controls */}
            <div className="mb-6 flex items-center gap-4">

                <select
                    value={bulkStatus}
                    onChange={(e) => setBulkStatus(e.target.value)}
                    className="border rounded px-2 py-1"
                >
                    <option value="">Select Status</option>
                    <option value="PENDIENTE">Pendiente</option>
                    <option value="EN_GESTION">En Gestión</option>
                    <option value="ACUERDO_DE_PAGO">Acuerdo de Pago</option>
                    <option value="PAGADO">Pagado</option>
                    <option value="ESCALADO_JUDICIAL">Escalado (Judicial)</option>
                </select>


                <button
                    onClick={handleBulkUpdate}
                    disabled={bulkLoading}
                    className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
                >
                    {bulkLoading ? 'Updating...' : 'Apply to Selected'}
                </button>
                {/* ✅ Select All checkbox */}
                <div className="mb-2">
                    <label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={selectAll}
                            onChange={handleSelectAll}
                        />
                        Select All
                    </label>
                </div>


                <span className="text-sm text-gray-600">
          Selected: {selectedDebtors.length}
        </span>
            </div>

            {bulkMessage && (
                <p
                    className={`mb-4 ${
                        bulkMessage.type === 'success' ? 'text-green-600' : 'text-red-600'
                    }`}
                >
                    {bulkMessage.text}
                </p>
            )}

            {/* Clients and Debtors */}
            {filteredClients.length === 0 ? (
                <p>No clients found.</p>
            ) : (
                filteredClients.map((client) => (
                    <div
                        key={client.id}
                        className="mb-10 p-4 border border-gray-300 rounded shadow-sm"
                    >
                        <h2 className="text-xl font-semibold mb-2">
                            {client.name} ({client.email})
                        </h2>

                        {client.debtorRecords.length === 0 ? (
                            <p className="text-gray-500">No debtors.</p>
                        ) : (
                            <ul className="space-y-3">
                                {client.debtorRecords.map((debtor) => (
                                    <li
                                        key={debtor.id}
                                        className="flex flex-col md:flex-row md:items-center md:justify-between border p-3 rounded space-y-2 md:space-y-0"
                                    >
                                        <div className="space-y-1">
                                            {/* Individual selection (no Select All yet) */}
                                            <label className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedDebtors.includes(debtor.id)}
                                                    onChange={() => handleSelectDebtor(debtor.id)}
                                                />
                                                <span>Select</span>
                                            </label>

                                            <p><strong>Name:</strong> {debtor.name}</p>
                                            <p><strong>Amount Owed:</strong> ${debtor.amountOwed}</p>

                                            {/* Single-item status selector (still available) */}
                                            <div className="flex items-center gap-2">
                                                <p className="m-0"><strong>Status:</strong></p>
                                                <select
                                                    value={debtor.status || 'PENDIENTE'}
                                                    onChange={(e) => updateDebtorStatus(debtor.id, e.target.value)}
                                                    className="border rounded px-2 py-1"
                                                >
                                                    <option value="PENDIENTE">Pendiente</option>
                                                    <option value="EN_GESTION">En Gestión</option>
                                                    <option value="ACUERDO_DE_PAGO">Acuerdo de Pago</option>
                                                    <option value="PAGADO">Pagado</option>
                                                    <option value="ESCALADO_JUDICIAL">Escalado (Judicial)</option>
                                                </select>
                                            </div>

                                            {/* Document link (download) */}
                                            {debtor.documentUrl && (
                                                <p className="m-0">
                                                    <strong>Document: </strong>
                                                    <a
                                                        href={debtor.documentUrl.replace('/upload/', '/upload/fl_attachment/')}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-blue-600 underline"
                                                    >
                                                        Download Document
                                                    </a>
                                                </p>
                                            )}
                                        </div>

                                        <label className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                checked={debtor.availableForNotify}
                                                onChange={() => toggleDebtorAvailability(debtor.id)}
                                            />
                                            <span>Notify Allowed</span>
                                        </label>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                ))
            )}

            {/* ========== Send Reminders Button ========== */}
            <SendRemindersButton />

            {/* ========== Set Reminder Time Form ========== */}
            <div className="mt-10 border-t pt-6">
                <h2 className="text-xl font-semibold mb-4">Automated Reminder Time</h2>
                <form onSubmit={handleCronTimeSubmit} className="space-y-4 max-w-sm">
                    <div>
                        <label className="block mb-1 font-medium">Hour (0–23)</label>
                        <input
                            type="number"
                            value={hour}
                            onChange={(e) => setHour(e.target.value)}
                            min="0"
                            max="23"
                            required
                            className="border rounded px-3 py-2 w-full"
                        />
                    </div>
                    <div>
                        <label className="block mb-1 font-medium">Minute (0–59)</label>
                        <input
                            type="number"
                            value={minute}
                            onChange={(e) => setMinute(e.target.value)}
                            min="0"
                            max="59"
                            required
                            className="border rounded px-3 py-2 w-full"
                        />
                    </div>
                    <button
                        type="submit"
                        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                    >
                        Save Reminder Time
                    </button>
                    {statusMessage && (
                        <p className="mt-2 text-sm">{statusMessage}</p>
                    )}
                </form>
            </div>

            <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="mt-10 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
                Logout
            </button>
        </main>
    );
}
