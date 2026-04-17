"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Category, Tag, Industry } from "@/types/database";
import { useLocale, useTranslations } from "next-intl";
import type { Locale } from "@/i18n/routing";
import { localizedField } from "@/i18n/utils";

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
  const pathname = usePathname();
  const isFavorites = pathname === "/favorites";
  const locale = useLocale() as Locale;
  const t = useTranslations("filters");
  const tLib = useTranslations("library");

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
      {/* Favorites */}
      <Link
        href="/favorites"
        className={cn(
          "flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold shadow-sm transition-all",
          isFavorites
            ? "bg-yellow-400 text-slate-900 shadow-yellow-200"
            : "bg-slate-900 text-white hover:bg-slate-800 hover:shadow-md"
        )}
      >
        <Heart className={cn("h-5 w-5", isFavorites ? "fill-slate-900 text-slate-900" : "fill-yellow-400 text-yellow-400")} />
        {tLib("viewFavorites")}
      </Link>

      <div className="border-t" />

      {/* Sort */}
      <div>
        <h3 className="mb-2 text-sm font-semibold text-muted-foreground">{t("sort")}</h3>
        <div className="flex flex-col gap-1">
          {[
            { value: "popular", label: t("sortPopular") },
            { value: "recent", label: t("sortRecent") },
            { value: "rating", label: t("sortRating") },
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
        <h3 className="mb-2 text-sm font-semibold text-muted-foreground">{t("industry")}</h3>
        <div className="flex flex-col gap-1">
          <Link
            href={buildUrl({ industry: undefined })}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm transition-colors hover:bg-secondary",
              !current.industry && "bg-secondary font-medium"
            )}
          >
            {t("allIndustries")}
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
              {localizedField(ind, "name", locale)}
            </Link>
          ))}
        </div>
      </div>

      {/* Categories */}
      <div>
        <h3 className="mb-2 text-sm font-semibold text-muted-foreground">{t("category")}</h3>
        <div className="flex flex-col gap-1">
          <Link
            href={buildUrl({ category: undefined })}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm transition-colors hover:bg-secondary",
              !current.category && "bg-secondary font-medium"
            )}
          >
            {t("allCategories")}
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
              {localizedField(cat, "name", locale)}
            </Link>
          ))}
        </div>
      </div>

      {/* Tags */}
      <div>
        <h3 className="mb-2 text-sm font-semibold text-muted-foreground">{t("tags")}</h3>
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <Link
              key={tag.id}
              href={buildUrl({ tag: current.tag === tag.slug ? undefined : tag.slug })}
              className={cn(
                "rounded-full border px-2.5 py-0.5 text-xs transition-colors hover:border-yellow-300",
                current.tag === tag.slug
                  ? "border-yellow-400 bg-yellow-50 font-medium"
                  : "border-border"
              )}
            >
              {tag.name}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
