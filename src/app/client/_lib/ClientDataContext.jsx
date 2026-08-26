"use client";

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { STATUS_COLORS } from "./shared";

const ClientDataContext = createContext(null);

export function useClientData() {
    const ctx = useContext(ClientDataContext);
    if (!ctx) throw new Error("useClientData must be used within ClientDataProvider");
    return ctx;
}

// Mounted once in client/layout.jsx, so it survives navigation between
// /client, /client/agregar, /client/facturas, /client/reportes and
// /client/ajustes (Next only swaps the page segment, not the layout).
// That's what lets `draft` bridge the two prefill flows that used to be
// same-page tab switches — clicking "Editar" on a debtor, or "Usar estos
// datos" after invoice extraction — across what are now real route changes:
// the setter runs before the router.push, the Agregar page reads it on
// mount after landing.
export function ClientDataProvider({ children }) {
    const { user, isLoaded, isSignedIn } = useUser();
    const router = useRouter();

    const [debtors, setDebtors] = useState([]);
    const [debtorsLoaded, setDebtorsLoaded] = useState(false);
    const [debtorsError, setDebtorsError] = useState("");
    const [draft, setDraft] = useState(null);

    useEffect(() => {
        if (!isLoaded) return;
        if (!isSignedIn) { router.replace("/sign-in"); return; }
        if (user?.publicMetadata?.role !== "client") { router.replace("/sign-in"); }
    }, [isLoaded, isSignedIn, user, router]);

    const fetchDebtors = useCallback(async () => {
        try {
            const res = await fetch("/api/debtors", { credentials: "include" });
            if (!res.ok) throw new Error("Failed to fetch");
            const data = await res.json();
            setDebtors(data || []);
            setDebtorsError("");
        } catch (err) {
            console.error(err);
            setDebtorsError("Error loading debtors");
        } finally {
            setDebtorsLoaded(true);
        }
    }, []);

    useEffect(() => {
        if (!isLoaded || !isSignedIn) return;
        fetchDebtors();
    }, [isLoaded, isSignedIn, fetchDebtors]);

    const stats = useMemo(() => {
        const total = debtors.length;
        const totalOwed = debtors.reduce((acc, d) => acc + Number(d.amountOwed), 0);
        const paid = debtors.filter(d => d.status === "PAGADO").reduce((acc, d) => acc + Number(d.amountOwed), 0);
        const pending = debtors.filter(d => d.status === "PENDIENTE").length;
        const byStatus = Object.entries(
            debtors.reduce((acc, d) => {
                acc[d.status] = (acc[d.status] || 0) + 1;
                return acc;
            }, {})
        ).map(([name, value]) => ({ name, value, color: STATUS_COLORS[name]?.color || "var(--color-accent)" }));
        return { total, totalOwed, paid, pending, byStatus };
    }, [debtors]);

    const value = {
        user, isLoaded, isSignedIn,
        debtors, setDebtors, debtorsLoaded, debtorsError, fetchDebtors,
        stats,
        draft, setDraft,
    };

    return <ClientDataContext.Provider value={value}>{children}</ClientDataContext.Provider>;
}
