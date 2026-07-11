import type { Metadata } from "next";
import {
  BookOpenCheck,
  CalendarClock,
  Headphones,
  MessageCircle,
  PenLine,
  ScanText,
} from "lucide-react";
import { IeltsSessionForm } from "@/app/(dashboard)/ielts/_components/ielts-form";
import { StatCard } from "@/components/dashboard/stat-card";
import { TrendChart } from "@/components/trend-chart";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getIeltsSessions } from "@/lib/data/sections";

export const metadata: Metadata = { title: "IELTS" };
const skillNames: Record<string, string> = {
  LISTENING: "听力",
  READING: "阅读",
  WRITING_TASK_1: "写作 Task 1",
  WRITING_TASK_2: "写作 Task 2",
  SPEAKING: "口语",
  VOCABULARY: "词汇",
  MOCK: "模考",
};

export default async function IeltsPage() {
  const sessions = await getIeltsSessions();
  const total = sessions.reduce((sum, session) => sum + session.minutes, 0);
  const bestBand = Math.max(0, ...sessions.map((session) => session.band ?? 0));
  const bandTrend = sessions
    .filter((session) => session.band != null)
    .map((session) => ({ label: session.date.slice(5), value: session.band! }))
    .reverse();
  const errorLog = sessions.filter((session) => session.mainErrors);
  return (
    <div className="space-y-6">
      <header>
        <p className="section-eyebrow">IELTS 刷新计划</p>
        <h1 className="page-title">把 7.5 找回来，再稳稳向前</h1>
        <p className="page-description">
          先诊断弱项，再通过短循环练习、错误复盘和周末模考恢复状态。
        </p>
      </header>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="累计练习"
          value={`${total} min`}
          detail={`${sessions.length} 次记录`}
          icon={<BookOpenCheck className="size-5" />}
          accent="primary"
        />
        <StatCard
          label="最高估算 Band"
          value={bestBand ? bestBand.toFixed(1) : "待记录"}
          detail="仅供练习趋势参考"
          icon={<ScanText className="size-5" />}
          accent="success"
        />
        <StatCard
          label="考试占位"
          value="2026-08-29"
          detail="待确认，可在设置中修改"
          icon={<CalendarClock className="size-5" />}
          accent="warning"
        />
        <StatCard
          label="本周重点"
          value="准确率"
          detail="短练习 + 错误定位"
          icon={<Headphones className="size-5" />}
          accent="secondary"
        />
      </section>
      <section className="grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>最近练习</CardTitle>
              <CardDescription>每次都留下一个清晰的下一步</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {sessions.length ? (
              sessions.map((session) => (
                <article
                  className="rounded-2xl border border-border bg-surface-subtle p-4"
                  key={session.id}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge tone="primary">
                        {skillNames[session.skill] ?? session.skill}
                      </Badge>
                      <time className="text-xs text-muted-foreground">
                        {session.date}
                      </time>
                    </div>
                    <strong className="text-sm">
                      {session.minutes} min
                      {session.band ? ` · Band ${session.band}` : ""}
                    </strong>
                  </div>
                  {session.nextAction ? (
                    <p className="mt-3 text-sm text-muted-foreground">
                      下一步：{session.nextAction}
                    </p>
                  ) : null}
                </article>
              ))
            ) : (
              <p className="py-14 text-center text-sm text-muted-foreground">
                还没有练习记录。
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div>
              <CardTitle>添加练习</CardTitle>
              <CardDescription>链接仅作为参考，不上传文件</CardDescription>
            </div>
            <PenLine className="size-5 text-primary" />
          </CardHeader>
          <CardContent>
            <IeltsSessionForm />
          </CardContent>
        </Card>
      </section>
      <section className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>模考 / 估算 Band 趋势</CardTitle>
            <CardDescription>练习估算不等同于正式成绩</CardDescription>
          </CardHeader>
          <CardContent>
            <TrendChart title="IELTS Band" data={bandTrend} min={0} max={9} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>错误日志</CardTitle>
            <CardDescription>把重复错误变成下一次练习的输入</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {errorLog.length ? (
              errorLog.slice(0, 6).map((session) => (
                <div
                  className="rounded-xl border border-border p-3"
                  key={`error-${session.id}`}
                >
                  <div className="flex justify-between gap-3 text-xs text-muted-foreground">
                    <span>{skillNames[session.skill] ?? session.skill}</span>
                    <time>{session.date}</time>
                  </div>
                  <p className="mt-2 text-sm">{session.mainErrors}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">还没有错误记录。</p>
            )}
          </CardContent>
        </Card>
      </section>
      <Card>
        <CardHeader>
          <CardTitle>考试准备检查</CardTitle>
          <CardDescription>只做提醒，不会阻止你记录进度</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {[
              "考试日期与考点已确认",
              "完成至少一次完整模考",
              "整理高频错误模式",
              "考前一周降低额外负荷",
            ].map((item) => (
              <label className="check-chip justify-start" key={item}>
                <input type="checkbox" />
                {item}
              </label>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <div>
            <CardTitle>7 周进度</CardTitle>
            <CardDescription>
              工作日短练，周末深练，最后一周减量
            </CardDescription>
          </div>
          <MessageCircle className="size-5 text-secondary" />
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              "重新校准",
              "准确率",
              "输出提升",
              "混合计时",
              "实习适应",
              "考试准备",
              "减量与睡眠",
            ].map((label, index) => (
              <div className="rounded-xl bg-muted p-3" key={label}>
                <span className="text-xs text-muted-foreground">
                  Week {index + 1}
                </span>
                <p className="mt-1 text-sm font-semibold">{label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
