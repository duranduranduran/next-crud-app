"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";

const EVENT_LABELS = {
    STATUS_CHANGED:      { label: "Status changed",   color: "#F59E0B", bg: "#2A1E0A" },
    NOTE_ADDED:          { label: "Note added",        color: "#443CA3", bg: "#EEEDFE" },
    NOTE_DELETED:        { label: "Note deleted",      color: "#EF4444", bg: "#FEE2E2" },
    DEBTOR_CREATED:      { label: "Debtor created",    color: "#21FE83", bg: "#052010" },
    DEBTOR_DELETED:      { label: "Debtor deleted",    color: "#EF4444", bg: "#FEE2E2" },
    REMINDER_SENT:       { label: "Reminder sent",     color: "#0EA5E9", bg: "#E0F2FE" },
    CALL_TRIGGERED:      { label: "Call triggered",    color: "#8B5CF6", bg: "#EDE9FE" },
    BULK_STATUS_CHANGED: { label: "Bulk status",       color: "#F59E0B", bg: "#FEF3C7" },
};

const EVENT_FILTERS = ["All", "STATUS_CHANGED", "NOTE_ADDED", "NOTE_DELETED", "DEBTOR_CREATED", "DEBTOR_DELETED", "REMINDER_SENT", "CALL_TRIGGERED", "BULK_STATUS_CHANGED"];

function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleString("es-EC", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export default function LogsPage() {
    const { user, isLoaded } = useUser();
    const router = useRouter();

    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [eventFilter, setEventFilter] = useState("All");
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    useEffect(() => {
        if (!isLoaded) return;
        if (!user) { router.push("/sign-in"); return; }
        if (user.publicMetadata?.role !== "admin") { router.push("/client"); return; }
    }, [isLoaded, user, router]);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const res = await fetch("/api/admin/logs", { credentials: "include" });
                if (!res.ok) throw new Error("Failed to fetch logs");
                const data = await res.json();
                setLogs(data);
            } catch (err) {
                console.error(err);
                setError("Failed to load activity logs.");
            } finally {
                setLoading(false);
            }
        };

        if (isLoaded && user) fetchLogs();
    }, [isLoaded, user]);

    const filteredLogs = logs.filter((log) => {
        const matchesSearch =
            log.detail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.debtor?.name?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesEvent = eventFilter === "All" || log.event === eventFilter;

        return matchesSearch && matchesEvent;
    });

    const totalPages = Math.max(1, Math.ceil(filteredLogs.length / ITEMS_PER_PAGE));
    const paginatedLogs = filteredLogs.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    // Stats
    const stats = {
        total: logs.length,
        reminders: logs.filter((l) => l.event === "REMINDER_SENT").length,
        statusChanges: logs.filter((l) => l.event === "STATUS_CHANGED" || l.event === "BULK_STATUS_CHANGED").length,
        notes: logs.filter((l) => l.event === "NOTE_ADDED").length,
    };

    if (loading) return <p className="text-center mt-20 text-[#443CA3]">Loading...</p>;
    if (error) return <p className="text-red-500 text-center mt-20">{error}</p>;

    return (
        <main className="min-h-screen bg-[#F7F8FF] px-8 py-8">

            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-[#443CA3]">Activity Logs</h1>
                    <p className="text-sm text-[#443CA3]/60 mt-1">Full audit trail of all system and user actions</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-[#21FE83] rounded-full animate-pulse"></div>
                    <span className="text-sm text-[#443CA3]/60">Live</span>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white border border-[#443CA3]/10 rounded-2xl p-5">
                    <p className="text-xs text-[#443CA3]/50 uppercase tracking-wide mb-1">Total events</p>
                    <p className="text-3xl font-bold text-[#443CA3]">{stats.total}</p>
                </div>
                <div className="bg-white border border-[#443CA3]/10 rounded-2xl p-5">
                    <p className="text-xs text-[#443CA3]/50 uppercase tracking-wide mb-1">Reminders sent</p>
                    <p className="text-3xl font-bold text-[#0EA5E9]">{stats.reminders}</p>
                </div>
                <div className="bg-white border border-[#443CA3]/10 rounded-2xl p-5">
                    <p className="text-xs text-[#443CA3]/50 uppercase tracking-wide mb-1">Status changes</p>
                    <p className="text-3xl font-bold text-[#F59E0B]">{stats.statusChanges}</p>
                </div>
                <div className="bg-white border border-[#443CA3]/10 rounded-2xl p-5">
                    <p className="text-xs text-[#443CA3]/50 uppercase tracking-wide mb-1">Notes added</p>
                    <p className="text-3xl font-bold text-[#21FE83]">{stats.notes}</p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white border border-[#443CA3]/10 rounded-2xl p-4 mb-6 flex flex-wrap gap-3 items-center">
                <input
                    type="text"
                    placeholder="Search detail, user or debtor..."
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                    className="border border-[#443CA3]/20 rounded-xl px-4 py-2 text-sm text-[#443CA3] focus:outline-none focus:border-[#443CA3] flex-1 min-w-[200px]"
                />
                <div className="flex flex-wrap gap-2">
                    {EVENT_FILTERS.map((f) => (
                        <button
                            key={f}
                            onClick={() => { setEventFilter(f); setCurrentPage(1); }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${
                                eventFilter === f
                                    ? "bg-[#443CA3] text-white"
                                    : "bg-[#F7F8FF] text-[#443CA3] border border-[#443CA3]/20 hover:bg-[#443CA3]/10"
                            }`}
                        >
                            {f === "All" ? "All events" : EVENT_LABELS[f]?.label || f}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="bg-white border border-[#443CA3]/10 rounded-2xl overflow-hidden mb-6">
                {/* Table Header */}
                <div className="grid grid-cols-[160px_140px_1fr_140px] px-5 py-3 border-b border-[#443CA3]/10 bg-[#F7F8FF]">
                    <span className="text-xs font-medium text-[#443CA3]/50 uppercase tracking-wide">Timestamp</span>
                    <span className="text-xs font-medium text-[#443CA3]/50 uppercase tracking-wide">Event</span>
                    <span className="text-xs font-medium text-[#443CA3]/50 uppercase tracking-wide">Details</span>
                    <span className="text-xs font-medium text-[#443CA3]/50 uppercase tracking-wide">User</span>
                </div>

                {paginatedLogs.length === 0 ? (
                    <div className="text-center py-16 text-[#443CA3]/40">
                        No activity logs found.
                    </div>
                ) : (
                    paginatedLogs.map((log, i) => {
                        const meta = EVENT_LABELS[log.event] || { label: log.event, color: "#443CA3", bg: "#EEEDFE" };
                        return (
                            <div
                                key={log.id}
                                className={`grid grid-cols-[160px_140px_1fr_140px] px-5 py-4 border-b border-[#443CA3]/5 items-center ${
                                    i % 2 === 1 ? "bg-[#F7F8FF]/50" : ""
                                }`}
                            >
                                <span className="text-xs text-[#443CA3]/40 font-mono">
                                    {formatDate(log.createdAt)}
                                </span>
                                <span
                                    className="text-xs font-semibold px-3 py-1 rounded-full inline-block"
                                    style={{ color: meta.color, background: meta.bg }}
                                >
                                    {meta.label}
                                </span>
                                <span className="text-sm text-[#443CA3] px-4 overflow-hidden text-ellipsis whitespace-nowrap">
                                    {log.detail}
                                </span>
                                <span className="text-xs text-[#443CA3]/50 truncate">
                                    {log.user?.name || log.user?.email || "System"}
                                </span>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-center gap-4">
                <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border border-[#443CA3]/20 rounded-xl text-sm text-[#443CA3] hover:bg-[#443CA3] hover:text-white transition disabled:opacity-30"
                >
                    ← Prev
                </button>
                <span className="text-sm text-[#443CA3]/60">
                    Page {currentPage} of {totalPages}
                </span>
                <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 border border-[#443CA3]/20 rounded-xl text-sm text-[#443CA3] hover:bg-[#443CA3] hover:text-white transition disabled:opacity-30"
                >
                    Next →
                </button>
            </div>

        </main>
    );
}
