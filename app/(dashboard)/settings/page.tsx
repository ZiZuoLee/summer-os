import Link from "next/link";
import {
  BookOpenCheck,
  CalendarCog,
  FileDown,
  GraduationCap,
  Settings2,
  Sparkles,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { getSettingsProfile } from "@/lib/data/sections";
import { SettingsForms } from "./_components/settings-forms";

export const metadata = { title: "设置与数据" };

export default async function SettingsPage() {
  const profile = await getSettingsProfile();
  const tools = [
    { href: "/ielts", label: "IELTS 记录", icon: BookOpenCheck },
    { href: "/gre", label: "GRE 决策", icon: GraduationCap },
    { href: "/weekly-review", label: "每周复盘", icon: CalendarCog },
    { href: "/plan", label: "计划编辑", icon: Sparkles },
    { href: "/export", label: "导出数据", icon: FileDown },
  ];
  return (
    <div className="grid gap-5">
      <header className="hero-panel">
        <div>
          <p className="section-eyebrow">CONTROL CENTER</p>
          <h1 className="page-title">设置与数据</h1>
          <p className="page-description">
            控制你的目标、时区、界面、导出与账户生命周期。
          </p>
        </div>
        <Settings2 className="size-8 text-primary" />
      </header>
      <nav
        className="grid grid-cols-2 gap-3 sm:grid-cols-4"
        aria-label="更多工具"
      >
        {tools.map(({ href, label, icon: Icon }) => (
          <Link href={href} key={href}>
            <Card className="h-full transition-colors hover:border-primary/35">
              <CardContent className="flex min-h-24 flex-col justify-between pt-5">
                <Icon className="size-5 text-primary" />
                <span className="text-sm font-semibold">{label}</span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </nav>
      <SettingsForms profile={profile} />
    </div>
  );
}
