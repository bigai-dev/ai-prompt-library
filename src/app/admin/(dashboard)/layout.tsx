import { AdminSidebar } from "@/components/admin-sidebar";

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <main className="flex-1 overflow-auto bg-secondary/20 p-4 pt-18 sm:p-6 sm:pt-18 md:ml-56 md:pt-6">
        {children}
      </main>
    </div>
  );
}
