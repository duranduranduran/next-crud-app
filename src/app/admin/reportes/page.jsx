"use client";

import { useEffect, useState, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import {
    PieChart, Pie, Cell, Tooltip, Legend,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
} from "recharts";

function getStatusColor(status) {
    const key = status.toLowerCase();
    if (key.includes("pagado")) return "#21FE83";
    if (key.includes("pendiente")) return "#443CA3";
    if (key.includes("en_gestion") || key.includes("gestion")) return "#7C6FCD";
    if (key.includes("acuerdo")) return "#A78BFA";
    if (key.includes("escalado") || key.includes("judicial")) return "#EF4444";
    return "#443CA3";
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
            <div className="bg-white border border-[#443CA3]/10 rounded-xl px-4 py-3 shadow-lg">
                <p className="text-xs text-[#443CA3]/50 mb-1">{label || payload[0].name}</p>
                <p className="font-bold text-[#443CA3]">{payload[0].value}</p>
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
        <div className="min-h-screen bg-[#F7F8FF] flex items-center justify-center">
            <div className="text-center">
                <div className="w-8 h-8 border-2 border-[#443CA3] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-sm text-[#443CA3]/50">Cargando...</p>
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
        <main className="min-h-screen bg-[#F7F8FF] px-8 py-8">

            {/* Header */}
            <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-[#443CA3]">Reportes</h1>
                    <p className="text-sm text-[#443CA3]/50 mt-1">
                        Mostrando datos: <span className="font-medium text-[#443CA3]/70">{periodLabel}</span>
                    </p>
                </div>

                {/* Period Toggle */}
                <div className="flex items-center gap-1 bg-white border border-[#443CA3]/10 rounded-2xl p-1.5">
                    {Object.entries(PERIOD_LABELS).map(([value, label]) => (
                        <button
                            key={value}
                            onClick={() => handlePeriod(value)}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                                period === value
                                    ? "bg-[#443CA3] text-white shadow-sm"
                                    : "text-[#443CA3]/50 hover:text-[#443CA3] hover:bg-[#443CA3]/5"
                            }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Loading overlay when switching periods */}
            {loading && data && (
                <div className="flex items-center gap-2 mb-4 text-sm text-[#443CA3]/50">
                    <div className="w-4 h-4 border-2 border-[#443CA3]/30 border-t-[#443CA3] rounded-full animate-spin" />
                    Actualizando datos...
                </div>
            )}

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white border border-[#443CA3]/10 rounded-2xl p-6 hover:shadow-md hover:border-[#443CA3]/20 transition-all duration-300">
                    <p className="text-xs text-[#443CA3]/40 uppercase tracking-wide mb-2">Total Deudores</p>
                    <p className="text-4xl font-bold text-[#443CA3]">{data.totalDebtors}</p>
                    <p className="text-xs text-[#443CA3]/30 mt-2">{periodLabel}</p>
                </div>

                <div className="bg-white border border-[#443CA3]/10 rounded-2xl p-6 hover:shadow-md hover:border-[#443CA3]/20 transition-all duration-300">
                    <p className="text-xs text-[#443CA3]/40 uppercase tracking-wide mb-2">Total Adeudado</p>
                    <p className="text-4xl font-bold text-[#443CA3]">{formatMoney(data.totalAmountOwed)}</p>
                    <p className="text-xs text-[#443CA3]/30 mt-2">{periodLabel}</p>
                </div>

                <div className="bg-[#443CA3] border border-[#443CA3] rounded-2xl p-6 hover:shadow-md hover:shadow-[#443CA3]/20 transition-all duration-300">
                    <p className="text-xs text-white/50 uppercase tracking-wide mb-2">Recuperado</p>
                    <p className="text-4xl font-bold text-[#21FE83]">{formatMoney(data.totalCollected)}</p>
                    <p className="text-xs text-white/30 mt-2">{periodLabel}</p>
                </div>

                <div className="bg-white border border-[#443CA3]/10 rounded-2xl p-6 hover:shadow-md hover:border-[#443CA3]/20 transition-all duration-300">
                    <p className="text-xs text-[#443CA3]/40 uppercase tracking-wide mb-2">Tasa de Recuperación</p>
                    <p className="text-4xl font-bold text-[#21FE83]">{recoveryRate}%</p>
                    <p className="text-xs text-[#443CA3]/30 mt-2">{periodLabel}</p>
                    <div className="mt-3 w-full h-1.5 bg-[#443CA3]/10 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-[#21FE83] rounded-full transition-all duration-700"
                            style={{ width: `${Math.min(recoveryRate, 100)}%` }}
                        />
                    </div>
                    <div className="flex justify-between text-[9px] text-[#443CA3]/25 mt-1">
                        <span>0%</span>
                        <span>Promedio sector ~35%</span>
                        <span>100%</span>
                    </div>
                </div>
            </div>

            {/* Main Charts Row */}
            <div className="grid md:grid-cols-3 gap-6 mb-6">

                {/* Bar Chart */}
                <div className="md:col-span-2 bg-white border border-[#443CA3]/10 rounded-2xl p-6 hover:shadow-md transition-all duration-300">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="font-semibold text-[#443CA3]">Distribución por Estado</h2>
                        <span className="text-xs text-[#443CA3]/30 bg-[#443CA3]/5 px-3 py-1 rounded-full">{periodLabel}</span>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={barData} barSize={40}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#443CA310" vertical={false} />
                            <XAxis dataKey="status" tick={{ fontSize: 11, fill: '#443CA3', opacity: 0.5 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 11, fill: '#443CA3', opacity: 0.5 }} axisLine={false} tickLine={false} />
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
                <div className="bg-white border border-[#443CA3]/10 rounded-2xl p-6 hover:shadow-md transition-all duration-300">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="font-semibold text-[#443CA3]">Métricas del Portafolio</h2>
                        <span className="text-xs text-[#443CA3]/30 bg-[#443CA3]/5 px-3 py-1 rounded-full">{periodLabel}</span>
                    </div>
                    <div className="space-y-5">
                        <div className="p-4 bg-[#F7F8FF] rounded-xl">
                            <p className="text-xs text-[#443CA3]/40 uppercase tracking-wide mb-1">Portafolio Total</p>
                            <p className="text-xl font-bold text-[#443CA3]">{formatMoney(data.totalAmountOwed)}</p>
                        </div>
                        <div className="p-4 bg-[#443CA3]/5 rounded-xl">
                            <p className="text-xs text-[#443CA3]/40 uppercase tracking-wide mb-1">Recuperado</p>
                            <p className="text-xl font-bold text-[#21FE83]">{formatMoney(data.totalCollected)}</p>
                        </div>
                        <div className="p-4 bg-[#F7F8FF] rounded-xl">
                            <p className="text-xs text-[#443CA3]/40 uppercase tracking-wide mb-1">Pendiente</p>
                            <p className="text-xl font-bold text-[#443CA3]">{formatMoney(outstanding)}</p>
                        </div>
                        <div>
                            <div className="flex justify-between text-xs text-[#443CA3]/40 mb-2">
                                <span>Progreso de recuperación</span>
                                <span>{recoveryRate}%</span>
                            </div>
                            <div className="w-full h-2 bg-[#443CA3]/10 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-[#21FE83] rounded-full transition-all duration-700"
                                    style={{ width: `${Math.min(recoveryRate, 100)}%` }}
                                />
                            </div>
                            <p className="text-[10px] text-[#443CA3]/25 mt-1 text-right">Promedio sector ~35%</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Second Row */}
            <div className="grid md:grid-cols-2 gap-6">

                {/* Pie Chart */}
                <div className="bg-white border border-[#443CA3]/10 rounded-2xl p-6 hover:shadow-md transition-all duration-300">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="font-semibold text-[#443CA3]">Deudores por Estado</h2>
                        <span className="text-xs text-[#443CA3]/30 bg-[#443CA3]/5 px-3 py-1 rounded-full">{periodLabel}</span>
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
                                    <span style={{ color: '#443CA3', fontSize: '12px', opacity: 0.7 }}>{value}</span>
                                )}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Call Metrics */}
                <div className="grid md:grid-cols-3 gap-6 mb-6">

                    <div className="bg-white border border-[#443CA3]/10 rounded-2xl p-6 hover:shadow-md transition-all duration-300">
                        <p className="text-xs text-[#EF4444]/60 uppercase tracking-wide mb-2">Llamadas Totales</p>
                        <p className="text-4xl font-bold text-[#EF4444]">{data.calls.total}</p>
                        <p className="text-xs text-[#443CA3]/40 mt-2">
                            Últimos 7 días: <span className="font-bold text-[#EF4444]">{data.calls.last7Days}</span>
                        </p>
                        <p className="text-xs text-[#443CA3]/25 mt-1">{periodLabel}</p>
                    </div>

                    <div className="bg-white border border-[#443CA3]/10 rounded-2xl p-6 hover:shadow-md transition-all duration-300">
                        <p className="text-xs text-[#F59E0B]/60 uppercase tracking-wide mb-2">Recordatorios Enviados</p>
                        <p className="text-4xl font-bold text-[#F59E0B]">{data.totalReminders}</p>
                        <p className="text-xs text-[#443CA3]/40 mt-2">Emails</p>
                        <p className="text-xs text-[#443CA3]/25 mt-1">{periodLabel}</p>
                    </div>

                    <div className="md:col-span-1 bg-white border border-[#443CA3]/10 rounded-2xl p-6 hover:shadow-md transition-all duration-300">
                        <h2 className="font-semibold text-[#EF4444] mb-4">Llamadas por Día</h2>
                        <ResponsiveContainer width="100%" height={120}>
                            <BarChart data={data.calls.perDay} barSize={18}>
                                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#EF4444', opacity: 0.5 }} axisLine={false} tickLine={false} />
                                <YAxis hide />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="calls" radius={[4, 4, 0, 0]} fill="#EF4444" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                </div>

                {/* Status breakdown table */}
                <div className="bg-white border border-[#443CA3]/10 rounded-2xl p-6 hover:shadow-md transition-all duration-300">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="font-semibold text-[#443CA3]">Detalle por Estado</h2>
                        <span className="text-xs text-[#443CA3]/30 bg-[#443CA3]/5 px-3 py-1 rounded-full">{periodLabel}</span>
                    </div>
                    <div className="space-y-3">
                        {Object.entries(data.byStatus).map(([status, count], i) => {
                            const pct = data.totalDebtors > 0 ? ((count / data.totalDebtors) * 100).toFixed(0) : 0;
                            return (
                                <div key={i} className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: getStatusColor(status) }} />
                                    <span className="text-sm text-[#443CA3]/70 flex-1">{formatStatus(status)}</span>
                                    <span className="text-sm font-bold text-[#443CA3]">{count}</span>
                                    <div className="w-24 h-1.5 bg-[#443CA3]/10 rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full transition-all duration-500"
                                            style={{ width: `${pct}%`, background: getStatusColor(status) }}
                                        />
                                    </div>
                                    <span className="text-xs text-[#443CA3]/40 w-8 text-right">{pct}%</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

            </div>

        </main>
    );
}