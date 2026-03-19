// "use client";
//
// import { useEffect, useState } from "react";
// import { useUser } from "@clerk/nextjs";
//
// export default function ReportesPage() {
//     const { user, isLoaded } = useUser();
//
//     const [data, setData] = useState(null);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState(null);
//
//     useEffect(() => {
//         if (!isLoaded) return;
//
//         if (!user) {
//             setError("Not logged in");
//             setLoading(false);
//             return;
//         }
//
//         const fetchReports = async () => {
//             try {
//                 const res = await fetch("/api/admin/reports", {
//                     credentials: "include",
//                 });
//
//                 if (!res.ok) {
//                     const text = await res.text();
//                     console.error("STATUS:", res.status);
//                     console.error("BODY:", text);
//                     throw new Error("Error fetching reports");
//                 }
//
//                 const json = await res.json();
//                 setData(json);
//             } catch (err) {
//                 console.error(err);
//                 setError(err.message);
//             } finally {
//                 setLoading(false);
//             }
//         };
//
//         fetchReports();
//     }, [isLoaded, user]);
//
//     if (loading) return <div className="p-6">Loading...</div>;
//     if (error) return <div className="p-6 text-red-500">{error}</div>;
//
//     return (
//         <div className="p-6">
//             <h1 className="text-xl font-bold mb-4">Reports</h1>
//             <pre>{JSON.stringify(data, null, 2)}</pre>
//         </div>
//     );
// }

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
} from "recharts";

const COLORS = ["#3b82f6", "#f59e0b", "#10b981", "#ef4444"];

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

    // 🔥 Transform data for charts
    const pieData = Object.entries(data.byStatus).map(([name, value]) => ({
        name,
        value,
    }));

    const barData = Object.entries(data.byStatus).map(([name, value]) => ({
        status: name,
        count: value,
    }));

    return (
        <div className="p-6 space-y-8">
            <h1 className="text-2xl font-bold">Reports Dashboard</h1>

            {/* ✅ SUMMARY CARDS */}
            <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-white rounded shadow">
                    <p className="text-gray-500">Total Debtors</p>
                    <h2 className="text-xl font-bold">{data.totalDebtors}</h2>
                </div>

                <div className="p-4 bg-white rounded shadow">
                    <p className="text-gray-500">Total Owed</p>
                    <h2 className="text-xl font-bold">
                        ${data.totalAmountOwed.toFixed(2)}
                    </h2>
                </div>

                <div className="p-4 bg-white rounded shadow">
                    <p className="text-gray-500">Total Collected</p>
                    <h2 className="text-xl font-bold">
                        ${data.totalCollected.toFixed(2)}
                    </h2>
                </div>
            </div>

            {/* ✅ CHARTS */}
            <div className="grid grid-cols-2 gap-6">

                {/* 🔵 PIE CHART */}
                <div className="bg-white p-4 rounded shadow">
                    <h2 className="mb-4 font-semibold">Debtors by Status</h2>

                    <PieChart width={350} height={300}>
                        <Pie
                            data={pieData}
                            dataKey="value"
                            nameKey="name"
                            outerRadius={100}
                            label
                        >
                            {pieData.map((entry, index) => (
                                <Cell
                                    key={index}
                                    fill={COLORS[index % COLORS.length]}
                                />
                            ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                    </PieChart>
                </div>

                {/* 🟢 BAR CHART */}
                <div className="bg-white p-4 rounded shadow">
                    <h2 className="mb-4 font-semibold">Status Distribution</h2>

                    <BarChart width={400} height={300} data={barData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="status" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="#3b82f6" />
                    </BarChart>
                </div>

            </div>
        </div>
    );
}