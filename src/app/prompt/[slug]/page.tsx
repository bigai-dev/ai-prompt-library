import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/header";
import { PromptDetailClient } from "@/components/prompt-detail-client";
import { PromptCard } from "@/components/prompt-card";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import type {
  PromptWithCategory,
  PromptVariable,
  Tag,
} from "@/types/database";
import { cache } from "react";
import { getLocale, getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { localizedField } from "@/i18n/utils";

const getPrompt = cache(async (slug: string) => {
  const supabase = await createClient();

  const { data: prompt } = await supabase
    .from("prompts")
    .select("*, category:categories(*)")
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  return prompt as PromptWithCategory | null;
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const prompt = await getPrompt(slug);
  if (!prompt) return { title: "Not Found" };
  const locale = (await getLocale()) as Locale;

  return {
    title: localizedField(prompt, "title", locale) || prompt.title_en,
    description: prompt.subtitle,
  };
}

export default async function PromptDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const prompt = await getPrompt(slug);
  if (!prompt) notFound();

  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("prompt");
  const supabase = await createClient();

  const [variablesRes, tagsRes, relatedRes] = await Promise.all([
    supabase
      .from("prompt_variables")
      .select("*")
      .eq("prompt_id", prompt.id)
      .order("sort_order"),
    supabase
      .from("prompt_tags")
      .select("tag:tags(*)")
      .eq("prompt_id", prompt.id),
    supabase
      .from("related_prompts")
      .select("related_id")
      .eq("prompt_id", prompt.id)
      .order("sort_order"),
  ]);

  const variables = (variablesRes.data || []) as PromptVariable[];
  const tags = (tagsRes.data || []).map(
    (t: Record<string, unknown>) => t.tag
  ) as Tag[];

  let relatedPrompts: PromptWithCategory[] = [];
  if (relatedRes.data && relatedRes.data.length > 0) {
    const { data } = await supabase
      .from("prompts")
      .select("*, category:categories(*)")
      .in(
        "id",
        relatedRes.data.map((r) => r.related_id)
      )
      .eq("status", "published");
    relatedPrompts = (data || []) as PromptWithCategory[];
  }

  const promptTitle = localizedField(prompt, "title", locale);
  const categoryName = localizedField(prompt.category, "name", locale);

  return (
    <>
      <Header />
      <div className="mx-auto max-w-7xl px-4 py-6">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground">
          <Link href="/library" className="hover:text-foreground transition-colors">
            {t("breadcrumbAll")}
          </Link>
          <span className="text-border">/</span>
          <Link
            href={`/library?category=${prompt.category?.slug}`}
            className="hover:text-foreground transition-colors"
          >
            {categoryName}
          </Link>
          <span className="text-border">/</span>
          <span className="truncate text-foreground font-medium">
            {promptTitle}
          </span>
        </nav>

        {/* Two-column layout */}
        <div className="flex flex-col gap-10 lg:flex-row">
          {/* Left column — prompt content */}
          <div className="min-w-0 flex-1">
            <PromptDetailClient
              prompt={prompt}
              variables={variables}
              tags={tags}
              locale={locale}
            />
          </div>

          {/* Right column — sidebar (sticky) */}
          <aside className="w-full shrink-0 lg:w-80">
            <div className="space-y-6 lg:sticky lg:top-24">
              {/* Usage Steps */}
              <div className="rounded-xl border bg-card p-5">
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("stepsTitle")}
                </h3>
                <ol className="space-y-4">
                  {[
                    { step: "1", title: t("step1"), desc: t("step1Desc") },
                    { step: "2", title: t("step2"), desc: t("step2Desc") },
                    { step: "3", title: t("step3"), desc: t("step3Desc") },
                    { step: "4", title: t("step4"), desc: t("step4Desc") },
                  ].map(({ step, title, desc }) => (
                    <li key={step} className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                        {step}
                      </span>
                      <div className="pt-0.5">
                        <div className="text-sm font-medium leading-none">
                          {title}
                        </div>
                        {desc && (
                          <div className="mt-1 text-xs text-muted-foreground">
                            {desc}
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Boss Tip */}
              {prompt.boss_tip && (
                <div className="rounded-xl border border-[hsl(var(--boss-tip-border))] bg-[hsl(var(--boss-tip-bg))] p-5">
                  <h3 className="mb-2 text-sm font-semibold">
                    💡 {t("bossTipTitle")}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {prompt.boss_tip}
                  </p>
                </div>
              )}

              {/* Related Prompts */}
              {relatedPrompts.length > 0 && (
                <div>
                  <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    {t("relatedTitle")}
                  </h3>
                  <div className="space-y-3">
                    {relatedPrompts.slice(0, 3).map((rp) => (
                      <PromptCard key={rp.id} prompt={rp} compact locale={locale} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
