import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id } = await params;

  // Get current status
  const { data: prompt } = await supabase
    .from("prompts")
    .select("status")
    .eq("id", id)
    .single();

  if (!prompt) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const newStatus = prompt.status === "published" ? "draft" : "published";

  const { data, error } = await supabase
    .from("prompts")
    .update({ status: newStatus })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
