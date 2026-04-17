export type DeptKey =
  | "sales"
  | "market"
  | "service"
  | "ops"
  | "stock"
  | "finance"
  | "hr"
  | "mgmt";

export type IndustryKey =
  | "general"
  | "fnb"
  | "retail"
  | "education"
  | "healthcare"
  | "professional"
  | "manufacturing"
  | "realestate"
  | "other";

export type SolutionType = "ai" | "light" | "full";

export interface Department {
  key: DeptKey;
  name: string;
  fill: string;
  stroke: string;
  text: string;
  pains: string[];
}

export interface Solution {
  name: string;
  type: SolutionType;
  tool: string;
  desc: string;
  outcome: string;     // "每月省 8 小时" — what the user gets
  impact: number;      // 1-10 (how valuable)
  effort: number;      // 1-10 (how hard; lower = easier)
  hoursSavedPerMonth: number; // rough estimate for totals
  tags: string[];      // keywords for matching custom-typed pains
}

export interface AppState {
  industry: IndustryKey;
  industryCustom: string;
  company: string;
  selectedDepts: Set<DeptKey>;
  selectedPains: Record<DeptKey, Set<string>>;
  customPains: Record<DeptKey, string[]>;
}
