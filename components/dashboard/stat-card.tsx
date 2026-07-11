import type { ReactNode } from "react";

import { MetricCard } from "../metric-card";

export interface StatCardProps {
  label: string;
  value: string;
  detail?: string;
  trend?: "up" | "down" | "flat";
  trendLabel?: string;
  icon?: ReactNode;
  accent?: "primary" | "secondary" | "success" | "warning";
  className?: string;
}

export function StatCard(props: StatCardProps) {
  return <MetricCard {...props} />;
}
