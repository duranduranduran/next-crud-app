//
// 'use client';
//
// import { useSession, signOut } from 'next-auth/react';
// import { useEffect, useState } from 'react';
// import { useRouter } from 'next/navigation';
//
// export default function ClientPage() {
//     const { data: session, status } = useSession();
//     const router = useRouter();
//
//     const [name, setName] = useState('');
//     const [email, setEmail] = useState('');
//     const [amountOwed, setAmountOwed] = useState('');
//     const [success, setSuccess] = useState('');
//     const [error, setError] = useState('');
//     const [debtors, setDebtors] = useState([]);
//     const [editingId, setEditingId] = useState(null);
//     const [loading, setLoading] = useState(false);
//
//
//
//     useEffect(() => {
//         if (status === 'loading') return;
//         if (!session) {
//             router.push('/login');
//         } else if (session.user.role !== 'client') {
//             router.push('/login');
//         }
//     }, [status, session, router]);
//
//     const fetchDebtors = async () => {
//         try {
//             const res = await fetch('/api/debtors', {
//                 method: 'GET',
//                 credentials: 'include',
//             });
//
//             const data = await res.json();
//             if (res.ok) {
//                 setDebtors(data);
//             } else {
//                 console.error('Failed to fetch debtors:', data);
//             }
//         } catch (err) {
//             console.error('Error fetching debtors:', err);
//         }
//     };
//
//     useEffect(() => {
//         if (status === 'authenticated') {
//             fetchDebtors();
//         }
//     }, [status]);
//
//     const handleSubmit = async (e) => {
//         e.preventDefault();
//         setSuccess('');
//         setError('');
//
//         if (Number(amountOwed) <= 0) {
//             setError('Amount owed must be greater than 0');
//             return;
//         }
//
//         setLoading(true);
//         let res;
//         try {
//             if (editingId) {
//                 // Update debtor
//                 res = await fetch(`/api/debtors/${editingId}`, {
//                     method: 'PATCH',
//                     body: JSON.stringify({ name, email, amountOwed }),
//                     headers: { 'Content-Type': 'application/json' },
//                     credentials: 'include',
//                 });
//             } else {
//                 // Add debtor
//                 res = await fetch('/api/debtors', {
//                     method: 'POST',
//                     body: JSON.stringify({ name, email, amountOwed }),
//                     headers: { 'Content-Type': 'application/json' },
//                     credentials: 'include',
//                 });
//             }
//
//             if (res.ok) {
//                 setSuccess(editingId ? 'Debtor updated!' : 'Debtor added!');
//                 setName('');
//                 setEmail('');
//                 setAmountOwed('');
//                 setEditingId(null);
//                 await fetchDebtors();
//             } else {
//                 let data;
//                 try {
//                     data = await res.json();
//                 } catch (err) {
//                     data = { message: 'Unknown error occurred' };
//                 }
//                 setError(data.message || 'Error submitting form');
//             }
//         } catch (err) {
//             setError('Unexpected error occurred');
//         } finally {
//             setLoading(false);
//         }
//     };
//
//     const handleEdit = (debtor) => {
//         setName(debtor.name);
//         setEmail(debtor.email || '');
//         setAmountOwed(debtor.amountOwed);
//         setEditingId(debtor.id);
//     };
//
//     const handleDelete = async (id) => {
//         const confirmed = confirm('Are you sure you want to delete this debtor?');
//         if (!confirmed) return;
//
//         try {
//             const res = await fetch(`/api/debtors/${id}`, {
//                 method: 'DELETE',
//                 credentials: 'include',
//             });
//
//             if (res.ok) {
//                 await fetchDebtors();
//             } else {
//                 let data;
//                 try {
//                     data = await res.json();
//                 } catch (err) {
//                     data = { message: 'Unknown error occurred' };
//                 }
//                 setError(data.message || 'Error deleting debtor');
//             }
//         } catch (err) {
//             setError('Unexpected error occurred while deleting');
//         }
//     };
//
//     if (status === 'loading') return <p>Loading session...</p>;
//     if (!session || session.user.role !== 'client') return null;
//
//     return (
//         <div className="p-10">
//             <h1 className="text-2xl font-bold mb-4">Welcome, {session.user.name || 'Client'}!</h1>
//             <p>Email: {session.user.email}</p>
//
//             <form onSubmit={handleSubmit} className="mt-6 space-y-4 max-w-md">
//                 <h2 className="text-xl font-semibold">{editingId ? 'Edit Debtor' : 'Add a Debtor'}</h2>
//
//                 <input
//                     type="text"
//                     placeholder="Debtor Name"
//                     value={name}
//                     onChange={(e) => setName(e.target.value)}
//                     className="w-full p-2 border rounded"
//                     required
//                 />
//
//                 <input
//                     type="email"
//                     placeholder="Debtor Email (optional)"
//                     value={email}
//                     onChange={(e) => setEmail(e.target.value)}
//                     className="w-full p-2 border rounded"
//                 />
//
//                 <input
//                     type="number"
//                     placeholder="Amount Owed"
//                     value={amountOwed}
//                     onChange={(e) => setAmountOwed(e.target.value)}
//                     className="w-full p-2 border rounded"
//                     required
//                 />
//
//                 <button
//                     type="submit"
//                     className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
//                     disabled={loading}
//                 >
//                     {loading ? 'Submitting...' : editingId ? 'Update Debtor' : 'Add Debtor'}
//                 </button>
//
//                 {success && <p className="text-green-600">{success}</p>}
//                 {error && <p className="text-red-600">{error}</p>}
//             </form>
//
//             <div className="mt-10 bg-red-500 text-black p-4 rounded  ">
//                 <h2 className="text-xl font-bold mb-2">Your Debtors</h2>
//                 {debtors.length === 0 ? (
//                     <p className="text-gray-500 ">No debtors yet.</p>
//                 ) : (
//                     <ul className="space-y-2 ">
//                         {debtors.map((debtor) => (
//                             <li
//                                 key={debtor.id}
//                                 className="border p-4 rounded bg-white shadow-sm flex justify-between items-start"
//                             >
//                                 <div>
//                                     <p><strong>Name:</strong> {debtor.name}</p>
//                                     {debtor.email && (
//                                         <p><strong>Email:</strong> {debtor.email}</p>
//                                     )}
//                                     <p><strong>Amount Owed:</strong> ${debtor.amountOwed}</p>
//                                 </div>
//                                 <div className="space-x-2">
//                                     <button
//                                         onClick={() => handleEdit(debtor)}
//                                         className="text-blue-600 hover:underline"
//                                     >
//                                         Edit
//                                     </button>
//                                     <button
//                                         onClick={() => handleDelete(debtor.id)}
//                                         className="text-red-600 hover:underline"
//                                     >
//                                         Delete
//                                     </button>
//                                 </div>
//                             </li>
//                         ))}
//                     </ul>
//                 )}
//             </div>
//
//             <button
//                 onClick={() => signOut({ callbackUrl: '/login' })}
//                 className="mt-10 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
//             >
//                 Logout
//             </button>
//         </div>
//     );
// }


'use client';

import { useSession, signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
// import process from "next/dist/build/webpack/loaders/resolve-url-loader/lib/postcss";

export default function ClientPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [amountOwed, setAmountOwed] = useState('');
    const [documentFile, setDocumentFile] = useState(null); // new state
    const [success, setSuccess] = useState('');
    const [telephone, setTelephone] = useState('');       // NEW
    const [address, setAddress] = useState('');           // NEW
    const [cedulaIdentidad, setCedulaIdentidad] = useState(''); // NEW
    const [error, setError] = useState('');
    const [debtors, setDebtors] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(false);


    useEffect(() => {
        if (status === 'loading') return;
        if (!session) {
            router.push('/login');
        } else if (session.user.role !== 'client') {
            router.push('/login');
        }
    }, [status, session, router]);


        const fetchDebtors = async () => {
        try {
            const res = await fetch('/api/debtors', {
                method: 'GET',
                credentials: 'include',
            });

            const data = await res.json();
            if (res.ok) {
                setDebtors(data);
            } else {
                console.error('Failed to fetch debtors:', data);
            }
        } catch (err) {
            console.error('Error fetching debtors:', err);
        }
    };

    useEffect(() => {
        if (status === 'authenticated') {
            fetchDebtors();
        }
    }, [status]);

    const uploadDocument = async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append(
            'upload_preset',
            process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
        );

        // Decide resource type based on file
        const isPdf = file.type === 'application/pdf';
        const resourceType = isPdf ? 'raw' : 'auto'; // 'auto' works for images

        try {
            const res = await fetch(
                `https://api.cloudinary.com/v1_1/${
                    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
                }/${resourceType}/upload`,
                { method: 'POST', body: formData }
            );
            const data = await res.json();
            if (!res.ok) throw new Error(data.error?.message || 'Upload failed');
            return data.secure_url;
        } catch (err) {
            console.error('Cloudinary upload error:', err);
            return null;
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSuccess('');
        setError('');

        if (Number(amountOwed) <= 0) {
            setError('Amount owed must be greater than 0');
            return;
        }

        setLoading(true);

        try {
            let documentUrl = null;

            if (documentFile) {
                documentUrl = await uploadDocument(documentFile);
                if (!documentUrl) {
                    setError('Failed to upload document');
                    setLoading(false);
                    return;
                }
            }

            const payload = {
                name,
                email,
                telephone,
                address,
                cedulaIdentidad,
                amountOwed
            };


            if (documentUrl) payload.documentUrl = documentUrl;

            let res;
            if (editingId) {
                // Update debtor (including documentUrl if any)
                res = await fetch(`/api/debtors/${editingId}`, {
                    method: 'PATCH',
                    body: JSON.stringify(payload),
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                });
            } else {
                // Add debtor
                res = await fetch('/api/debtors', {
                    method: 'POST',
                    body: JSON.stringify(payload),
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                });
            }

            if (res.ok) {
                setSuccess(editingId ? 'Debtor updated!' : 'Debtor added!');
                setName('');
                setEmail('');
                setTelephone('');
                setAddress('');
                setCedulaIdentidad('');
                setAmountOwed('');
                setDocumentFile(null);
                setEditingId(null);
                await fetchDebtors();
            } else {
                const data = await res.json();
                setError(data.message || 'Error submitting form');
            }
        } catch (err) {
            console.error(err);
            setError('Unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (debtor) => {
        setName(debtor.name);
        setEmail(debtor.email || '');
        setTelephone(debtor.telephone || '');
        setAddress(debtor.address || '');
        setCedulaIdentidad(debtor.cedulaIdentidad || '');
        setAmountOwed(debtor.amountOwed);
        setEditingId(debtor.id);
        setDocumentFile(null);
    };


    const handleDelete = async (id) => {
        const confirmed = confirm('Are you sure you want to delete this debtor?');
        if (!confirmed) return;

        try {
            const res = await fetch(`/api/debtors/${id}`, {
                method: 'DELETE',
                credentials: 'include',
            });

            if (res.ok) {
                await fetchDebtors();
            } else {
                let data;
                try {
                    data = await res.json();
                } catch (err) {
                    data = { message: 'Unknown error occurred' };
                }
                setError(data.message || 'Error deleting debtor');
            }
        } catch (err) {
            setError('Unexpected error occurred while deleting');
        }
    };


    if (status === 'loading') return <p>Loading session...</p>;
    if (!session || session.user.role !== 'client') return null;

    return (
        <div className="p-10">
            <h1 className="text-2xl font-bold mb-4">Welcome, {session.user.name || 'Client'}!</h1>
            <p>Email: {session.user.email}</p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4 max-w-md">
                <h2 className="text-xl font-semibold">{editingId ? 'Edit Debtor' : 'Add a Debtor'}</h2>

                <input
                    type="text"
                    placeholder="Debtor Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-2 border rounded"
                    required
                />

                <input
                    type="email"
                    placeholder="Debtor Email (optional)"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-2 border rounded"
                />

                <input
                    type="text"
                    placeholder="Telephone"
                    value={telephone}
                    onChange={(e) => setTelephone(e.target.value)}
                    className="w-full p-2 border rounded"
                />

                <input
                    type="text"
                    placeholder="Address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full p-2 border rounded"
                />

                <input
                    type="text"
                    placeholder="Cédula de Identidad"
                    value={cedulaIdentidad}
                    onChange={(e) => setCedulaIdentidad(e.target.value)}
                    className="w-full p-2 border rounded"
                    required
                />

                <input
                    type="number"
                    placeholder="Amount Owed"
                    value={amountOwed}
                    onChange={(e) => setAmountOwed(e.target.value)}
                    className="w-full p-2 border rounded"
                    required
                />

                <label className="block">
                    <span className="text-gray-700">Attach Document (photo or PDF, optional):</span>
                    <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={(e) => setDocumentFile(e.target.files[0])}
                        className="mt-1"
                    />
                </label>

                <button
                    type="submit"
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                    disabled={loading}
                >
                    {loading ? 'Submitting...' : editingId ? 'Update Debtor' : 'Add Debtor'}
                </button>

                {success && <p className="text-green-600">{success}</p>}
                {error && <p className="text-red-600">{error}</p>}
            </form>

            {/*DEBTOR LIST*/}

            <div className="mt-10 bg-red-500 text-black p-4 rounded">
                <h2 className="text-xl font-bold mb-2">Your Debtors</h2>
                {debtors.length === 0 ? (
                    <p className="text-gray-500">No debtors yet.</p>
                ) : (
                    <ul className="space-y-2">
                        {debtors.map((debtor) => (
                            <li key={debtor.id}
                                className="border p-4 rounded bg-white shadow-sm flex justify-between items-start">
                                <div>
                                    <p><strong>Name:</strong> {debtor.name}</p>
                                    {debtor.email && <p><strong>Email:</strong> {debtor.email}</p>}
                                    {debtor.telephone && <p><strong>Telephone:</strong> {debtor.telephone}</p>}
                                    {debtor.address && <p><strong>Address:</strong> {debtor.address}</p>}
                                    <p><strong>Cédula:</strong> {debtor.cedulaIdentidad}</p>
                                    <p><strong>Amount Owed:</strong> ${debtor.amountOwed}</p>
                                </div>
                                <div className="space-x-2">
                                    <button
                                        onClick={() => handleEdit(debtor)}
                                        className="text-blue-600 hover:underline"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(debtor.id)}
                                        className="text-red-600 hover:underline"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <button
                onClick={() => signOut({callbackUrl: '/login'})}
                className="mt-10 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
                Logout
            </button>

        </div>
    );
}
