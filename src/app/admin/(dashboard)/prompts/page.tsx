import { createClient } from "@/lib/supabase/server";
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
    <AdminPromptList
      prompts={(promptsRes.data || []) as PromptWithCategory[]}
      categories={(categoriesRes.data || []) as Category[]}
    />
  );
}
