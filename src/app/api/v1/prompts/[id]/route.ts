import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id } = await params;

  // Support lookup by slug or UUID
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  const column = isUuid ? "id" : "slug";

  const { data: prompt, error } = await supabase
    .from("prompts")
    .select("*, category:categories(*)")
    .eq(column, id)
    .eq("status", "published")
    .single();

  if (error || !prompt) {
    return NextResponse.json({ error: "Prompt not found" }, { status: 404 });
  }

  // Fetch variables, tags, and related prompts in parallel
  const [variablesRes, tagsRes, relatedRes] = await Promise.all([
    supabase
      .from("prompt_variables")
      .select("*")
      .eq("prompt_id", prompt.id)
      .order("sort_order"),
    supabase
      .from("prompt_tags")
      .select("tag:tags(*)")
      .eq("prompt_id", prompt.id),
    supabase
      .from("related_prompts")
      .select("related_id, sort_order")
      .eq("prompt_id", prompt.id)
      .order("sort_order"),
  ]);

  let relatedPrompts: unknown[] = [];
  if (relatedRes.data && relatedRes.data.length > 0) {
    const relatedIds = relatedRes.data.map((r) => r.related_id);
    const { data: relatedData } = await supabase
      .from("prompts")
      .select("*, category:categories(*)")
      .in("id", relatedIds)
      .eq("status", "published");
    relatedPrompts = relatedData || [];
  }

  return NextResponse.json({
    ...prompt,
    variables: variablesRes.data || [],
    tags: (tagsRes.data || []).map((t: Record<string, unknown>) => t.tag),
    related_prompts: relatedPrompts,
  });
}
