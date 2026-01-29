"use client";

import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-[#443CA3]">
            <SignUp
                forceRedirectUrl="/client"
                appearance={{
                    elements: {
                        card: "bg-[#2E2875] shadow-lg rounded-2xl",
                        headerTitle: "text-white",
                        headerSubtitle: "text-[#CCE8FF]",
                        formButtonPrimary:
                            "bg-[#21FE83] hover:bg-[#FFFF76] text-black font-extrabold",
                    },
                }}
            />
        </div>
    );
}
