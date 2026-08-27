'use client';

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { AlertTriangle, Check, Pencil, X } from "lucide-react";

const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";
const SHORT_NAME_MAX_LENGTH = 12;

function ShortNameCell({ client, onSaved }) {
    const [editing, setEditing] = useState(false);
    const [value, setValue] = useState(client.shortName || "");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const startEdit = () => {
        setValue(client.shortName || "");
        setError("");
        setEditing(true);
    };

    const cancel = () => {
        setEditing(false);
        setError("");
    };

    const save = async () => {
        const trimmed = value.trim();
        if (!trimmed) { setError("No puede estar vacío"); return; }
        if (trimmed.length > SHORT_NAME_MAX_LENGTH) { setError(`Máximo ${SHORT_NAME_MAX_LENGTH} caracteres`); return; }

        setSaving(true);
        setError("");
        try {
            const res = await fetch(`/api/admin/clients/${client.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ shortName: trimmed }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Error al guardar");
            onSaved(client.id, data.shortName);
            setEditing(false);
        } catch (err) {
            setError(err.message || "Error al guardar");
        } finally {
            setSaving(false);
        }
    };

    if (!editing) {
        return (
            <button
                onClick={startEdit}
                className={`group flex items-center gap-2 text-left ${focusRing} ring-offset-surface-raised rounded-lg`}
            >
                {client.shortName ? (
                    <span className="font-mono text-sm text-text-primary">{client.shortName}</span>
                ) : (
                    <span className="flex items-center gap-1.5 text-sm text-danger font-medium">
                        <AlertTriangle size={13} />
                        Sin shortName
                    </span>
                )}
                <Pencil size={12} className="text-text-tertiary opacity-0 group-hover:opacity-100 transition" />
            </button>
        );
    }

    return (
        <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5">
                <input
                    autoFocus
                    type="text"
                    value={value}
                    maxLength={SHORT_NAME_MAX_LENGTH}
                    onChange={e => setValue(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") save(); if (e.key === "Escape") cancel(); }}
                    className={`w-32 border border-border-default rounded-lg px-2 py-1 text-sm font-mono bg-surface-page text-text-primary focus:outline-none focus:border-accent ${focusRing} ring-offset-surface-raised`}
                />
                <button onClick={save} disabled={saving} aria-label="Guardar"
                        className={`w-6 h-6 flex items-center justify-center rounded-lg text-success hover:bg-success-bg transition disabled:opacity-40 ${focusRing} ring-offset-surface-raised`}>
                    <Check size={14} />
                </button>
                <button onClick={cancel} disabled={saving} aria-label="Cancelar"
                        className={`w-6 h-6 flex items-center justify-center rounded-lg text-text-tertiary hover:bg-surface-hover transition ${focusRing} ring-offset-surface-raised`}>
                    <X size={14} />
                </button>
            </div>
            <p className={`text-[11px] font-mono ${value.length >= SHORT_NAME_MAX_LENGTH ? "text-danger" : "text-text-tertiary"}`}>
                {value.length} / {SHORT_NAME_MAX_LENGTH} — aparece en los mensajes SMS
            </p>
            {error && <p className="text-[11px] text-danger">{error}</p>}
        </div>
    );
}

export default function ClientesPage() {
    const { user, isLoaded } = useUser();
    const router = useRouter();

    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");

    useEffect(() => {
        if (!isLoaded) return;
        if (user?.publicMetadata?.role !== "admin") { router.replace("/sign-in"); return; }
        const fetchClients = async () => {
            try {
                const res = await fetch("/api/admin/clients", { credentials: "include" });
                if (!res.ok) throw new Error();
                setClients(await res.json());
            } catch {
                setError("Error al cargar clientes");
            } finally {
                setLoading(false);
            }
        };
        fetchClients();
    }, [isLoaded, user, router]);

    const handleSaved = (clientId, shortName) => {
        setClients(prev => prev.map(c => (c.id === clientId ? { ...c, shortName } : c)));
    };

    const filtered = useMemo(() => {
        const term = search.toLowerCase();
        if (!term) return clients;
        return clients.filter(c =>
            (c.name || "").toLowerCase().includes(term) || (c.email || "").toLowerCase().includes(term)
        );
    }, [clients, search]);

    const missingCount = clients.filter(c => !c.shortName).length;

    if (!isLoaded) return null;

    return (
        <main data-density="compact" className="min-h-screen bg-surface-page px-8 py-8">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">Clientes</h1>
                    <p className="text-sm text-text-tertiary mt-0.5">
                        Gestión de clientes — el shortName es el nombre corto que aparece en los mensajes SMS.
                    </p>
                </div>
                <input
                    type="text"
                    placeholder="Buscar cliente..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className={`border border-border-default rounded-xl px-4 py-2 text-sm bg-surface-raised text-text-primary focus:outline-none focus:border-accent min-w-[220px] ${focusRing} ring-offset-surface-page`}
                />
            </div>

            {error && <p className="text-sm text-danger mb-4 bg-danger-bg border border-danger/25 rounded-xl px-4 py-3">{error}</p>}

            {missingCount > 0 && !loading && (
                <div className="flex items-center gap-2 text-sm text-danger bg-danger-bg border border-danger/25 rounded-xl px-4 py-3 mb-4">
                    <AlertTriangle size={16} className="flex-shrink-0" />
                    {missingCount} cliente{missingCount !== 1 ? "s" : ""} sin shortName — sus deudores no podrán recibir SMS hasta que se configure uno.
                </div>
            )}

            <div className="bg-surface-raised rounded-2xl shadow-sm border border-border-subtle overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                        <thead>
                            <tr className="border-b border-border-default text-left text-[11px] font-medium text-text-tertiary uppercase tracking-wide">
                                <th className="px-4 py-2.5">Cliente</th>
                                <th className="px-2 py-2.5">Email</th>
                                <th className="px-2 py-2.5">shortName (SMS)</th>
                                <th className="px-2 py-2.5">Deudores</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-subtle">
                            {loading ? (
                                <tr><td colSpan={4} className="text-center py-10 text-text-tertiary">Cargando...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={4} className="text-center py-10 text-text-tertiary">Sin resultados</td></tr>
                            ) : filtered.map(c => (
                                <tr key={c.id} id={`client-${c.id}`} className="hover:bg-surface-hover transition-colors">
                                    <td className="px-4 py-2.5 text-text-primary font-medium">{c.name || c.email?.split("@")[0] || "Cliente"}</td>
                                    <td className="px-2 py-2.5 text-text-tertiary">{c.email}</td>
                                    <td className="px-2 py-2.5"><ShortNameCell client={c} onSaved={handleSaved} /></td>
                                    <td className="px-2 py-2.5 text-text-tertiary font-mono">{c.debtorRecords?.length ?? 0}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </main>
    );
}
