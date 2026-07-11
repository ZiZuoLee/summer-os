import { BookOpenCheck } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getAnalyticsData,
  getSettingsProfile,
  getWeeklyReviewData,
} from "@/lib/data/sections";
import { WeeklyReviewForm } from "./_components/weekly-review-form";

export const metadata = { title: "每周复盘" };

function weekStart(timezone: string) {
  const local = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const date = new Date(`${local}T12:00:00Z`);
  const offset = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - offset);
  return date.toISOString().slice(0, 10);
}

export default async function WeeklyReviewPage() {
  const profile = await getSettingsProfile();
  const monday = weekStart(profile.timezone);
  const [review, analytics] = await Promise.all([
    getWeeklyReviewData(monday),
    getAnalyticsData(),
  ]);
  return (
    <div className="grid gap-5">
      <header className="hero-panel">
        <div>
          <p className="section-eyebrow">WEEKLY RESET</p>
          <h1 className="page-title">每周复盘</h1>
          <p className="page-description">
            从真实记录调整下一周，不用用意志力惩罚自己。
          </p>
        </div>
        <BookOpenCheck className="size-8 text-primary" />
      </header>
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground">打卡样本</p>
            <p className="mt-1 text-2xl font-bold tabular-nums">
              {analytics.sampleCount}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground">运动记录</p>
            <p className="mt-1 text-2xl font-bold tabular-nums">
              {analytics.workouts}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground">IELTS 分钟</p>
            <p className="mt-1 text-2xl font-bold tabular-nums">
              {analytics.ieltsMinutes}
            </p>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{monday} 开始的一周</CardTitle>
          <CardDescription>复盘可以反复保存；记录只对你可见。</CardDescription>
        </CardHeader>
        <CardContent>
          <WeeklyReviewForm review={review} />
        </CardContent>
      </Card>
    </div>
  );
}
