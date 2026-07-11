import {
  aggregateByWeek,
  calculateCompletionScore,
  calculateCorrelation,
  calculateRollingWeightAverage,
  calculateSafeWeightProjection,
} from "@/lib/analytics";
import { describe, expect, it } from "vitest";

describe("completion analytics", () => {
  it("weights required tasks twice and keeps the calculation transparent", () => {
    expect(
      calculateCompletionScore([
        { required: true, status: "COMPLETED" },
        { required: true, status: "PENDING" },
        { required: false, status: "COMPLETED" },
      ]),
    ).toEqual({
      completedWeight: 3,
      totalWeight: 5,
      percent: 60,
      completedTasks: 2,
      totalTasks: 3,
    });
  });
});

describe("weight analytics", () => {
  it("requires three readings for a seven-day rolling average", () => {
    const points = calculateRollingWeightAverage([
      { date: "2026-07-01", weightKg: 83 },
      { date: "2026-07-03", weightKg: 82.8 },
      { date: "2026-07-06", weightKg: 82.6 },
    ]);
    expect(points[1].averageKg).toBeNull();
    expect(points[2]).toEqual({
      date: "2026-07-06",
      averageKg: 82.8,
      samples: 3,
    });
  });

  it("withholds projections without 14 days and seven readings", () => {
    expect(
      calculateSafeWeightProjection(
        Array.from({ length: 7 }, (_, index) => ({
          date: `2026-07-${String(index + 1).padStart(2, "0")}`,
          weightKg: 83 - index * 0.1,
        })),
        75,
      ),
    ).toEqual({
      available: false,
      reason: "INSUFFICIENT_DATA",
      sampleCount: 7,
    });
  });

  it("uses a robust trend and caps displayed loss at one percent weekly", () => {
    const result = calculateSafeWeightProjection(
      Array.from({ length: 15 }, (_, index) => ({
        date: `2026-07-${String(index + 1).padStart(2, "0")}`,
        weightKg: 83 - index * 0.22,
      })),
      75,
    );
    expect(result.available).toBe(true);
    if (result.available) {
      expect(result.cappedForSafety).toBe(true);
      expect(Math.abs(result.safeWeeklyChangeKg)).toBeLessThanOrEqual(
        result.currentTrendKg * 0.0101,
      );
      expect(result.projectedDate).toMatch(/^2026-/);
    }
  });

  it("returns no target date for a flat or rising trend", () => {
    const result = calculateSafeWeightProjection(
      Array.from({ length: 15 }, (_, index) => ({
        date: `2026-07-${String(index + 1).padStart(2, "0")}`,
        weightKg: 82 + index * 0.02,
      })),
      75,
    );
    expect(result).toEqual({
      available: false,
      reason: "FLAT_OR_RISING",
      sampleCount: 15,
    });
  });
});

describe("weekly and correlation analytics", () => {
  it("groups weeks from Monday and preserves missing metrics", () => {
    const weeks = aggregateByWeek([
      {
        date: "2026-07-13",
        sleepMinutes: 420,
        ieltsMinutes: 30,
        completedTaskWeight: 3,
        totalTaskWeight: 5,
      },
      {
        date: "2026-07-19",
        sleepMinutes: 360,
        ieltsMinutes: 20,
        completedTaskWeight: 5,
        totalTaskWeight: 5,
      },
      { date: "2026-07-20", sleepMinutes: null, ieltsMinutes: 10 },
    ]);
    expect(weeks).toHaveLength(2);
    expect(weeks[0]).toEqual(
      expect.objectContaining({
        weekStartDate: "2026-07-13",
        averageSleepMinutes: 390,
        ieltsMinutes: 50,
        completionPercent: 80,
      }),
    );
    expect(weeks[1].averageSleepMinutes).toBeNull();
  });

  it("requires ten pairs and labels output as non-causal", () => {
    expect(
      calculateCorrelation(
        Array.from({ length: 9 }, (_, index) => ({ x: index, y: index })),
      ),
    ).toEqual({
      available: false,
      reason: "INSUFFICIENT_DATA",
      sampleCount: 9,
    });
    const result = calculateCorrelation(
      Array.from({ length: 10 }, (_, index) => ({ x: index, y: index * 2 })),
    );
    expect(result.available).toBe(true);
    if (result.available) {
      expect(result.coefficient).toBe(1);
      expect(result.disclaimer).toContain("不代表因果");
    }
  });
});
