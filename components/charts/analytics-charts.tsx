"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { TrendChart, type TrendDatum } from "../trend-chart";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";

export interface StudyDatum {
  label: string;
  minutes: number;
}

export interface AnalyticsChartsProps {
  weightData?: TrendDatum[];
  studyData?: StudyDatum[];
  weightUnit?: string;
}

export function AnalyticsCharts({
  weightData = [],
  studyData = [],
  weightUnit = " kg",
}: AnalyticsChartsProps) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Card>
        <CardHeader>
          <div>
            <CardTitle>体重趋势</CardTitle>
            <CardDescription>
              仅在数据足够时展示趋势；短期波动不代表方向。
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <TrendChart data={weightData} title="体重" unit={weightUnit} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <div>
            <CardTitle>学习投入</CardTitle>
            <CardDescription>
              最近周期内每天记录的 IELTS 学习分钟数。
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <StudyBarChart data={studyData} />
        </CardContent>
      </Card>
    </div>
  );
}

export function StudyBarChart({ data }: { data: StudyDatum[] }) {
  if (!data.length) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-border bg-surface-subtle text-sm text-muted-foreground">
        暂无学习记录
      </div>
    );
  }

  const summary = `学习时长：${data.map((item) => `${item.label} ${item.minutes} 分钟`).join("；")}。`;

  return (
    <figure aria-label="学习投入柱状图">
      <div className="h-64 w-full" role="img" aria-label={summary}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 12, right: 6, bottom: 2, left: -20 }}
          >
            <CartesianGrid
              stroke="var(--border)"
              strokeDasharray="3 5"
              vertical={false}
            />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
              dy={8}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            />
            <Tooltip
              cursor={{ fill: "var(--muted)" }}
              contentStyle={{
                background: "var(--surface-raised)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                boxShadow: "var(--shadow-raised)",
                color: "var(--foreground)",
                fontSize: 12,
              }}
              formatter={(value) => [`${Number(value)} 分钟`, "学习时长"]}
            />
            <Bar
              dataKey="minutes"
              fill="var(--secondary)"
              radius={[7, 7, 2, 2]}
              maxBarSize={34}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <figcaption className="sr-only">{summary}</figcaption>
      <details className="mt-2 text-xs text-muted-foreground">
        <summary className="min-h-10 cursor-pointer py-2 font-medium hover:text-foreground">
          查看图表数据
        </summary>
        <ul className="grid grid-cols-2 gap-x-6 gap-y-1 border-l border-border pl-3 sm:grid-cols-4">
          {data.map((item) => (
            <li key={item.label} className="flex justify-between gap-2">
              <span>{item.label}</span>
              <span className="font-medium text-foreground tabular-nums">
                {item.minutes} 分钟
              </span>
            </li>
          ))}
        </ul>
      </details>
    </figure>
  );
}

export type { TrendDatum };
