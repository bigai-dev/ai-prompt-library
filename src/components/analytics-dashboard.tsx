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
import { Eye, Copy, Heart, TrendingUp } from "lucide-react";

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

export function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/v1/admin/analytics/overview")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div>
        <h1 className="mb-6 text-2xl font-bold">Analytics</h1>
        <div className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl border bg-white" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div>
        <h1 className="mb-6 text-2xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">Unable to load data</p>
      </div>
    );
  }

  const maxCopies = Math.max(...data.dailyTrend.map((d) => d.count), 1);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Analytics</h1>
      <p className="mb-6 text-sm text-muted-foreground">Last 30 days</p>

      {/* KPI Cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
              <Eye className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{data.totals.views.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Total Views</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100">
              <Copy className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{data.totals.copies.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Total Copies</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100">
              <Heart className="h-6 w-6 text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{data.totals.favorites.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Total Favorites</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Daily Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4" />
              Daily Copy Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.dailyTrend.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No data available</p>
            ) : (
              <div className="flex h-40 items-end gap-1">
                {data.dailyTrend.slice(-30).map((d) => (
                  <div
                    key={d.date}
                    className="flex-1 rounded-t bg-primary transition-all hover:bg-yellow-400"
                    style={{
                      height: `${(d.count / maxCopies) * 100}%`,
                      minHeight: d.count > 0 ? "4px" : "0",
                    }}
                    title={`${d.date}: ${d.count} copies`}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

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
      </div>

      {/* Top Prompts */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Top 10 Prompts</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Prompt Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Views</TableHead>
                <TableHead className="text-right">Copies</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.topPrompts.map((p, i) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{i + 1}</TableCell>
                  <TableCell>{p.title_en}</TableCell>
                  <TableCell className="text-muted-foreground">
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
  );
}
