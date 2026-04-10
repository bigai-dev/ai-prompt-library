import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const since = thirtyDaysAgo.toISOString();

  // Get totals for last 30 days
  const [viewsRes, copiesRes, favoritesRes] = await Promise.all([
    supabase
      .from("prompt_events")
      .select("id", { count: "exact", head: true })
      .eq("event_type", "view")
      .gte("created_at", since),
    supabase
      .from("prompt_events")
      .select("id", { count: "exact", head: true })
      .eq("event_type", "copy")
      .gte("created_at", since),
    supabase
      .from("prompt_events")
      .select("id", { count: "exact", head: true })
      .eq("event_type", "favorite")
      .gte("created_at", since),
  ]);

  // Top 10 prompts by copies
  const { data: topPrompts } = await supabase
    .from("prompts")
    .select("id, title_en, slug, times_copied, times_viewed, category:categories(name_en)")
    .order("times_copied", { ascending: false })
    .limit(10);

  // Daily copy trend (last 30 days)
  const { data: dailyEvents } = await supabase
    .from("prompt_events")
    .select("created_at, event_type")
    .eq("event_type", "copy")
    .gte("created_at", since)
    .order("created_at");

  // Aggregate daily
  const dailyTrend: Record<string, number> = {};
  (dailyEvents || []).forEach((event) => {
    const day = event.created_at.split("T")[0];
    dailyTrend[day] = (dailyTrend[day] || 0) + 1;
  });

  // Category distribution
  const { data: categoryStats } = await supabase
    .from("prompts")
    .select("category:categories(name_en)")
    .eq("status", "published");

  const categoryDistribution: Record<string, number> = {};
  (categoryStats || []).forEach((p: Record<string, unknown>) => {
    const cat = p.category as { name_en: string } | null;
    const name = cat?.name_en || "Unknown";
    categoryDistribution[name] = (categoryDistribution[name] || 0) + 1;
  });

  return NextResponse.json({
    totals: {
      views: viewsRes.count || 0,
      copies: copiesRes.count || 0,
      favorites: favoritesRes.count || 0,
    },
    topPrompts: topPrompts || [],
    dailyTrend: Object.entries(dailyTrend).map(([date, count]) => ({
      date,
      count,
    })),
    categoryDistribution: Object.entries(categoryDistribution).map(
      ([name, count]) => ({ name, count })
    ),
  });
}
