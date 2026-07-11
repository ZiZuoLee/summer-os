import { assessTargetPace, evaluateHealthAlerts } from "@/lib/health";
import { describe, expect, it } from "vitest";

describe("health guardrails", () => {
  it("warns that the canonical 75 kg aspiration is aggressive without prescribing behavior", () => {
    const result = assessTargetPace(83, 75, "2026-07-13", "2026-08-31");
    expect(result.exceedsOnePercentPerWeek).toBe(true);
    expect(result.message).toContain("愿望");
    expect(result.message).not.toMatch(/卡路里|热量缺口/);
  });

  it("uses self-reported intake concern rather than inferring it from optional calories", () => {
    const logs = Array.from({ length: 7 }, (_, index) => ({
      date: `2026-07-${String(index + 1).padStart(2, "0")}`,
      sleepMinutes: 330,
      intakeConcern: index >= 5,
      dizzinessOrFainting: index === 6,
      painLevel: index === 4 ? 8 : 0,
    }));
    const alerts = evaluateHealthAlerts(logs);
    expect(alerts.map((alert) => alert.kind)).toEqual(
      expect.arrayContaining([
        "LOW_SLEEP",
        "INTAKE_CONCERN",
        "DIZZINESS_OR_FAINTING",
        "SEVERE_PAIN",
      ]),
    );
    expect(
      alerts.find((alert) => alert.kind === "DIZZINESS_OR_FAINTING")?.severity,
    ).toBe("URGENT");
  });

  it("detects seven distinct consecutive high-RPE days", () => {
    const workouts = Array.from({ length: 7 }, (_, index) => ({
      date: `2026-07-${String(index + 1).padStart(2, "0")}`,
      rpe: 8,
    }));
    expect(
      evaluateHealthAlerts([], workouts).map((alert) => alert.kind),
    ).toContain("CONSECUTIVE_HIGH_RPE");
  });
});
