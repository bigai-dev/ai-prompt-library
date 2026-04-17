"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Copy, Check, Clock, Star, Eye, RotateCcw, Sparkles, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { FavoriteButton } from "@/components/favorite-button";
import { toast } from "sonner";
import { getAnonId } from "@/lib/anon-id";
import type { PromptWithCategory, PromptVariable, Tag } from "@/types/database";
import { useTranslations } from "next-intl";
import type { Locale } from "@/i18n/routing";
import { localizedField, localizedBody, localizedDefaultValue } from "@/i18n/utils";

interface Props {
  prompt: PromptWithCategory;
  variables: PromptVariable[];
  tags: Tag[];
  locale: Locale;
}

export function PromptDetailClient({ prompt, variables, tags, locale }: Props) {
  const t = useTranslations("prompt");
  const [values, setValues] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);
  const [viewLogged, setViewLogged] = useState(false);

  // Pick body and title based on global locale
  const activeBody = useMemo(() => localizedBody(prompt, locale), [prompt, locale]);
  const promptTitle = useMemo(() => localizedField(prompt, "title", locale), [prompt, locale]);

  // Initialize / reset defaults when locale changes
  useEffect(() => {
    const defaults: Record<string, string> = {};
    variables.forEach((v) => {
      defaults[v.key] = localizedDefaultValue(v, locale);
    });
    setValues(defaults);
  }, [variables, locale]);

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
    toast.success(t("copied"));

    fetch(`/api/v1/prompts/${prompt.id}/copy`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ anon_id: getAnonId() }),
    }).catch(() => {});

    setTimeout(() => setCopied(false), 2000);
  }, [substitutedBody, prompt.id, t]);

  const handleReset = useCallback(() => {
    const defaults: Record<string, string> = {};
    variables.forEach((v) => {
      defaults[v.key] = localizedDefaultValue(v, locale);
    });
    setValues(defaults);
  }, [variables, locale]);

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
            {promptTitle}
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
            {t("minutes", { count: prompt.estimated_minutes })}
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
          {copied ? t("copied") : t("copyButton")}
        </button>

        {prompt.example_output && (
          <a
            href={`/api/v1/prompts/${prompt.slug}/preview`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-xl border-2 border-yellow-300 bg-yellow-50 px-5 py-3 text-base font-semibold text-yellow-700 shadow-sm transition-all hover:border-yellow-400 hover:bg-yellow-100 hover:shadow-md active:scale-[0.98]"
          >
            <Sparkles className="h-5 w-5" />
            {t("previewTitle")}
            <ExternalLink className="h-4 w-4" />
          </a>
        )}
      </div>

      {/* ── Prompt Body ── */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            {t("promptBodyTitle")}
          </h2>
          <span className="text-xs text-muted-foreground">{t("wordCount", { count: wordCount })}</span>
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
              {t("variablesTitle")}
            </h2>
            <button
              onClick={handleReset}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <RotateCcw className="h-3 w-3" />
              {t("resetButton")}
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
                    {localizedField(v as unknown as Record<string, unknown>, "label", locale)}
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
