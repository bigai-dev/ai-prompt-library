import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);

  const category = searchParams.get("category");
  const q = searchParams.get("q");
  const tag = searchParams.get("tag");
  const sort = searchParams.get("sort") || "popular";
  const limit = parseInt(searchParams.get("limit") || "20");
  const offset = parseInt(searchParams.get("offset") || "0");

  let query = supabase
    .from("prompts")
    .select("*, category:categories(*)", { count: "exact" })
    .eq("status", "published");

  if (category) {
    query = query.eq("category.slug", category);
  }
  if (q) {
    query = query.or(
      `title_zh.ilike.%${q}%,title_en.ilike.%${q}%,subtitle.ilike.%${q}%`
    );
  }
  if (tag) {
    const { data: tagData } = await supabase
      .from("tags")
      .select("id")
      .eq("slug", tag)
      .single();

    if (tagData) {
      const { data: promptIds } = await supabase
        .from("prompt_tags")
        .select("prompt_id")
        .eq("tag_id", tagData.id);

      if (promptIds && promptIds.length > 0) {
        query = query.in(
          "id",
          promptIds.map((pt) => pt.prompt_id)
        );
      } else {
        return NextResponse.json({ data: [], count: 0 });
      }
    }
  }

  switch (sort) {
    case "popular":
      query = query.order("times_copied", { ascending: false });
      break;
    case "recent":
      query = query.order("created_at", { ascending: false });
      break;
    case "rating":
      query = query.order("rating", { ascending: false });
      break;
    default:
      query = query.order("times_copied", { ascending: false });
  }

  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data, count });
}
