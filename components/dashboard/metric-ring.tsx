import { cn } from "../ui/cn";

export function MetricRing({
  value,
  label,
  detail,
  size = "md",
  className,
}: {
  value: number;
  label: string;
  detail?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const safeValue = Math.min(100, Math.max(0, value));
  return (
    <div className={cn("inline-grid justify-items-center gap-3", className)}>
      <div
        className={cn(
          "relative grid place-items-center rounded-full",
          size === "sm" && "size-20",
          size === "md" && "size-28",
          size === "lg" && "size-36",
        )}
        style={{
          background: `conic-gradient(var(--primary) ${safeValue * 3.6}deg, var(--muted) 0deg)`,
        }}
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={safeValue}
      >
        <div className="absolute inset-2.5 rounded-full bg-surface shadow-[inset_0_0_0_1px_var(--border)]" />
        <span
          className={cn(
            "relative font-semibold tracking-[-0.045em] tabular-nums",
            size === "sm" ? "text-lg" : size === "lg" ? "text-3xl" : "text-2xl",
          )}
        >
          {safeValue}%
        </span>
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        {detail ? (
          <p className="mt-0.5 text-xs text-muted-foreground">{detail}</p>
        ) : null}
      </div>
    </div>
  );
}
