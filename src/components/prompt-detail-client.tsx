"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Copy, Check, Clock, Star, Eye, RotateCcw, Sparkles, ExternalLink, Globe } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { FavoriteButton } from "@/components/favorite-button";
import { toast } from "sonner";
import { getAnonId } from "@/lib/anon-id";
import type { PromptWithCategory, PromptVariable, Tag } from "@/types/database";

type Lang = "en" | "zh";

interface Props {
  prompt: PromptWithCategory;
  variables: PromptVariable[];
  tags: Tag[];
}

export function PromptDetailClient({ prompt, variables, tags }: Props) {
  const hasEnglish = !!prompt.prompt_body_en;
  const [lang, setLang] = useState<Lang>("en");
  const [values, setValues] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);
  const [viewLogged, setViewLogged] = useState(false);

  // Active prompt body based on selected language
  const activeBody = useMemo(() => {
    if (lang === "en" && hasEnglish) return prompt.prompt_body_en!;
    return prompt.prompt_body;
  }, [lang, hasEnglish, prompt.prompt_body, prompt.prompt_body_en]);

  // Reset defaults when language changes
  useEffect(() => {
    const defaults: Record<string, string> = {};
    variables.forEach((v) => {
      defaults[v.key] =
        lang === "en" && v.default_value_en
          ? v.default_value_en
          : v.default_value;
    });
    setValues(defaults);
  }, [variables, lang]);

  useEffect(() => {
    if (viewLogged) return;
    setViewLogged(true);
    fetch(`/api/v1/prompts/${prompt.id}/view`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ anon_id: getAnonId() }),
    }).catch(() => {});
  }, [prompt.id, viewLogged]);

  const substitutedBody = useMemo(() => {
    let body = activeBody;
    Object.entries(values).forEach(([key, value]) => {
      const regex = new RegExp(`\\{${key}\\}`, "g");
      body = body.replace(regex, value || `{${key}}`);
    });
    return body;
  }, [activeBody, values]);

  const wordCount = useMemo(() => {
    const chinese = (substitutedBody.match(/[\u4e00-\u9fff]/g) || []).length;
    const english = (substitutedBody.match(/[a-zA-Z]+/g) || []).length;
    return chinese + english;
  }, [substitutedBody]);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(substitutedBody);
    setCopied(true);
    toast.success("Copied to clipboard");

    fetch(`/api/v1/prompts/${prompt.id}/copy`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ anon_id: getAnonId() }),
    }).catch(() => {});

    setTimeout(() => setCopied(false), 2000);
  }, [substitutedBody, prompt.id]);

  const handleReset = useCallback(() => {
    const defaults: Record<string, string> = {};
    variables.forEach((v) => {
      defaults[v.key] =
        lang === "en" && v.default_value_en
          ? v.default_value_en
          : v.default_value;
    });
    setValues(defaults);
  }, [variables, lang]);

  const updateValue = useCallback((key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  const renderedBody = useMemo(() => {
    const parts: { text: string; isVar: boolean; key?: string }[] = [];
    const regex = /\{([a-z_]+)\}/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(activeBody)) !== null) {
      if (match.index > lastIndex) {
        parts.push({
          text: activeBody.slice(lastIndex, match.index),
          isVar: false,
        });
      }

      const key = match[1];
      const value = values[key];
      if (value && value !== `{${key}}`) {
        parts.push({ text: value, isVar: false });
      } else {
        parts.push({ text: match[0], isVar: true, key });
      }

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < activeBody.length) {
      parts.push({
        text: activeBody.slice(lastIndex),
        isVar: false,
      });
    }

    return parts;
  }, [activeBody, values]);

  return (
    <div className="space-y-8">
      {/* ── Hero: Title + Subtitle ── */}
      <div>
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-2xl font-bold leading-tight sm:text-3xl">
            {prompt.title_en}
          </h1>
          <FavoriteButton promptId={prompt.id} className="mt-1 shrink-0" />
        </div>
        <p className="mt-2 text-base text-muted-foreground leading-relaxed">
          {prompt.subtitle}
        </p>

        {/* Metadata row */}
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {prompt.estimated_minutes} min
          </span>
          <span>{prompt.version}</span>
          <Separator orientation="vertical" className="!h-4" />
          <span className="flex items-center gap-1">
            <Eye className="h-3.5 w-3.5" />
            {prompt.times_viewed}
          </span>
          <span className="flex items-center gap-1">
            <Copy className="h-3.5 w-3.5" />
            {prompt.times_copied}
          </span>
          {prompt.rating > 0 && (
            <span className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
              {prompt.rating.toFixed(1)} ({prompt.ratings_count})
            </span>
          )}
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <Badge key={tag.id} variant="outline" className="font-normal">
                {tag.name}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* ── Language Toggle + Action Buttons ── */}
      {hasEnglish && (
        <div className="flex items-center gap-1 rounded-lg bg-secondary p-1 w-fit">
          <button
            onClick={() => setLang("en")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              lang === "en"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Globe className="h-3.5 w-3.5" />
            English
          </button>
          <button
            onClick={() => setLang("zh")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              lang === "zh"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Globe className="h-3.5 w-3.5" />
            中文
          </button>
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={handleCopy}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-3 text-base font-semibold text-primary-foreground shadow-sm transition-all hover:bg-yellow-400 hover:shadow-md active:scale-[0.98]"
        >
          {copied ? (
            <Check className="h-5 w-5" />
          ) : (
            <Copy className="h-5 w-5" />
          )}
          {copied ? "Copied to clipboard" : "Copy Prompt"}
        </button>

        {prompt.example_output && (
          <a
            href={`/api/v1/prompts/${prompt.slug}/preview`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-xl border-2 border-yellow-300 bg-yellow-50 px-5 py-3 text-base font-semibold text-yellow-700 shadow-sm transition-all hover:border-yellow-400 hover:bg-yellow-100 hover:shadow-md active:scale-[0.98]"
          >
            <Sparkles className="h-5 w-5" />
            Preview UI
            <ExternalLink className="h-4 w-4" />
          </a>
        )}
      </div>

      {prompt.example_output && (
        <p className="text-xs text-muted-foreground -mt-4">
          * Preview is for reference only. Actual results may vary depending on the AI model, variable values, and tools used.
        </p>
      )}

      {/* ── Prompt Body ── */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Prompt Content
            {hasEnglish && (
              <span className="ml-2 text-xs font-normal normal-case">
                ({lang === "en" ? "English" : "Chinese"})
              </span>
            )}
          </h2>
          <span className="text-xs text-muted-foreground">{wordCount} words</span>
        </div>
        <div className="overflow-hidden rounded-xl border border-slate-800">
          <pre className="max-h-[600px] overflow-auto bg-[hsl(var(--code-block-bg))] p-5 text-sm leading-relaxed text-[hsl(var(--code-block-fg))]">
            <code className="whitespace-pre-wrap">
              {renderedBody.map((part, i) =>
                part.isVar ? (
                  <mark
                    key={i}
                    className="rounded bg-yellow-500/20 px-1 text-yellow-300"
                  >
                    {part.text}
                  </mark>
                ) : (
                  <span key={i}>{part.text}</span>
                )
              )}
            </code>
          </pre>
        </div>
      </div>

      {/* ── Variable Inputs ── */}
      {variables.length > 0 && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Variables
            </h2>
            <button
              onClick={handleReset}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <RotateCcw className="h-3 w-3" />
              Reset defaults
            </button>
          </div>
          <div className="rounded-xl border p-5">
            <div className="grid gap-5 sm:grid-cols-2">
              {variables.map((v) => (
                <div
                  key={v.id}
                  className={
                    v.input_type === "textarea" ? "sm:col-span-2" : ""
                  }
                >
                  <Label className="mb-1.5 block text-sm font-medium">
                    {v.label_en}
                  </Label>
                  {v.input_type === "textarea" ? (
                    <Textarea
                      value={values[v.key] || ""}
                      onChange={(e) => updateValue(v.key, e.target.value)}
                      className="bg-[hsl(var(--var-input-bg))] border-[hsl(var(--var-input-border))] focus-visible:ring-[hsl(var(--var-input-focus))]"
                      rows={3}
                    />
                  ) : v.input_type === "number" ? (
                    <Input
                      type="number"
                      value={values[v.key] || ""}
                      onChange={(e) => updateValue(v.key, e.target.value)}
                      className="bg-[hsl(var(--var-input-bg))] border-[hsl(var(--var-input-border))] focus-visible:ring-[hsl(var(--var-input-focus))]"
                    />
                  ) : (
                    <Input
                      value={values[v.key] || ""}
                      onChange={(e) => updateValue(v.key, e.target.value)}
                      className="bg-[hsl(var(--var-input-bg))] border-[hsl(var(--var-input-border))] focus-visible:ring-[hsl(var(--var-input-focus))]"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
