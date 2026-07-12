"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BookOpenCheck,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  FileDown,
  GraduationCap,
  LayoutDashboard,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Sparkles,
  X,
} from "lucide-react";

import { Brand } from "./brand";
import { ServiceWorkerRegistration } from "./service-worker-registration";
import { ThemeToggle } from "./theme-toggle";
import { Button } from "./ui/button";
import { cn } from "./ui/cn";

const primaryNavigation = [
  { href: "/today", label: "今日", icon: LayoutDashboard },
  { href: "/calendar", label: "日历", icon: CalendarDays },
  { href: "/check-in", label: "打卡", icon: CheckCircle2, accent: true },
  { href: "/analytics", label: "数据", icon: BarChart3 },
  { href: "/settings", label: "更多", icon: Menu },
];

const secondaryNavigation = [
  { href: "/ielts", label: "IELTS", icon: BookOpenCheck },
  { href: "/gre", label: "GRE 决策", icon: GraduationCap },
  { href: "/weekly-review", label: "每周复盘", icon: ClipboardCheck },
  { href: "/plan", label: "计划编辑", icon: Sparkles },
  { href: "/export", label: "导出数据", icon: FileDown },
  { href: "/settings", label: "设置", icon: Settings },
];

function NavItem({
  href,
  label,
  icon: Icon,
  active,
  collapsed,
}: {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  active: boolean;
  collapsed: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors duration-200",
        active
          ? "bg-primary-soft text-primary-strong"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
        collapsed && "justify-center px-0",
      )}
      aria-current={active ? "page" : undefined}
      title={collapsed ? label : undefined}
    >
      <Icon
        aria-hidden="true"
        className={cn("size-[1.125rem] shrink-0", active && "text-primary")}
      />
      {!collapsed ? <span className="truncate">{label}</span> : null}
    </Link>
  );
}

export interface AppShellProps {
  children: ReactNode;
  title?: string;
  eyebrow?: string;
  displayName?: string;
  actions?: ReactNode;
}

export function AppShell({
  children,
  title = "今日",
  eyebrow,
  displayName = "夏日用户",
  actions,
}: AppShellProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    if (!moreOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMoreOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [moreOpen]);

  const isActive = (href: string) =>
    pathname === href || (href !== "/today" && pathname.startsWith(`${href}/`));

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <ServiceWorkerRegistration />
      <a
        href="#main-content"
        className="fixed top-3 left-3 z-100 -translate-y-20 rounded-lg bg-surface-inverse px-4 py-2 text-sm font-semibold text-background transition-transform focus:translate-y-0"
      >
        跳到主要内容
      </a>

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden border-r border-border bg-surface-subtle/95 backdrop-blur-xl transition-[width] duration-200 lg:flex lg:flex-col",
          collapsed ? "w-20" : "w-64",
        )}
      >
        <div
          className={cn(
            "flex h-20 items-center border-b border-border px-5",
            collapsed && "justify-center px-0",
          )}
        >
          <Brand compact={collapsed} />
        </div>
        <nav className="flex-1 overflow-y-auto p-3" aria-label="应用导航">
          <div className="grid gap-1">
            {primaryNavigation.slice(0, 4).map((item) => (
              <NavItem
                key={item.href}
                {...item}
                active={isActive(item.href)}
                collapsed={collapsed}
              />
            ))}
          </div>
          <div className="my-4 h-px bg-border" />
          <div className="grid gap-1">
            {secondaryNavigation.map((item) => (
              <NavItem
                key={`${item.href}-${item.label}`}
                {...item}
                active={isActive(item.href)}
                collapsed={collapsed}
              />
            ))}
          </div>
        </nav>
        <div className="border-t border-border p-3">
          <Button
            variant="ghost"
            size={collapsed ? "icon" : "sm"}
            width={collapsed ? "auto" : "full"}
            onClick={() => setCollapsed((value) => !value)}
            aria-label={collapsed ? "展开侧边栏" : "收起侧边栏"}
            className={cn(!collapsed && "justify-start")}
          >
            {collapsed ? (
              <PanelLeftOpen aria-hidden="true" className="size-4" />
            ) : (
              <PanelLeftClose aria-hidden="true" className="size-4" />
            )}
            {!collapsed ? "收起侧边栏" : null}
          </Button>
        </div>
      </aside>

      <div
        className={cn(
          "transition-[padding] duration-200 lg:pl-64",
          collapsed && "lg:pl-20",
        )}
      >
        <header className="sticky top-0 z-30 flex min-h-18 items-center justify-between gap-4 border-b border-border bg-background/88 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <div className="min-w-0">
            {eyebrow ? (
              <p className="truncate text-xs font-medium text-muted-foreground">
                {eyebrow}
              </p>
            ) : null}
            <h1 className="truncate text-lg font-semibold tracking-[-0.025em] sm:text-xl">
              {title}
            </h1>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {actions}
            <ThemeToggle compact />
            <Link
              href="/settings"
              className="ml-1 inline-flex size-10 items-center justify-center rounded-full bg-linear-to-br from-primary-soft to-secondary-soft text-sm font-bold text-primary-strong ring-1 ring-border transition-transform hover:scale-[1.03]"
              aria-label={`${displayName}的设置`}
              title={displayName}
            >
              {displayName.slice(0, 1)}
            </Link>
          </div>
        </header>
        <main
          id="main-content"
          tabIndex={-1}
          className="mx-auto w-full max-w-[1480px] px-4 py-5 pb-28 sm:px-6 sm:py-7 lg:px-8 lg:pb-8"
        >
          {children}
        </main>
      </div>

      {moreOpen ? (
        <div className="fixed inset-0 z-60 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
            onClick={() => setMoreOpen(false)}
            aria-label="关闭更多菜单"
          />
          <section
            className="safe-bottom absolute inset-x-0 bottom-0 max-h-[82dvh] overflow-y-auto rounded-t-[1.75rem] border-t border-border bg-surface p-4 pb-8 shadow-[0_-24px_70px_rgb(0_0_0/32%)]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="more-menu-title"
          >
            <div
              className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-border-strong"
              aria-hidden="true"
            />
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 id="more-menu-title" className="text-lg font-semibold">
                  更多工具
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  学习、复盘、计划与数据控制
                </p>
              </div>
              <Button
                autoFocus
                variant="ghost"
                size="icon"
                onClick={() => setMoreOpen(false)}
                aria-label="关闭"
              >
                <X className="size-5" />
              </Button>
            </div>
            <nav className="grid grid-cols-2 gap-2" aria-label="更多功能">
              {secondaryNavigation.map(({ href, label, icon: Icon }) => (
                <Link
                  key={`${href}-sheet`}
                  href={href}
                  onClick={() => queueMicrotask(() => setMoreOpen(false))}
                  onNavigate={() => setMoreOpen(false)}
                  className="flex min-h-20 flex-col items-start justify-between rounded-2xl border border-border bg-surface-raised p-3.5 text-sm font-semibold hover:border-primary/35 hover:bg-primary-soft"
                >
                  <Icon className="size-5 text-primary" aria-hidden="true" />
                  <span>{label}</span>
                </Link>
              ))}
            </nav>
          </section>
        </div>
      ) : null}

      <nav
        className="safe-bottom fixed inset-x-0 bottom-0 z-50 grid grid-cols-5 border-t border-border bg-surface/94 px-1 pt-1.5 shadow-[0_-10px_30px_rgb(0_0_0/6%)] backdrop-blur-xl lg:hidden"
        aria-label="主要导航"
      >
        {primaryNavigation.map((item) => {
          const isMore = item.label === "更多";
          const active = isMore
            ? secondaryNavigation.some((entry) => isActive(entry.href))
            : isActive(item.href);
          const Icon = item.icon;
          const content = (
            <>
              <span
                className={cn(
                  "flex size-7 items-center justify-center rounded-lg",
                  active && !item.accent && "bg-primary-soft",
                  item.accent &&
                    "size-11 rounded-2xl bg-primary text-[#041317] shadow-[0_8px_24px_color-mix(in_srgb,var(--primary)_28%,transparent)]",
                )}
              >
                <Icon
                  aria-hidden="true"
                  className={cn("size-[1.1rem]", item.accent && "size-5")}
                />
              </span>
              <span>{item.label}</span>
            </>
          );
          if (isMore)
            return (
              <button
                key={item.label}
                type="button"
                onClick={() => setMoreOpen(true)}
                className={cn(
                  "relative flex min-h-13 flex-col items-center justify-center gap-1 rounded-xl text-[0.65rem] font-medium transition-colors",
                  active ? "text-primary-strong" : "text-muted-foreground",
                )}
                aria-haspopup="dialog"
                aria-expanded={moreOpen}
              >
                {content}
              </button>
            );
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex min-h-13 flex-col items-center justify-center gap-1 rounded-xl text-[0.65rem] font-medium transition-colors",
                active ? "text-primary-strong" : "text-muted-foreground",
                item.accent && "-mt-4",
              )}
              aria-current={active ? "page" : undefined}
            >
              {content}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
