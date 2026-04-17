import { createAdminClient } from "@/lib/supabase/admin";
import { AdminUserList } from "@/components/admin-user-list";

// Force fresh data on every request — user list changes often
export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const supabase = createAdminClient();
  const { data } = await supabase.auth.admin.listUsers();

  // Filter out admin users
  const adminEmails = (process.env.ADMIN_EMAIL_ALLOWLIST || "")
    .split(",")
    .map((e) => e.trim().toLowerCase());

  const users = (data?.users || []).filter(
    (u) => !adminEmails.includes(u.email?.toLowerCase() ?? "")
  );

  return <AdminUserList users={users} />;
}
