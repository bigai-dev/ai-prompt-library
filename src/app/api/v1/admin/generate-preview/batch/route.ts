import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const apiKey = process.env.ARK_API_KEY;
  const modelId = process.env.ARK_MODEL_ID;
  const baseUrl =
    process.env.ARK_BASE_URL ||
    "https://ark.ap-southeast.bytepluses.com/api/v3";

  if (!apiKey || !modelId) {
    return NextResponse.json(
      { error: "ARK_API_KEY and ARK_MODEL_ID must be set in environment" },
      { status: 500 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const regenerateAll = body.regenerate_all === true;

  const supabase = await createClient();

  // Get prompts missing previews (or all if regenerate_all)
  let query = supabase
    .from("prompts")
    .select("id, slug, title_zh, prompt_body, prompt_body_en, preview_prompt")
    .eq("status", "published");

  if (!regenerateAll) {
    query = query.is("example_output", null);
  }

  const { data: prompts, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!prompts || prompts.length === 0) {
    return NextResponse.json({ message: "No prompts need preview generation", results: [] });
  }

  // Get variables for all prompts
  const { data: allVars } = await supabase
    .from("prompt_variables")
    .select("prompt_id, key, default_value_en, default_value")
    .in("prompt_id", prompts.map((p) => p.id));

  const varsByPrompt: Record<string, { key: string; default_value: string }[]> = {};
  (allVars || []).forEach((v) => {
    if (!varsByPrompt[v.prompt_id]) varsByPrompt[v.prompt_id] = [];
    varsByPrompt[v.prompt_id].push({
      key: v.key,
      default_value: v.default_value_en || v.default_value,
    });
  });

  const systemMessage = `You are a Vibe Coding preview generator. The user will give you a prompt instruction (students paste this prompt into Cursor or Claude to generate code).

You need to simulate the final result of this prompt by generating a complete HTML page to show what UI the student can build with it.

Strict requirements:
1. Output a complete HTML document (including <!DOCTYPE html>, <html>, <head>, <body>)
2. Include the Tailwind CSS CDN in <head>: <script src="https://cdn.tailwindcss.com"></script>
3. Use Chinese content (unless the prompt explicitly asks for English) — the target audience is Malaysian Chinese SME owners
4. The design must be polished, professional, and detailed — this is a demo for Malaysian SME bosses
5. Use MYR/RM for currency, Sdn Bhd for company types, and +60 format for phone numbers
6. Output only HTML code — no explanatory text, no markdown code fences
7. Use modern UI design: rounded corners, shadows, gradients, proper spacing
8. Color scheme: dark navigation + white content area + yellow/gold accents
9. Ensure the page displays well inside an iframe (avoid position:fixed full-screen elements)
10. Include realistic sample data — do not use lorem ipsum placeholders`;

  const results: { slug: string; status: string; error?: string }[] = [];

  // Process sequentially to avoid rate limits
  for (const prompt of prompts) {
    // Use preview_prompt if available, otherwise fill prompt_body
    let userMessage: string;
    if (prompt.preview_prompt) {
      userMessage = prompt.preview_prompt;
    } else {
      const promptBody = prompt.prompt_body_en || prompt.prompt_body;
      let filledPrompt = promptBody;
      const vars = varsByPrompt[prompt.id] || [];
      for (const v of vars) {
        if (v.key && v.default_value) {
          const regex = new RegExp(`\\{${v.key}\\}`, "g");
          filledPrompt = filledPrompt.replace(regex, v.default_value);
        }
      }
      userMessage = `Below is a Vibe Coding Prompt template (title: ${prompt.title_zh || "Untitled"}).\n\nPlease generate an HTML page to demonstrate the final UI that a student can build using this prompt:\n\n${filledPrompt}`;
    }

    process.stdout.write(`Generating: ${prompt.slug} ... `);

    try {
      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: modelId,
          messages: [
            { role: "system", content: systemMessage },
            { role: "user", content: userMessage },
          ],
          temperature: 0.7,
          max_tokens: 8192,
        }),
      });

      if (!res.ok) {
        results.push({ slug: prompt.slug, status: "error", error: `API ${res.status}` });
        continue;
      }

      const data = await res.json();
      let content = data.choices?.[0]?.message?.content;

      if (!content) {
        results.push({ slug: prompt.slug, status: "error", error: "Empty response" });
        continue;
      }

      // Strip markdown code fences
      content = content.replace(/^```html?\s*\n?/i, "").replace(/\n?```\s*$/i, "");

      // Save to DB
      const { error: updateErr } = await supabase
        .from("prompts")
        .update({ example_output: content.trim() })
        .eq("id", prompt.id);

      if (updateErr) {
        results.push({ slug: prompt.slug, status: "error", error: updateErr.message });
      } else {
        results.push({ slug: prompt.slug, status: "ok" });
      }
    } catch (err) {
      results.push({
        slug: prompt.slug,
        status: "error",
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  const ok = results.filter((r) => r.status === "ok").length;
  const failed = results.filter((r) => r.status === "error").length;

  return NextResponse.json({
    message: `Generated ${ok} previews, ${failed} failed`,
    results,
  });
}
