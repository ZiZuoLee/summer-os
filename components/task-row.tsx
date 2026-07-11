"use client";

import { useState } from "react";
import { Check, Circle, Clock3, GripVertical, RotateCcw } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "./ui/primitives";
import { cn } from "./ui/cn";

export interface TaskRowProps {
  id: string;
  title: string;
  description?: string;
  time?: string;
  optional?: boolean;
  completed?: boolean;
  disabled?: boolean;
  draggable?: boolean;
  onToggle?: (nextCompleted: boolean, id: string) => Promise<void> | void;
  className?: string;
}

export function TaskRow({
  id,
  title,
  description,
  time,
  optional = false,
  completed = false,
  disabled = false,
  draggable = false,
  onToggle,
  className,
}: TaskRowProps) {
  const [optimisticCompleted, setOptimisticCompleted] = useState(completed);
  const [pending, setPending] = useState(false);

  async function handleToggle() {
    if (disabled || pending) return;

    const next = !optimisticCompleted;
    setOptimisticCompleted(next);
    setPending(true);

    try {
      await onToggle?.(next, id);
    } catch {
      setOptimisticCompleted(!next);
      toast.error("更新失败，已恢复原状态");
    } finally {
      setPending(false);
    }
  }

  return (
    <div
      className={cn(
        "group flex min-h-16 items-center gap-3 rounded-xl border border-transparent px-2 py-2 transition-[background-color,border-color,opacity] duration-200 hover:border-border hover:bg-surface-subtle",
        optimisticCompleted && "bg-surface-subtle",
        className,
      )}
    >
      {draggable ? (
        <GripVertical
          aria-hidden="true"
          className="hidden size-4 shrink-0 cursor-grab text-muted-foreground/60 sm:block"
        />
      ) : null}
      <button
        type="button"
        role="checkbox"
        aria-checked={optimisticCompleted}
        aria-label={`${optimisticCompleted ? "取消完成" : "标记完成"}：${title}`}
        disabled={disabled || pending}
        onClick={handleToggle}
        className={cn(
          "flex size-11 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-[background-color,color,transform] duration-200 hover:bg-primary-soft hover:text-primary-strong focus-visible:ring-3 focus-visible:ring-primary/25 focus-visible:outline-none active:scale-95",
          optimisticCompleted &&
            "bg-primary text-[#061518] hover:bg-primary-strong hover:text-white",
        )}
      >
        {pending ? (
          <RotateCcw aria-hidden="true" className="size-4 animate-spin" />
        ) : optimisticCompleted ? (
          <Check aria-hidden="true" className="size-5" strokeWidth={2.5} />
        ) : (
          <Circle aria-hidden="true" className="size-5" />
        )}
      </button>
      <div className="min-w-0 flex-1 py-1">
        <div className="flex flex-wrap items-center gap-2">
          <p
            className={cn(
              "text-sm font-medium text-foreground",
              optimisticCompleted && "line-through decoration-border-strong",
            )}
          >
            {title}
          </p>
          {optional ? <Badge>可选</Badge> : null}
        </div>
        {description ? (
          <p className="mt-1 truncate text-xs text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {time ? (
        <span className="hidden shrink-0 items-center gap-1.5 rounded-lg bg-muted px-2.5 py-1.5 text-xs font-medium text-muted-foreground sm:inline-flex">
          <Clock3 aria-hidden="true" className="size-3.5" />
          {time}
        </span>
      ) : null}
    </div>
  );
}
