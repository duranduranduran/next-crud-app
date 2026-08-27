"use client";

import { useEffect, useState } from "react";
import { Sun, Moon, Monitor } from "lucide-react";
import { useClientData } from "../_lib/ClientDataContext";
import { getStoredMode, applyTheme, subscribeThemeChange } from "../../lib/theme";

const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-surface-raised";

const MODES = [
    { id: "light", label: "Claro", icon: Sun },
    { id: "dark", label: "Oscuro", icon: Moon },
    { id: "auto", label: "Auto", icon: Monitor },
];

export default function AjustesPage() {
    const { user } = useClientData();
    const [mode, setMode] = useState("auto");

    // Reads the same stored/DOM state everything else reads, and re-syncs
    // if the theme changes from elsewhere (e.g. the sidebar's sun/moon
    // toggle) — one source of truth (see lib/theme.js), this is just a
    // second view over it.
    useEffect(() => {
        setMode(getStoredMode());
        return subscribeThemeChange(() => setMode(getStoredMode()));
    }, []);

    const choose = (next) => {
        applyTheme(next);
        setMode(next);
    };

    return (
        <div data-density="compact" className="min-h-screen bg-surface-page">
            <div className="max-w-3xl mx-auto px-8 py-8 space-y-6">

                <div>
                    <h1 className="text-2xl font-bold text-text-primary">Ajustes</h1>
                    <p className="text-sm text-text-tertiary mt-0.5">Preferencias de tu cuenta</p>
                </div>

                {/* PERFIL — read-only: no PATCH route exists yet for a client
                    to update their own User record, and there's no ruc/company
                    field on the model to show beyond name + email. See the
                    schema report delivered alongside this build. */}
                <section className="bg-surface-raised border border-border-subtle rounded-2xl p-6">
                    <h2 className="font-semibold text-text-primary mb-1">Perfil</h2>
                    <p className="text-xs text-text-tertiary mb-5">Gestionado por tu cuenta — solo lectura por ahora</p>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-surface-hover rounded-xl p-4">
                            <p className="text-xs text-text-tertiary mb-1">Nombre</p>
                            <p className="text-sm font-medium text-text-primary">{user?.fullName || "—"}</p>
                        </div>
                        <div className="bg-surface-hover rounded-xl p-4">
                            <p className="text-xs text-text-tertiary mb-1">Correo</p>
                            <p className="text-sm font-medium text-text-primary truncate">{user?.primaryEmailAddress?.emailAddress || "—"}</p>
                        </div>
                    </div>
                </section>

                {/* APARIENCIA */}
                <section className="bg-surface-raised border border-border-subtle rounded-2xl p-6">
                    <h2 className="font-semibold text-text-primary mb-1">Apariencia</h2>
                    <p className="text-xs text-text-tertiary mb-5">Auto sigue la configuración de tu sistema</p>
                    <div className="flex gap-2">
                        {MODES.map(({ id, label, icon: Icon }) => (
                            <button
                                key={id}
                                onClick={() => choose(id)}
                                aria-pressed={mode === id}
                                className={`flex-1 flex flex-col items-center gap-2 py-4 rounded-xl border transition ${focusRing} ${
                                    mode === id
                                        ? "border-text-primary bg-surface-hover text-text-primary"
                                        : "border-border-default text-text-secondary hover:border-text-tertiary hover:text-text-primary"
                                }`}
                            >
                                <Icon size={20} />
                                <span className="text-sm font-medium">{label}</span>
                            </button>
                        ))}
                    </div>
                </section>

                {/* NOTIFICACIONES intentionally omitted — User has no
                    notification-preference fields (weekly summary, payment
                    alerts, etc.) and there's no schema to persist toggles
                    against. Adding this section would mean building UI that
                    silently doesn't save. See the schema report. */}
            </div>
        </div>
    );
}
