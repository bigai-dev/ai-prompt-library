"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Save, Trash2, Plus, Sparkles, Loader2 } from "lucide-react";
import type { Prompt, Category, Tag, PromptVariable, InputType, Difficulty, PromptStatus } from "@/types/database";

interface Props {
  prompt?: Prompt;
  categories: Category[];
  tags: Tag[];
  existingVariables?: PromptVariable[];
  existingTagIds?: string[];
}

interface VariableRow {
  key: string;
  label_zh: string;
  label_en: string;
  default_value: string;
  default_value_en: string;
  input_type: InputType;
  sort_order: number;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

function detectVariables(body: string): string[] {
  const matches = body.match(/\{([a-z_]+)\}/g) || [];
  const keys = matches.map((m) => m.slice(1, -1));
  return Array.from(new Set(keys));
}

export function PromptEditor({
  prompt,
  categories,
  tags,
  existingVariables = [],
  existingTagIds = [],
}: Props) {
  const router = useRouter();
  const isEditing = !!prompt;

  const [form, setForm] = useState({
    title_zh: prompt?.title_zh || "",
    title_en: prompt?.title_en || "",
    slug: prompt?.slug || "",
    subtitle: prompt?.subtitle || "",
    category_id: prompt?.category_id || categories[0]?.id || "",
    difficulty: (prompt?.difficulty || "easy") as Difficulty,
    estimated_minutes: prompt?.estimated_minutes || 10,
    version: prompt?.version || "v1.0",
    prompt_body: prompt?.prompt_body || "",
    prompt_body_en: prompt?.prompt_body_en || "",
    preview_image_url: prompt?.preview_image_url || "",
    boss_tip: prompt?.boss_tip || "",
    preview_prompt: prompt?.preview_prompt || "",
    example_output: prompt?.example_output || "",
    status: (prompt?.status || "draft") as PromptStatus,
  });

  const [variables, setVariables] = useState<VariableRow[]>(
    existingVariables.map((v) => ({
      key: v.key,
      label_zh: v.label_zh,
      label_en: v.label_en,
      default_value: v.default_value,
      default_value_en: v.default_value_en || "",
      input_type: v.input_type,
      sort_order: v.sort_order,
    }))
  );

  const [selectedTags, setSelectedTags] = useState<string[]>(existingTagIds);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Auto-generate slug from title
  useEffect(() => {
    if (!isEditing && form.title_en) {
      setForm((f) => ({ ...f, slug: slugify(form.title_en) }));
    }
  }, [form.title_en, isEditing]);

  // Auto-detect variables from prompt body
  const detectedKeys = useMemo(
    () => detectVariables(form.prompt_body),
    [form.prompt_body]
  );

  useEffect(() => {
    setVariables((prev) => {
      const existingKeys = new Set(prev.map((v) => v.key));
      const newVars = detectedKeys
        .filter((key) => !existingKeys.has(key))
        .map((key, i) => ({
          key,
          label_zh: key.replace(/_/g, " "),
          label_en: "",
          default_value: "",
          default_value_en: "",
          input_type: "text" as InputType,
          sort_order: prev.length + i,
        }));

      // Remove variables not in prompt body
      const validVars = prev.filter((v) => detectedKeys.includes(v.key));
      return [...validVars, ...newVars];
    });
  }, [detectedKeys]);

  const updateField = useCallback(
    (field: string, value: string | number) => {
      setForm((f) => ({ ...f, [field]: value }));
    },
    []
  );

  const updateVariable = useCallback(
    (index: number, field: keyof VariableRow, value: string) => {
      setVariables((prev) => {
        const next = [...prev];
        next[index] = { ...next[index], [field]: value };
        return next;
      });
    },
    []
  );

  const removeVariable = useCallback((index: number) => {
    setVariables((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const addVariable = useCallback(() => {
    setVariables((prev) => [
      ...prev,
      {
        key: "",
        label_zh: "",
        label_en: "",
        default_value: "",
        default_value_en: "",
        input_type: "text" as InputType,
        sort_order: prev.length,
      },
    ]);
  }, []);

  const toggleTag = useCallback((tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId]
    );
  }, []);

  const handleGeneratePreview = async () => {
    if (!form.prompt_body && !form.preview_prompt) {
      toast.error("Please fill in the prompt content or preview prompt first");
      return;
    }

    setGenerating(true);
    try {
      const res = await fetch("/api/v1/admin/generate-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt_body: form.prompt_body,
          title_zh: form.title_zh,
          preview_prompt: form.preview_prompt || undefined,
          variables: variables.filter((v) => v.key && v.default_value),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Generation failed");
      }

      const { example_output } = await res.json();
      setForm((f) => ({ ...f, example_output }));
      toast.success("Preview generated. Remember to save!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!form.title_zh || !form.slug || !form.category_id) {
      toast.error("Please fill in the title, slug, and category");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        variables: variables
          .filter((v) => v.key)
          .map((v, i) => ({ ...v, sort_order: i })),
        tags: selectedTags,
      };

      const url = isEditing
        ? `/api/v1/admin/prompts/${prompt.id}`
        : "/api/v1/admin/prompts";
      const method = isEditing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Save failed");
      }

      toast.success(isEditing ? "Updated successfully" : "Created successfully");
      router.push("/admin/prompts");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          {isEditing ? "Edit Prompt" : "New Prompt"}
        </h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground hover:bg-yellow-400 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {saving ? "Saving..." : "Save"}
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: Form */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Basic Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Title (Chinese) *</Label>
                  <Input
                    value={form.title_zh}
                    onChange={(e) => updateField("title_zh", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Title (English)</Label>
                  <Input
                    value={form.title_en}
                    onChange={(e) => updateField("title_en", e.target.value)}
                  />
                </div>
              </div>
              <div>
                <Label>Slug</Label>
                <Input
                  value={form.slug}
                  onChange={(e) => updateField("slug", e.target.value)}
                />
              </div>
              <div>
                <Label>Subtitle</Label>
                <Input
                  value={form.subtitle}
                  onChange={(e) => updateField("subtitle", e.target.value)}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <Label>Category</Label>
                  <select
                    value={form.category_id}
                    onChange={(e) => updateField("category_id", e.target.value)}
                    className="w-full rounded-md border bg-white px-3 py-2 text-sm"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name_en}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Difficulty</Label>
                  <select
                    value={form.difficulty}
                    onChange={(e) => updateField("difficulty", e.target.value)}
                    className="w-full rounded-md border bg-white px-3 py-2 text-sm"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
                <div>
                  <Label>Est. Time (min)</Label>
                  <Input
                    type="number"
                    value={form.estimated_minutes}
                    onChange={(e) =>
                      updateField("estimated_minutes", parseInt(e.target.value) || 0)
                    }
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Version</Label>
                  <Input
                    value={form.version}
                    onChange={(e) => updateField("version", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Status</Label>
                  <select
                    value={form.status}
                    onChange={(e) => updateField("status", e.target.value)}
                    className="w-full rounded-md border bg-white px-3 py-2 text-sm"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </div>
              </div>
              <div>
                <Label>Tags</Label>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {tags.map((tag) => (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleTag(tag.id)}
                      className={`rounded-full border px-2.5 py-0.5 text-xs transition-colors ${
                        selectedTags.includes(tag.id)
                          ? "border-yellow-400 bg-yellow-50 font-medium"
                          : "border-border hover:border-yellow-300"
                      }`}
                    >
                      {tag.name}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Prompt Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Prompt Body — Chinese (use {"{variable_name}"} to mark variables)</Label>
                <Textarea
                  value={form.prompt_body}
                  onChange={(e) => updateField("prompt_body", e.target.value)}
                  rows={12}
                  className="font-mono text-sm"
                />
              </div>
              <div>
                <Label>Prompt Body — English (use the same {"{variable_name}"} keys)</Label>
                <Textarea
                  value={form.prompt_body_en}
                  onChange={(e) => updateField("prompt_body_en", e.target.value)}
                  rows={12}
                  className="font-mono text-sm"
                  placeholder="English version of the prompt..."
                />
              </div>
              <div>
                <Label>Preview Image URL</Label>
                <Input
                  value={form.preview_image_url}
                  onChange={(e) => updateField("preview_image_url", e.target.value)}
                  placeholder="https://..."
                />
              </div>
              <div>
                <Label>Boss Tip</Label>
                <Textarea
                  value={form.boss_tip}
                  onChange={(e) => updateField("boss_tip", e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Output Preview</CardTitle>
                <button
                  type="button"
                  onClick={handleGeneratePreview}
                  disabled={generating || (!form.prompt_body && !form.preview_prompt)}
                  className="flex items-center gap-1.5 rounded-lg border border-yellow-300 bg-yellow-50 px-3 py-1.5 text-xs font-medium text-yellow-700 transition-colors hover:bg-yellow-100 disabled:opacity-50"
                >
                  {generating ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="h-3.5 w-3.5" />
                  )}
                  {generating ? "Generating..." : "AI Generate Preview"}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                {form.preview_prompt
                  ? "Uses the custom preview prompt below"
                  : "Falls back to the full prompt body — add a preview prompt for better results"}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Preview Prompt (optional — focused prompt for generating the preview)</Label>
                <Textarea
                  value={form.preview_prompt}
                  onChange={(e) => updateField("preview_prompt", e.target.value)}
                  rows={4}
                  className="text-sm"
                  placeholder="e.g., Show the customer mobile menu screen of a kopitiam ordering app with category tabs, 5 food items with CN/EN names and MYR prices, and a floating cart button..."
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Generated Preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {form.example_output && (
                <div className="overflow-hidden rounded-lg border">
                  <iframe
                    srcDoc={form.example_output}
                    sandbox="allow-scripts"
                    className="h-[400px] w-full border-0 bg-white"
                    title="Preview"
                  />
                </div>
              )}
              <details className="group">
                <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                  {form.example_output ? "Edit HTML source" : "Enter HTML manually"}
                </summary>
                <Textarea
                  value={form.example_output}
                  onChange={(e) => updateField("example_output", e.target.value)}
                  rows={10}
                  className="mt-2 font-mono text-xs"
                  placeholder="Click 'AI Generate Preview' above, or paste HTML manually..."
                />
              </details>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  Variables ({variables.length})
                </CardTitle>
                <button
                  type="button"
                  onClick={addVariable}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  <Plus className="h-3 w-3" />
                  Add manually
                </button>
              </div>
            </CardHeader>
            <CardContent>
              {variables.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Type {"{variable_name}"} in the Prompt Body to auto-detect variables
                </p>
              ) : (
                <div className="space-y-4">
                  {variables.map((v, i) => (
                    <div
                      key={i}
                      className="rounded-lg border bg-secondary/30 p-3"
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <code className="text-xs font-semibold text-yellow-700">
                          {"{" + v.key + "}"}
                        </code>
                        <button
                          type="button"
                          onClick={() => removeVariable(i)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-4">
                        <div>
                          <Label className="text-xs">Key</Label>
                          <Input
                            value={v.key}
                            onChange={(e) =>
                              updateVariable(i, "key", e.target.value)
                            }
                            className="h-8 text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Label (Chinese)</Label>
                          <Input
                            value={v.label_zh}
                            onChange={(e) =>
                              updateVariable(i, "label_zh", e.target.value)
                            }
                            className="h-8 text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Default (Chinese)</Label>
                          <Input
                            value={v.default_value}
                            onChange={(e) =>
                              updateVariable(i, "default_value", e.target.value)
                            }
                            className="h-8 text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Default (English)</Label>
                          <Input
                            value={v.default_value_en}
                            onChange={(e) =>
                              updateVariable(i, "default_value_en", e.target.value)
                            }
                            className="h-8 text-xs"
                            placeholder="English default..."
                          />
                        </div>
                      </div>
                      <div className="mt-2">
                        <Label className="text-xs">Input Type</Label>
                        <select
                          value={v.input_type}
                          onChange={(e) =>
                            updateVariable(i, "input_type", e.target.value)
                          }
                          className="h-8 w-full rounded border bg-white px-2 text-xs"
                        >
                          <option value="text">Text</option>
                          <option value="textarea">Multiline Text</option>
                          <option value="number">Number</option>
                          <option value="select">Dropdown</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Live Preview */}
        <div className="hidden lg:block">
          <div className="sticky top-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Live Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <h2 className="text-xl font-bold">
                    {form.title_en || "Prompt Title"}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {form.subtitle || "Subtitle"}
                  </p>
                  <Separator />
                  <div className="rounded-lg bg-[var(--code-block-bg)] p-4">
                    <pre className="whitespace-pre-wrap text-xs leading-relaxed text-[var(--code-block-fg)]">
                      {form.prompt_body || "Prompt content will appear here..."}
                    </pre>
                  </div>
                  {form.boss_tip && (
                    <div className="rounded-lg border border-[var(--boss-tip-border)] bg-[var(--boss-tip-bg)] p-3">
                      <p className="text-xs">💡 {form.boss_tip}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
