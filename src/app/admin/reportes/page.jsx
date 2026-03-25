"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    Legend,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    ResponsiveContainer,
} from "recharts";

/* -----------------------------
STATUS COLOR LOGIC
----------------------------- */

function getStatusColor(status) {
    const key = status.toLowerCase();

    // PAID
    if (key.includes("pagado") || key.includes("paid") || key.includes("collected")) {
        return "#10b981"; // green
    }

    // PENDING
    if (key.includes("pendiente") || key.includes("pending")) {
        return "#fd0303"; // red
    }

    // LATE / OVERDUE
    if (key.includes("vencido") || key.includes("overdue") || key.includes("late")) {
        return "#f59e0b"; // orange
    }

    return "#3b82f6"; // fallback blue
}

/* -----------------------------
CURRENCY FORMATTER
----------------------------- */

function formatMoney(amount) {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
    }).format(amount);
}

export default function ReportesPage() {
    const { user, isLoaded } = useUser();

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isLoaded || !user) return;

        const fetchReports = async () => {
            const res = await fetch("/api/admin/reports", {
                credentials: "include",
            });

            const json = await res.json();
            setData(json);
            setLoading(false);
        };

        fetchReports();
    }, [isLoaded, user]);

    if (loading) return <div className="p-6">Loading...</div>;
    if (!data) return <div className="p-6">No data</div>;

    const pieData = Object.entries(data.byStatus).map(([name, value]) => ({
        name,
        value,
        fill: getStatusColor(name),
    }));

    const barData = Object.entries(data.byStatus).map(([name, value]) => ({
        status: name,
        count: value,
        fill: getStatusColor(name),
    }));

    const outstanding = data.totalAmountOwed - data.totalCollected;

    return (
        <div className="p-8 bg-gray-50 min-h-screen space-y-8">
            <h1 className="text-2xl font-semibold text-gray-800">
                Reports Dashboard
            </h1>

            {/* KPI CARDS */}

            <div className="grid grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl border border-gray-200">
                    <p className="text-sm text-gray-500">Total Debtors</p>
                    <h2 className="text-3xl font-semibold text-blue-600 mt-1">
                        {data.totalDebtors}
                    </h2>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200">
                    <p className="text-sm text-gray-500">Total Owed</p>
                    <h2 className="text-3xl font-semibold text-red-500 mt-1">
                        {formatMoney(data.totalAmountOwed)}
                    </h2>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200">
                    <p className="text-sm text-gray-500">Total Collected</p>
                    <h2 className="text-3xl font-semibold text-green-600 mt-1">
                        {formatMoney(data.totalCollected)}
                    </h2>
                </div>
            </div>

            {/* MAIN GRID */}

            <div className="grid grid-cols-3 gap-6">
                <div className="col-span-2 bg-white p-6 rounded-xl border border-gray-200">
                    <h2 className="font-semibold text-gray-700 mb-6">
                        Status Distribution
                    </h2>

                    <ResponsiveContainer width="100%" height={350}>
                        <BarChart data={barData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />

                            <XAxis dataKey="status" tick={{ fontSize: 12 }} />

                            <YAxis tick={{ fontSize: 12 }} />

                            <Tooltip />

                            <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                                {barData.map((entry, index) => (
                                    <Cell key={index} fill={entry.fill} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* METRICS PANEL */}

                <div className="bg-white p-6 rounded-xl border border-gray-200 space-y-6">
                    <h2 className="font-semibold text-gray-700">
                        Portfolio Metrics
                    </h2>

                    <div>
                        <p className="text-sm text-gray-500">Total Portfolio</p>
                        <p className="text-xl font-semibold text-red-500">
                            {formatMoney(data.totalAmountOwed)}
                        </p>
                    </div>

                    <div>
                        <p className="text-sm text-gray-500">Collected</p>
                        <p className="text-xl font-semibold text-green-600">
                            {formatMoney(data.totalCollected)}
                        </p>
                    </div>

                    <div>
                        <p className="text-sm text-gray-500">Outstanding</p>
                        <p className="text-xl font-semibold text-orange-500">
                            {formatMoney(outstanding)}
                        </p>
                    </div>
                </div>
            </div>

            {/* SECOND ROW */}

            <div className="grid grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl border border-gray-200">
                    <h2 className="font-semibold text-gray-700 mb-6">
                        Debtors by Status
                    </h2>

                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={pieData}
                                dataKey="value"
                                nameKey="name"
                                outerRadius={110}
                                label
                            >
                                {pieData.map((entry, index) => (
                                    <Cell key={index} fill={entry.fill} />
                                ))}
                            </Pie>

                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200 flex items-center justify-center text-gray-400">
                    Future Metrics
                </div>
            </div>
        </div>
    );
}