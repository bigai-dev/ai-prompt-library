import { createClient } from "@/lib/supabase/server";
import { CategoriesManager } from "@/components/categories-manager";
import type { Category } from "@/types/database";

export const metadata = { title: "Manage Categories" };

export default async function AdminCategoriesPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order");

  return <CategoriesManager categories={(data || []) as Category[]} />;
}
