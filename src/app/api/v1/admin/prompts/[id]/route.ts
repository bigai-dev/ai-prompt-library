import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id } = await params;
  const body = await request.json();

  const { variables, tags, related_prompts, ...promptData } = body;

  // Update prompt
  const { data: prompt, error } = await supabase
    .from("prompts")
    .update(promptData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Replace variables if provided
  if (variables !== undefined) {
    await supabase.from("prompt_variables").delete().eq("prompt_id", id);
    if (variables.length > 0) {
      await supabase.from("prompt_variables").insert(
        variables.map((v: Record<string, unknown>) => ({
          ...v,
          prompt_id: id,
        }))
      );
    }
  }

  // Replace tags if provided
  if (tags !== undefined) {
    await supabase.from("prompt_tags").delete().eq("prompt_id", id);
    if (tags.length > 0) {
      await supabase.from("prompt_tags").insert(
        tags.map((tagId: string) => ({
          prompt_id: id,
          tag_id: tagId,
        }))
      );
    }
  }

  // Replace related prompts if provided
  if (related_prompts !== undefined) {
    await supabase.from("related_prompts").delete().eq("prompt_id", id);
    if (related_prompts.length > 0) {
      await supabase.from("related_prompts").insert(
        related_prompts.map((rp: { related_id: string }, i: number) => ({
          prompt_id: id,
          related_id: rp.related_id,
          sort_order: i,
        }))
      );
    }
  }

  return NextResponse.json(prompt);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id } = await params;

  const { error } = await supabase.from("prompts").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
