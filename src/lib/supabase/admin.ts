import { createClient as createSupabaseClient, type SupabaseClient, type User } from "@supabase/supabase-js";

export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

// auth.admin.listUsers() returns max 1000 rows per page (default 50).
// Loop until a short page is returned so callers see every user.
export async function listAllUsers(admin: SupabaseClient): Promise<User[]> {
  const perPage = 1000;
  const users: User[] = [];
  for (let page = 1; ; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const batch = data?.users ?? [];
    users.push(...batch);
    if (batch.length < perPage) break;
  }
  return users;
}
