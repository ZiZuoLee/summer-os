"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, ChevronLeft, ChevronRight, List } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { CalendarDay } from "@/lib/data/sections";

function monthKey(date: string) {
  return date.slice(0, 7);
}
function monthLabel(key: string) {
  const [year, month] = key.split("-").map(Number);
  return `${year} 年 ${month} 月`;
}
function weekday(date: string) {
  const day = new Date(`${date}T00:00:00Z`).getUTCDay();
  return day === 0 ? 7 : day;
}

const categoryTone: Record<string, string> = {
  BASELINE: "bg-cyan-400/10 text-cyan-700 dark:text-cyan-200",
  INTERNSHIP_PART_TIME: "bg-violet-400/10 text-violet-700 dark:text-violet-200",
  INTERNSHIP_FULL_TIME: "bg-violet-400/10 text-violet-700 dark:text-violet-200",
  COURSE_DAY: "bg-blue-400/10 text-blue-700 dark:text-blue-200",
  WEEKEND_INTENSIVE: "bg-amber-400/10 text-amber-700 dark:text-amber-200",
  WEEKEND_RECOVERY: "bg-emerald-400/10 text-emerald-700 dark:text-emerald-200",
  IELTS_TAPER: "bg-fuchsia-400/10 text-fuchsia-700 dark:text-fuchsia-200",
  EXAM_DAY: "bg-rose-400/10 text-rose-700 dark:text-rose-200",
  FINAL_REVIEW: "bg-cyan-400/10 text-cyan-700 dark:text-cyan-200",
};

export function CalendarView({ days }: { days: CalendarDay[] }) {
  const months = useMemo(
    () => Array.from(new Set(days.map((day) => monthKey(day.date)))),
    [days],
  );
  const [monthIndex, setMonthIndex] = useState(0);
  const [view, setView] = useState<"month" | "agenda">("month");
  const currentMonth = months[monthIndex] ?? "2026-07";
  const visibleDays = days.filter((day) => monthKey(day.date) === currentMonth);
  const pad = visibleDays[0] ? weekday(visibleDays[0].date) - 1 : 0;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            aria-label="上个月"
            disabled={monthIndex === 0}
            onClick={() => setMonthIndex((value) => value - 1)}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <strong className="min-w-30 text-center">
            {monthLabel(currentMonth)}
          </strong>
          <Button
            variant="ghost"
            size="icon"
            aria-label="下个月"
            disabled={monthIndex === months.length - 1}
            onClick={() => setMonthIndex((value) => value + 1)}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
        <div className="flex rounded-xl border border-border bg-surface p-1">
          <button
            className={cn(
              "calendar-toggle",
              view === "month" && "calendar-toggle-active",
            )}
            onClick={() => setView("month")}
          >
            <CalendarDays className="size-4" />
            月历
          </button>
          <button
            className={cn(
              "calendar-toggle",
              view === "agenda" && "calendar-toggle-active",
            )}
            onClick={() => setView("agenda")}
          >
            <List className="size-4" />
            议程
          </button>
        </div>
      </div>
      {view === "month" ? (
        <Card>
          <CardContent className="p-2 sm:p-4">
            <div className="grid grid-cols-7 text-center text-xs font-medium text-muted-foreground">
              {"一二三四五六日".split("").map((day) => (
                <div className="py-3" key={day}>
                  周{day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: pad }).map((_, index) => (
                <div className="min-h-24" key={`pad-${index}`} />
              ))}
              {visibleDays.map((day) => (
                <Link
                  href={`/plan?date=${day.date}`}
                  className="calendar-day"
                  key={day.id}
                >
                  <div className="flex items-start justify-between">
                    <span className="font-semibold tabular-nums">
                      {Number(day.date.slice(-2))}
                    </span>
                    {day.completion ? (
                      <span className="text-[10px] font-bold text-primary-strong">
                        {day.completion}%
                      </span>
                    ) : null}
                  </div>
                  <span
                    className={cn(
                      "mt-2 line-clamp-2 rounded-md px-1.5 py-1 text-[10px] leading-4",
                      categoryTone[day.category] ?? "bg-muted",
                    )}
                  >
                    {day.title}
                  </span>
                  <span className="mt-auto pt-2 text-[10px] text-muted-foreground">
                    {day.taskCount} 项
                  </span>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {visibleDays.map((day) => (
            <Link href={`/plan?date=${day.date}`} key={day.id}>
              <Card className="transition hover:border-primary/30">
                <CardContent className="flex items-center gap-4 pt-5 sm:pt-6">
                  <div className="grid size-13 shrink-0 place-items-center rounded-2xl bg-muted text-center">
                    <strong className="text-lg tabular-nums">
                      {day.date.slice(-2)}
                    </strong>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <strong>{day.title}</strong>
                      <Badge>{day.intensity}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {day.category.replaceAll("_", " ")} · {day.taskCount}{" "}
                      项任务
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-primary-strong">
                    {day.completion}%
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
