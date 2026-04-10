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

  return {
    title: prompt.title_en,
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

  return (
    <>
      <Header />
      <div className="mx-auto max-w-7xl px-4 py-6">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground">
          <Link href="/library" className="hover:text-foreground transition-colors">
            All Templates
          </Link>
          <span className="text-border">/</span>
          <Link
            href={`/library?category=${prompt.category?.slug}`}
            className="hover:text-foreground transition-colors"
          >
            {prompt.category?.name_en}
          </Link>
          <span className="text-border">/</span>
          <span className="truncate text-foreground font-medium">
            {prompt.title_en}
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
            />
          </div>

          {/* Right column — sidebar (sticky) */}
          <aside className="w-full shrink-0 lg:w-80">
            <div className="space-y-6 lg:sticky lg:top-24">
              {/* Usage Steps */}
              <div className="rounded-xl border bg-card p-5">
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  How to Use
                </h3>
                <ol className="space-y-4">
                  {[
                    { step: "1", title: "Fill in Variables", desc: "Replace placeholders with your info on the left" },
                    { step: "2", title: "Live Preview", desc: "The preview updates automatically" },
                    { step: "3", title: "Copy Prompt", desc: "Click the yellow button to copy" },
                    { step: "4", title: "Paste & Use", desc: "Open Cursor / Claude and paste" },
                  ].map(({ step, title, desc }) => (
                    <li key={step} className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                        {step}
                      </span>
                      <div className="pt-0.5">
                        <div className="text-sm font-medium leading-none">
                          {title}
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {desc}
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Boss Tip */}
              {prompt.boss_tip && (
                <div className="rounded-xl border border-[hsl(var(--boss-tip-border))] bg-[hsl(var(--boss-tip-bg))] p-5">
                  <h3 className="mb-2 text-sm font-semibold">
                    💡 Pro Tip
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
                    Related Templates
                  </h3>
                  <div className="space-y-3">
                    {relatedPrompts.slice(0, 3).map((rp) => (
                      <PromptCard key={rp.id} prompt={rp} compact />
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
