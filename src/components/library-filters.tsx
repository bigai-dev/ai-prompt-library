"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import type { Category, Tag, Industry } from "@/types/database";

interface FiltersProps {
  categories: Category[];
  tags: Tag[];
  industries: Industry[];
  current: {
    category?: string;
    q?: string;
    sort?: string;
    tag?: string;
    industry?: string;
  };
}

export function LibraryFilters({ categories, tags, industries, current }: FiltersProps) {
  function buildUrl(params: Record<string, string | undefined>) {
    const merged = { ...current, ...params };
    const sp = new URLSearchParams();
    Object.entries(merged).forEach(([key, value]) => {
      if (value) sp.set(key, value);
    });
    return `/library?${sp.toString()}`;
  }

  return (
    <div className="space-y-6">
      {/* Sort */}
      <div>
        <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Sort</h3>
        <div className="flex flex-col gap-1">
          {[
            { value: "popular", label: "Most Copied" },
            { value: "recent", label: "Newest" },
            { value: "rating", label: "Highest Rated" },
          ].map(({ value, label }) => (
            <Link
              key={value}
              href={buildUrl({ sort: value })}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm transition-colors hover:bg-secondary",
                (current.sort || "popular") === value &&
                  "bg-secondary font-medium"
              )}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>

      {/* Industry */}
      <div>
        <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Industry</h3>
        <div className="flex flex-col gap-1">
          <Link
            href={buildUrl({ industry: undefined })}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm transition-colors hover:bg-secondary",
              !current.industry && "bg-secondary font-medium"
            )}
          >
            All Industries
          </Link>
          {industries.map((ind) => (
            <Link
              key={ind.id}
              href={buildUrl({ industry: ind.slug })}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm transition-colors hover:bg-secondary",
                current.industry === ind.slug && "bg-secondary font-medium"
              )}
            >
              {ind.name_en}
            </Link>
          ))}
        </div>
      </div>

      {/* Categories */}
      <div>
        <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Category</h3>
        <div className="flex flex-col gap-1">
          <Link
            href={buildUrl({ category: undefined })}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm transition-colors hover:bg-secondary",
              !current.category && "bg-secondary font-medium"
            )}
          >
            All
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={buildUrl({ category: cat.slug })}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm transition-colors hover:bg-secondary",
                current.category === cat.slug && "bg-secondary font-medium"
              )}
            >
              {cat.name_en}
            </Link>
          ))}
        </div>
      </div>

      {/* Tags */}
      <div>
        <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Tags</h3>
        <div className="flex flex-wrap gap-1.5">
          {tags.map((t) => (
            <Link
              key={t.id}
              href={buildUrl({ tag: current.tag === t.slug ? undefined : t.slug })}
              className={cn(
                "rounded-full border px-2.5 py-0.5 text-xs transition-colors hover:border-yellow-300",
                current.tag === t.slug
                  ? "border-yellow-400 bg-yellow-50 font-medium"
                  : "border-border"
              )}
            >
              {t.name}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
