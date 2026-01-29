"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RedirectPage() {
    const { user, isLoaded } = useUser();
    const router = useRouter();

    useEffect(() => {
        if (!isLoaded) return;

        const role = user?.publicMetadata?.role;

        if (role === "admin") {
            router.replace("/admin");
        } else {
            router.replace("/client");
        }
    }, [isLoaded, user]);

    return (
        <div className="min-h-screen flex items-center justify-center">
            <p className="text-lg font-bold">Redirecting...</p>
        </div>
    );
}
