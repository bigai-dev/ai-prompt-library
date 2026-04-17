import { DEPTS, PAIN_SOLUTIONS, getPainsForDept } from "./diagnostic-data";
import type { DeptKey, IndustryKey, Solution } from "@/types/diagnostic";

const FALLBACK: Solution = {
  name: "自动化工具",
  type: "light",
  tool: "Claude Code 小工具",
  desc: "用 Vibe Coding 做一个小工具来解决这个问题",
  outcome: "根据具体情况，可能每月省 5–10 小时",
  impact: 5,
  effort: 4,
  hoursSavedPerMonth: 6,
  tags: [],
};

/**
 * Score how well a custom-typed pain string matches a solution's tags.
 * Counts how many tag keywords appear in the pain text.
 */
function scoreMatch(pain: string, sol: Solution): number {
  if (!sol.tags.length) return 0;
  const lower = pain.toLowerCase();
  let score = 0;
  for (const tag of sol.tags) {
    if (lower.includes(tag.toLowerCase())) score += 1;
  }
  return score;
}

/**
 * Find the best solution for a pain.
 * - If the pain is one of the canned pains (index match), use the mapped solution.
 * - If the pain is custom-typed, do keyword matching against all solutions in the dept.
 * - Fall back to the dept's first solution if nothing matches.
 */
export function getSolutionForPain(
  industry: IndustryKey,
  dept: DeptKey,
  pain: string,
): Solution {
  const deptPains = getPainsForDept(industry, dept);
  const solList = PAIN_SOLUTIONS[dept] ?? [];
  const idx = deptPains.indexOf(pain);

  // Canned pain — use index mapping
  if (idx >= 0 && solList[idx]) return solList[idx];

  // Custom pain — keyword match against dept solutions
  if (solList.length > 0) {
    let best: Solution | null = null;
    let bestScore = 0;
    for (const sol of solList) {
      const s = scoreMatch(pain, sol);
      if (s > bestScore) {
        bestScore = s;
        best = sol;
      }
    }
    if (best) return best;
  }

  return solList[0] ?? FALLBACK;
}

/**
 * Priority score — higher = do this first.
 * Rewards high impact and low effort (cheap quick wins).
 */
export function priorityScore(sol: Solution): number {
  return sol.impact * 10 - sol.effort * 3;
}

/**
 * Given a dept's selected pains, return [{pain, solution}] sorted by priority.
 * De-dupes solutions that appear multiple times (same solution for different pains).
 */
export function rankedSolutionsForDept(
  industry: IndustryKey,
  dept: DeptKey,
  pains: string[],
): Array<{ pain: string; solution: Solution; priority: number }> {
  const entries = pains.map((pain) => {
    const solution = getSolutionForPain(industry, dept, pain);
    return { pain, solution, priority: priorityScore(solution) };
  });

  // Sort high → low priority; stable by original pain order for ties.
  return entries.sort((a, b) => b.priority - a.priority);
}

export function buildDeptPrompt({
  dept,
  pains,
  industry,
  company,
  industryLabel,
}: {
  dept: DeptKey;
  pains: string[];
  industry: IndustryKey;
  company: string;
  industryLabel: string;
}): string {
  const d = DEPTS[dept];
  const painLines = pains.map((p) => `- ${p}`).join("\n");
  const sols = pains.map((p) => getSolutionForPain(industry, dept, p));
  const isAllAI = sols.every((s) => s.type === "ai");
  const solNames = sols.map((s) => s.name).join("、");
  const co = company.trim() || "我的公司";
  const ind = industryLabel || "中小企业";

  if (isAllAI) {
    return `我的${d.name}有这些问题：
${painLines}

公司：${co}，行业：${ind}

请帮我：
1. 每个问题给我一个马上可以用的做法
2. 给我一个可以直接复制使用的 Claude 指令
3. 步骤要简单，不用写代码`;
  }

  return `帮我用 Claude Code 做${d.name}的自动化工具（${solNames}）。

公司：${co}，行业：${ind}

要解决的问题：
${painLines}

技术要求：
- 用简单的 HTML/CSS/JS + Node.js，不要用复杂框架
- 要存数据就用 Supabase
- 电脑上可以跑，之后可以放上 Vercel

请先告诉我大概怎么做，我同意后再一步一步写代码。`;
}

export const STEPS = [
  {
    main: "第一步：先解决最烦的问题",
    sub: "下面的方案已经按 '先做这个最划算' 排好了。从第一个开始，不要一次全部做",
  },
  {
    main: "第二步：复制指令给 Claude",
    sub: "把下面的指令发给 Claude，它会问你几个问题，然后帮你做出来",
  },
  {
    main: "第三步：用一个星期，看有没有用",
    sub: "先自己或几个人试用，确认有用了再给全公司用",
  },
  {
    main: "第四步：再做下一个工具",
    sub: "第一个做成功了，再按方案做下一个",
  },
];
