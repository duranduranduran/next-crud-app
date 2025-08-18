


// 'use client';
//
// import { useEffect, useState } from 'react';
// import { signOut, useSession } from 'next-auth/react';
// import { useRouter } from 'next/navigation';
//
// // ========== Send Reminders Button ==========
// function SendRemindersButton() {
//     const [sending, setSending] = useState(false);
//     const [message, setMessage] = useState(null);
//
//     const handleSendReminders = async () => {
//         setSending(true);
//         setMessage(null);
//
//         try {
//             const res = await fetch('/api/send-reminders', {
//                 method: 'GET',
//             });
//
//             if (!res.ok) {
//                 const errorData = await res.json();
//                 throw new Error(errorData.message || 'Something went wrong.');
//             }
//
//             setMessage({ type: 'success', text: 'Reminders sent successfully!' });
//         } catch (err) {
//             setMessage({ type: 'error', text: err.message });
//         } finally {
//             setSending(false);
//         }
//     };
//
//     return (
//         <div className="mt-6">
//             <button
//                 onClick={handleSendReminders}
//                 disabled={sending}
//                 className={`bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 ${
//                     sending ? 'opacity-50 cursor-not-allowed' : ''
//                 }`}
//             >
//                 {sending ? 'Sending Reminders...' : 'Send Reminders'}
//             </button>
//
//             {message && (
//                 <p
//                     className={`mt-2 ${
//                         message.type === 'success' ? 'text-green-600' : 'text-red-600'
//                     }`}
//                 >
//                     {message.text}
//                 </p>
//             )}
//         </div>
//     );
// }
//
// // ========== Admin Page ==========
// export default function AdminPage() {
//     const [clients, setClients] = useState([]);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState('');
//     const { data: session, status } = useSession();
//     const router = useRouter();
//
//     // Cron form state
//     const [hour, setHour] = useState('');
//     const [minute, setMinute] = useState('');
//     const [statusMessage, setStatusMessage] = useState('');
//
//     // Auth & client data fetching
//     useEffect(() => {
//         if (status === 'loading') return;
//
//         if (!session) {
//             router.push('/login');
//         } else if (session.user.role !== 'admin') {
//             router.push('/client');
//         }
//     }, [status, session, router]);
//
//     const fetchClients = async () => {
//         try {
//             const res = await fetch('/api/admin/clients');
//             const data = await res.json();
//             const clientData = Array.isArray(data) ? data : data.clients;
//             setClients(clientData);
//         } catch (err) {
//             console.error('Error fetching clients:', err);
//             setError('Failed to load clients.');
//         } finally {
//             setLoading(false);
//         }
//     };
//
//     useEffect(() => {
//         fetchClients();
//         fetchReminderTime();
//     }, []);
//
//     const toggleDebtorAvailability = async (debtorId) => {
//         try {
//             const res = await fetch(`/api/admin/debtors/${debtorId}/toggle-availability`, {
//                 method: 'PATCH',
//             });
//             if (!res.ok) throw new Error('Failed to toggle');
//             await fetchClients(); // refresh data
//         } catch (err) {
//             console.error(err);
//             alert('Failed to toggle availability');
//         }
//     };
//
//     const fetchReminderTime = async () => {
//         try {
//             const res = await fetch('/api/get-reminder-time');
//             const data = await res.json();
//             setHour(data.hour || '');
//             setMinute(data.minute || '');
//         } catch (err) {
//             console.error('Failed to fetch reminder time');
//         }
//     };
//
//     const handleCronTimeSubmit = async (e) => {
//         e.preventDefault();
//         try {
//             const res = await fetch('/api/set-reminder-time', {
//                 method: 'POST',
//                 headers: { 'Content-Type': 'application/json' },
//                 body: JSON.stringify({ hour, minute }),
//             });
//             const data = await res.json();
//             if (res.ok) {
//                 setStatusMessage('✅ Reminder time updated!');
//             } else {
//                 setStatusMessage(`❌ Error: ${data.message}`);
//             }
//         } catch (err) {
//             console.error(err);
//             setStatusMessage('❌ Failed to update reminder time');
//         }
//     };
//
//     if (loading) return <p>Loading...</p>;
//     if (error) return <p className="text-red-500">{error}</p>;
//
//     return (
//         <main className="p-6 max-w-4xl mx-auto">
//             <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
//
//             {clients.length === 0 ? (
//                 <p>No clients found.</p>
//             ) : (
//                 clients.map(client => (
//                     <div
//                         key={client.id}
//                         className="mb-10 p-4 border border-gray-300 rounded shadow-sm"
//                     >
//                         <h2 className="text-xl font-semibold mb-2">
//                             {client.name} ({client.email})
//                         </h2>
//
//                         {client.debtorRecords.length === 0 ? (
//                             <p className="text-gray-500">No debtors.</p>
//                         ) : (
//                             <ul className="space-y-3">
//                                 {client.debtorRecords.map(debtor => (
//                                     <li
//                                         key={debtor.id}
//                                         className="flex items-center justify-between border p-3 rounded"
//                                     >
//                                         <div>
//                                             <p><strong>Name:</strong> {debtor.name}</p>
//                                             <p><strong>Amount Owed:</strong> ${debtor.amountOwed}</p>
//                                         </div>
//                                         <label className="flex items-center space-x-2">
//                                             <input
//                                                 type="checkbox"
//                                                 checked={debtor.availableForNotify}
//                                                 onChange={() => toggleDebtorAvailability(debtor.id)}
//                                             />
//                                             <span>Notify Allowed</span>
//                                         </label>
//                                     </li>
//                                 ))}
//                             </ul>
//                         )}
//                     </div>
//                 ))
//             )}
//
//             {/* ========== Send Reminders Button ========== */}
//             <SendRemindersButton />
//
//             {/* ========== Set Reminder Time Form ========== */}
//             <div className="mt-10 border-t pt-6">
//                 <h2 className="text-xl font-semibold mb-4">Automated Reminder Time</h2>
//                 <form onSubmit={handleCronTimeSubmit} className="space-y-4 max-w-sm">
//                     <div>
//                         <label className="block mb-1 font-medium">Hour (0–23)</label>
//                         <input
//                             type="number"
//                             value={hour}
//                             onChange={(e) => setHour(e.target.value)}
//                             min="0"
//                             max="23"
//                             required
//                             className="border rounded px-3 py-2 w-full"
//                         />
//                     </div>
//                     <div>
//                         <label className="block mb-1 font-medium">Minute (0–59)</label>
//                         <input
//                             type="number"
//                             value={minute}
//                             onChange={(e) => setMinute(e.target.value)}
//                             min="0"
//                             max="59"
//                             required
//                             className="border rounded px-3 py-2 w-full"
//                         />
//                     </div>
//                     <button
//                         type="submit"
//                         className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
//                     >
//                         Save Reminder Time
//                     </button>
//                     {statusMessage && (
//                         <p className="mt-2 text-sm">{statusMessage}</p>
//                     )}
//                 </form>
//             </div>
//
//             <button
//                 onClick={() => signOut({ callbackUrl: '/login' })}
//                 className="mt-10 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
//             >
//                 Logout
//             </button>
//         </main>
//     );
// }


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
            const res = await fetch('/api/send-reminders', {
                method: 'GET',
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
            const data = await res.json();
            const clientData = Array.isArray(data) ? data : data.clients;
            setClients(clientData);
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

    const fetchReminderTime = async () => {
        try {
            const res = await fetch('/api/get-reminder-time');
            const data = await res.json();
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
            const data = await res.json();
            if (res.ok) {
                setStatusMessage('✅ Reminder time updated!');
            } else {
                setStatusMessage(`❌ Error: ${data.message}`);
            }
        } catch (err) {
            console.error(err);
            setStatusMessage('❌ Failed to update reminder time');
        }
    };

    if (loading) return <p>Loading...</p>;
    if (error) return <p className="text-red-500">{error}</p>;

    return (
        <main className="p-6 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-6 text-red-600">Admin Dashboard</h1>

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
                                        className="flex flex-col md:flex-row md:items-center md:justify-between border p-3 rounded space-y-2 md:space-y-0"
                                    >
                                        <div>
                                            <p><strong>Name:</strong> {debtor.name}</p>
                                            <p><strong>Amount Owed:</strong> ${debtor.amountOwed}</p>
                                            {debtor.documentUrl && (
                                                <p>
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
