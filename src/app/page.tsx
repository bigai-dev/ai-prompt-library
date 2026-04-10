import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/header";
import { PromptCard } from "@/components/prompt-card";
import Link from "next/link";
import { Zap, ArrowRight, Folder } from "lucide-react";
import type { PromptWithCategory, Category } from "@/types/database";

export default async function HomePage() {
  const supabase = await createClient();

  const [promptsRes, categoriesRes] = await Promise.all([
    supabase
      .from("prompts")
      .select("*, category:categories(*)")
      .eq("status", "published")
      .order("times_copied", { ascending: false })
      .limit(6),
    supabase.from("categories").select("*").order("sort_order"),
  ]);

  const prompts = (promptsRes.data || []) as PromptWithCategory[];
  const categories = (categoriesRes.data || []) as Category[];

  // Count prompts per category
  const { data: allPrompts } = await supabase
    .from("prompts")
    .select("category_id")
    .eq("status", "published");

  const categoryCounts: Record<string, number> = {};
  (allPrompts || []).forEach((p) => {
    categoryCounts[p.category_id] = (categoryCounts[p.category_id] || 0) + 1;
  });

  return (
    <>
      <Header />
      <main>
        {/* Hero */}
        <section className="border-b bg-gradient-to-b from-yellow-50/50 to-white py-16 text-center">
          <div className="mx-auto max-w-3xl px-4">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/20 px-4 py-1.5 text-sm font-medium">
              <Zap className="h-4 w-4" />
              Student Exclusive · Continuously Updated
            </div>
            <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl">
              Vibe Coding
              <br />
              <span className="text-yellow-600">Prompt Library</span>
            </h1>
            <p className="mb-8 text-lg text-muted-foreground">
              Ready-to-use AI Prompt templates — copy and paste into Cursor / Claude.
              <br />
              Built for SME owners, covering everything from quotations to data analysis.
            </p>
            <Link
              href="/library"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground transition-colors hover:bg-yellow-400"
            >
              Browse Full Library
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        {/* Categories */}
        <section className="mx-auto max-w-7xl px-4 py-12">
          <h2 className="mb-6 text-2xl font-bold">Categories</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/library?category=${cat.slug}`}
                className="flex flex-col items-center gap-2 rounded-xl border bg-white p-4 text-center transition-all hover:border-yellow-300 hover:shadow-sm"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
                  <Folder className="h-5 w-5" />
                </div>
                <span className="text-sm font-medium">{cat.name_en}</span>
                <span className="text-xs text-muted-foreground">
                  {categoryCounts[cat.id] || 0} templates
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* Featured Prompts */}
        <section className="mx-auto max-w-7xl px-4 pb-16">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold">Popular Templates</h2>
            <Link
              href="/library"
              className="flex items-center gap-1 text-sm font-medium text-yellow-600 hover:text-yellow-700"
            >
              View All
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {prompts.map((prompt) => (
              <PromptCard key={prompt.id} prompt={prompt} />
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
