"use client";

import { useEffect, useState, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import {
    PieChart, Pie, Cell, Tooltip, Legend,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
} from "recharts";

// Colors a chart by actual debtor status — must use the real status tokens,
// not generic ones (a chart segment showing PAGADO debtors IS the PAGADO
// status, unlike a success toast which merely coincides in hue).
function getStatusColor(status) {
    const key = status.toLowerCase();
    if (key.includes("pagado")) return "var(--color-status-pagado)";
    if (key.includes("pendiente")) return "var(--color-status-pendiente)";
    if (key.includes("en_gestion") || key.includes("gestion")) return "var(--color-status-en-gestion)";
    if (key.includes("acuerdo")) return "var(--color-status-acuerdo-de-pago)";
    if (key.includes("escalado") || key.includes("judicial")) return "var(--color-status-escalado-judicial)";
    return "var(--color-accent)";
}

function formatMoney(amount) {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
    }).format(amount);
}

function formatStatus(status) {
    return status.replace(/_/g, " ");
}

const PERIOD_LABELS = {
    "7d": "Últimos 7 días",
    "30d": "Últimos 30 días",
    "all": "Todo el tiempo",
};

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-surface-raised border border-accent/10 rounded-xl px-4 py-3 shadow-lg">
                <p className="text-xs text-accent/50 mb-1">{label || payload[0].name}</p>
                <p className="font-bold text-accent">{payload[0].value}</p>
            </div>
        );
    }
    return null;
};

export default function ReportesPage() {
    const { user, isLoaded } = useUser();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState("all");

    const fetchReports = useCallback(async (p) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/reports?period=${p}`, { credentials: "include" });
            const json = await res.json();
            setData(json);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!isLoaded || !user) return;
        fetchReports(period);
    }, [isLoaded, user, period]);

    const handlePeriod = (p) => {
        setPeriod(p);
    };

    const Spinner = () => (
        <div data-density="compact" className="min-h-screen bg-surface-page flex items-center justify-center">
            <div className="text-center">
                <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-sm text-accent/50">Cargando...</p>
            </div>
        </div>
    );

    if (loading && !data) return <Spinner />;
    if (!data) return <Spinner />;

    const pieData = Object.entries(data.byStatus).map(([name, value]) => ({
        name: formatStatus(name),
        value,
        fill: getStatusColor(name),
    }));

    const barData = Object.entries(data.byStatus).map(([name, value]) => ({
        status: formatStatus(name),
        count: value,
        fill: getStatusColor(name),
    }));

    const outstanding = data.totalAmountOwed - data.totalCollected;
    const recoveryRate = data.totalAmountOwed > 0
        ? ((data.totalCollected / data.totalAmountOwed) * 100).toFixed(1)
        : 0;

    const periodLabel = PERIOD_LABELS[period];

    return (
        <main data-density="compact" className="min-h-screen bg-surface-page px-8 py-8">

            {/* Header */}
            <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-accent">Reportes</h1>
                    <p className="text-sm text-accent/50 mt-1">
                        Mostrando datos: <span className="font-medium text-accent/70">{periodLabel}</span>
                    </p>
                </div>

                {/* Period Toggle */}
                <div className="flex items-center gap-1 bg-surface-raised border border-accent/10 rounded-2xl p-1.5">
                    {Object.entries(PERIOD_LABELS).map(([value, label]) => (
                        <button
                            key={value}
                            onClick={() => handlePeriod(value)}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                                period === value
                                    ? "bg-accent text-surface-page shadow-sm"
                                    : "text-accent/50 hover:text-accent hover:bg-accent/5"
                            }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Loading overlay when switching periods */}
            {loading && data && (
                <div className="flex items-center gap-2 mb-4 text-sm text-accent/50">
                    <div className="w-4 h-4 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
                    Actualizando datos...
                </div>
            )}

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-surface-raised border border-accent/10 rounded-2xl p-6 hover:shadow-md hover:border-accent/20 transition-all duration-300">
                    <p className="text-xs text-accent/40 uppercase tracking-wide mb-2">Total Deudores</p>
                    <p className="text-4xl font-bold text-accent">{data.totalDebtors}</p>
                    <p className="text-xs text-accent/30 mt-2">{periodLabel}</p>
                </div>

                <div className="bg-surface-raised border border-accent/10 rounded-2xl p-6 hover:shadow-md hover:border-accent/20 transition-all duration-300">
                    <p className="text-xs text-accent/40 uppercase tracking-wide mb-2">Total Adeudado</p>
                    <p className="text-4xl font-bold text-accent">{formatMoney(data.totalAmountOwed)}</p>
                    <p className="text-xs text-accent/30 mt-2">{periodLabel}</p>
                </div>

                <div className="bg-accent border border-accent rounded-2xl p-6 hover:shadow-md hover:shadow-accent/20 transition-all duration-300">
                    <p className="text-xs text-surface-page/50 uppercase tracking-wide mb-2">Recuperado</p>
                    <p className="text-4xl font-bold text-success">{formatMoney(data.totalCollected)}</p>
                    <p className="text-xs text-surface-page/30 mt-2">{periodLabel}</p>
                </div>

                <div className="bg-surface-raised border border-accent/10 rounded-2xl p-6 hover:shadow-md hover:border-accent/20 transition-all duration-300">
                    <p className="text-xs text-accent/40 uppercase tracking-wide mb-2">Tasa de Recuperación</p>
                    <p className="text-4xl font-bold text-success">{recoveryRate}%</p>
                    <p className="text-xs text-accent/30 mt-2">{periodLabel}</p>
                    <div className="mt-3 w-full h-1.5 bg-accent/10 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-success rounded-full transition-all duration-700"
                            style={{ width: `${Math.min(recoveryRate, 100)}%` }}
                        />
                    </div>
                    <div className="flex justify-between text-[9px] text-accent/25 mt-1">
                        <span>0%</span>
                        <span>Promedio sector ~35%</span>
                        <span>100%</span>
                    </div>
                </div>
            </div>

            {/* Main Charts Row */}
            <div className="grid md:grid-cols-3 gap-6 mb-6">

                {/* Bar Chart */}
                <div className="md:col-span-2 bg-surface-raised border border-accent/10 rounded-2xl p-6 hover:shadow-md transition-all duration-300">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="font-semibold text-accent">Distribución por Estado</h2>
                        <span className="text-xs text-accent/30 bg-accent/5 px-3 py-1 rounded-full">{periodLabel}</span>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={barData} barSize={40}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-accent)10" vertical={false} />
                            <XAxis dataKey="status" tick={{ fontSize: 11, fill: 'var(--color-accent)', opacity: 0.5 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 11, fill: 'var(--color-accent)', opacity: 0.5 }} axisLine={false} tickLine={false} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                                {barData.map((entry, index) => (
                                    <Cell key={index} fill={entry.fill} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Portfolio Metrics */}
                <div className="bg-surface-raised border border-accent/10 rounded-2xl p-6 hover:shadow-md transition-all duration-300">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="font-semibold text-accent">Métricas del Portafolio</h2>
                        <span className="text-xs text-accent/30 bg-accent/5 px-3 py-1 rounded-full">{periodLabel}</span>
                    </div>
                    <div className="space-y-5">
                        <div className="p-4 bg-surface-hover rounded-xl">
                            <p className="text-xs text-accent/40 uppercase tracking-wide mb-1">Portafolio Total</p>
                            <p className="text-xl font-bold text-accent">{formatMoney(data.totalAmountOwed)}</p>
                        </div>
                        <div className="p-4 bg-accent/5 rounded-xl">
                            <p className="text-xs text-accent/40 uppercase tracking-wide mb-1">Recuperado</p>
                            <p className="text-xl font-bold text-success">{formatMoney(data.totalCollected)}</p>
                        </div>
                        <div className="p-4 bg-surface-hover rounded-xl">
                            <p className="text-xs text-accent/40 uppercase tracking-wide mb-1">Pendiente</p>
                            <p className="text-xl font-bold text-accent">{formatMoney(outstanding)}</p>
                        </div>
                        <div>
                            <div className="flex justify-between text-xs text-accent/40 mb-2">
                                <span>Progreso de recuperación</span>
                                <span>{recoveryRate}%</span>
                            </div>
                            <div className="w-full h-2 bg-accent/10 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-success rounded-full transition-all duration-700"
                                    style={{ width: `${Math.min(recoveryRate, 100)}%` }}
                                />
                            </div>
                            <p className="text-[10px] text-accent/25 mt-1 text-right">Promedio sector ~35%</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Second Row */}
            <div className="grid md:grid-cols-2 gap-6">

                {/* Pie Chart */}
                <div className="bg-surface-raised border border-accent/10 rounded-2xl p-6 hover:shadow-md transition-all duration-300">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="font-semibold text-accent">Deudores por Estado</h2>
                        <span className="text-xs text-accent/30 bg-accent/5 px-3 py-1 rounded-full">{periodLabel}</span>
                    </div>
                    <ResponsiveContainer width="100%" height={280}>
                        <PieChart>
                            <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={100} innerRadius={50} paddingAngle={3}>
                                {pieData.map((entry, index) => (
                                    <Cell key={index} fill={entry.fill} />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                            <Legend
                                iconType="circle"
                                iconSize={8}
                                formatter={(value) => (
                                    <span style={{ color: 'var(--color-accent)', fontSize: '12px', opacity: 0.7 }}>{value}</span>
                                )}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Call Metrics */}
                <div className="grid md:grid-cols-3 gap-6 mb-6">

                    <div className="bg-surface-raised border border-accent/10 rounded-2xl p-6 hover:shadow-md transition-all duration-300">
                        <p className="text-xs text-danger/60 uppercase tracking-wide mb-2">Llamadas Totales</p>
                        <p className="text-4xl font-bold text-danger">{data.calls.total}</p>
                        <p className="text-xs text-accent/40 mt-2">
                            Últimos 7 días: <span className="font-bold text-danger">{data.calls.last7Days}</span>
                        </p>
                        <p className="text-xs text-accent/25 mt-1">{periodLabel}</p>
                    </div>

                    <div className="bg-surface-raised border border-accent/10 rounded-2xl p-6 hover:shadow-md transition-all duration-300">
                        <p className="text-xs text-neutral-event/60 uppercase tracking-wide mb-2">Recordatorios Enviados</p>
                        <p className="text-4xl font-bold text-neutral-event">{data.totalReminders}</p>
                        <p className="text-xs text-accent/40 mt-2">Emails</p>
                        <p className="text-xs text-accent/25 mt-1">{periodLabel}</p>
                    </div>

                    <div className="md:col-span-1 bg-surface-raised border border-accent/10 rounded-2xl p-6 hover:shadow-md transition-all duration-300">
                        <h2 className="font-semibold text-danger mb-4">Llamadas por Día</h2>
                        <ResponsiveContainer width="100%" height={120}>
                            <BarChart data={data.calls.perDay} barSize={18}>
                                <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--color-danger)', opacity: 0.5 }} axisLine={false} tickLine={false} />
                                <YAxis hide />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="calls" radius={[4, 4, 0, 0]} fill="var(--color-danger)" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                </div>

                {/* Status breakdown table */}
                <div className="bg-surface-raised border border-accent/10 rounded-2xl p-6 hover:shadow-md transition-all duration-300">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="font-semibold text-accent">Detalle por Estado</h2>
                        <span className="text-xs text-accent/30 bg-accent/5 px-3 py-1 rounded-full">{periodLabel}</span>
                    </div>
                    <div className="space-y-3">
                        {Object.entries(data.byStatus).map(([status, count], i) => {
                            const pct = data.totalDebtors > 0 ? ((count / data.totalDebtors) * 100).toFixed(0) : 0;
                            return (
                                <div key={i} className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: getStatusColor(status) }} />
                                    <span className="text-sm text-accent/70 flex-1">{formatStatus(status)}</span>
                                    <span className="text-sm font-bold text-accent">{count}</span>
                                    <div className="w-24 h-1.5 bg-accent/10 rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full transition-all duration-500"
                                            style={{ width: `${pct}%`, background: getStatusColor(status) }}
                                        />
                                    </div>
                                    <span className="text-xs text-accent/40 w-8 text-right">{pct}%</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

            </div>

        </main>
    );
}