"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RedirectPage() {
    const { user, isLoaded } = useUser();
    const router = useRouter();

    useEffect(() => {
        if (!isLoaded || !user) return; // 👈 wait for both

        const role = user?.publicMetadata?.role;

        if (role === "admin") {
            router.replace("/admin");
        } else if (role === "client") {
            router.replace("/client");
        } else {
            // role not set yet — wait a moment and retry
            const timer = setTimeout(() => {
                router.replace(user?.publicMetadata?.role === "admin" ? "/admin" : "/client");
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [isLoaded, user]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-white">
            <div className="text-center">
                <div className="w-8 h-8 border-2 border-[#443CA3] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-sm text-[#443CA3]/50">Cargando...</p>
            </div>
        </div>
    );
}