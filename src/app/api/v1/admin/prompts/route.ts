import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const body = await request.json();

  const { variables, tags, ...promptData } = body;

  // Create prompt
  const { data: prompt, error } = await supabase
    .from("prompts")
    .insert(promptData)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Insert variables
  if (variables && variables.length > 0) {
    await supabase.from("prompt_variables").insert(
      variables.map((v: Record<string, unknown>) => ({
        ...v,
        prompt_id: prompt.id,
      }))
    );
  }

  // Insert tags
  if (tags && tags.length > 0) {
    await supabase.from("prompt_tags").insert(
      tags.map((tagId: string) => ({
        prompt_id: prompt.id,
        tag_id: tagId,
      }))
    );
  }

  return NextResponse.json(prompt, { status: 201 });
}
