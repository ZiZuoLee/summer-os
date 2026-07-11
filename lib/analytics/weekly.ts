import { addDateDays, dayOfWeek, parseDateOnly } from "@/lib/seed/date";

export interface DailyAnalyticsRecord {
  date: string;
  weightKg?: number | null;
  sleepMinutes?: number | null;
  steps?: number | null;
  ieltsMinutes?: number | null;
  completedTaskWeight?: number;
  totalTaskWeight?: number;
}

export interface WeeklyAggregate {
  weekStartDate: string;
  daysWithLogs: number;
  averageWeightKg: number | null;
  averageSleepMinutes: number | null;
  averageSteps: number | null;
  ieltsMinutes: number;
  completionPercent: number | null;
}

function mondayFor(date: string): string {
  parseDateOnly(date);
  const weekday = dayOfWeek(date);
  return addDateDays(date, weekday === 0 ? -6 : 1 - weekday);
}

function average(values: number[]): number | null {
  return values.length
    ? Number(
        (values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(
          2,
        ),
      )
    : null;
}

export function aggregateByWeek(
  records: DailyAnalyticsRecord[],
): WeeklyAggregate[] {
  const weeks = new Map<string, DailyAnalyticsRecord[]>();
  for (const record of records) {
    const key = mondayFor(record.date);
    weeks.set(key, [...(weeks.get(key) ?? []), record]);
  }

  return [...weeks.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([weekStartDate, items]) => {
      const completed = items.reduce(
        (sum, item) => sum + (item.completedTaskWeight ?? 0),
        0,
      );
      const total = items.reduce(
        (sum, item) => sum + (item.totalTaskWeight ?? 0),
        0,
      );
      return {
        weekStartDate,
        daysWithLogs: new Set(items.map((item) => item.date)).size,
        averageWeightKg: average(
          items.flatMap((item) =>
            item.weightKg == null ? [] : [item.weightKg],
          ),
        ),
        averageSleepMinutes: average(
          items.flatMap((item) =>
            item.sleepMinutes == null ? [] : [item.sleepMinutes],
          ),
        ),
        averageSteps: average(
          items.flatMap((item) => (item.steps == null ? [] : [item.steps])),
        ),
        ieltsMinutes: items.reduce(
          (sum, item) => sum + (item.ieltsMinutes ?? 0),
          0,
        ),
        completionPercent:
          total === 0 ? null : Math.round((completed / total) * 100),
      };
    });
}
