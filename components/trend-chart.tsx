"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { cn } from "./ui/cn";

export interface TrendDatum {
  label: string;
  value: number;
}

export interface TrendChartProps {
  data: TrendDatum[];
  title: string;
  unit?: string;
  description?: string;
  className?: string;
  min?: number;
  max?: number;
}

export function TrendChart({
  data,
  title,
  unit = "",
  description,
  className,
  min,
  max,
}: TrendChartProps) {
  const values = data.map((item) => item.value);
  const domainMin = min ?? Math.floor(Math.min(...values) - 1);
  const domainMax = max ?? Math.ceil(Math.max(...values) + 1);
  const summary =
    description ??
    `${title}：从 ${data.at(0)?.value ?? "—"}${unit} 变化到 ${data.at(-1)?.value ?? "—"}${unit}。`;

  if (data.length === 0) {
    return (
      <div
        className={cn(
          "flex h-64 items-center justify-center rounded-xl border border-dashed border-border bg-surface-subtle text-sm text-muted-foreground",
          className,
        )}
      >
        暂无足够数据生成趋势图
      </div>
    );
  }

  return (
    <figure className={cn("min-w-0", className)} aria-label={title}>
      <div className="h-64 w-full" role="img" aria-label={summary}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 12, right: 6, bottom: 2, left: -20 }}
          >
            <defs>
              <linearGradient
                id="summer-trend-fill"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="0%"
                  stopColor="var(--primary)"
                  stopOpacity={0.3}
                />
                <stop
                  offset="100%"
                  stopColor="var(--primary)"
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
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
              domain={[domainMin, domainMax]}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            />
            <Tooltip
              cursor={{
                stroke: "var(--border-strong)",
                strokeDasharray: "3 3",
              }}
              contentStyle={{
                background: "var(--surface-raised)",
                border: "1px solid var(--border)",
                borderRadius: "12px",
                boxShadow: "var(--shadow-raised)",
                color: "var(--foreground)",
                fontSize: "12px",
              }}
              formatter={(value) => [
                `${Number(value).toFixed(1)}${unit}`,
                title,
              ]}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="var(--primary)"
              strokeWidth={2.5}
              fill="url(#summer-trend-fill)"
              activeDot={{
                r: 5,
                fill: "var(--surface)",
                stroke: "var(--primary)",
                strokeWidth: 3,
              }}
            />
          </AreaChart>
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
                {item.value}
                {unit}
              </span>
            </li>
          ))}
        </ul>
      </details>
    </figure>
  );
}
