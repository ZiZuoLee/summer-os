import { createCsv, csvDownloadFilename, escapeCsvCell } from "@/lib/export";
import {
  dailyCheckInSchema,
  greProgramSchema,
  onboardingSchema,
  signUpSchema,
  toCheckInRpcPayload,
} from "@/lib/validation";
import { describe, expect, it } from "vitest";

describe("validation", () => {
  it("enforces strong signup credentials and adult/health acknowledgement", () => {
    expect(
      signUpSchema.safeParse({
        email: "hello@example.com",
        password: "weak",
        confirmPassword: "weak",
        isAdult: false,
        healthDisclaimerAccepted: false,
        turnstileToken: "token",
      }).success,
    ).toBe(false);
    expect(
      signUpSchema.safeParse({
        email: "Hello@Example.com",
        password: "Long-enough-Password7!",
        confirmPassword: "Long-enough-Password7!",
        isAdult: true,
        healthDisclaimerAccepted: true,
        turnstileToken: "token",
      }).success,
    ).toBe(true);
  });

  it("requires weight or an explicit skip and maps only the RPC data contract", () => {
    const input = {
      idempotencyKey: "11aedcab-063a-4f5c-8e4d-162356d4c540",
      logDate: "2026-07-13",
      weightKg: null,
      weightSkipped: true,
      waistCm: null,
      sleepMinutes: 420,
      steps: 8000,
      waterMl: 2000,
      proteinG: 90,
      nutritionQualityFlags: ["REGULAR_MEALS"] as const,
    };
    const parsed = dailyCheckInSchema.parse(input);
    expect(toCheckInRpcPayload(parsed).p_log).toEqual(
      expect.objectContaining({
        log_date: "2026-07-13",
        weight_skipped: true,
        sleep_minutes: 420,
      }),
    );
    expect(
      dailyCheckInSchema.safeParse({ ...input, weightSkipped: false }).success,
    ).toBe(false);
  });

  it("validates plan length, target ordering, timezone and HTTPS-only evidence", () => {
    const onboarding = onboardingSchema.safeParse({
      displayName: "Kirito",
      timezone: "Asia/Shanghai",
      heightCm: 180,
      startingWeightKg: 83,
      targetWeightKg: 75,
      stretchTargetWeightKg: 73,
      previousIeltsBand: 7.5,
      summerStartDate: "2026-07-13",
      summerEndDate: "2026-08-31",
      ieltsExamDate: "2026-08-29",
      templateKey: "kirito-summer-2026@1",
      dailyStepTarget: 8000,
      dailyWaterMlTarget: 2000,
      dailyProteinGTarget: 90,
      dailySleepMinutesTarget: 480,
      healthDisclaimerAccepted: true,
    });
    expect(onboarding.success).toBe(true);
    expect(
      greProgramSchema.safeParse({
        university: "Example U",
        program: "MSc",
        officialRequirementUrl: "http://example.com/gre",
        requirementStatus: "UNKNOWN",
      }).success,
    ).toBe(false);
  });
});

describe("CSV export safety", () => {
  it("escapes quotes/newlines and neutralizes spreadsheet formulas", () => {
    expect(escapeCsvCell('hello,"world"')).toBe('"hello,""world"""');
    expect(escapeCsvCell('=HYPERLINK("https://bad.test")')).toBe(
      '"\'=HYPERLINK(""https://bad.test"")"',
    );
    expect(escapeCsvCell("-2+3")).toBe("'-2+3");
    expect(escapeCsvCell(42)).toBe("42");
  });

  it("creates BOM-prefixed CRLF CSV and safe filenames", () => {
    const csv = createCsv(
      [{ date: "2026-07-13", notes: "line 1\nline 2" }],
      [
        { header: "date", value: (row) => row.date },
        { header: "notes", value: (row) => row.notes },
      ],
    );
    expect(csv.startsWith("\uFEFFdate,notes\r\n")).toBe(true);
    expect(csv).toContain('"line 1\nline 2"');
    expect(csvDownloadFilename("Daily Logs", "2026-07-13")).toBe(
      "summer-os-daily-logs-2026-07-13.csv",
    );
  });
});
