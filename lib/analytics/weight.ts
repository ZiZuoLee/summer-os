import {
  addDateDays,
  differenceInCalendarDays,
  parseDateOnly,
} from "@/lib/seed/date";

export interface WeightReading {
  date: string;
  weightKg: number;
}

export interface RollingWeightPoint {
  date: string;
  averageKg: number | null;
  samples: number;
}

function validReadings(readings: WeightReading[]): WeightReading[] {
  const byDate = new Map<string, number>();
  for (const reading of readings) {
    parseDateOnly(reading.date);
    if (
      Number.isFinite(reading.weightKg) &&
      reading.weightKg >= 30 &&
      reading.weightKg <= 350
    ) {
      byDate.set(reading.date, reading.weightKg);
    }
  }
  return [...byDate.entries()]
    .map(([date, weightKg]) => ({ date, weightKg }))
    .sort((left, right) => left.date.localeCompare(right.date));
}

export function calculateRollingWeightAverage(
  readings: WeightReading[],
  windowDays = 7,
  minimumSamples = 3,
): RollingWeightPoint[] {
  if (!Number.isInteger(windowDays) || windowDays < 1)
    throw new RangeError("windowDays must be positive");
  if (!Number.isInteger(minimumSamples) || minimumSamples < 1) {
    throw new RangeError("minimumSamples must be positive");
  }

  const sorted = validReadings(readings);
  return sorted.map((current) => {
    const start = addDateDays(current.date, -(windowDays - 1));
    const window = sorted.filter(
      (item) => item.date >= start && item.date <= current.date,
    );
    return {
      date: current.date,
      averageKg:
        window.length >= minimumSamples
          ? Number(
              (
                window.reduce((sum, item) => sum + item.weightKg, 0) /
                window.length
              ).toFixed(2),
            )
          : null,
      samples: window.length,
    };
  });
}

function median(values: number[]): number {
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

function theilSenSlope(readings: WeightReading[]): number {
  const slopes: number[] = [];
  for (let left = 0; left < readings.length; left += 1) {
    for (let right = left + 1; right < readings.length; right += 1) {
      const days = differenceInCalendarDays(
        readings[right].date,
        readings[left].date,
      );
      if (days > 0)
        slopes.push(
          (readings[right].weightKg - readings[left].weightKg) / days,
        );
    }
  }
  return median(slopes);
}

export type WeightProjection =
  | {
      available: false;
      reason: "INSUFFICIENT_DATA" | "TARGET_ALREADY_REACHED" | "FLAT_OR_RISING";
      sampleCount: number;
    }
  | {
      available: true;
      projectedDate: string;
      currentTrendKg: number;
      observedWeeklyChangeKg: number;
      safeWeeklyChangeKg: number;
      cappedForSafety: boolean;
      sampleCount: number;
      disclaimer: string;
    };

export function calculateSafeWeightProjection(
  readings: WeightReading[],
  targetWeightKg: number,
): WeightProjection {
  if (
    !Number.isFinite(targetWeightKg) ||
    targetWeightKg < 30 ||
    targetWeightKg > 350
  ) {
    throw new RangeError("targetWeightKg must be between 30 and 350");
  }
  const sorted = validReadings(readings);
  if (sorted.length < 7) {
    return {
      available: false,
      reason: "INSUFFICIENT_DATA",
      sampleCount: sorted.length,
    };
  }

  const mostRecent = sorted.at(-1)!;
  const cutoff = addDateDays(mostRecent.date, -41);
  const recent = sorted.filter((item) => item.date >= cutoff);
  if (
    recent.length < 7 ||
    differenceInCalendarDays(recent.at(-1)!.date, recent[0].date) < 14
  ) {
    return {
      available: false,
      reason: "INSUFFICIENT_DATA",
      sampleCount: recent.length,
    };
  }

  const rolling = calculateRollingWeightAverage(recent);
  const latestAverage = [...rolling]
    .reverse()
    .find((point) => point.averageKg !== null)?.averageKg;
  const currentTrendKg = latestAverage ?? mostRecent.weightKg;
  if (targetWeightKg >= currentTrendKg) {
    return {
      available: false,
      reason: "TARGET_ALREADY_REACHED",
      sampleCount: recent.length,
    };
  }

  const observedDailySlope = theilSenSlope(recent);
  if (observedDailySlope >= -0.005) {
    return {
      available: false,
      reason: "FLAT_OR_RISING",
      sampleCount: recent.length,
    };
  }

  const safeLossPerDay = (currentTrendKg * 0.01) / 7;
  const appliedDailyLoss = Math.min(-observedDailySlope, safeLossPerDay);
  const daysToTarget = Math.ceil(
    (currentTrendKg - targetWeightKg) / appliedDailyLoss,
  );
  const observedWeeklyChangeKg = observedDailySlope * 7;
  const safeWeeklyChangeKg = -appliedDailyLoss * 7;
  return {
    available: true,
    projectedDate: addDateDays(mostRecent.date, daysToTarget),
    currentTrendKg: Number(currentTrendKg.toFixed(2)),
    observedWeeklyChangeKg: Number(observedWeeklyChangeKg.toFixed(2)),
    safeWeeklyChangeKg: Number(safeWeeklyChangeKg.toFixed(2)),
    cappedForSafety: -observedDailySlope > safeLossPerDay,
    sampleCount: recent.length,
    disclaimer: "趋势仅供一般健康追踪参考，不是医疗建议或结果保证。",
  };
}
