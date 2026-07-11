"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Download, Share, Smartphone, X } from "lucide-react";

import { Button } from "./ui/button";
import { Card } from "./ui/card";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

function subscribeToDisplayMode(callback: () => void) {
  const query = window.matchMedia("(display-mode: standalone)");
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}

function getStandaloneSnapshot() {
  return window.matchMedia("(display-mode: standalone)").matches;
}

function getIOSSnapshot() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

function subscribeToUserAgent() {
  return () => undefined;
}

export function InstallPrompt({ compact = false }: { compact?: boolean }) {
  const [promptEvent, setPromptEvent] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const isIOS = useSyncExternalStore(
    subscribeToUserAgent,
    getIOSSnapshot,
    () => false,
  );
  const standalone = useSyncExternalStore(
    subscribeToDisplayMode,
    getStandaloneSnapshot,
    () => false,
  );

  useEffect(() => {
    function capturePrompt(event: Event) {
      event.preventDefault();
      setPromptEvent(event as BeforeInstallPromptEvent);
    }

    window.addEventListener("beforeinstallprompt", capturePrompt);
    return () =>
      window.removeEventListener("beforeinstallprompt", capturePrompt);
  }, []);

  async function install() {
    if (!promptEvent) return;
    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    if (choice.outcome === "accepted") setPromptEvent(null);
  }

  if (standalone || dismissed || (!promptEvent && !isIOS)) return null;

  if (compact) {
    return (
      <Button
        variant="soft"
        size="sm"
        onClick={promptEvent ? install : undefined}
      >
        <Download aria-hidden="true" className="size-4" />
        安装应用
      </Button>
    );
  }

  return (
    <Card className="relative overflow-hidden border-primary/20 bg-linear-to-br from-primary-soft to-secondary-soft p-5 sm:p-6">
      <button
        type="button"
        className="absolute top-3 right-3 flex size-11 items-center justify-center rounded-xl text-muted-foreground hover:bg-surface/55 hover:text-foreground"
        onClick={() => setDismissed(true)}
        aria-label="关闭安装提示"
      >
        <X aria-hidden="true" className="size-4" />
      </button>
      <div className="shadow-soft flex size-11 items-center justify-center rounded-2xl bg-surface/75 text-primary-strong">
        <Smartphone aria-hidden="true" className="size-5" />
      </div>
      <h2 className="mt-4 pr-8 text-base font-semibold">
        把 Summer OS 放到主屏幕
      </h2>
      <p className="mt-1.5 max-w-lg text-sm leading-6 text-muted-foreground">
        像普通应用一样快速打开。离线时仅保留应用外壳和本机草稿，不会缓存你的健康记录。
      </p>
      {promptEvent ? (
        <Button size="sm" className="mt-4" onClick={install}>
          <Download aria-hidden="true" className="size-4" />
          安装 Summer OS
        </Button>
      ) : (
        <div className="mt-4 flex items-center gap-2 text-xs font-medium text-foreground">
          <Share aria-hidden="true" className="size-4 text-primary" />在 Safari
          点“分享”，再选择“添加到主屏幕”
        </div>
      )}
    </Card>
  );
}
