"use client";

import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import {
    PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis
} from "recharts";
import { useClientData } from "../_lib/ClientDataContext";
import { STATUS_COLORS, exportDebtorsExcel } from "../_lib/shared";

const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-surface-page";

export default function ReportesPage() {
    const { debtors, stats, isLoaded, isSignedIn } = useClientData();
    const [notifData, setNotifData] = useState(null);

    useEffect(() => {
        if (!isLoaded || !isSignedIn) return;
        const fetchNotifs = async () => {
            const res = await fetch("/api/debtors/logs", { credentials: "include" });
            if (res.ok) setNotifData(await res.json());
        };
        fetchNotifs();
    }, [isLoaded, isSignedIn]);

    return (
        <div data-density="compact" className="min-h-screen bg-surface-page">
            <div className="max-w-6xl mx-auto px-8 py-8 space-y-6">

                <div>
                    <h1 className="text-2xl font-bold text-text-primary">Reportes</h1>
                    <p className="text-sm text-text-tertiary mt-0.5">Métricas de recuperación y actividad de notificaciones</p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-surface-raised border border-border-subtle rounded-2xl p-6">
                        <h3 className="font-semibold text-text-primary mb-4">Deudores por Estado</h3>
                        {stats.byStatus.length === 0 ? (
                            <p className="text-text-tertiary text-sm text-center py-12">Sin datos</p>
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
                    <div className="bg-surface-raised border border-border-subtle rounded-2xl p-6">
                        <h3 className="font-semibold text-text-primary mb-4">Distribución por Estado</h3>
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={stats.byStatus} barSize={36}>
                                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "var(--color-text-tertiary)" }} axisLine={false} tickLine={false}
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

                <div className="bg-surface-raised border border-border-subtle rounded-2xl p-6">
                    <h3 className="font-semibold text-text-primary mb-4">Detalle por Estado</h3>
                    <div className="space-y-3">
                        {Object.entries(STATUS_COLORS).map(([key, meta]) => {
                            const count = debtors.filter(d => d.status === key).length;
                            const amount = debtors.filter(d => d.status === key).reduce((acc, d) => acc + Number(d.amountOwed), 0);
                            const pct = stats.total > 0 ? ((count / stats.total) * 100).toFixed(0) : 0;
                            return (
                                <div key={key} className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: meta.color }} />
                                    <span className="text-sm text-text-secondary w-36">{meta.label}</span>
                                    <span className="text-sm font-bold text-text-primary w-8">{count}</span>
                                    <div className="flex-1 h-1.5 bg-border-subtle rounded-full overflow-hidden">
                                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: meta.color }} />
                                    </div>
                                    <span className="text-xs font-mono text-text-tertiary w-16 text-right">${amount.toLocaleString()}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {notifData && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-3 gap-4">
                            <div className="bg-surface-raised border border-border-subtle rounded-2xl p-5">
                                <p className="text-xs text-text-tertiary uppercase tracking-wide mb-2">Emails Enviados</p>
                                <p className="text-3xl font-bold font-mono text-info">{notifData.totalEmails}</p>
                            </div>
                            <div className="bg-surface-raised border border-border-subtle rounded-2xl p-5">
                                <p className="text-xs text-text-tertiary uppercase tracking-wide mb-2">Llamadas Realizadas</p>
                                <p className="text-3xl font-bold font-mono text-info">{notifData.totalCalls}</p>
                            </div>
                            <div className="bg-surface-raised border border-border-subtle rounded-2xl p-5">
                                <p className="text-xs text-text-tertiary uppercase tracking-wide mb-2">Total Contactos</p>
                                <p className="text-3xl font-bold font-mono text-text-primary">{notifData.totalEmails + notifData.totalCalls}</p>
                            </div>
                        </div>
                        <div className="bg-surface-raised border border-border-subtle rounded-2xl p-6">
                            <h3 className="font-semibold text-text-primary mb-4">Historial de Notificaciones por Deudor</h3>
                            {notifData.byDebtor.length === 0 ? (
                                <p className="text-text-tertiary text-sm text-center py-8">Aún no se han enviado notificaciones</p>
                            ) : (
                                <div className="space-y-3">
                                    {notifData.byDebtor.map((d) => (
                                        <div key={d.id} className="flex items-center gap-4 p-3 bg-surface-hover rounded-xl">
                                            <div className="flex-1">
                                                <p className="text-sm font-semibold text-text-primary">{d.name}</p>
                                                <p className="text-xs text-text-tertiary mt-0.5">
                                                    Último contacto: {d.lastContact ? new Date(d.lastContact).toLocaleDateString("es-EC") : "—"}
                                                </p>
                                            </div>
                                            <div className="flex gap-3 text-xs">
                                                <span className="bg-info-bg text-info px-2.5 py-1 rounded-full font-semibold">📧 {d.emails}</span>
                                                <span className="bg-info-bg text-info px-2.5 py-1 rounded-full font-semibold">📞 {d.calls}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="bg-surface-raised border border-border-subtle rounded-2xl p-6">
                            <h3 className="font-semibold text-text-primary mb-4">Actividad Reciente</h3>
                            <div className="space-y-2">
                                {notifData.logs.slice(0, 8).map((log) => (
                                    <div key={log.id} className="flex items-center gap-3 text-sm py-2 border-b border-border-subtle last:border-0">
                                        <span className="text-lg">{log.event === "CALL_TRIGGERED" ? "📞" : "📧"}</span>
                                        <span className="flex-1 text-text-secondary text-xs">{log.detail}</span>
                                        <span className="text-xs text-text-tertiary whitespace-nowrap">
                                            {new Date(log.createdAt).toLocaleDateString("es-EC")}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex justify-end">
                    <button onClick={() => exportDebtorsExcel(debtors, XLSX)}
                            className={`bg-accent text-accent-fg px-6 py-3 rounded-xl font-bold hover:opacity-90 transition text-sm ${focusRing}`}>
                        ⬇ Exportar Reporte Excel
                    </button>
                </div>
            </div>
        </div>
    );
}
