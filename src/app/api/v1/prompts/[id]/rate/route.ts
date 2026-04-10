import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id } = await params;
  const body = await request.json();
  const { rating, anon_id } = body;

  if (!rating || rating < 1 || rating > 5 || !anon_id) {
    return NextResponse.json(
      { error: "Invalid rating (1-5) or missing anon_id" },
      { status: 400 }
    );
  }

  // Upsert rating
  const { error } = await supabase.from("prompt_ratings").upsert(
    { prompt_id: id, anon_id, rating },
    { onConflict: "prompt_id,anon_id" }
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Recalculate average rating
  const { data: stats } = await supabase
    .from("prompt_ratings")
    .select("rating")
    .eq("prompt_id", id);

  if (stats && stats.length > 0) {
    const avg =
      stats.reduce((sum, r) => sum + r.rating, 0) / stats.length;
    await supabase
      .from("prompts")
      .update({ rating: Math.round(avg * 10) / 10, ratings_count: stats.length })
      .eq("id", id);
  }

  return NextResponse.json({ success: true });
}
