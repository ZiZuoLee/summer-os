import type { ReactNode } from "react";
import { Inbox } from "lucide-react";

import { cn } from "./ui/cn";

export function EmptyState({
  title,
  description,
  icon,
  action,
  className,
}: {
  title: string;
  description: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-h-64 flex-col items-center justify-center rounded-[1.25rem] border border-dashed border-border-strong bg-surface-subtle px-5 py-10 text-center",
        className,
      )}
    >
      <div className="shadow-soft flex size-12 items-center justify-center rounded-2xl border border-border bg-surface text-primary [&_svg]:size-5">
        {icon ?? <Inbox aria-hidden="true" />}
      </div>
      <h2 className="mt-4 text-base font-semibold tracking-[-0.02em]">
        {title}
      </h2>
      <p className="mt-1.5 max-w-sm text-sm leading-6 text-muted-foreground">
        {description}
      </p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
