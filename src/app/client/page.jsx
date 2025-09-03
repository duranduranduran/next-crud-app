'use client';

import { useSession, signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';

export default function ClientPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [amountOwed, setAmountOwed] = useState('');
    const [documentFile, setDocumentFile] = useState(null);
    const [success, setSuccess] = useState('');
    const [telephone, setTelephone] = useState('');
    const [address, setAddress] = useState('');
    const [cedulaIdentidad, setCedulaIdentidad] = useState('');
    const [error, setError] = useState('');
    const [debtors, setDebtors] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isTyping, setIsTyping] = useState(false);

    // ✅ NEW: State for email validation error
    const [emailError, setEmailError] = useState('');

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

        const isPdf = file.type === 'application/pdf';
        const resourceType = isPdf ? 'raw' : 'auto';

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

    const formatAmount = (value) => {
        // Remove all non-digit and non-dot characters
        let cleaned = value.replace(/[^\d.]/g, '');

        // Split integer and decimal parts
        const [integerPart, decimalPart] = cleaned.split('.');

        // Format integer part with commas
        const formattedInt = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

        // Keep up to 2 decimal digits
        const formattedDecimal = decimalPart ? decimalPart.substring(0, 2) : '';

        return formattedDecimal ? `${formattedInt}.${formattedDecimal}` : formattedInt;
    };

    const formatAmountAutoDecimal = (value) => {
        // Remove all non-digit characters
        const digits = value.replace(/\D/g, '');

        if (!digits) return '';

        let integerPart = digits.slice(0, -2) || '0';
        let decimalPart = digits.slice(-2);

        // Format integer part with commas
        integerPart = parseInt(integerPart, 10).toLocaleString();

        return `${integerPart}.${decimalPart}`;
    };



    // ✅ Cedula checksum validation
    const isValidCedula = (cedula) => {
        if (!/^\d{10}$/.test(cedula)) return false;

        const province = parseInt(cedula.substring(0, 2), 10);
        if (province < 1 || (province > 24 && province !== 30)) return false;

        const digits = cedula.split('').map(Number);
        const checkDigit = digits[9];

        let sum = 0;
        for (let i = 0; i < 9; i++) {
            let value = digits[i];
            if (i % 2 === 0) { // odd positions (0-based index)
                value *= 2;
                if (value > 9) value -= 9;
            }
            sum += value;
        }

        const nextTen = Math.ceil(sum / 10) * 10;
        const calculatedCheckDigit = nextTen - sum === 10 ? 0 : nextTen - sum;

        return calculatedCheckDigit === checkDigit;
    };

    // ✅ Email validation function
    const validateEmail = (value) => {
        if (!value) {
            setEmailError('');
            return;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            setEmailError('Por favor, ingresa un correo válido');
        } else {
            setEmailError('');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSuccess('');
        setError('');

        // ✅ Validate email before submission
        if (email && emailError) {
            setError('El correo ingresado no es válido');
            return;
        }

        const numericAmount = amountOwed.replace(/,/g, '');
        const amount = Number(numericAmount);


        if (isNaN(amount)) {
            setError('Amount owed must be a valid number');
            return;
        }

        if (!/^\d+(\.\d{1,2})?$/.test(numericAmount)) {
            setError('Amount can have at most 2 decimal places');
            return;
        }

        if (amount <= 0) {
            setError('Amount owed must be greater than 0');
            return;
        }

        if (amount > 1000000) {
            setError('Amount owed is unrealistically high');
            return;
        }

        if (!telephone || telephone.length < 8) {
            setError('Please enter a valid phone number');
            return;
        }

        if (cedulaIdentidad.length !== 10) {
            setError('La cédula debe tener exactamente 10 dígitos');
            return;
        }

        if (!isValidCedula(cedulaIdentidad)) {
            setError('Cédula inválida. Verifique los 10 dígitos.');
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
                telephone, // Full phone number with country code
                address,
                cedulaIdentidad,
                amountOwed: amount.toFixed(2)
            };

            if (documentUrl) payload.documentUrl = documentUrl;

            let res;
            if (editingId) {
                res = await fetch(`/api/debtors/${editingId}`, {
                    method: 'PATCH',
                    body: JSON.stringify(payload),
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                });
            } else {
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

    const handleAmountChange = (e) => {
        let input = e.target.value.replace(/\D/g, ''); // Only digits

        if (!input) {
            setAmountOwed('');
            return;
        }

        // Convert to cents → divide by 100 for decimals
        let rawValue = (parseInt(input, 10) / 100).toFixed(2);

        // Format with commas for display
        const formattedValue = new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(rawValue);

        setAmountOwed(formattedValue);
    };

    const handleBlur = () => {
        setIsTyping(false);

        if (amountOwed !== '' && !isNaN(amountOwed)) {
            const formatted = parseFloat(amountOwed).toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            });
            setAmountOwed(formatted);
        }
    };

    const handleFocus = () => {
        // Remove formatting when focusing (so user can edit raw number)
        const rawValue = amountOwed.replace(/,/g, '');
        setAmountOwed(rawValue);
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
                    onChange={(e) => {
                        setEmail(e.target.value);
                        validateEmail(e.target.value);
                    }}
                    className="w-full p-2 border rounded"
                />
                {emailError && (
                    <p className="text-red-500 text-sm mt-1">{emailError}</p>
                )}

                <PhoneInput
                    country={'ec'}
                    value={telephone}
                    onChange={(phone) => setTelephone(phone)}
                    enableSearch={true}
                    inputClass="w-full p-2 border rounded"
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
                    onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, ''); // only digits
                        if (value.length <= 10) {
                            setCedulaIdentidad(value);
                        }
                    }}
                    className="w-full p-2 border rounded"
                    required
                />
                {cedulaIdentidad.length > 0 && cedulaIdentidad.length < 10 && (
                    <p className="text-red-500 text-sm mt-1">
                        La cédula debe tener 10 dígitos.
                    </p>
                )}

                <input
                    type="text"
                    placeholder="Amount Owed"
                    value={amountOwed}
                    onChange={handleAmountChange}
                    onBlur={handleBlur}
                    onFocus={handleFocus}
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
                                <p className="mt-2">
                                    <strong>Status:</strong>{' '}
                                    <span className={`px-2 py-1 rounded text-white text-sm ${
                                        debtor.status === 'PENDIENTE' ? 'bg-yellow-500' :
                                            debtor.status === 'EN_GESTION' ? 'bg-blue-500' :
                                                debtor.status === 'ACUERDO_DE_PAGO' ? 'bg-purple-500' :
                                                    debtor.status === 'PAGADO' ? 'bg-green-600' :
                                                        debtor.status === 'ESCALADO_JUDICIAL' ? 'bg-red-600' :
                                                            'bg-gray-500'
                                    }`}>
                                        {debtor.status.replace(/_/g, ' ')}
                                    </span>
                                </p>
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
