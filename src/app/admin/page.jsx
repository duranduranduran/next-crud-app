

'use client';

import { useEffect, useState } from 'react';
import {signOut, useSession} from "next-auth/react";
import {useRouter} from "next/navigation";
// import SendRemindersButton from "@/app/components/SendReminders";
function SendRemindersButton() {
    const [sending, setSending] = useState(false);
    const [message, setMessage] = useState(null);

    const handleSendReminders = async () => {
        setSending(true);
        setMessage(null);

        try {
            const res = await fetch('/api/send-reminders', {
                method: 'POST',
            });

            if (!res.ok) {
                const errorData = await res.json();
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




export default function AdminPage() {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { data: session, status } = useSession();
    const router = useRouter();


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
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Error fetching clients');
            }

            // Adjust depending on whether `data` has a `clients` key or not
            const clientData = Array.isArray(data) ? data : data.clients;
            setClients(clientData);
        } catch (err) {
            console.error('Error fetching clients:', err);
            setError('Failed to load clients.');
        } finally {
            setLoading(false);
        }
    };

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

    useEffect(() => {
        fetchClients();
    }, []);

    if (loading) return <p>Loading...</p>;
    if (error) return <p className="text-red-500">{error}</p>;

    return (
        <main className="p-6 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

            {clients.length === 0 ? (
                <p>No clients found.</p>
            ) : (
                clients.map(client => (
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
                                {client.debtorRecords.map(debtor => (
                                    <li
                                        key={debtor.id}
                                        className="flex items-center justify-between border p-3 rounded"
                                    >
                                        <div>
                                            <p><strong>Name:</strong> {debtor.name}</p>
                                            <p><strong>Amount Owed:</strong> ${debtor.amountOwed}</p>
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

            <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="mt-10 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
                Logout
            </button>
        </main>
    );

}
