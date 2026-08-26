import AdminSidebar from "../components/AdminSidebar";

export default function AdminLayout({ children }) {
    return (
        <div className="flex">
            <AdminSidebar />
            {/* Fixed offset matches the sidebar's COLLAPSED width (w-20 =
                80px) permanently. The sidebar is position:fixed and
                hover-expands to w-60 on top of this margin — an overlay,
                not a push, since fixed elements don't participate in
                sibling layout at all. min-w-0 prevents this flex child
                from overflowing on its own intrinsic content width.
                No padding/margin here beyond ml-20 — each page owns its
                own <main> and padding; this used to also be a <main> with
                ml-64 (stale, matched neither sidebar width) wrapping
                admin/page.jsx's own <main>, an invalid nested-landmark and
                double-padding bug. */}
            <div className="ml-20 flex-1 min-w-0">{children}</div>
        </div>
    );
}
