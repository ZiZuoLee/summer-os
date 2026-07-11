import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/supabase/server";
import { getTodayDashboard } from "@/lib/data/today";
import { CheckInForm } from "@/app/(dashboard)/check-in/_components/check-in-form";

export const metadata: Metadata = { title: "每日打卡" };

export default async function CheckInPage() {
  const [dashboard, user] = await Promise.all([
    getTodayDashboard(),
    getCurrentUser(),
  ]);
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <p className="section-eyebrow">每日打卡 · 约 2 分钟</p>
        <h1 className="page-title">今天，真实地记录就好</h1>
        <p className="page-description">
          所有指标都可以跳过。连续记录比一次完美更有价值。
        </p>
      </header>
      <CheckInForm date={dashboard.date} userKey={user?.id ?? "demo"} />
    </div>
  );
}
