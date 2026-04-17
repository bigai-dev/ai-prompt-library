"use client";

import { useMemo, useState } from "react";
import {
  DEPTS,
  IND_LABELS,
  SOL_TYPE_LABEL,
  SOL_TYPE_STYLE,
} from "@/lib/diagnostic-data";
import {
  STEPS,
  buildDeptPrompt,
  rankedSolutionsForDept,
} from "@/lib/diagnostic-prompts";
import type { DeptKey, IndustryKey } from "@/types/diagnostic";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Copy, Check, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";

export function Result({
  industry,
  industryCustom,
  company,
  selectedDepts,
  selectedPains,
  onBack,
  onRestart,
}: {
  industry: IndustryKey;
  industryCustom: string;
  company: string;
  selectedDepts: Set<DeptKey>;
  selectedPains: Record<DeptKey, Set<string>>;
  onBack: () => void;
  onRestart: () => void;
}) {
  const t = useTranslations("diagnostic");
  const [openDepts, setOpenDepts] = useState<Set<DeptKey>>(new Set());
  const [copied, setCopied] = useState<string | null>(null);

  const industryLabel =
    industry === "other"
      ? industryCustom.trim()
      : IND_LABELS[industry] || "";
  const displayCompany = company.trim() || t("yourCompany");

  const rankedDepts = useMemo(() => {
    const entries = [...selectedDepts]
      .filter((k) => (selectedPains[k]?.size ?? 0) > 0)
      .map((key) => {
        const pains = [...(selectedPains[key] ?? [])];
        const ranked = rankedSolutionsForDept(industry, key, pains);
        const topPriority = ranked[0]?.priority ?? 0;
        return { key, pains, ranked, topPriority };
      });
    entries.sort((a, b) => b.topPriority - a.topPriority);
    return entries;
  }, [selectedDepts, selectedPains, industry]);

  const totalProblems = rankedDepts.reduce(
    (sum, d) => sum + d.pains.length,
    0,
  );

  const totalHoursSaved = useMemo(() => {
    const seen = new Set<string>();
    let total = 0;
    for (const dept of rankedDepts) {
      for (const { solution } of dept.ranked) {
        const id = `${dept.key}:${solution.name}`;
        if (seen.has(id)) continue;
        seen.add(id);
        total += solution.hoursSavedPerMonth;
      }
    }
    return total;
  }, [rankedDepts]);

  const topPicks = useMemo(() => {
    const all = rankedDepts.flatMap((dept) =>
      dept.ranked.map((r) => ({ deptKey: dept.key, ...r })),
    );
    const seen = new Set<string>();
    const unique = [];
    for (const item of all.sort((a, b) => b.priority - a.priority)) {
      if (seen.has(item.solution.name)) continue;
      seen.add(item.solution.name);
      unique.push(item);
      if (unique.length === 3) break;
    }
    return unique;
  }, [rankedDepts]);

  const toggleDept = (k: DeptKey) => {
    const next = new Set(openDepts);
    if (next.has(k)) next.delete(k);
    else next.add(k);
    setOpenDepts(next);
  };

  const copyPrompt = async (id: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2200);
  };

  return (
    <div className="max-w-[900px] mx-auto">
      {/* HERO */}
      <div className="mb-7">
        <div className="flex items-center gap-3 mb-4">
          <Button variant="ghost" size="sm" onClick={onBack} className="gap-1">
            <ArrowLeft className="h-4 w-4" />
            {t("backButtonEdit")}
          </Button>
        </div>
        <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-[20px] mb-3.5 uppercase tracking-wider">
          ✓ {t("resultBadge")}
        </div>
        <div className="text-[clamp(24px,2.8vw,36px)] font-bold leading-[1.15] mb-2.5">
          {displayCompany} · {t("resultTitle")}
        </div>
        <div className="text-sm text-muted-foreground leading-[1.7]">
          {t("resultSubtitle", { count: totalProblems })}
        </div>
      </div>

      {/* SAVINGS SUMMARY */}
      <div className="mb-7 bg-gradient-to-br from-yellow-50 to-white border border-yellow-200 rounded-xl p-5 sm:p-6 shadow-sm">
        <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
          <div>
            <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-1">
              {t("savingsLabel")}
            </div>
            <div className="text-[44px] sm:text-[54px] font-bold leading-none text-yellow-600">
              {totalHoursSaved}
              <span className="text-[20px] sm:text-[22px] text-muted-foreground ml-2 font-normal">
                {t("savingsUnit")}
              </span>
            </div>
          </div>
          <div className="text-xs text-muted-foreground leading-[1.6] max-w-[360px]">
            {t("savingsExplain1")}
            <br />
            <span className="text-muted-foreground/70">
              {t("savingsDisclaimer")}
            </span>
          </div>
        </div>
      </div>

      {/* TOP PICKS */}
      {topPicks.length > 0 && (
        <div className="mb-9">
          <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-3">
            ★ {t("topPicksLabel", { count: topPicks.length })}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {topPicks.map((pick, i) => {
              const style = SOL_TYPE_STYLE[pick.solution.type];
              const d = DEPTS[pick.deptKey];
              return (
                <div
                  key={`${pick.deptKey}-${pick.solution.name}`}
                  className="bg-white border border-yellow-200 rounded-xl p-4 shadow-sm flex flex-col"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[20px] font-bold text-yellow-600 leading-none">
                      {i + 1}
                    </span>
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-[20px] border"
                      style={{
                        background: d.fill,
                        color: d.text,
                        borderColor: `${d.stroke}50`,
                      }}
                    >
                      {d.name}
                    </span>
                  </div>
                  <div className="text-sm font-semibold mb-1.5">
                    {pick.solution.name}
                  </div>
                  <div className="text-xs text-emerald-700 font-medium mb-2 leading-[1.5]">
                    → {pick.solution.outcome}
                  </div>
                  <span
                    className="text-[10px] font-semibold px-2 py-1 rounded-md border w-fit mt-auto"
                    style={{
                      background: style.bg,
                      color: style.text,
                      borderColor: style.border,
                    }}
                  >
                    {SOL_TYPE_LABEL[pick.solution.type]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* PER-DEPT ACCORDIONS */}
      <div className="mb-9">
        <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-3">
          {t("fullPlanLabel")}
        </div>

        <div className="flex flex-col gap-3">
          {rankedDepts.map(({ key, pains, ranked }) => {
            const d = DEPTS[key];
            const isOpen = openDepts.has(key);
            const prompt = buildDeptPrompt({
              dept: key,
              pains,
              industry,
              company,
              industryLabel,
            });
            const promptId = `prompt-${key}`;
            const deptHoursSaved = ranked.reduce(
              (sum, r) => sum + r.solution.hoursSavedPerMonth,
              0,
            );

            return (
              <div
                key={key}
                className="bg-white border rounded-xl overflow-hidden shadow-sm"
              >
                <button
                  onClick={() => toggleDept(key)}
                  className="w-full flex items-center gap-3 px-[18px] py-3.5 text-left hover:bg-slate-50 transition-colors"
                >
                  <ChevronRight
                    className={`h-3.5 w-3.5 transition-transform ${
                      isOpen ? "rotate-90" : ""
                    }`}
                  />
                  <span
                    className="text-[11px] font-bold px-2.5 py-1 rounded-[20px] border"
                    style={{
                      background: d.fill,
                      color: d.text,
                      borderColor: `${d.stroke}50`,
                    }}
                  >
                    {d.name}
                  </span>
                  <span className="text-xs text-muted-foreground flex-1 truncate">
                    {t("deptSummary", {
                      pains: pains.length,
                      hours: deptHoursSaved,
                    })}
                  </span>
                  <span className="text-xs font-medium text-muted-foreground">
                    {isOpen ? t("collapse") : t("expand")}
                  </span>
                </button>

                {isOpen && (
                  <div className="border-t bg-slate-50">
                    <div className="p-[18px] flex flex-col gap-3">
                      {ranked.map(({ pain, solution: sol }, rIdx) => {
                        const style = SOL_TYPE_STYLE[sol.type];
                        const isFirst = rIdx === 0;
                        return (
                          <div
                            key={pain}
                            className={`bg-white rounded-lg p-3.5 border flex gap-3 ${
                              isFirst ? "border-yellow-400 shadow-sm" : "border-input"
                            }`}
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                {isFirst && (
                                  <span className="text-[10px] font-bold text-yellow-700 bg-yellow-50 border border-yellow-200 px-1.5 py-0.5 rounded-md">
                                    ★ {t("startHereBadge")}
                                  </span>
                                )}
                                <div className="text-sm font-semibold">
                                  {sol.name}
                                </div>
                              </div>
                              <div className="text-xs text-muted-foreground mb-1.5">
                                {t("forPainLabel")}{pain}
                              </div>
                              <div className="text-[13px] text-muted-foreground leading-[1.6] mb-1.5">
                                {sol.desc}
                              </div>
                              <div className="text-[12px] text-emerald-700 font-semibold leading-[1.5]">
                                → {sol.outcome}
                              </div>
                            </div>
                            <span
                              className="text-[10px] font-semibold px-2 py-1 rounded-md h-fit whitespace-nowrap border"
                              style={{
                                background: style.bg,
                                color: style.text,
                                borderColor: style.border,
                              }}
                            >
                              {SOL_TYPE_LABEL[sol.type]}
                            </span>
                          </div>
                        );
                      })}

                      <div className="mt-2">
                        <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-2">
                          {t("promptToClaudeLabel")}
                        </div>
                        <div className="bg-slate-900 rounded-lg overflow-hidden">
                          <div className="flex items-center gap-2 px-3.5 py-2.5 border-b border-white/10">
                            <div className="flex gap-1.5">
                              <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
                              <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
                              <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
                            </div>
                            <span className="text-[11px] text-slate-400 font-mono">
                              {key}-prompt.txt
                            </span>
                            <button
                              onClick={() => copyPrompt(promptId, prompt)}
                              className="ml-auto flex items-center gap-1 text-[11px] text-white/70 hover:text-white transition-colors font-medium"
                            >
                              {copied === promptId ? (
                                <>
                                  <Check className="h-3 w-3" />
                                  {t("copiedLabel")}
                                </>
                              ) : (
                                <>
                                  <Copy className="h-3 w-3" />
                                  {t("copyLabel")}
                                </>
                              )}
                            </button>
                          </div>
                          <pre className="p-3.5 text-[12.5px] text-white/90 font-mono leading-[1.65] whitespace-pre-wrap">
                            {prompt}
                          </pre>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="mb-9">
        <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-3">
          {t("stepsLabel")}
        </div>
        <div className="flex flex-col gap-2.5">
          {STEPS.map((s, i) => (
            <div
              key={i}
              className="flex gap-3.5 p-4 bg-white rounded-xl border shadow-sm"
            >
              <div className="text-[22px] font-bold text-yellow-500 leading-none min-w-[32px]">
                {String(i + 1).padStart(2, "0")}
              </div>
              <div>
                <div className="text-sm font-semibold mb-0.5">{s.main}</div>
                <div className="text-xs text-muted-foreground leading-[1.6]">
                  {s.sub}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={onRestart}
        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        ← {t("restartButton")}
      </button>
    </div>
  );
}
