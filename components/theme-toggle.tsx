"use client";

import { useSyncExternalStore } from "react";
import { Laptop, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "./ui/button";

const choices = [
  { value: "light", label: "浅色", icon: Sun },
  { value: "dark", label: "深色", icon: Moon },
  { value: "system", label: "跟随系统", icon: Laptop },
] as const;

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme = "system", setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );
  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size={compact ? "icon" : "sm"}
        disabled
        aria-label="主题加载中"
      >
        <Laptop aria-hidden="true" className="size-4" />
        {!compact ? <span>跟随系统</span> : null}
      </Button>
    );
  }
  const currentIndex = Math.max(
    0,
    choices.findIndex((choice) => choice.value === theme),
  );
  const current = choices[currentIndex];
  const Icon = current.icon;

  function cycleTheme() {
    setTheme(choices[(currentIndex + 1) % choices.length].value);
  }

  return (
    <Button
      variant="ghost"
      size={compact ? "icon" : "sm"}
      onClick={cycleTheme}
      aria-label={`当前为${current.label}主题，切换主题`}
      title={`主题：${current.label}`}
      className={compact ? undefined : "gap-2"}
    >
      <Icon aria-hidden="true" className="size-4" />
      {!compact ? <span>{current.label}</span> : null}
    </Button>
  );
}
