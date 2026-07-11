import Link from "next/link";
import { Download, FileJson, FileSpreadsheet, ShieldCheck } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export const metadata = { title: "导出数据" };

export default function ExportPage() {
  return (
    <div className="grid gap-5">
      <header className="hero-panel">
        <div>
          <p className="section-eyebrow">DATA PORTABILITY</p>
          <h1 className="page-title">导出你的数据</h1>
          <p className="page-description">
            免费公测没有托管备份或 SLA。请定期保留一份由你控制的副本。
          </p>
        </div>
        <Download className="size-8 text-primary" />
      </header>
      <div className="grid gap-5 md:grid-cols-2">
        <Card>
          <CardHeader>
            <FileJson className="size-6 text-primary" />
            <CardTitle>完整 JSON</CardTitle>
            <CardDescription>
              包含个人设置、计划、任务、打卡、运动、IELTS、GRE、复盘与提醒。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <a
              href="/api/export?format=json"
              className={cn(buttonVariants({ width: "full" }))}
            >
              <Download className="size-4" />
              下载完整备份
            </a>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <FileSpreadsheet className="size-6 text-secondary" />
            <CardTitle>打卡 CSV</CardTitle>
            <CardDescription>
              适合在 Excel、Numbers 或分析工具中查看；危险公式前缀会自动转义。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <a
              href="/api/export?format=csv"
              className={cn(
                buttonVariants({ variant: "secondary", width: "full" }),
              )}
            >
              <Download className="size-4" />
              下载打卡表格
            </a>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardContent className="flex gap-3 pt-5">
          <ShieldCheck className="mt-0.5 size-5 shrink-0 text-success" />
          <div>
            <p className="text-sm font-semibold">私有、即时、不缓存</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              导出请求经过登录验证与 RLS，响应使用{" "}
              <code>private, no-store</code>
              。应用不会把导出文件上传到第三方存储。
            </p>
          </div>
        </CardContent>
      </Card>
      <Link href="/settings" className={buttonVariants({ variant: "ghost" })}>
        返回设置
      </Link>
    </div>
  );
}
