import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BookOpenCheck,
  CalendarClock,
  Footprints,
  MoonStar,
  Scale,
  Sparkles,
} from "lucide-react";
import { AlertCard } from "@/components/dashboard/alert-card";
import { MetricRing } from "@/components/dashboard/metric-ring";
import { StatCard } from "@/components/dashboard/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getTodayDashboard } from "@/lib/data/today";
import {
  acknowledgeHealthAlertAction,
  setMinimumModeAction,
} from "@/app/(dashboard)/actions";
import { TodayTaskList } from "@/app/(dashboard)/today/_components/today-task-list";

export const metadata: Metadata = { title: "今日" };

function displayDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
    timeZone: "UTC",
  }).format(date);
}

export default async function TodayPage() {
  const data = await getTodayDashboard();
  return (
    <div className="space-y-6">
      <section className="hero-panel overflow-hidden">
        <div className="hero-panel-glow" aria-hidden="true" />
        <div className="relative grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="primary">
                {data.plan.category.replaceAll("_", " ")}
              </Badge>
              <Badge
                tone={data.plan.intensity === "HIGH" ? "warning" : "neutral"}
              >
                {data.plan.intensity}
              </Badge>
              {data.isPreviewDate ? (
                <Badge tone="warning">下一计划日预览</Badge>
              ) : null}
            </div>
            <p className="mt-5 text-sm font-medium text-muted-foreground">
              {displayDate(data.date)} · {data.profile.timezone}
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
              早上好，{data.profile.displayName}。<br />
              <span className="text-gradient">{data.plan.title}</span>
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
              {data.plan.summary}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                className={cn(buttonVariants({ variant: "primary" }))}
                href="/check-in"
              >
                <Sparkles className="size-4" />
                快速打卡
                <ArrowRight className="size-4" />
              </Link>
              <form action={setMinimumModeAction}>
                <input type="hidden" name="planId" value={data.plan.id} />
                <input
                  type="hidden"
                  name="enabled"
                  value={String(!data.plan.minimumModeEnabled)}
                />
                <Button type="submit" variant="secondary">
                  {data.plan.minimumModeEnabled
                    ? "恢复完整计划"
                    : "开启最低完成版"}
                </Button>
              </form>
            </div>
          </div>
          <MetricRing
            value={data.metrics.completion}
            label="今日完成度"
            detail="必做任务按 2 倍权重"
            size="lg"
          />
        </div>
      </section>

      <section
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
        aria-label="今日概览"
      >
        <StatCard
          label="最新体重"
          value={
            data.metrics.latestWeightKg
              ? `${data.metrics.latestWeightKg} kg`
              : "待记录"
          }
          detail={
            data.metrics.sevenDayWeightKg
              ? `7 日均值 ${data.metrics.sevenDayWeightKg} kg`
              : "至少 3 次记录后显示均值"
          }
          icon={<Scale className="size-5" />}
          accent="primary"
        />
        <StatCard
          label="今日步数"
          value={data.metrics.todaySteps?.toLocaleString("zh-CN") ?? "待记录"}
          detail="目标 10,000 步"
          icon={<Footprints className="size-5" />}
          accent="success"
        />
        <StatCard
          label="昨夜睡眠"
          value={
            data.metrics.todaySleepHours
              ? `${data.metrics.todaySleepHours} h`
              : "待记录"
          }
          detail="目标 7.5 小时"
          icon={<MoonStar className="size-5" />}
          accent="secondary"
        />
        <StatCard
          label="本周 IELTS"
          value={`${data.metrics.ieltsMinutesThisWeek} min`}
          detail="短而专注也算进步"
          icon={<BookOpenCheck className="size-5" />}
          accent="warning"
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(300px,.75fr)]">
        <TodayTaskList
          tasks={data.tasks}
          minimumMode={data.plan.minimumModeEnabled}
        />
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>下一步 IELTS</CardTitle>
                <CardDescription>根据最近一次记录自动衔接</CardDescription>
              </div>
              <BookOpenCheck className="size-5 text-primary" />
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-6 font-medium">
                {data.nextIeltsAction}
              </p>
              <Link
                className="mt-4 inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-primary-strong"
                href="/ielts"
              >
                查看学习面板
                <ArrowRight className="size-4" />
              </Link>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <div>
                <CardTitle>日程节奏</CardTitle>
                <CardDescription>
                  先守住固定承诺，再安排额外目标
                </CardDescription>
              </div>
              <CalendarClock className="size-5 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">高强度连续天数</span>
                  <strong>0 / 3</strong>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">当前连续打卡</span>
                  <strong>{data.metrics.streak} 天</strong>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {data.alerts.length ? (
        <section className="grid gap-4 md:grid-cols-2" aria-label="提醒">
          {data.alerts.map((alert) => (
            <AlertCard
              key={alert.id}
              title={alert.title}
              tone={alert.tone === "info" ? "primary" : alert.tone}
            >
              <p>{alert.description}</p>
              <form action={acknowledgeHealthAlertAction} className="mt-3">
                <input type="hidden" name="alertId" value={alert.id} />
                <Button type="submit" variant="ghost" size="sm">
                  我已阅读
                </Button>
              </form>
            </AlertCard>
          ))}
        </section>
      ) : null}
    </div>
  );
}
