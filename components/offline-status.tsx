"use client";

import { useSyncExternalStore } from "react";
import { Cloud, CloudOff } from "lucide-react";

import { cn } from "./ui/cn";

function subscribe(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

function getSnapshot() {
  return navigator.onLine;
}

export function OfflineStatus() {
  const online = useSyncExternalStore(subscribe, getSnapshot, () => true);

  if (online) return null;

  return (
    <div
      className="shadow-raised fixed inset-x-3 top-3 z-100 mx-auto flex min-h-11 max-w-md items-center justify-center gap-2 rounded-xl border border-warning/20 bg-warning-soft px-4 py-2 text-center text-xs font-semibold text-warning"
      role="status"
    >
      <CloudOff aria-hidden="true" className="size-4" />
      当前离线。草稿保存在此设备，联网后再提交。
    </div>
  );
}

export function ConnectionPill() {
  const online = useSyncExternalStore(subscribe, getSnapshot, () => true);
  const Icon = online ? Cloud : CloudOff;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        online
          ? "border-success/15 bg-success-soft text-success"
          : "border-warning/15 bg-warning-soft text-warning",
      )}
    >
      <Icon aria-hidden="true" className="size-3.5" />
      {online ? "已联网" : "离线模式"}
    </span>
  );
}
