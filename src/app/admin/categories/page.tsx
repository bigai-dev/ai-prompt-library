import { createClient } from "@/lib/supabase/server";
import { AdminSidebar } from "@/components/admin-sidebar";
import { CategoriesManager } from "@/components/categories-manager";
import type { Category } from "@/types/database";

export const metadata = { title: "Manage Categories" };

export default async function AdminCategoriesPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order");

  return (
    <>
      <AdminSidebar />
      <main className="flex-1 overflow-auto bg-secondary/20 p-6">
        <CategoriesManager categories={(data || []) as Category[]} />
      </main>
    </>
  );
}
