import { AdminSidebar } from "@/components/admin-sidebar";
import { AnalyticsDashboard } from "@/components/analytics-dashboard";

export const metadata = { title: "Analytics" };

export default function AdminAnalyticsPage() {
  return (
    <>
      <AdminSidebar />
      <main className="flex-1 overflow-auto bg-secondary/20 p-6">
        <AnalyticsDashboard />
      </main>
    </>
  );
}
