/**
 * Batch Prompt Importer
 *
 * Usage:
 *   node scripts/import-prompts.mjs prompts.json
 *
 * The JSON file should be an array of prompt objects:
 * [
 *   {
 *     "slug": "qr-menu-ordering-system",
 *     "title_en": "QR Menu & Ordering System",
 *     "title_zh": "QR 扫码点餐系统",
 *     "subtitle": "Build a complete QR-code ordering system...",
 *     "category": "operations",          // category slug
 *     "difficulty": "hard",              // easy | medium | hard
 *     "estimated_minutes": 120,
 *     "boss_tip": "Start with the customer ordering flow...",
 *     "prompt_body": "Chinese prompt body...",
 *     "prompt_body_en": "English prompt body...",
 *     "preview_prompt": "Show the customer mobile view...",
 *     "tags": ["qr-code", "full-app"],   // tag slugs (created if missing)
 *     "industries": ["fnb", "general"],   // industry slugs
 *     "variables": [
 *       {
 *         "key": "restaurant_name",
 *         "label_en": "Restaurant Name",
 *         "label_zh": "餐厅名称",
 *         "default_value": "好味道茶餐室",
 *         "default_value_en": "Ho Wei Dao Kopitiam",
 *         "input_type": "text"
 *       }
 *     ],
 *     "related": ["whatsapp-customer-reply-generator"]  // slugs of related prompts
 *   }
 * ]
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

// Load env
const envFile = readFileSync(".env.local", "utf-8");
const env = {};
envFile.split("\n").forEach((line) => {
  const [key, ...rest] = line.split("=");
  if (key && !key.startsWith("#")) env[key.trim()] = rest.join("=").trim();
});

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

const file = process.argv[2];
if (!file) {
  console.error("Usage: node scripts/import-prompts.mjs <prompts.json>");
  process.exit(1);
}

const prompts = JSON.parse(readFileSync(file, "utf-8"));
console.log(`Importing ${prompts.length} prompt(s)...\n`);

let created = 0;
let updated = 0;
let failed = 0;

for (const p of prompts) {
  process.stdout.write(`${p.slug} ... `);

  try {
    // Resolve category
    const { data: cat } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", p.category)
      .single();

    if (!cat) {
      console.log(`SKIP (category "${p.category}" not found)`);
      failed++;
      continue;
    }

    // Check if prompt exists
    const { data: existing } = await supabase
      .from("prompts")
      .select("id")
      .eq("slug", p.slug)
      .single();

    const promptData = {
      slug: p.slug,
      title_en: p.title_en,
      title_zh: p.title_zh || p.title_en,
      subtitle: p.subtitle || "",
      category_id: cat.id,
      difficulty: p.difficulty || "medium",
      estimated_minutes: p.estimated_minutes || 30,
      version: p.version || "v1.0",
      prompt_body: p.prompt_body || "",
      prompt_body_en: p.prompt_body_en || "",
      preview_prompt: p.preview_prompt || null,
      boss_tip: p.boss_tip || null,
      status: "published",
    };

    let promptId;

    if (existing) {
      // Update
      await supabase
        .from("prompts")
        .update(promptData)
        .eq("id", existing.id);
      promptId = existing.id;
      updated++;
    } else {
      // Insert
      const { data: newPrompt, error } = await supabase
        .from("prompts")
        .insert(promptData)
        .select("id")
        .single();

      if (error) throw new Error(error.message);
      promptId = newPrompt.id;
      created++;
    }

    // ── Variables ──
    if (p.variables?.length) {
      // Clear existing
      await supabase
        .from("prompt_variables")
        .delete()
        .eq("prompt_id", promptId);

      await supabase.from("prompt_variables").insert(
        p.variables.map((v, i) => ({
          prompt_id: promptId,
          key: v.key,
          label_en: v.label_en || v.key.replace(/_/g, " "),
          label_zh: v.label_zh || v.label_en || v.key,
          default_value: v.default_value || "",
          default_value_en: v.default_value_en || v.default_value || "",
          input_type: v.input_type || "text",
          sort_order: i,
        }))
      );
    }

    // ── Tags ──
    if (p.tags?.length) {
      await supabase.from("prompt_tags").delete().eq("prompt_id", promptId);

      for (const tagSlug of p.tags) {
        // Create tag if missing
        await supabase
          .from("tags")
          .upsert(
            { name: tagSlug.replace(/-/g, " "), slug: tagSlug },
            { onConflict: "slug" }
          );

        const { data: tag } = await supabase
          .from("tags")
          .select("id")
          .eq("slug", tagSlug)
          .single();

        if (tag) {
          await supabase
            .from("prompt_tags")
            .insert({ prompt_id: promptId, tag_id: tag.id });
        }
      }
    }

    // ── Industries ──
    if (p.industries?.length) {
      await supabase
        .from("prompt_industries")
        .delete()
        .eq("prompt_id", promptId);

      for (const indSlug of p.industries) {
        const { data: ind } = await supabase
          .from("industries")
          .select("id")
          .eq("slug", indSlug)
          .single();

        if (ind) {
          await supabase
            .from("prompt_industries")
            .insert({ prompt_id: promptId, industry_id: ind.id });
        }
      }
    }

    // ── Related Prompts ──
    if (p.related?.length) {
      await supabase
        .from("related_prompts")
        .delete()
        .eq("prompt_id", promptId);

      for (let i = 0; i < p.related.length; i++) {
        const { data: rel } = await supabase
          .from("prompts")
          .select("id")
          .eq("slug", p.related[i])
          .single();

        if (rel) {
          await supabase.from("related_prompts").insert({
            prompt_id: promptId,
            related_id: rel.id,
            sort_order: i,
          });
        }
      }
    }

    console.log(existing ? "UPDATED" : "CREATED");
  } catch (err) {
    console.log("FAIL:", err.message);
    failed++;
  }
}

console.log(`\nDone! ${created} created, ${updated} updated, ${failed} failed`);

// ── Generate previews for prompts missing them ──
const generatePreviews = process.argv.includes("--generate-previews");
if (generatePreviews) {
  const apiKey = env.ARK_API_KEY;
  const modelId = env.ARK_MODEL_ID;

  if (!apiKey || !modelId) {
    console.log("\nSkipping preview generation (ARK_API_KEY / ARK_MODEL_ID not set)");
    process.exit(0);
  }

  const { data: needPreview } = await supabase
    .from("prompts")
    .select("id, slug, title_zh, prompt_body, prompt_body_en, preview_prompt")
    .eq("status", "published")
    .is("example_output", null);

  if (!needPreview?.length) {
    console.log("\nAll prompts already have previews.");
    process.exit(0);
  }

  console.log(`\nGenerating previews for ${needPreview.length} prompt(s)...\n`);

  const systemMessage =
    "You are a Vibe Coding preview generator. You generate a single, polished HTML page that shows what a student can build using a given prompt. Requirements: 1. Complete HTML document with Tailwind CDN 2. Polished, professional design for Malaysian SME bosses 3. MYR/RM currency, Sdn Bhd companies 4. ONLY HTML output, no markdown fences 5. Modern UI with dark nav + white content + yellow accents 6. Realistic sample data 7. Focus on ONE key screen";

  for (const prompt of needPreview) {
    const userMessage =
      prompt.preview_prompt ||
      `Generate an HTML page for: ${(prompt.prompt_body_en || prompt.prompt_body).substring(0, 500)}`;

    process.stdout.write(`Preview: ${prompt.slug} ... `);
    try {
      const res = await fetch(
        "https://ark.ap-southeast.bytepluses.com/api/v3/chat/completions",
        {
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
        }
      );

      const data = await res.json();
      let content = data.choices?.[0]?.message?.content;
      if (!content) {
        console.log("FAIL (empty)");
        continue;
      }
      content = content
        .replace(/^```html?\s*\n?/i, "")
        .replace(/\n?```\s*$/i, "");
      await supabase
        .from("prompts")
        .update({ example_output: content.trim() })
        .eq("id", prompt.id);
      console.log("OK");
    } catch (err) {
      console.log("FAIL:", err.message);
    }
  }
}

console.log("\nAll done!");
