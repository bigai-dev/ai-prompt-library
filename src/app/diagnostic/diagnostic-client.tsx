"use client";

import { useState } from "react";
import { Intake } from "@/components/diagnostic/intake";
import { Pains } from "@/components/diagnostic/pains";
import { Result } from "@/components/diagnostic/result";
import type { DeptKey, IndustryKey } from "@/types/diagnostic";

type Step = 1 | 2 | 3;

export function DiagnosticClient() {
  const [step, setStep] = useState<Step>(1);
  const [industry, setIndustry] = useState<IndustryKey>("general");
  const [industryCustom, setIndustryCustom] = useState("");
  const [company, setCompany] = useState("");
  const [selectedDepts, setSelectedDepts] = useState<Set<DeptKey>>(new Set());
  const [selectedPains, setSelectedPains] = useState<
    Record<DeptKey, Set<string>>
  >({} as Record<DeptKey, Set<string>>);
  const [customPains, setCustomPains] = useState<Record<DeptKey, string[]>>(
    {} as Record<DeptKey, string[]>,
  );

  const toggleDept = (key: DeptKey) => {
    const next = new Set(selectedDepts);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setSelectedDepts(next);
  };

  const togglePain = (dept: DeptKey, pain: string) => {
    const current = selectedPains[dept] ?? new Set<string>();
    const next = new Set(current);
    if (next.has(pain)) next.delete(pain);
    else next.add(pain);
    setSelectedPains({ ...selectedPains, [dept]: next });
  };

  const addCustom = (dept: DeptKey, pain: string) => {
    const customs = [...(customPains[dept] ?? []), pain];
    const sel = new Set(selectedPains[dept] ?? new Set<string>());
    sel.add(pain);
    setCustomPains({ ...customPains, [dept]: customs });
    setSelectedPains({ ...selectedPains, [dept]: sel });
  };

  const removeCustom = (dept: DeptKey, idx: number) => {
    const list = [...(customPains[dept] ?? [])];
    const val = list[idx];
    if (!val) return;
    list[idx] = "";
    const sel = new Set(selectedPains[dept] ?? new Set<string>());
    sel.delete(val);
    setCustomPains({ ...customPains, [dept]: list });
    setSelectedPains({ ...selectedPains, [dept]: sel });
  };

  const goStep = (n: Step) => {
    setStep(n);
    if (typeof window !== "undefined") window.scrollTo(0, 0);
  };

  const restart = () => {
    setSelectedDepts(new Set());
    setSelectedPains({} as Record<DeptKey, Set<string>>);
    setCustomPains({} as Record<DeptKey, string[]>);
    setIndustry("general");
    setIndustryCustom("");
    setCompany("");
    goStep(1);
  };

  return (
    <div className="py-10 px-4">
      {step === 1 && (
        <Intake
          industry={industry}
          industryCustom={industryCustom}
          company={company}
          selectedDepts={selectedDepts}
          onIndustry={setIndustry}
          onIndustryCustom={setIndustryCustom}
          onCompany={setCompany}
          onToggleDept={toggleDept}
          onNext={() => goStep(2)}
        />
      )}
      {step === 2 && (
        <Pains
          industry={industry}
          company={company}
          selectedDepts={selectedDepts}
          selectedPains={selectedPains}
          customPains={customPains}
          onTogglePain={togglePain}
          onAddCustom={addCustom}
          onRemoveCustom={removeCustom}
          onBack={() => goStep(1)}
          onNext={() => goStep(3)}
        />
      )}
      {step === 3 && (
        <Result
          industry={industry}
          industryCustom={industryCustom}
          company={company}
          selectedDepts={selectedDepts}
          selectedPains={selectedPains}
          onBack={() => goStep(2)}
          onRestart={restart}
        />
      )}
    </div>
  );
}
