"use client";

import { useEffect } from "react";
import { useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export default function SignOutPage() {
    const { signOut } = useClerk();
    const router = useRouter();

    useEffect(() => {
        const doSignOut = async () => {
            await signOut();
            router.replace("/sign-in");
        };

        doSignOut();
    }, [signOut, router]);

    return (
        <div className="min-h-screen flex items-center justify-center">
            <p>Signing out…</p>
        </div>
    );
}
