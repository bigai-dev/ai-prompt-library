"use client";

import { DEPTS, INDUSTRY_OPTIONS, IND_LABELS } from "@/lib/diagnostic-data";
import type { DeptKey, IndustryKey } from "@/types/diagnostic";
import { MindMap } from "./mind-map";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";

export function Intake({
  industry,
  industryCustom,
  company,
  selectedDepts,
  onIndustry,
  onIndustryCustom,
  onCompany,
  onToggleDept,
  onNext,
}: {
  industry: IndustryKey;
  industryCustom: string;
  company: string;
  selectedDepts: Set<DeptKey>;
  onIndustry: (v: IndustryKey) => void;
  onIndustryCustom: (v: string) => void;
  onCompany: (v: string) => void;
  onToggleDept: (k: DeptKey) => void;
  onNext: () => void;
}) {
  const t = useTranslations("diagnostic");
  const industryLabel =
    industry === "other"
      ? industryCustom.trim()
      : IND_LABELS[industry] || "";

  return (
    <div className="max-w-[860px] mx-auto flex flex-col gap-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-[11px] font-bold text-muted-foreground tracking-wider uppercase">
            {t("industryLabel")}
          </Label>
          <select
            value={industry}
            onChange={(e) => onIndustry(e.target.value as IndustryKey)}
            className="w-full h-10 text-sm px-3 py-2 border border-input rounded-lg bg-white outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 transition-colors"
          >
            {INDUSTRY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {industry === "other" && (
            <Input
              type="text"
              value={industryCustom}
              onChange={(e) => onIndustryCustom(e.target.value)}
              placeholder={t("industryCustomPlaceholder")}
              className="mt-2"
            />
          )}
        </div>
        <div className="space-y-1.5">
          <Label className="text-[11px] font-bold text-muted-foreground tracking-wider uppercase">
            {t("companyLabel")}
          </Label>
          <Input
            type="text"
            value={company}
            onChange={(e) => onCompany(e.target.value)}
            placeholder={t("companyPlaceholder")}
            className="h-10"
          />
        </div>
      </div>

      <div className="flex flex-col">
        <div className="text-[13px] font-semibold text-muted-foreground mb-4">
          {t("departmentPrompt")}
        </div>
        <MindMap
          company={company}
          industryLabel={industryLabel}
          selected={selectedDepts}
          onToggle={onToggleDept}
          centerCompanyLine={t("mindMapPlaceholder")}
          centerSubLineEmpty={t("mindMapSubEmpty")}
          centerSubLineCount={(count) => t("mindMapSubCount", { count })}
        />
        <div className="mt-5 flex flex-col gap-2.5">
          <div className="flex items-baseline gap-1.5">
            <span className="text-[30px] font-bold text-yellow-500 leading-none">
              {selectedDepts.size}
            </span>
            <span className="text-[13px] text-muted-foreground">
              {t("departmentSelectedSuffix")}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5 min-h-[22px]">
            {[...selectedDepts].map((key) => {
              const d = DEPTS[key];
              return (
                <span
                  key={key}
                  className="text-[11px] font-medium px-2.5 py-0.5 rounded-[20px]"
                  style={{ background: d.fill, color: d.text }}
                >
                  {d.name}
                </span>
              );
            })}
          </div>
          <Button
            disabled={selectedDepts.size === 0}
            onClick={onNext}
            className="w-full h-auto py-3.5 px-5 text-sm font-semibold tracking-wide bg-slate-900 text-white hover:bg-slate-800"
          >
            <span className="flex-1 text-left">{t("nextButtonIntake")}</span>
            <ArrowRight className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
