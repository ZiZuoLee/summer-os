import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Dumbbell,
  HeartPulse,
  LockKeyhole,
  MoonStar,
  ShieldCheck,
  Sparkles,
  Target,
  Zap,
} from "lucide-react";

import { Brand } from "@/components/brand";
import { ServiceWorkerRegistration } from "@/components/service-worker-registration";
import { ThemeToggle } from "@/components/theme-toggle";
import { buttonVariants } from "@/components/ui/button";
import { Badge, Progress } from "@/components/ui/primitives";
import { cn } from "@/components/ui/cn";

const tasks = [
  { label: "完成 IELTS 听力精练", meta: "40 分钟", done: true },
  { label: "午间散步与补水", meta: "20 分钟", done: true },
  { label: "整理 GRE 项目资料", meta: "25 分钟", done: false },
];

const features = [
  {
    icon: CalendarDays,
    title: "计划不再散落",
    description:
      "把实习、课程、备考和恢复日放进同一条清晰时间线，每天只看此刻真正重要的事。",
    tone: "primary",
  },
  {
    icon: HeartPulse,
    title: "两分钟轻量打卡",
    description:
      "体重、睡眠、步数、训练和状态都可跳过；草稿只留在你的设备，不强迫完整记录。",
    tone: "success",
  },
  {
    icon: BarChart3,
    title: "趋势，而非噪声",
    description:
      "用周均值、完成度和学习分布看方向。所有相关性都明确标注为描述性信息，而非因果结论。",
    tone: "secondary",
  },
  {
    icon: ShieldCheck,
    title: "隐私从结构开始",
    description:
      "每位用户的数据由数据库行级权限隔离，支持随时导出，也可以自行永久删除账号。",
    tone: "warning",
  },
];

const toneStyles = {
  primary: "bg-primary-soft text-primary-strong",
  success: "bg-success-soft text-success",
  secondary: "bg-secondary-soft text-secondary",
  warning: "bg-warning-soft text-warning",
};

function DashboardPreview() {
  return (
    <div
      className="relative mx-auto w-full max-w-[62rem]"
      aria-label="Summer OS 今日面板预览"
    >
      <div className="absolute -inset-8 -z-10 rounded-[3rem] bg-[radial-gradient(circle_at_50%_50%,color-mix(in_srgb,var(--primary)_18%,transparent),transparent_68%)] blur-2xl" />
      <div className="overflow-hidden rounded-[1.35rem] border border-white/10 bg-[#0c1116] p-1.5 shadow-[0_32px_90px_rgb(0_0_0/28%)] ring-1 ring-black/20 sm:rounded-[1.75rem] sm:p-2">
        <div className="flex h-8 items-center gap-1.5 px-3" aria-hidden="true">
          <span className="size-2 rounded-full bg-[#ff7d89]" />
          <span className="size-2 rounded-full bg-[#f2bd68]" />
          <span className="size-2 rounded-full bg-[#56d4a0]" />
          <span className="ml-2 text-[0.6rem] font-medium tracking-[0.08em] text-white/65 uppercase">
            summer-os.vercel.app
          </span>
        </div>
        <div className="grid min-h-[32rem] overflow-hidden rounded-[1rem] border border-white/8 bg-[#0a0f14] text-[#eef5f7] sm:rounded-[1.25rem] md:grid-cols-[10.5rem_1fr]">
          <aside className="hidden border-r border-white/8 bg-[#0e151b] p-4 md:flex md:flex-col">
            <Brand className="pointer-events-none text-white [&_span]:text-white" />
            <nav className="mt-7 grid gap-1.5" aria-label="预览导航">
              {[
                [Sparkles, "今日", true],
                [CalendarDays, "日历", false],
                [CheckCircle2, "打卡", false],
                [BarChart3, "数据", false],
                [BookOpenCheck, "IELTS", false],
              ].map(([Icon, label, active]) => {
                const ItemIcon = Icon as typeof Sparkles;
                return (
                  <div
                    key={label as string}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium",
                      active ? "bg-[#15333a] text-[#5cdef0]" : "text-white/65",
                    )}
                  >
                    <ItemIcon aria-hidden="true" className="size-3.5" />
                    {label as string}
                  </div>
                );
              })}
            </nav>
            <div className="mt-auto rounded-xl border border-white/8 bg-white/3 p-3">
              <p className="text-[0.6rem] text-white/65">连续完成</p>
              <p className="mt-1 text-lg font-semibold tracking-tight">12 天</p>
            </div>
          </aside>
          <div className="min-w-0 p-3 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[0.65rem] font-medium text-white/65">
                  7月20日 · 周一
                </p>
                <h2 className="mt-1 text-lg font-semibold tracking-[-0.03em] sm:text-xl">
                  早上好，Kirito
                </h2>
              </div>
              <div className="flex size-9 items-center justify-center rounded-xl bg-[#16333a] text-[#59dcec]">
                <Zap aria-hidden="true" className="size-4" />
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {[
                ["今日完成", "68%", "+12%"],
                ["睡眠", "7.4h", "稳定"],
                ["步数", "6,820", "目标 8k"],
                ["IELTS", "40m", "本周 3h"],
              ].map(([label, value, detail], index) => (
                <div
                  key={label}
                  className={cn(
                    "rounded-xl border border-white/8 bg-[#111920] p-3",
                    index > 1 && "hidden sm:block",
                  )}
                >
                  <p className="text-[0.6rem] text-white/65">{label}</p>
                  <p className="mt-2 text-base font-semibold tracking-[-0.03em] tabular-nums">
                    {value}
                  </p>
                  <p
                    className={cn(
                      "mt-1 text-[0.58rem]",
                      index === 0 ? "text-[#56d4a0]" : "text-white/65",
                    )}
                  >
                    {detail}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-3 grid gap-3 lg:grid-cols-[1.2fr_.8fr]">
              <div className="rounded-xl border border-white/8 bg-[#111920] p-3.5 sm:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold">今日焦点</p>
                    <p className="mt-0.5 text-[0.6rem] text-white/65">
                      上午 · 3 项任务
                    </p>
                  </div>
                  <span className="rounded-full bg-[#17363d] px-2 py-1 text-[0.55rem] font-semibold text-[#59dcec]">
                    实习日
                  </span>
                </div>
                <div className="mt-3 grid gap-1">
                  {tasks.map((task) => (
                    <div
                      key={task.label}
                      className="flex min-h-12 items-center gap-2.5 rounded-lg border border-transparent px-1.5"
                    >
                      <span
                        className={cn(
                          "flex size-7 shrink-0 items-center justify-center rounded-lg",
                          task.done
                            ? "bg-[#38cee5] text-[#081216]"
                            : "border border-white/12 text-white/65",
                        )}
                      >
                        {task.done ? (
                          <Check aria-hidden="true" className="size-3.5" />
                        ) : null}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p
                          className={cn(
                            "truncate text-[0.68rem] font-medium",
                            task.done && "text-white/65 line-through",
                          )}
                        >
                          {task.label}
                        </p>
                        <p className="mt-0.5 text-[0.55rem] text-white/65">
                          {task.meta}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid gap-3">
                <div className="rounded-xl border border-white/8 bg-[#111920] p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold">七日节奏</p>
                    <Badge
                      tone="success"
                      className="border-[#255642] bg-[#17382c] text-[#56d4a0]"
                    >
                      平稳
                    </Badge>
                  </div>
                  <svg
                    className="mt-4 h-20 w-full"
                    viewBox="0 0 260 80"
                    role="img"
                    aria-label="七日趋势整体平稳"
                  >
                    <defs>
                      <linearGradient
                        id="preview-area"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop stopColor="#38CEE5" stopOpacity=".32" />
                        <stop offset="1" stopColor="#38CEE5" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M0 60 C27 58 35 41 62 45 C92 49 101 29 126 35 C151 42 165 19 191 26 C217 33 229 14 260 18 L260 80 L0 80Z"
                      fill="url(#preview-area)"
                    />
                    <path
                      d="M0 60 C27 58 35 41 62 45 C92 49 101 29 126 35 C151 42 165 19 191 26 C217 33 229 14 260 18"
                      fill="none"
                      stroke="#38CEE5"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
                <div className="rounded-xl border border-[#644fc2]/30 bg-linear-to-br from-[#211c38] to-[#121922] p-4">
                  <div className="flex items-center gap-2 text-[#a993f6]">
                    <MoonStar aria-hidden="true" className="size-4" />
                    <p className="text-xs font-semibold">最低可行日</p>
                  </div>
                  <p className="mt-2 text-[0.62rem] leading-4 text-white/65">
                    状态不好也没关系。保留三件最重要的小事。
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="min-h-dvh overflow-hidden bg-background text-foreground">
      <ServiceWorkerRegistration />
      <div className="page-grid pointer-events-none fixed inset-0 -z-10" />
      <header className="sticky top-0 z-50 border-b border-border/70 bg-background/82 backdrop-blur-xl">
        <div className="mx-auto flex h-17 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Brand />
          <nav
            className="hidden items-center gap-1 md:flex"
            aria-label="首页导航"
          >
            <a
              href="#features"
              className="inline-flex min-h-11 items-center rounded-xl px-3 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              功能
            </a>
            <a
              href="#principles"
              className="inline-flex min-h-11 items-center rounded-xl px-3 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              理念
            </a>
            <Link
              href="/privacy"
              className="inline-flex min-h-11 items-center rounded-xl px-3 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              隐私
            </Link>
          </nav>
          <div className="flex items-center gap-1.5">
            <ThemeToggle compact />
            <Link
              href="/login"
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "hidden sm:inline-flex",
              )}
            >
              登录
            </Link>
            <Link href="/signup" className={buttonVariants({ size: "sm" })}>
              免费开始
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="relative px-4 pt-18 pb-12 sm:px-6 sm:pt-24 sm:pb-16 lg:px-8 lg:pt-28">
          <div className="pointer-events-none absolute top-10 left-1/2 -z-10 size-[35rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,color-mix(in_srgb,var(--primary)_15%,transparent),transparent_66%)] blur-2xl" />
          <div className="mx-auto max-w-5xl text-center">
            <Badge tone="primary" className="animate-enter gap-1.5 px-3 py-1">
              <span className="size-1.5 rounded-full bg-primary" />
              免费 · 非商业公开测试版
            </Badge>
            <h1 className="mt-6 text-4xl leading-[1.05] font-semibold tracking-[-0.065em] text-balance sm:text-6xl lg:text-[4.65rem]">
              让这个夏天，
              <span className="bg-linear-to-r from-primary-strong via-primary to-secondary bg-clip-text text-transparent">
                有节奏地向前。
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
              Summer OS
              把生活、健康与备考放进一个清晰的个人系统。少一点追赶，多一点可持续的完成感。
            </p>
            <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
              <Link href="/signup" className={buttonVariants({ size: "lg" })}>
                创建免费账号
                <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
              <Link
                href="/login"
                className={buttonVariants({ variant: "secondary", size: "lg" })}
              >
                我已有账号
              </Link>
            </div>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
              {[
                [LockKeyhole, "邮箱登录"],
                [ShieldCheck, "数据隔离"],
                [Target, "随时导出与删除"],
              ].map(([Icon, label]) => {
                const ItemIcon = Icon as typeof LockKeyhole;
                return (
                  <span
                    key={label as string}
                    className="inline-flex items-center gap-1.5"
                  >
                    <ItemIcon
                      aria-hidden="true"
                      className="size-3.5 text-primary"
                    />
                    {label as string}
                  </span>
                );
              })}
            </div>
          </div>
        </section>

        <section className="px-3 pb-24 sm:px-6 sm:pb-32 lg:px-8">
          <DashboardPreview />
        </section>

        <section
          id="features"
          className="border-y border-border bg-surface-subtle/60 px-4 py-20 sm:px-6 sm:py-28 lg:px-8"
        >
          <div className="mx-auto max-w-7xl">
            <div className="max-w-2xl">
              <p className="text-xs font-bold tracking-[0.16em] text-primary-strong uppercase">
                一个系统，完整视角
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.045em] text-balance sm:text-5xl">
                不是更用力，是更清楚。
              </h2>
              <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
                计划会变化，状态也会起伏。Summer OS
                帮你保留方向，同时给每一天留出真实的弹性。
              </p>
            </div>
            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((feature) => (
                <article
                  key={feature.title}
                  className="group shadow-soft hover:shadow-raised rounded-[1.35rem] border border-border bg-surface p-5 transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-1 hover:border-primary/25 sm:p-6"
                >
                  <span
                    className={cn(
                      "flex size-11 items-center justify-center rounded-2xl transition-transform duration-200 group-hover:scale-105",
                      toneStyles[feature.tone as keyof typeof toneStyles],
                    )}
                  >
                    <feature.icon aria-hidden="true" className="size-5" />
                  </span>
                  <h3 className="mt-5 text-base font-semibold tracking-[-0.025em]">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {feature.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section
          id="principles"
          className="px-4 py-20 sm:px-6 sm:py-28 lg:px-8"
        >
          <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[.8fr_1.2fr] lg:gap-20">
            <div>
              <Badge tone="secondary">为真实状态设计</Badge>
              <h2 className="mt-5 text-3xl font-semibold tracking-[-0.045em] text-balance sm:text-5xl">
                好状态有计划，低状态也有出口。
              </h2>
              <p className="mt-5 text-base leading-7 text-muted-foreground">
                开启“最低可行日”，系统只留下最重要的小任务。你不需要为了保持连续记录而忽略身体信号。
              </p>
              <Link
                href="/signup"
                className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-xl font-semibold text-primary-strong hover:underline hover:underline-offset-4"
              >
                建立我的夏日计划{" "}
                <ChevronRight aria-hidden="true" className="size-4" />
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="shadow-soft rounded-[1.4rem] border border-border bg-surface p-6 sm:row-span-2 sm:p-7">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">今日节奏</p>
                    <p className="mt-1 text-2xl font-semibold tracking-[-0.04em]">
                      稳定推进
                    </p>
                  </div>
                  <div className="flex size-11 items-center justify-center rounded-2xl bg-success-soft text-success">
                    <Sparkles aria-hidden="true" className="size-5" />
                  </div>
                </div>
                <div className="mt-8 space-y-5">
                  <Progress label="必要任务" value={80} />
                  <Progress label="学习时间" value={64} />
                  <Progress label="恢复状态" value={72} />
                </div>
                <div className="mt-8 rounded-xl border border-border bg-surface-subtle p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Clock3
                      aria-hidden="true"
                      className="size-4 text-primary"
                    />
                    下一步
                  </div>
                  <p className="mt-1.5 text-xs leading-5 text-muted-foreground">
                    20:00 · IELTS 错题回顾，25 分钟
                  </p>
                </div>
              </div>
              <div className="shadow-soft rounded-[1.4rem] border border-border bg-linear-to-br from-primary-soft to-surface p-6">
                <Dumbbell
                  aria-hidden="true"
                  className="size-5 text-primary-strong"
                />
                <p className="mt-4 text-base font-semibold">不提供激进处方</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  只呈现你的记录与保守趋势，不生成医疗、热量或训练建议。
                </p>
              </div>
              <div className="shadow-soft rounded-[1.4rem] border border-border bg-linear-to-br from-secondary-soft to-surface p-6">
                <MoonStar
                  aria-hidden="true"
                  className="size-5 text-secondary"
                />
                <p className="mt-4 text-base font-semibold">休息也是计划</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  睡眠、疼痛和精力信号会获得与完成任务同等清晰的关注。
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 pb-20 sm:px-6 sm:pb-28 lg:px-8">
          <div className="noise-surface mx-auto max-w-7xl overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#0d141a] px-6 py-12 text-center text-white shadow-[0_30px_80px_rgb(0_0_0/22%)] sm:px-12 sm:py-16">
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-[#17363d] text-[#55dcec]">
              <Zap aria-hidden="true" className="size-5" />
            </div>
            <h2 className="mx-auto mt-6 max-w-2xl text-3xl font-semibold tracking-[-0.045em] text-balance sm:text-5xl">
              从今天开始，不必等到完美状态。
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-white/55 sm:text-base">
              公开测试版完全免费，适用于年满 18 周岁的个人非商业用户。
            </p>
            <Link
              href="/signup"
              className={cn(buttonVariants({ size: "lg" }), "mt-8")}
            >
              免费创建账号 <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-border px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Brand />
            <p className="mt-2">个人健康与学习管理工具，不构成医疗建议。</p>
          </div>
          <nav
            className="flex flex-wrap items-center gap-x-5 gap-y-3"
            aria-label="页脚导航"
          >
            <Link
              href="/privacy"
              className="min-h-11 py-3 hover:text-foreground"
            >
              隐私说明
            </Link>
            <Link href="/terms" className="min-h-11 py-3 hover:text-foreground">
              使用条款
            </Link>
            <Link
              href="/health"
              className="min-h-11 py-3 hover:text-foreground"
            >
              健康与安全
            </Link>
            <Link
              href="/offline"
              className="min-h-11 py-3 hover:text-foreground"
            >
              离线使用
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
