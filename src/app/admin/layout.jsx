import AdminSidebar from "../components/AdminSidebar";

export default function AdminLayout({ children }) {
    return (
        <div className="flex">
            <AdminSidebar />
            {/* push content to the right (leave space for sidebar) */}
            <main className="ml-64 flex-1 p-6">{children}</main>
        </div>
    );
}