import type { Metadata } from "next";
import Link from "next/link";
import {
  Activity,
  BookOpenCheck,
  CalendarCheck2,
  Footprints,
  MoonStar,
  Scale,
  ShieldCheck,
} from "lucide-react";
import { AlertCard } from "@/components/dashboard/alert-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { TrendChart } from "@/components/trend-chart";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getAnalyticsData } from "@/lib/data/sections";

export const metadata: Metadata = { title: "数据分析" };

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; from?: string; to?: string }>;
}) {
  const params = await searchParams;
  const range = ["7", "30", "plan", "custom"].includes(params.range ?? "")
    ? params.range!
    : "30";
  const validDate = (value?: string) => /^\d{4}-\d{2}-\d{2}$/.test(value ?? "");
  const data = await getAnalyticsData(
    range === "custom" && validDate(params.from) && validDate(params.to)
      ? { from: params.from, to: params.to }
      : { limit: range === "7" ? 7 : range === "30" ? 30 : 120 },
  );
  const projectionText = data.projection.available
    ? `按安全展示速度 ${Math.abs(data.projection.safeWeeklyChangeKg).toFixed(2)} kg/周，愿景日期约为 ${data.projection.projectedDate}${data.projection.cappedForSafety ? "；观察速度已超过 1%/周上限，因此已收窄展示" : ""}。`
    : data.projection.reason === "INSUFFICIENT_DATA"
      ? `需要至少跨 14 天的 7 次有效体重记录；当前 ${data.projection.sampleCount} 次。`
      : data.projection.reason === "FLAT_OR_RISING"
        ? "近期趋势平稳或上升，不生成虚假的到达日期。"
        : "当前趋势已经达到该愿景，不再外推日期。";
  return (
    <div className="space-y-6">
      <header>
        <p className="section-eyebrow">趋势，不是审判</p>
        <h1 className="page-title">看见长期变化</h1>
        <p className="page-description">
          所有相关性都只是描述性的。样本不足时，我们宁愿不做预测。
        </p>
      </header>
      <section
        className="flex flex-wrap items-end gap-3 rounded-2xl border border-border bg-surface p-3"
        aria-label="分析范围"
      >
        <nav className="flex flex-wrap gap-1" aria-label="快速范围">
          {[
            ["7", "最近 7 次"],
            ["30", "最近 30 次"],
            ["plan", "当前计划"],
          ].map(([value, label]) => (
            <Link
              key={value}
              href={`/analytics?range=${value}`}
              aria-current={range === value ? "page" : undefined}
              className={`inline-flex min-h-11 items-center rounded-xl px-3 text-sm font-semibold ${range === value ? "bg-primary-soft text-primary-strong" : "text-muted-foreground hover:bg-muted"}`}
            >
              {label}
            </Link>
          ))}
        </nav>
        <form className="ml-auto flex flex-wrap items-end gap-2" method="get">
          <input type="hidden" name="range" value="custom" />
          <label className="form-field">
            从<input type="date" name="from" defaultValue={params.from} />
          </label>
          <label className="form-field">
            到<input type="date" name="to" defaultValue={params.to} />
          </label>
          <button
            className="inline-flex min-h-11 items-center rounded-xl border border-border-strong bg-surface-raised px-4 text-sm font-semibold hover:bg-muted"
            type="submit"
          >
            应用
          </button>
        </form>
      </section>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="计划完成度"
          value={`${data.completionPercent}%`}
          detail="必做任务按 2 倍权重"
          icon={<Activity className="size-5" />}
          accent="primary"
        />
        <StatCard
          label="最新体重"
          value={data.latestWeight ? `${data.latestWeight} kg` : "样本不足"}
          detail={
            data.weightChange == null
              ? "需要至少 2 次记录"
              : `累计变化 ${data.weightChange > 0 ? "+" : ""}${data.weightChange} kg`
          }
          icon={<Scale className="size-5" />}
          accent="primary"
        />
        <StatCard
          label="平均步数"
          value={data.averageSteps?.toLocaleString("zh-CN") ?? "样本不足"}
          detail={`${data.sampleCount} 个记录日`}
          icon={<Footprints className="size-5" />}
          accent="success"
        />
        <StatCard
          label="平均睡眠"
          value={data.averageSleep ? `${data.averageSleep} h` : "样本不足"}
          detail="少于 6 小时会触发温和提醒"
          icon={<MoonStar className="size-5" />}
          accent="secondary"
        />
        <StatCard
          label="IELTS 总时长"
          value={`${data.ieltsMinutes} min`}
          detail={`${data.workouts} 次训练记录`}
          icon={<BookOpenCheck className="size-5" />}
          accent="warning"
        />
      </section>
      <section className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>体重趋势</CardTitle>
              <CardDescription>
                只在至少 3 次读数后计算 7 日均值
              </CardDescription>
            </div>
            <Scale className="size-5 text-primary" />
          </CardHeader>
          <CardContent>
            <TrendChart title="体重" unit=" kg" data={data.weights} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div>
              <CardTitle>步数趋势</CardTitle>
              <CardDescription>关注一周平均，而不是单日波动</CardDescription>
            </div>
            <Footprints className="size-5 text-success" />
          </CardHeader>
          <CardContent>
            <TrendChart title="步数" data={data.steps} min={0} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div>
              <CardTitle>睡眠趋势</CardTitle>
              <CardDescription>连续恢复是执行力的一部分</CardDescription>
            </div>
            <MoonStar className="size-5 text-secondary" />
          </CardHeader>
          <CardContent>
            <TrendChart
              title="睡眠"
              unit=" h"
              data={data.sleep}
              min={0}
              max={10}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div>
              <CardTitle>心情趋势</CardTitle>
              <CardDescription>不用于因果推断或医疗判断</CardDescription>
            </div>
            <Activity className="size-5 text-warning" />
          </CardHeader>
          <CardContent>
            <TrendChart title="心情" data={data.mood} min={0} max={5} />
          </CardContent>
        </Card>
      </section>
      <section className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>IELTS 技能分布</CardTitle>
            <CardDescription>按实际学习分钟汇总</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {data.ieltsBySkill.length ? (
              data.ieltsBySkill.map((item) => (
                <div
                  key={item.skill}
                  className="grid grid-cols-[7rem_1fr_auto] items-center gap-3 text-sm"
                >
                  <span>{item.skill.replaceAll("_", " ")}</span>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{
                        width: `${Math.max(4, Math.round((item.minutes / Math.max(...data.ieltsBySkill.map((entry) => entry.minutes))) * 100))}%`,
                      }}
                    />
                  </div>
                  <strong className="tabular-nums">{item.minutes}m</strong>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">暂无 IELTS 记录。</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>睡眠与心情</CardTitle>
            <CardDescription>描述性相关，不代表因果</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold tabular-nums">
              {data.sleepMoodCorrelation.available
                ? data.sleepMoodCorrelation.coefficient.toFixed(2)
                : "—"}
            </p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {data.sleepMoodCorrelation.available
                ? data.sleepMoodCorrelation.disclaimer
                : `至少需要 10 组成对记录；当前 ${data.sleepMoodCorrelation.sampleCount} 组。`}
            </p>
          </CardContent>
        </Card>
      </section>
      <div className="grid gap-4 lg:grid-cols-2">
        <AlertCard title="愿景趋势" tone="primary">
          <div className="flex gap-3">
            <CalendarCheck2 className="mt-0.5 size-5 shrink-0" />
            <p>{projectionText} 这不是结果保证或医疗建议。</p>
          </div>
        </AlertCard>
        <AlertCard title="安全预测规则" tone="primary">
          <div className="flex gap-3">
            <ShieldCheck className="mt-0.5 size-5 shrink-0" />
            <p>
              目标日期预测需要至少 14 天和 7
              次体重记录，并把展示的减重速度限制在最新平均体重的每周
              1%。趋势平稳或上升时不会给出虚假的到达日期。
            </p>
          </div>
        </AlertCard>
      </div>
    </div>
  );
}
