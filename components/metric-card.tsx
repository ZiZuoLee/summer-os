import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";

import { Card } from "./ui/card";
import { cn } from "./ui/cn";

export interface MetricCardProps {
  label: string;
  value: string;
  detail?: string;
  trend?: "up" | "down" | "flat";
  trendLabel?: string;
  icon?: ReactNode;
  accent?: "primary" | "secondary" | "success" | "warning";
  className?: string;
}

const accents = {
  primary: "bg-primary-soft text-primary-strong",
  secondary: "bg-secondary-soft text-secondary",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
};

export function MetricCard({
  label,
  value,
  detail,
  trend,
  trendLabel,
  icon,
  accent = "primary",
  className,
}: MetricCardProps) {
  const TrendIcon =
    trend === "up" ? ArrowUpRight : trend === "down" ? ArrowDownRight : Minus;

  return (
    <Card className={cn("min-w-0 p-4 sm:p-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        {icon ? (
          <span
            className={cn(
              "flex size-8 items-center justify-center rounded-lg [&_svg]:size-4",
              accents[accent],
            )}
          >
            {icon}
          </span>
        ) : null}
      </div>
      <p className="mt-3 truncate text-2xl font-semibold tracking-[-0.045em] tabular-nums sm:text-[1.75rem]">
        {value}
      </p>
      <div className="mt-2 flex min-h-5 items-center gap-1.5 text-xs text-muted-foreground">
        {trend && trendLabel ? (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 font-medium",
              trend === "flat" ? "text-muted-foreground" : "text-success",
            )}
          >
            <TrendIcon aria-hidden="true" className="size-3.5" />
            {trendLabel}
          </span>
        ) : null}
        {detail ? <span className="truncate">{detail}</span> : null}
      </div>
    </Card>
  );
}
