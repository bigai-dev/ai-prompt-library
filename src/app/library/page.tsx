import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Suspense } from "react";
import { Header } from "@/components/header";
import { PromptCard } from "@/components/prompt-card";
import { LibraryFilters } from "@/components/library-filters";
import { SearchInput } from "@/components/search-input";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { PromptWithCategory, Category, Tag, Industry } from "@/types/database";
import { getLocale, getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { localizedField } from "@/i18n/utils";

const PAGE_SIZE = 12;

function buildPageUrl(
  filters: Record<string, string | undefined>,
  page: number
): string {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return `/library${qs ? `?${qs}` : ""}`;
}

export const metadata = {
  title: "Template Library",
};

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string; sort?: string; tag?: string; industry?: string; page?: string }>;
}) {
  const supabase = await createClient();
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("library");

  const { category, q, sort = "popular", tag, industry, page: pageParam } = await searchParams;
  const currentPage = Math.max(1, parseInt(pageParam || "1", 10));

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
                current={{ category, q, sort, tag, industry }}
              />
            </aside>
            <div className="flex-1">
              <div className="py-16 text-center text-muted-foreground">
                {t("noResults")}
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
      // Fallback: ILIKE catches partial/substring matches tsvector misses
      query = query.or(
        `title_zh.ilike.%${q}%,title_en.ilike.%${q}%,subtitle.ilike.%${q}%,prompt_body.ilike.%${q}%`
      );
    }
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
                    current={{ category, q, sort, tag, industry }}
                  />
                </aside>
                <div className="flex-1">
                  <div className="py-16 text-center text-muted-foreground">
                    {t("noResults")}
                  </div>
                </div>
              </div>
            </div>
          </>
        );
      }
    }
  }

  // When tsvector matched, skip normal sort — we'll reorder by relevance after fetch
  if (!searchRankedIds) {
    switch (sort) {
      case "recent":
        query = query.order("created_at", { ascending: false });
        break;
      case "rating":
        query = query
          .order("rating", { ascending: false })
          .order("created_at", { ascending: false });
        break;
      default:
        query = query
          .order("times_copied", { ascending: false })
          .order("created_at", { ascending: false });
    }
  }

  const from = (currentPage - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  query = query.range(from, to);

  let { data: prompts, count } = await query;
  const totalPages = Math.ceil((count || 0) / PAGE_SIZE);

  // Re-sort by relevance rank when tsvector matched
  if (searchRankedIds && prompts) {
    const rankMap = new Map(searchRankedIds.map((id, i) => [id, i]));
    prompts = [...prompts].sort(
      (a, b) => (rankMap.get(a.id) ?? 999) - (rankMap.get(b.id) ?? 999)
    );
  }

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
              current={{ category, q, sort, tag, industry }}
            />
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            <div className="mb-4 flex items-center justify-between">
              <h1 className="text-2xl font-bold">
                {category
                  ? localizedField(categories.find((c) => c.slug === category), "name", locale) || t("pageTitle")
                  : t("allTemplates")}
                {industry && (
                  <span className="ml-2 text-base font-normal text-muted-foreground">
                    · {localizedField(industries.find((i) => i.slug === industry), "name", locale)}
                  </span>
                )}
              </h1>
              <span className="text-sm text-muted-foreground">
                {t("resultCount", { count: count || 0 })}
              </span>
            </div>

            <div className="mb-6">
              <Suspense fallback={<div className="h-10 w-full animate-pulse rounded-lg bg-muted" />}>
                <SearchInput />
              </Suspense>
            </div>

            {(prompts || []).length === 0 ? (
              <div className="py-16 text-center text-muted-foreground">
                {t("noResults")}
              </div>
            ) : (
              <>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {(prompts as PromptWithCategory[]).map((prompt) => (
                    <PromptCard key={prompt.id} prompt={prompt} locale={locale} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-8 flex items-center justify-center gap-2">
                    {currentPage > 1 ? (
                      <Link
                        href={buildPageUrl({ category, q, sort, tag, industry }, currentPage - 1)}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border text-sm transition-colors hover:bg-secondary"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Link>
                    ) : (
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg border text-sm text-muted-foreground/30">
                        <ChevronLeft className="h-4 w-4" />
                      </span>
                    )}

                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((p) => {
                        // Show first, last, and pages near current
                        return p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1;
                      })
                      .reduce<(number | "ellipsis")[]>((acc, p, i, arr) => {
                        if (i > 0 && p - (arr[i - 1] as number) > 1) {
                          acc.push("ellipsis");
                        }
                        acc.push(p);
                        return acc;
                      }, [])
                      .map((item, i) =>
                        item === "ellipsis" ? (
                          <span key={`e${i}`} className="px-1 text-sm text-muted-foreground">
                            ...
                          </span>
                        ) : (
                          <Link
                            key={item}
                            href={buildPageUrl({ category, q, sort, tag, industry }, item)}
                            className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                              item === currentPage
                                ? "bg-slate-900 text-white"
                                : "border hover:bg-secondary"
                            }`}
                          >
                            {item}
                          </Link>
                        )
                      )}

                    {currentPage < totalPages ? (
                      <Link
                        href={buildPageUrl({ category, q, sort, tag, industry }, currentPage + 1)}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border text-sm transition-colors hover:bg-secondary"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    ) : (
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg border text-sm text-muted-foreground/30">
                        <ChevronRight className="h-4 w-4" />
                      </span>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
