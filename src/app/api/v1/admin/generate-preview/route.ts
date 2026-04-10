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

  const { prompt_body, title_zh, variables, preview_prompt } =
    await request.json();

  if (!prompt_body && !preview_prompt) {
    return NextResponse.json(
      { error: "prompt_body or preview_prompt is required" },
      { status: 400 }
    );
  }

  const systemMessage = `You are a Vibe Coding preview generator. You generate a single, polished HTML page that shows what a student can build using a given prompt.

Strict requirements:
1. Output a complete HTML document (<!DOCTYPE html>, <html>, <head>, <body>)
2. Include Tailwind CSS CDN: <script src="https://cdn.tailwindcss.com"></script>
3. Design must be polished, professional, detailed — this is a demo for Malaysian SME bosses
4. Use MYR/RM for currency, Sdn Bhd for company types, +60 format for phones
5. Output ONLY HTML code — no explanatory text, no markdown code fences
6. Modern UI: rounded corners, shadows, gradients, proper spacing
7. Color scheme: dark navigation + white content area + yellow/gold accents
8. Page must display well in a new browser tab (avoid position:fixed full-screen overlays)
9. Realistic sample data — no lorem ipsum
10. Focus on ONE key screen that best showcases the app`;

  // Use preview_prompt if provided, otherwise fall back to filling prompt_body
  let userMessage: string;

  if (preview_prompt) {
    userMessage = preview_prompt;
  } else {
    let filledPrompt = prompt_body;
    if (variables && Array.isArray(variables)) {
      for (const v of variables) {
        if (v.key && v.default_value) {
          const regex = new RegExp(`\\{${v.key}\\}`, "g");
          filledPrompt = filledPrompt.replace(regex, v.default_value);
        }
      }
    }
    userMessage = `Below is a Vibe Coding Prompt template (title: ${title_zh || "Untitled"}).\n\nPlease generate an HTML page to demonstrate the final UI that a student can build using this prompt:\n\n${filledPrompt}`;
  }

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
      const err = await res.text();
      return NextResponse.json(
        { error: `AI API error: ${res.status} — ${err}` },
        { status: 502 }
      );
    }

    const data = await res.json();
    let content = data.choices?.[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        { error: "AI returned empty response" },
        { status: 502 }
      );
    }

    // Strip markdown code fences if the model wrapped it
    content = content
      .replace(/^```html?\s*\n?/i, "")
      .replace(/\n?```\s*$/i, "");

    return NextResponse.json({ example_output: content.trim() });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Failed to call AI API",
      },
      { status: 500 }
    );
  }
}
