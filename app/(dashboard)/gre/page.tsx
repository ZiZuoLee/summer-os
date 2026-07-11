import type { Metadata } from "next";
import { ExternalLink, GraduationCap, HelpCircle } from "lucide-react";
import { GreDecisionForm } from "@/app/(dashboard)/gre/_components/gre-decision-form";
import { GreProgramForm } from "@/app/(dashboard)/gre/_components/gre-form";
import { AlertCard } from "@/components/dashboard/alert-card";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getGreDecision, getGrePrograms } from "@/lib/data/sections";

export const metadata: Metadata = { title: "GRE 决策" };
const statusName: Record<string, string> = {
  REQUIRED: "必须",
  OPTIONAL: "可选",
  NOT_REQUIRED: "不要求",
  NOT_ACCEPTED: "不接受",
  UNKNOWN: "待核验",
};

export default async function GrePage() {
  const [programs, decision] = await Promise.all([
    getGrePrograms(),
    getGreDecision(),
  ]);
  return (
    <div className="space-y-6">
      <header>
        <p className="section-eyebrow">基于事实再决定</p>
        <h1 className="page-title">GRE 是否值得准备？</h1>
        <p className="page-description">
          Summer OS
          不会虚构学校要求。所有结论都必须来自你保存的官网链接和核验日期。
        </p>
      </header>
      <AlertCard title="决策原则" tone="primary">
        先列出目标项目，再看 GRE
        是必须、可选、不要求还是不接受；最后比较时间成本与
        GPA、项目、研究和申请材料的机会成本。
      </AlertCard>
      <section className="grid gap-5 xl:grid-cols-[1.2fr_.8fr]">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>项目研究表</CardTitle>
              <CardDescription>
                {programs.length} 个项目 · 最终决策日期 2026-08-30
              </CardDescription>
            </div>
            <GraduationCap className="size-5 text-primary" />
          </CardHeader>
          <CardContent className="space-y-3">
            {programs.map((program) => (
              <article
                className="rounded-2xl border border-border p-4"
                key={program.id}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">{program.university}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {program.program}
                    </p>
                  </div>
                  <Badge
                    tone={
                      program.status === "REQUIRED"
                        ? "warning"
                        : program.status === "NOT_REQUIRED"
                          ? "success"
                          : "neutral"
                    }
                  >
                    {statusName[program.status] ?? program.status}
                  </Badge>
                </div>
                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
                  {program.deadline ? (
                    <span>截止：{program.deadline}</span>
                  ) : null}
                  {program.verifiedDate ? (
                    <span>核验：{program.verifiedDate}</span>
                  ) : null}
                  {program.url ? (
                    <a
                      className="inline-flex items-center gap-1 text-primary-strong hover:underline"
                      href={program.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      官网
                      <ExternalLink className="size-3" />
                    </a>
                  ) : null}
                </div>
              </article>
            ))}
            {!programs.length ? (
              <p className="py-16 text-center text-sm text-muted-foreground">
                先添加第一个目标项目。
              </p>
            ) : null}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div>
              <CardTitle>添加研究记录</CardTitle>
              <CardDescription>只保存 HTTPS 官方链接</CardDescription>
            </div>
            <HelpCircle className="size-5 text-secondary" />
          </CardHeader>
          <CardContent>
            <GreProgramForm />
          </CardContent>
        </Card>
      </section>
      <Card>
        <CardHeader>
          <CardTitle>最终决定检查</CardTitle>
          <CardDescription>
            清单未完成也可以暂存 DEFER；决定与依据会绑定到当前计划周期。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <GreDecisionForm value={decision} />
        </CardContent>
      </Card>
    </div>
  );
}
