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
  // Full-text search via tsvector RPC, with ILIKE fallback
  let searchRankedIds: string[] | null = null;
  if (q) {
    const { data: searchResults } = await supabase.rpc("search_prompts", {
      search_query: q,
    });
    if (searchResults && searchResults.length > 0) {
      searchRankedIds = searchResults.map((r: { id: string }) => r.id);
      query = query.in("id", searchRankedIds as string[]);
    } else {
      query = query.or(
        `title_zh.ilike.%${q}%,title_en.ilike.%${q}%,subtitle.ilike.%${q}%,prompt_body.ilike.%${q}%`
      );
    }
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

  if (!searchRankedIds) {
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
  }

  query = query.range(offset, offset + limit - 1);

  let { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Re-sort by relevance rank when tsvector matched
  if (searchRankedIds && data) {
    const rankMap = new Map(searchRankedIds.map((id, i) => [id, i]));
    data = [...data].sort(
      (a, b) => (rankMap.get(a.id) ?? 999) - (rankMap.get(b.id) ?? 999)
    );
  }

  return NextResponse.json({ data, count });
}
