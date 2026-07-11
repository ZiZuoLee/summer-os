import type { ReactNode } from "react";
import { AppShell as BaseAppShell } from "../app-shell";
import { SignOutButton } from "../sign-out-button";
import { Badge } from "../ui/badge";

export interface AppShellProps {
  userName?: string;
  children: ReactNode;
  signOutAction?: (formData: FormData) => void | Promise<void>;
  demoMode?: boolean;
  title?: string;
  eyebrow?: string;
}

export function AppShell({
  userName = "夏日用户",
  children,
  signOutAction,
  demoMode = false,
  title,
  eyebrow,
}: AppShellProps) {
  const actions = (
    <div className="flex items-center gap-1">
      {demoMode ? (
        <Badge tone="warning" className="hidden sm:inline-flex">
          演示模式
        </Badge>
      ) : null}
      {signOutAction ? <SignOutButton action={signOutAction} /> : null}
    </div>
  );

  return (
    <BaseAppShell
      displayName={userName}
      title={title}
      eyebrow={eyebrow}
      actions={actions}
    >
      {children}
    </BaseAppShell>
  );
}
