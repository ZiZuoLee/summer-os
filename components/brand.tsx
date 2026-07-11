import Link from "next/link";

import { cn } from "./ui/cn";

export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      className={cn("size-9 shrink-0", className)}
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden="true"
    >
      <rect width="40" height="40" rx="12" fill="url(#summer-mark-bg)" />
      <path
        d="M11.75 23.4c2.62 3.95 6.3 5.43 10.82 4.23 3.5-.92 5.55-3.45 6.12-7.57-2.1 2.16-4.48 3.32-7.14 3.48-3.52.22-6.79-.8-9.8-3.04v2.9Z"
        fill="#071216"
        opacity=".94"
      />
      <path
        d="M12.2 16.25c3.22-4.19 7.34-5.5 12.34-3.9 1.87.6 3.28 1.63 4.21 3.1-2.47-.7-4.72-.76-6.76-.2-2.82.79-5.26 2.46-7.32 5.03l-2.47-4.03Z"
        fill="white"
        opacity=".95"
      />
      <circle cx="29" cy="11" r="2.15" fill="#DDFBFF" />
      <defs>
        <linearGradient
          id="summer-mark-bg"
          x1="4"
          y1="3"
          x2="36"
          y2="38"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#58E6F4" />
          <stop offset=".55" stopColor="#10AEC8" />
          <stop offset="1" stopColor="#8D72EF" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function Brand({
  compact = false,
  className,
}: {
  compact?: boolean;
  className?: string;
}) {
  return (
    <Link
      href="/"
      className={cn(
        "inline-flex min-h-11 items-center gap-2.5 rounded-xl text-foreground",
        className,
      )}
      aria-label="Summer OS 首页"
    >
      <BrandMark />
      {!compact ? (
        <span className="flex flex-col leading-none">
          <span className="text-[0.95rem] font-bold tracking-[-0.035em]">
            Summer OS
          </span>
          <span className="mt-1 text-[0.6rem] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
            Public beta
          </span>
        </span>
      ) : null}
    </Link>
  );
}
