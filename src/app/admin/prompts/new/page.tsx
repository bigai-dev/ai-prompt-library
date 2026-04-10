import { createClient } from "@/lib/supabase/server";
import { AdminSidebar } from "@/components/admin-sidebar";
import { PromptEditor } from "@/components/prompt-editor";
import type { Category, Tag } from "@/types/database";

export const metadata = { title: "New Prompt" };

export default async function NewPromptPage() {
  const supabase = await createClient();

  const [categoriesRes, tagsRes] = await Promise.all([
    supabase.from("categories").select("*").order("sort_order"),
    supabase.from("tags").select("*").order("name"),
  ]);

  return (
    <>
      <AdminSidebar />
      <main className="flex-1 overflow-auto bg-secondary/20 p-6">
        <PromptEditor
          categories={(categoriesRes.data || []) as Category[]}
          tags={(tagsRes.data || []) as Tag[]}
        />
      </main>
    </>
  );
}
