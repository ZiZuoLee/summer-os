import {
  generateFlexPlan,
  generateKiritoPlan,
  KIRITO_END_DATE,
  KIRITO_START_DATE,
  localDateAt,
  toSeedPlanRpcArgs,
} from "@/lib/seed";
import { describe, expect, it } from "vitest";

describe("kirito-summer-2026@1", () => {
  it("creates the exact contiguous 50-day fixture and agreed category totals", () => {
    const plan = generateKiritoPlan();
    expect(plan.days).toHaveLength(50);
    expect(plan.days[0].date).toBe(KIRITO_START_DATE);
    expect(plan.days.at(-1)?.date).toBe(KIRITO_END_DATE);
    expect(new Set(plan.days.map((day) => day.date)).size).toBe(50);

    const counts = Object.groupBy(plan.days, (day) => day.category);
    expect(counts.BASELINE).toHaveLength(1);
    expect(counts.INTERNSHIP_PART_TIME).toHaveLength(11);
    expect(counts.COURSE_DAY).toHaveLength(8);
    expect(counts.WEEKEND_INTENSIVE).toHaveLength(6);
    expect(counts.WEEKEND_RECOVERY).toHaveLength(6);
    expect(counts.INTERNSHIP_FULL_TIME).toHaveLength(10);
    expect(counts.IELTS_TAPER).toHaveLength(6);
    expect(counts.EXAM_DAY).toHaveLength(1);
    expect(counts.FINAL_REVIEW).toHaveLength(1);
  });

  it("retains commitments under special-category precedence", () => {
    const days = generateKiritoPlan().days;
    const july13 = days.find((day) => day.date === "2026-07-13")!;
    expect(july13.category).toBe("BASELINE");
    expect(july13.commitments).toContainEqual(
      expect.objectContaining({
        kind: "INTERNSHIP",
        startTime: "09:00",
        endTime: "17:30",
      }),
    );

    const beforeTransitionInternships = days
      .filter((day) => day.date < "2026-08-08")
      .flatMap((day) => day.commitments)
      .filter((item) => item.kind === "INTERNSHIP");
    const afterTransitionInternships = days
      .filter((day) => day.date >= "2026-08-08")
      .flatMap((day) => day.commitments)
      .filter((item) => item.kind === "INTERNSHIP");
    expect(beforeTransitionInternships).toHaveLength(12);
    expect(afterTransitionInternships).toHaveLength(16);
  });

  it("includes meaningful special days and avoids prolonged high intensity", () => {
    const days = generateKiritoPlan().days;
    const specialTaskKeys = new Set(
      days.flatMap((day) => day.tasks.map((task) => task.seedKey)),
    );
    expect(specialTaskKeys).toContain("2026-07-19:first-weekly-review");
    expect(specialTaskKeys).toContain("2026-08-07:course-closeout");
    expect(specialTaskKeys).toContain("2026-08-23:exam-readiness-review");
    expect(specialTaskKeys).toContain("2026-08-30:gre-final-decision");
    expect(specialTaskKeys).toContain("2026-08-31:summer-retrospective");

    let highRun = 0;
    for (const day of days) {
      highRun = day.intensity === "HIGH" ? highRun + 1 : 0;
      expect(highRun).toBeLessThanOrEqual(3);
      expect(new Set(day.tasks.map((task) => task.seedKey)).size).toBe(
        day.tasks.length,
      );
    }
  });

  it("is deterministic and maps to the RPC wire contract", () => {
    const first = generateKiritoPlan();
    const second = generateKiritoPlan();
    expect(first).toEqual(second);
    expect(first.payloadHash).toMatch(/^fnv1a64:[a-f0-9]{16}$/);
    const rpc = toSeedPlanRpcArgs(
      first,
      "2fd22249-8839-4dd4-bff4-90ad9d285d9f",
    );
    expect(rpc.p_days).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          date: "2026-07-13",
          commitments: expect.arrayContaining([
            expect.objectContaining({ seed_key: "2026-07-13:internship" }),
          ]),
        }),
      ]),
    );
  });
});

describe("summer-os-flex@1", () => {
  it("generates recurring commitments with first/last-day precedence", () => {
    const plan = generateFlexPlan({
      startDate: "2026-09-07",
      endDate: "2026-09-20",
      timezone: "Asia/Singapore",
      commitments: [
        {
          id: "work",
          title: "实习",
          kind: "INTERNSHIP",
          daysOfWeek: [1, 2, 3, 4, 5],
          startTime: "09:00",
          endTime: "17:30",
        },
      ],
    });
    expect(plan.days).toHaveLength(14);
    expect(plan.days[0].category).toBe("BASELINE");
    expect(plan.days.at(-1)?.category).toBe("FINAL_REVIEW");
    expect(plan.days.find((day) => day.date === "2026-09-08")?.category).toBe(
      "INTERNSHIP_FULL_TIME",
    );
  });

  it("rejects invalid range, timezone, and local times", () => {
    expect(() =>
      generateFlexPlan({
        startDate: "2026-01-01",
        endDate: "2026-01-05",
        timezone: "UTC",
      }),
    ).toThrow(/7 to 120/);
    expect(() =>
      generateFlexPlan({
        startDate: "2026-01-01",
        endDate: "2026-01-07",
        timezone: "Mars/Olympus",
      }),
    ).toThrow(/timezone/i);
    expect(() =>
      generateFlexPlan({
        startDate: "2026-01-01",
        endDate: "2026-01-07",
        timezone: "UTC",
        commitments: [
          {
            id: "bad",
            title: "Bad",
            kind: "PERSONAL",
            daysOfWeek: [1],
            startTime: "17:00",
            endTime: "09:00",
          },
        ],
      }),
    ).toThrow(/end after start/i);
    expect(() =>
      generateFlexPlan({
        startDate: "2026-01-01",
        endDate: "2026-01-07",
        timezone: "UTC",
        specialEvents: [
          {
            id: "partial-time",
            title: "Timed event",
            date: "2026-01-03",
            category: "FLEX_DAY",
            startTime: "09:00",
          },
        ],
      }),
    ).toThrow(/start and later end/i);
  });
});

describe("timezone calendar boundaries", () => {
  it("derives local dates without relying on the process timezone", () => {
    const instant = "2026-07-13T16:30:00.000Z";
    expect(localDateAt(instant, "Asia/Shanghai")).toBe("2026-07-14");
    expect(localDateAt(instant, "America/Los_Angeles")).toBe("2026-07-13");
  });
});
