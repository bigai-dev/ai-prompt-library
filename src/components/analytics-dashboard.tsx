"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Eye, Copy, Heart, TrendingUp, RefreshCw } from "lucide-react";

interface AnalyticsData {
  totals: { views: number; copies: number; favorites: number };
  topPrompts: {
    id: string;
    title_en: string;
    slug: string;
    times_copied: number;
    times_viewed: number;
    category: { name_en: string } | null;
  }[];
  dailyTrend: { date: string; count: number }[];
  categoryDistribution: { name: string; count: number }[];
}

const kpiConfig = [
  {
    key: "views" as const,
    label: "Total Views",
    icon: Eye,
    bg: "bg-accent",
    fg: "text-primary-foreground",
  },
  {
    key: "copies" as const,
    label: "Total Copies",
    icon: Copy,
    bg: "bg-secondary",
    fg: "text-secondary-foreground",
  },
  {
    key: "favorites" as const,
    label: "Total Favorites",
    icon: Heart,
    bg: "bg-destructive/10",
    fg: "text-destructive",
  },
];

export function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchData = () => {
    setLoading(true);
    setError(false);
    fetch("/api/v1/admin/analytics/overview")
      .then((r) => r.json())
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div>
        <h1 className="mb-6 text-2xl font-bold">Analytics</h1>
        <div className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="flex items-center gap-4 p-5">
                <Skeleton className="h-12 w-12 rounded-xl" />
                <div className="space-y-2">
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div>
        <h1 className="mb-6 text-2xl font-bold">Analytics</h1>
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12">
            <p className="text-muted-foreground">Unable to load analytics data</p>
            <Button variant="outline" size="sm" onClick={fetchData}>
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fill in missing days so we always show 30 bars
  const filledTrend = (() => {
    const map = new Map(data.dailyTrend.map((d) => [d.date, d.count]));
    const days: { date: string; count: number }[] = [];
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      days.push({ date: key, count: map.get(key) || 0 });
    }
    return days;
  })();

  const maxCopies = Math.max(...filledTrend.map((d) => d.count), 1);

  // Y-axis tick values (4 ticks including 0)
  const yTicks = (() => {
    const step = Math.ceil(maxCopies / 3);
    return [step * 3, step * 2, step, 0];
  })();
  const yMax = yTicks[0] || 1;

  // X-axis: show ~5 date labels evenly spread
  const xLabelIndices = [0, 7, 14, 21, 29].filter((i) => i < filledTrend.length);

  const totalCopies30d = filledTrend.reduce((s, d) => s + d.count, 0);

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">Analytics</h1>
      <p className="mb-6 text-sm text-muted-foreground">Last 30 days</p>

      {/* KPI Cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        {kpiConfig.map(({ key, label, icon: Icon, bg, fg }) => (
          <Card key={key}>
            <CardContent className="flex items-center gap-4 p-5">
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${bg}`}>
                <Icon className={`h-6 w-6 ${fg}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{data.totals[key].toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Daily Trend — full width */}
      <div className="mb-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="h-4 w-4" />
                Daily Copy Trend
              </CardTitle>
              <span className="text-xs text-muted-foreground">
                {totalCopies30d} total copies
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <TooltipProvider delay={0}>
              <div className="flex">
                {/* Y-axis labels */}
                <div className="flex w-8 shrink-0 flex-col justify-between pb-6 pr-2 text-right">
                  {yTicks.map((tick) => (
                    <span key={tick} className="text-[10px] leading-none text-muted-foreground">
                      {tick}
                    </span>
                  ))}
                </div>

                {/* Chart area */}
                <div className="flex-1">
                  {/* Gridlines + bars */}
                  <div className="relative h-44 border-b border-l border-border">
                    {/* Horizontal gridlines */}
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="absolute left-0 right-0 border-t border-dashed border-border/50"
                        style={{ bottom: `${(i / 3) * 100}%` }}
                      />
                    ))}

                    {/* Bars */}
                    <div className="relative z-10 flex h-full items-end gap-0.5 px-0.5">
                      {filledTrend.map((d, i) => {
                        const pct = d.count > 0 ? Math.max((d.count / yMax) * 100, 2) : 0;
                        const dateLabel = new Date(d.date + "T00:00:00").toLocaleDateString("en-MY", {
                          month: "short",
                          day: "numeric",
                        });
                        return (
                          <Tooltip key={d.date}>
                            <TooltipTrigger
                              className="flex-1 cursor-default rounded-t bg-primary/60 transition-all hover:bg-primary"
                              style={{ height: `${pct}%` }}
                              aria-label={`${dateLabel}: ${d.count} copies`}
                            />
                            <TooltipContent side="top">
                              <p className="font-medium">{dateLabel}</p>
                              <p className="text-background/70">{d.count} {d.count === 1 ? "copy" : "copies"}</p>
                            </TooltipContent>
                          </Tooltip>
                        );
                      })}
                    </div>
                  </div>

                  {/* X-axis labels */}
                  <div className="relative mt-1.5 flex h-4">
                    {xLabelIndices.map((i) => {
                      const d = filledTrend[i];
                      if (!d) return null;
                      const leftPct = ((i + 0.5) / filledTrend.length) * 100;
                      return (
                        <span
                          key={d.date}
                          className="absolute -translate-x-1/2 text-[10px] text-muted-foreground"
                          style={{ left: `${leftPct}%` }}
                        >
                          {new Date(d.date + "T00:00:00").toLocaleDateString("en-MY", {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            </TooltipProvider>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Category Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Category Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.categoryDistribution.map((cat) => {
                const total = data.categoryDistribution.reduce(
                  (s, c) => s + c.count,
                  0
                );
                const pct = total > 0 ? (cat.count / total) * 100 : 0;
                return (
                  <div key={cat.name}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span>{cat.name}</span>
                      <span className="text-muted-foreground">
                        {cat.count} ({pct.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
        {/* Top Prompts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top 10 Prompts</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">#</TableHead>
                  <TableHead>Prompt Name</TableHead>
                  <TableHead className="hidden sm:table-cell">Category</TableHead>
                  <TableHead className="text-right">Views</TableHead>
                  <TableHead className="text-right">Copies</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.topPrompts.map((p, i) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium text-muted-foreground">{i + 1}</TableCell>
                    <TableCell className="font-medium">{p.title_en}</TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground">
                      {p.category?.name_en}
                    </TableCell>
                    <TableCell className="text-right">{p.times_viewed}</TableCell>
                    <TableCell className="text-right font-medium">
                      {p.times_copied}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
