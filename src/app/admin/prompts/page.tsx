import { createClient } from "@/lib/supabase/server";
import { AdminSidebar } from "@/components/admin-sidebar";
import { AdminPromptList } from "@/components/admin-prompt-list";
import type { PromptWithCategory, Category } from "@/types/database";

export const metadata = { title: "Manage Prompts" };

export default async function AdminPromptsPage() {
  const supabase = await createClient();

  const [promptsRes, categoriesRes] = await Promise.all([
    supabase
      .from("prompts")
      .select("*, category:categories(*)")
      .order("updated_at", { ascending: false }),
    supabase.from("categories").select("*").order("sort_order"),
  ]);

  return (
    <>
      <AdminSidebar />
      <main className="flex-1 overflow-auto bg-secondary/20 p-6">
        <AdminPromptList
          prompts={(promptsRes.data || []) as PromptWithCategory[]}
          categories={(categoriesRes.data || []) as Category[]}
        />
      </main>
    </>
  );
}
