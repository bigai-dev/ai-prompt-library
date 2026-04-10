import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/header";
import { PromptCard } from "@/components/prompt-card";
import { LibraryFilters } from "@/components/library-filters";
import type { PromptWithCategory, Category, Tag, Industry } from "@/types/database";

export const metadata = {
  title: "Template Library",
};

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; difficulty?: string; q?: string; sort?: string; tag?: string; industry?: string }>;
}) {
  const supabase = await createClient();

  const { category, difficulty, q, sort = "popular", tag, industry } = await searchParams;

  // Fetch categories, tags, and industries for filters
  const [categoriesRes, tagsRes, industriesRes] = await Promise.all([
    supabase.from("categories").select("*").order("sort_order"),
    supabase.from("tags").select("*").order("name"),
    supabase.from("industries").select("*").order("sort_order"),
  ]);

  const categories = (categoriesRes.data || []) as Category[];
  const tags = (tagsRes.data || []) as Tag[];
  const industries = (industriesRes.data || []) as Industry[];

  // If industry filter is set, get matching prompt IDs first
  let industryPromptIds: string[] | null = null;
  if (industry) {
    const ind = industries.find((i) => i.slug === industry);
    if (ind) {
      const { data: piData } = await supabase
        .from("prompt_industries")
        .select("prompt_id")
        .eq("industry_id", ind.id);
      industryPromptIds = (piData || []).map((pi) => pi.prompt_id);
    }
  }

  // If industry filter returns no prompts, short-circuit
  if (industryPromptIds !== null && industryPromptIds.length === 0) {
    return (
      <>
        <Header />
        <div className="mx-auto max-w-7xl px-4 py-8">
          <div className="flex gap-8">
            <aside className="hidden w-56 shrink-0 lg:block">
              <LibraryFilters
                categories={categories}
                tags={tags}
                industries={industries}
                current={{ category, difficulty, q, sort, tag, industry }}
              />
            </aside>
            <div className="flex-1">
              <div className="py-16 text-center text-muted-foreground">
                No matching templates found
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Build prompt query
  let query = supabase
    .from("prompts")
    .select("*, category:categories(*)", { count: "exact" })
    .eq("status", "published");

  if (industryPromptIds) {
    query = query.in("id", industryPromptIds);
  }

  if (category) {
    const cat = categories.find((c) => c.slug === category);
    if (cat) {
      query = query.eq("category_id", cat.id);
    }
  }

  if (difficulty) {
    query = query.eq("difficulty", difficulty);
  }

  if (q) {
    query = query.or(
      `title_zh.ilike.%${q}%,title_en.ilike.%${q}%,subtitle.ilike.%${q}%`
    );
  }

  if (tag) {
    const tagObj = tags.find((t) => t.slug === tag);
    if (tagObj) {
      const { data: promptIds } = await supabase
        .from("prompt_tags")
        .select("prompt_id")
        .eq("tag_id", tagObj.id);
      if (promptIds && promptIds.length > 0) {
        query = query.in("id", promptIds.map((pt) => pt.prompt_id));
      } else {
        return (
          <>
            <Header />
            <div className="mx-auto max-w-7xl px-4 py-8">
              <div className="flex gap-8">
                <aside className="hidden w-56 shrink-0 lg:block">
                  <LibraryFilters
                    categories={categories}
                    tags={tags}
                    industries={industries}
                    current={{ category, difficulty, q, sort, tag, industry }}
                  />
                </aside>
                <div className="flex-1">
                  <div className="py-16 text-center text-muted-foreground">
                    No matching templates found
                  </div>
                </div>
              </div>
            </div>
          </>
        );
      }
    }
  }

  switch (sort) {
    case "recent":
      query = query.order("created_at", { ascending: false });
      break;
    case "rating":
      query = query.order("rating", { ascending: false });
      break;
    default:
      query = query.order("times_copied", { ascending: false });
  }

  query = query.limit(50);

  const { data: prompts, count } = await query;

  return (
    <>
      <Header />
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex gap-8">
          {/* Sidebar Filters */}
          <aside className="hidden w-56 shrink-0 lg:block">
            <LibraryFilters
              categories={categories}
              tags={tags}
              industries={industries}
              current={{ category, difficulty, q, sort, tag, industry }}
            />
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            <div className="mb-6 flex items-center justify-between">
              <h1 className="text-2xl font-bold">
                {category
                  ? categories.find((c) => c.slug === category)?.name_en || "Template Library"
                  : "All Templates"}
                {industry && (
                  <span className="ml-2 text-base font-normal text-muted-foreground">
                    · {industries.find((i) => i.slug === industry)?.name_en}
                  </span>
                )}
                {q && (
                  <span className="ml-2 text-base font-normal text-muted-foreground">
                    Search: &ldquo;{q}&rdquo;
                  </span>
                )}
              </h1>
              <span className="text-sm text-muted-foreground">
                {count || 0} templates
              </span>
            </div>

            {(prompts || []).length === 0 ? (
              <div className="py-16 text-center text-muted-foreground">
                No matching templates found
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {(prompts as PromptWithCategory[]).map((prompt) => (
                  <PromptCard key={prompt.id} prompt={prompt} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
