"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Save,
  Trash2,
  Plus,
  Sparkles,
  Loader2,
  ArrowLeft,
  Eye,
  EyeOff,
  FileText,
  Settings,
  Code,
  Wand2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  Prompt,
  Category,
  Tag,
  PromptVariable,
  InputType,
  PromptStatus,
} from "@/types/database";

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

const selectClassName =
  "h-9 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

const selectSmClassName =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2 text-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

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

type Tab = "content" | "settings" | "preview";

export function PromptEditor({
  prompt,
  categories,
  tags,
  existingVariables = [],
  existingTagIds = [],
}: Props) {
  const router = useRouter();
  const isEditing = !!prompt;

  const [activeTab, setActiveTab] = useState<Tab>("content");
  const [showPreview, setShowPreview] = useState(true);

  const [form, setForm] = useState({
    title_zh: prompt?.title_zh || "",
    title_en: prompt?.title_en || "",
    slug: prompt?.slug || "",
    subtitle: prompt?.subtitle || "",
    category_id: prompt?.category_id || categories[0]?.id || "",
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

  useEffect(() => {
    if (!isEditing && form.title_en) {
      setForm((f) => ({ ...f, slug: slugify(form.title_en) }));
    }
  }, [form.title_en, isEditing]);

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
      prev.includes(tagId)
        ? prev.filter((t) => t !== tagId)
        : [...prev, tagId]
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

  const tabs: { id: Tab; label: string; icon: typeof FileText }[] = [
    { id: "content", label: "Content", icon: FileText },
    { id: "settings", label: "Settings", icon: Settings },
    { id: "preview", label: "AI Preview", icon: Wand2 },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      {/* ── Sticky Header ── */}
      <div className="sticky top-0 z-20 -mx-4 -mt-4 mb-8 border-b bg-secondary/20 px-4 py-4 backdrop-blur-sm sm:-mx-6 sm:-mt-6 sm:px-6 md:-mt-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => router.push("/admin/prompts")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-lg font-bold leading-tight">
                {isEditing ? "Edit Prompt" : "New Prompt"}
              </h1>
              {isEditing && (
                <p className="text-xs text-muted-foreground">/{form.slug}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                updateField(
                  "status",
                  form.status === "published" ? "draft" : "published"
                )
              }
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                form.status === "published"
                  ? "bg-green-100 text-green-700 hover:bg-green-200"
                  : "bg-secondary text-muted-foreground hover:bg-secondary/80"
              )}
            >
              {form.status === "published" ? "Published" : "Draft"}
            </button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setShowPreview(!showPreview)}
              className="hidden lg:flex"
            >
              {showPreview ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
            <Button onClick={handleSave} disabled={saving} size="sm">
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </div>

      {/* ── Title Fields (always visible) ── */}
      <div className="mb-8 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              Title (Chinese) *
            </Label>
            <Input
              value={form.title_zh}
              onChange={(e) => updateField("title_zh", e.target.value)}
              placeholder="Chinese title..."
              className="h-10 text-base font-medium"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              Title (English)
            </Label>
            <Input
              value={form.title_en}
              onChange={(e) => updateField("title_en", e.target.value)}
              placeholder="English title..."
              className="h-10 text-base font-medium"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Subtitle</Label>
          <Input
            value={form.subtitle}
            onChange={(e) => updateField("subtitle", e.target.value)}
            placeholder="Short description of what this prompt does..."
            className="text-sm"
          />
        </div>
      </div>

      {/* ── Tab Bar ── */}
      <div className="mb-6 flex items-center gap-1 rounded-lg bg-secondary/60 p-1">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-all",
              activeTab === id
                ? "bg-white text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* ── Main Layout ── */}
      <div className="flex gap-6">
        {/* Left: Form Panels */}
        <div className="min-w-0 flex-1">
          {/* ── TAB: Content ── */}
          {activeTab === "content" && (
            <div className="space-y-6">
              {/* Chinese Prompt */}
              <section>
                <div className="mb-2 flex items-center gap-2">
                  <h3 className="text-sm font-semibold">Prompt Body (Chinese)</h3>
                  <Badge variant="secondary" className="text-[10px]">
                    Primary
                  </Badge>
                </div>
                <p className="mb-2 text-xs text-muted-foreground">
                  Use {"{variable_name}"} to mark dynamic variables
                </p>
                <Textarea
                  value={form.prompt_body}
                  onChange={(e) => updateField("prompt_body", e.target.value)}
                  rows={14}
                  className="font-mono text-sm leading-relaxed"
                />
              </section>

              {/* English Prompt */}
              <section>
                <h3 className="mb-2 text-sm font-semibold">
                  Prompt Body (English)
                </h3>
                <Textarea
                  value={form.prompt_body_en}
                  onChange={(e) =>
                    updateField("prompt_body_en", e.target.value)
                  }
                  rows={14}
                  className="font-mono text-sm leading-relaxed"
                  placeholder="English version of the prompt..."
                />
              </section>

              {/* Boss Tip */}
              <section>
                <h3 className="mb-2 text-sm font-semibold">Boss Tip</h3>
                <Textarea
                  value={form.boss_tip}
                  onChange={(e) => updateField("boss_tip", e.target.value)}
                  rows={3}
                  className="text-sm"
                  placeholder="Optional tip for users..."
                />
              </section>

              {/* Variables */}
              <section>
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Code className="h-4 w-4 text-muted-foreground" />
                    <h3 className="text-sm font-semibold">
                      Variables
                    </h3>
                    {variables.length > 0 && (
                      <Badge variant="secondary" className="text-[10px]">
                        {variables.length}
                      </Badge>
                    )}
                  </div>
                  <Button variant="ghost" size="sm" onClick={addVariable}>
                    <Plus className="h-3 w-3" />
                    Add
                  </Button>
                </div>

                {variables.length === 0 ? (
                  <div className="rounded-lg border border-dashed p-4 text-center">
                    <p className="text-xs text-muted-foreground">
                      Type {"{variable_name}"} in the prompt body to
                      auto-detect variables
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {variables.map((v, i) => (
                      <div
                        key={i}
                        className="rounded-lg border bg-white p-3"
                      >
                        <div className="flex items-start gap-3">
                          <code className="mt-1.5 shrink-0 rounded bg-foreground/5 px-1.5 py-0.5 text-[11px] font-semibold text-foreground">
                            {"{" + v.key + "}"}
                          </code>
                          <div className="grid flex-1 gap-2 sm:grid-cols-5">
                            <div>
                              <Label className="text-[10px] text-muted-foreground">
                                Key
                              </Label>
                              <Input
                                value={v.key}
                                onChange={(e) =>
                                  updateVariable(i, "key", e.target.value)
                                }
                                className="h-8 text-xs"
                              />
                            </div>
                            <div>
                              <Label className="text-[10px] text-muted-foreground">
                                Label (CN)
                              </Label>
                              <Input
                                value={v.label_zh}
                                onChange={(e) =>
                                  updateVariable(i, "label_zh", e.target.value)
                                }
                                className="h-8 text-xs"
                              />
                            </div>
                            <div>
                              <Label className="text-[10px] text-muted-foreground">
                                Default (CN)
                              </Label>
                              <Input
                                value={v.default_value}
                                onChange={(e) =>
                                  updateVariable(
                                    i,
                                    "default_value",
                                    e.target.value
                                  )
                                }
                                className="h-8 text-xs"
                              />
                            </div>
                            <div>
                              <Label className="text-[10px] text-muted-foreground">
                                Default (EN)
                              </Label>
                              <Input
                                value={v.default_value_en}
                                onChange={(e) =>
                                  updateVariable(
                                    i,
                                    "default_value_en",
                                    e.target.value
                                  )
                                }
                                className="h-8 text-xs"
                              />
                            </div>
                            <div>
                              <Label className="text-[10px] text-muted-foreground">
                                Type
                              </Label>
                              <select
                                value={v.input_type}
                                onChange={(e) =>
                                  updateVariable(
                                    i,
                                    "input_type",
                                    e.target.value
                                  )
                                }
                                className={selectSmClassName}
                              >
                                <option value="text">Text</option>
                                <option value="textarea">Multiline</option>
                                <option value="number">Number</option>
                                <option value="select">Dropdown</option>
                              </select>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => removeVariable(i)}
                            className="mt-1.5 shrink-0 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}

          {/* ── TAB: Settings ── */}
          {activeTab === "settings" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Metadata</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        Slug
                      </Label>
                      <Input
                        value={form.slug}
                        onChange={(e) => updateField("slug", e.target.value)}
                        className="font-mono text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        Category
                      </Label>
                      <select
                        value={form.category_id}
                        onChange={(e) =>
                          updateField("category_id", e.target.value)
                        }
                        className={selectClassName}
                      >
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name_en}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        Est. Time (min)
                      </Label>
                      <Input
                        type="number"
                        value={form.estimated_minutes}
                        onChange={(e) =>
                          updateField(
                            "estimated_minutes",
                            parseInt(e.target.value) || 0
                          )
                        }
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        Version
                      </Label>
                      <Input
                        value={form.version}
                        onChange={(e) => updateField("version", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        Preview Image URL
                      </Label>
                      <Input
                        value={form.preview_image_url}
                        onChange={(e) =>
                          updateField("preview_image_url", e.target.value)
                        }
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Tags</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1.5">
                    {tags.map((tag) => (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => toggleTag(tag.id)}
                        className={cn(
                          "cursor-pointer rounded-full border px-2.5 py-1 text-xs transition-colors",
                          selectedTags.includes(tag.id)
                            ? "border-primary bg-accent font-medium"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        {tag.name}
                      </button>
                    ))}
                  </div>
                  {selectedTags.length > 0 && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      {selectedTags.length} selected
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* ── TAB: AI Preview ── */}
          {activeTab === "preview" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">
                      AI Generate Preview
                    </CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleGeneratePreview}
                      disabled={
                        generating ||
                        (!form.prompt_body && !form.preview_prompt)
                      }
                    >
                      {generating ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="h-3.5 w-3.5" />
                      )}
                      {generating ? "Generating..." : "Generate"}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {form.preview_prompt
                      ? "Uses the custom preview prompt below"
                      : "Falls back to the full prompt body"}
                  </p>
                </CardHeader>
                <CardContent>
                  <Label className="text-xs text-muted-foreground">
                    Custom Preview Prompt (optional)
                  </Label>
                  <Textarea
                    value={form.preview_prompt}
                    onChange={(e) =>
                      updateField("preview_prompt", e.target.value)
                    }
                    rows={4}
                    className="mt-1 text-sm"
                    placeholder="e.g., Show the customer mobile menu screen..."
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Output</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {form.example_output ? (
                    <div className="overflow-hidden rounded-lg border">
                      <iframe
                        srcDoc={form.example_output}
                        sandbox="allow-scripts"
                        className="h-96 w-full border-0 bg-white"
                        title="Preview"
                      />
                    </div>
                  ) : (
                    <div className="flex h-48 items-center justify-center rounded-lg border border-dashed">
                      <p className="text-sm text-muted-foreground">
                        No preview generated yet
                      </p>
                    </div>
                  )}
                  <details className="group">
                    <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                      {form.example_output
                        ? "Edit HTML source"
                        : "Enter HTML manually"}
                    </summary>
                    <Textarea
                      value={form.example_output}
                      onChange={(e) =>
                        updateField("example_output", e.target.value)
                      }
                      rows={10}
                      className="mt-2 font-mono text-xs"
                      placeholder="Click 'Generate' above, or paste HTML manually..."
                    />
                  </details>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Right: Live Preview Panel */}
        {showPreview && (
          <div className="hidden w-80 shrink-0 lg:block xl:w-96">
            <div className="sticky top-20">
              <Card className="overflow-hidden">
                <CardHeader className="bg-secondary/30 py-3">
                  <CardTitle className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <Eye className="h-3.5 w-3.5" />
                    LIVE PREVIEW
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div>
                      <h2 className="text-lg font-bold leading-snug">
                        {form.title_en || form.title_zh || "Prompt Title"}
                      </h2>
                      {form.subtitle && (
                        <p className="mt-1 text-sm text-muted-foreground">
                          {form.subtitle}
                        </p>
                      )}
                    </div>

                    {/* Meta pills */}
                    <div className="flex flex-wrap gap-1.5">
                      {form.category_id && (
                        <Badge variant="secondary" className="text-[10px]">
                          {categories.find((c) => c.id === form.category_id)
                            ?.name_en || "Category"}
                        </Badge>
                      )}
                      <Badge variant="secondary" className="text-[10px]">
                        {form.estimated_minutes} min
                      </Badge>
                      <Badge variant="secondary" className="text-[10px]">
                        {form.version}
                      </Badge>
                    </div>

                    <Separator />

                    {/* Prompt body preview */}
                    <div className="rounded-lg bg-foreground p-3">
                      <pre className="max-h-64 overflow-auto whitespace-pre-wrap text-[11px] leading-relaxed text-secondary">
                        {form.prompt_body ||
                          "Prompt content will appear here..."}
                      </pre>
                    </div>

                    {/* Variables preview */}
                    {variables.length > 0 && (
                      <div>
                        <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                          Variables
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {variables.map((v) => (
                            <code
                              key={v.key}
                              className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium"
                            >
                              {"{" + v.key + "}"}
                            </code>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Boss tip preview */}
                    {form.boss_tip && (
                      <div className="rounded-lg border border-primary/30 bg-accent p-2.5">
                        <p className="text-xs text-foreground">
                          <span className="mr-1 font-semibold">Tip:</span>
                          {form.boss_tip}
                        </p>
                      </div>
                    )}

                    {/* Tags preview */}
                    {selectedTags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {selectedTags.map((tagId) => {
                          const tag = tags.find((t) => t.id === tagId);
                          return tag ? (
                            <span
                              key={tagId}
                              className="rounded-full border px-2 py-0.5 text-[10px]"
                            >
                              {tag.name}
                            </span>
                          ) : null;
                        })}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
