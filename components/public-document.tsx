import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Brand } from "./brand";
import { ThemeToggle } from "./theme-toggle";

export function PublicDocument({
  eyebrow,
  title,
  intro,
  updated,
  children,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/88 backdrop-blur-xl">
        <div className="mx-auto flex h-17 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Brand />
          <div className="flex items-center gap-1">
            <ThemeToggle compact />
            <Link
              href="/"
              className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <ArrowLeft aria-hidden="true" className="size-4" />
              返回首页
            </Link>
          </div>
        </div>
      </header>
      <main className="mx-auto grid max-w-6xl gap-10 px-4 py-10 sm:px-6 sm:py-16 lg:grid-cols-[minmax(0,1fr)_15rem]">
        <article className="min-w-0">
          <header className="border-b border-border pb-8">
            <p className="text-xs font-bold tracking-[0.16em] text-primary-strong uppercase">
              {eyebrow}
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.045em] text-balance sm:text-5xl">
              {title}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
              {intro}
            </p>
            <p className="mt-5 text-xs text-muted-foreground">
              最后更新：{updated}
            </p>
          </header>
          <div className="mt-9 space-y-9 text-sm leading-7 text-muted-foreground [&_a]:font-medium [&_a]:text-primary-strong [&_a]:underline [&_a]:underline-offset-4 [&_h2]:scroll-mt-24 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:tracking-[-0.025em] [&_h2]:text-foreground [&_h3]:font-semibold [&_h3]:text-foreground [&_li]:pl-1 [&_strong]:font-semibold [&_strong]:text-foreground [&_ul]:ml-5 [&_ul]:list-disc [&_ul]:space-y-2">
            {children}
          </div>
        </article>
        <aside className="hidden lg:block">
          <div className="shadow-soft sticky top-28 rounded-2xl border border-border bg-surface p-4">
            <p className="text-xs font-semibold text-foreground">相关页面</p>
            <nav className="mt-2 grid gap-1 text-sm" aria-label="政策页面">
              <Link
                href="/privacy"
                className="rounded-lg px-3 py-2 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                隐私说明
              </Link>
              <Link
                href="/terms"
                className="rounded-lg px-3 py-2 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                使用条款
              </Link>
              <Link
                href="/health"
                className="rounded-lg px-3 py-2 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                健康与安全
              </Link>
              <Link
                href="/offline"
                className="rounded-lg px-3 py-2 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                离线使用
              </Link>
            </nav>
          </div>
        </aside>
      </main>
    </div>
  );
}
