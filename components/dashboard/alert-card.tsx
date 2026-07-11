import type { ReactNode } from "react";

import { Alert } from "../ui/primitives";

export function AlertCard({
  title,
  children,
  tone = "warning",
  className,
}: {
  title: string;
  children?: ReactNode;
  tone?: "neutral" | "primary" | "secondary" | "success" | "warning" | "danger";
  className?: string;
}) {
  return (
    <Alert title={title} tone={tone} className={className}>
      {children}
    </Alert>
  );
}
