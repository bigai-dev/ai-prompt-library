import { createClient } from "@/lib/supabase/server";
import { PromptEditor } from "@/components/prompt-editor";
import { notFound } from "next/navigation";
import type { Category, Tag, Prompt, PromptVariable } from "@/types/database";

export const metadata = { title: "Edit Prompt" };

export default async function EditPromptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createClient();
  const { id } = await params;

  const [promptRes, categoriesRes, tagsRes, variablesRes, promptTagsRes] =
    await Promise.all([
      supabase.from("prompts").select("*").eq("id", id).single(),
      supabase.from("categories").select("*").order("sort_order"),
      supabase.from("tags").select("*").order("name"),
      supabase
        .from("prompt_variables")
        .select("*")
        .eq("prompt_id", id)
        .order("sort_order"),
      supabase.from("prompt_tags").select("tag_id").eq("prompt_id", id),
    ]);

  if (!promptRes.data) notFound();

  return (
    <PromptEditor
      prompt={promptRes.data as Prompt}
      categories={(categoriesRes.data || []) as Category[]}
      tags={(tagsRes.data || []) as Tag[]}
      existingVariables={(variablesRes.data || []) as PromptVariable[]}
      existingTagIds={(promptTagsRes.data || []).map((t) => t.tag_id)}
    />
  );
}
