import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  // Support both UUID and slug
  const isUUID =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

  const query = supabase
    .from("prompts")
    .select("example_output, title_zh")
    .eq("status", "published");

  const { data: prompt } = await (isUUID
    ? query.eq("id", id)
    : query.eq("slug", id)
  ).single();

  if (!prompt?.example_output) {
    return NextResponse.json(
      { error: "Preview not available" },
      { status: 404 }
    );
  }

  return new NextResponse(prompt.example_output, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}
