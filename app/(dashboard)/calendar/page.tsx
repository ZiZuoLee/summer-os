import type { Metadata } from "next";
import { CalendarView } from "@/app/(dashboard)/calendar/_components/calendar-view";
import { getCalendarDays } from "@/lib/data/sections";

export const metadata: Metadata = { title: "日历" };

export default async function CalendarPage() {
  const days = await getCalendarDays();
  return (
    <div className="space-y-6">
      <header>
        <p className="section-eyebrow">计划全景</p>
        <h1 className="page-title">每一天都有自己的节奏</h1>
        <p className="page-description">
          月历与议程共享同一份计划。点击日期即可安全编辑，不会影响打卡历史。
        </p>
      </header>
      <CalendarView days={days} />
    </div>
  );
}
