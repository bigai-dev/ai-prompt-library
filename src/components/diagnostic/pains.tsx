"use client";

import { useState } from "react";
import { DEPTS, getPainsForDept } from "@/lib/diagnostic-data";
import type { DeptKey, IndustryKey } from "@/types/diagnostic";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";

export function Pains({
  industry,
  company,
  selectedDepts,
  selectedPains,
  customPains,
  onTogglePain,
  onAddCustom,
  onRemoveCustom,
  onBack,
  onNext,
}: {
  industry: IndustryKey;
  company: string;
  selectedDepts: Set<DeptKey>;
  selectedPains: Record<DeptKey, Set<string>>;
  customPains: Record<DeptKey, string[]>;
  onTogglePain: (dept: DeptKey, pain: string) => void;
  onAddCustom: (dept: DeptKey, pain: string) => void;
  onRemoveCustom: (dept: DeptKey, idx: number) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const t = useTranslations("diagnostic");
  const [customDrafts, setCustomDrafts] = useState<Record<string, string>>({});
  const total = [...selectedDepts].reduce(
    (sum, k) => sum + (selectedPains[k]?.size ?? 0),
    0,
  );

  const displayCompany = company.trim() || t("yourCompany");

  return (
    <div className="max-w-[860px] mx-auto">
      <div className="mb-9">
        <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-yellow-700 bg-yellow-50 border border-yellow-200 px-3 py-1 rounded-[20px] mb-3.5 uppercase tracking-wider">
          {t("step2Badge")}
        </div>
        <div className="text-[clamp(24px,2.8vw,36px)] font-bold leading-[1.15] mb-2.5">
          {displayCompany} · {t("step2Title")}
        </div>
        <div className="text-sm text-muted-foreground leading-[1.7]">
          {t("step2Subtitle1")}
          <br />
          {t("step2Subtitle2")}
        </div>
      </div>

      <div className="flex flex-col gap-5 mb-7">
        {[...selectedDepts].map((key) => {
          const d = DEPTS[key];
          const pains = getPainsForDept(industry, key);
          const sel = selectedPains[key] ?? new Set<string>();
          const customs = customPains[key] ?? [];
          const draft = customDrafts[key] ?? "";

          return (
            <div
              key={key}
              className="bg-white border rounded-xl overflow-hidden shadow-sm"
            >
              <div className="flex items-center gap-2.5 px-[18px] py-3.5 border-b">
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
                <span className="text-xs text-muted-foreground ml-auto">
                  {t("tapToSelect")}
                </span>
              </div>

              <div className="p-[18px] flex flex-col gap-2.5">
                {pains.map((pain) => {
                  const selected = sel.has(pain);
                  return (
                    <div
                      key={pain}
                      onClick={() => onTogglePain(key, pain)}
                      className={`flex items-center gap-3 px-3.5 py-3 rounded-lg border cursor-pointer transition-all ${
                        selected
                          ? "border-yellow-400 bg-yellow-50"
                          : "border-input bg-white hover:border-slate-300"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-md border flex items-center justify-center text-[11px] font-bold transition-colors ${
                          selected
                            ? "bg-yellow-400 border-yellow-400 text-slate-900"
                            : "border-input text-transparent"
                        }`}
                      >
                        ✓
                      </div>
                      <div className="text-sm">{pain}</div>
                    </div>
                  );
                })}
              </div>

              <div className="px-[18px] pb-[18px]">
                <div className="text-xs text-muted-foreground mb-2">
                  ＋ {t("customPainPrompt")}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={draft}
                    onChange={(e) =>
                      setCustomDrafts({
                        ...customDrafts,
                        [key]: e.target.value,
                      })
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && draft.trim()) {
                        onAddCustom(key, draft.trim());
                        setCustomDrafts({ ...customDrafts, [key]: "" });
                      }
                    }}
                    maxLength={80}
                    placeholder={t("customPainPlaceholder")}
                    className="flex-1 h-10"
                  />
                  <Button
                    onClick={() => {
                      if (draft.trim()) {
                        onAddCustom(key, draft.trim());
                        setCustomDrafts({ ...customDrafts, [key]: "" });
                      }
                    }}
                    className="h-10 bg-slate-900 text-white hover:bg-slate-800"
                  >
                    {t("customPainAddButton")}
                  </Button>
                </div>
                {customs.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {customs.map((c, i) =>
                      c ? (
                        <div
                          key={i}
                          className="flex items-center gap-1.5 text-xs bg-yellow-50 border border-yellow-200 px-2.5 py-1 rounded-[20px]"
                        >
                          <span>{c}</span>
                          <span
                            className="text-muted-foreground cursor-pointer hover:text-foreground"
                            onClick={() => onRemoveCustom(key, i)}
                          >
                            ×
                          </span>
                        </div>
                      ) : null,
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={onBack}
            className="gap-1"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("backButton")}
          </Button>
          <div className="text-sm text-muted-foreground">
            {t("confirmedPainsCount", { count: total })}
          </div>
        </div>
        <Button
          disabled={total === 0}
          onClick={onNext}
          className="h-auto py-3.5 px-7 text-sm font-semibold tracking-wide bg-slate-900 text-white hover:bg-slate-800 gap-3"
        >
          <span>{t("nextButtonPains")}</span>
          <ArrowRight className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
