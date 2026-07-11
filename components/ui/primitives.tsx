import * as React from "react";
import { AlertCircle, CheckCircle2, Info, TriangleAlert } from "lucide-react";

import { cn } from "./cn";

type Tone =
  "neutral" | "primary" | "secondary" | "success" | "warning" | "danger";

const toneClasses: Record<Tone, string> = {
  neutral: "border-border bg-muted text-muted-foreground",
  primary: "border-primary/15 bg-primary-soft text-primary-strong",
  secondary: "border-secondary/15 bg-secondary-soft text-secondary",
  success: "border-success/15 bg-success-soft text-success",
  warning: "border-warning/15 bg-warning-soft text-warning",
  danger: "border-danger/15 bg-danger-soft text-danger",
};

export function Badge({
  tone = "neutral",
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex min-h-6 items-center rounded-full border px-2.5 py-0.5 text-[0.6875rem] leading-4 font-semibold tracking-[0.02em]",
        toneClasses[tone],
        className,
      )}
      {...props}
    />
  );
}

export function Progress({
  value,
  label,
  className,
}: {
  value: number;
  label: string;
  className?: string;
}) {
  const safeValue = Math.min(100, Math.max(0, value));
  return (
    <div className={cn("grid gap-2", className)}>
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="font-medium text-foreground">{label}</span>
        <span className="text-muted-foreground tabular-nums">{safeValue}%</span>
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={safeValue}
        aria-label={label}
      >
        <div
          className="h-full rounded-full bg-linear-to-r from-primary to-secondary transition-[width] duration-500 ease-out"
          style={{ width: `${safeValue}%` }}
        />
      </div>
    </div>
  );
}

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "animate-pulse rounded-lg bg-[linear-gradient(100deg,var(--muted)_20%,color-mix(in_srgb,var(--muted)_62%,var(--surface-raised))_50%,var(--muted)_80%)] bg-size-[200%_100%]",
        className,
      )}
      {...props}
    />
  );
}

const alertIcons = {
  neutral: Info,
  primary: Info,
  secondary: Info,
  success: CheckCircle2,
  warning: TriangleAlert,
  danger: AlertCircle,
};

export function Alert({
  tone = "neutral",
  title,
  children,
  className,
}: {
  tone?: Tone;
  title: string;
  children?: React.ReactNode;
  className?: string;
}) {
  const Icon = alertIcons[tone];
  return (
    <div
      className={cn(
        "flex gap-3 rounded-xl border p-4",
        toneClasses[tone],
        className,
      )}
      role={tone === "danger" ? "alert" : "status"}
    >
      <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <div className="min-w-0">
        <p className="text-sm font-semibold text-current">{title}</p>
        {children ? (
          <div className="mt-1 text-xs leading-5 [&_button]:text-current">
            {children}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function Divider({ className }: { className?: string }) {
  return (
    <div className={cn("h-px w-full bg-border", className)} role="separator" />
  );
}
