"use client";

import { DEPTS, DEPT_ORDER } from "@/lib/diagnostic-data";
import type { DeptKey } from "@/types/diagnostic";

interface NodePos {
  x: number;
  y: number;
  checkCx: number;
  checkCy: number;
}

const NODE_POSITIONS: Record<DeptKey, NodePos> = {
  sales:   { x: 8,   y: 88,  checkCx: 104, checkCy: 92 },
  market:  { x: 116, y: 44,  checkCx: 212, checkCy: 48 },
  service: { x: 280, y: 44,  checkCx: 376, checkCy: 48 },
  ops:     { x: 388, y: 88,  checkCx: 484, checkCy: 92 },
  stock:   { x: 8,   y: 292, checkCx: 104, checkCy: 296 },
  finance: { x: 116, y: 336, checkCx: 212, checkCy: 340 },
  hr:      { x: 280, y: 336, checkCx: 376, checkCy: 340 },
  mgmt:    { x: 388, y: 292, checkCx: 484, checkCy: 296 },
};

interface MindMapProps {
  company: string;
  industryLabel: string;
  selected: Set<DeptKey>;
  onToggle: (key: DeptKey) => void;
  centerCompanyLine: string;
  centerSubLineEmpty: string;
  centerSubLineCount: (count: number) => string;
}

export function MindMap({
  company,
  industryLabel,
  selected,
  onToggle,
  centerCompanyLine,
  centerSubLineEmpty,
  centerSubLineCount,
}: MindMapProps) {
  const companyLine = company || industryLabel || centerCompanyLine;
  const subLine =
    selected.size > 0 ? centerSubLineCount(selected.size) : centerSubLineEmpty;

  return (
    <svg viewBox="0 0 500 420" className="w-full block overflow-visible">
      <g stroke="#d0cfc8" strokeWidth="1.5" strokeDasharray="5 4" fill="none">
        <line x1="250" y1="186" x2="60" y2="108" />
        <line x1="250" y1="186" x2="168" y2="64" />
        <line x1="250" y1="186" x2="332" y2="64" />
        <line x1="250" y1="186" x2="440" y2="108" />
        <line x1="250" y1="212" x2="60" y2="312" />
        <line x1="250" y1="212" x2="168" y2="356" />
        <line x1="250" y1="212" x2="332" y2="356" />
        <line x1="250" y1="212" x2="440" y2="312" />
      </g>
      <rect
        x="172"
        y="176"
        width="156"
        height="48"
        rx="12"
        fill="#0F172A"
        stroke="#FCD34D"
        strokeWidth="1.5"
      />
      <text
        x="250"
        y="195"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="14"
        fontWeight="600"
        fill="#ffffff"
      >
        {companyLine}
      </text>
      <text
        x="250"
        y="213"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="10"
        fill="#94a3b8"
      >
        {subLine}
      </text>

      {DEPT_ORDER.map((key) => {
        const d = DEPTS[key];
        const pos = NODE_POSITIONS[key];
        const isSelected = selected.has(key);
        return (
          <g
            key={key}
            className="cursor-pointer"
            onClick={() => onToggle(key)}
            style={{ opacity: isSelected ? 1 : 0.42 }}
          >
            <rect
              x={pos.x}
              y={pos.y}
              width="104"
              height="40"
              rx="8"
              fill={d.fill}
              stroke={d.stroke}
              strokeWidth="2"
              style={{
                filter: isSelected
                  ? "drop-shadow(0 2px 6px rgba(0,0,0,0.18))"
                  : undefined,
                transition: "filter 0.15s, opacity 0.15s",
              }}
            />
            <text
              x={pos.x + 52}
              y={pos.y + 20}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize="12"
              fontWeight="600"
              fill={d.text}
              style={{ pointerEvents: "none" }}
            >
              {d.name}
            </text>
            <circle
              cx={pos.checkCx}
              cy={pos.checkCy}
              r="7"
              fill={d.stroke}
              style={{ opacity: isSelected ? 1 : 0, pointerEvents: "none" }}
            />
            <text
              x={pos.checkCx}
              y={pos.checkCy}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize="9"
              fill="#fff"
              fontWeight="700"
              style={{ opacity: isSelected ? 1 : 0, pointerEvents: "none" }}
            >
              ✓
            </text>
          </g>
        );
      })}
    </svg>
  );
}
