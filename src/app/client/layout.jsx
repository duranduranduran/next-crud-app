"use client";

import ClientSidebar from "../components/ClientSidebar";
import { ClientDataProvider, useClientData } from "./_lib/ClientDataContext";

function Gate({ children }) {
    const { isLoaded, isSignedIn } = useClientData();
    // Same early-return-null pattern the single-file page used before the
    // split — now gates every /client/* route uniformly instead of just one.
    if (!isLoaded || !isSignedIn) return null;

    return (
        <div className="flex">
            <ClientSidebar />
            {/* Fixed offset matches the sidebar's fixed width exactly — unlike
                AdminSidebar this rail never hover-expands, so there's no
                overlay-vs-push distinction to worry about here. */}
            <div className="ml-[152px] flex-1 min-w-0">{children}</div>
        </div>
    );
}

export default function ClientLayout({ children }) {
    return (
        <ClientDataProvider>
            <Gate>{children}</Gate>
        </ClientDataProvider>
    );
}
