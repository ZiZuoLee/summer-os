import { differenceInCalendarDays } from "@/lib/seed";
import { z } from "zod";

import { dateOnlySchema, timezoneSchema } from "./common";

export const onboardingSchema = z
  .object({
    displayName: z.string().trim().min(1, "请输入称呼").max(80),
    timezone: timezoneSchema,
    heightCm: z.number().min(100).max(250).nullable(),
    startingWeightKg: z.number().min(30).max(350).nullable(),
    targetWeightKg: z.number().min(30).max(350).nullable(),
    stretchTargetWeightKg: z.number().min(30).max(350).nullable(),
    previousIeltsBand: z.number().min(0).max(9).multipleOf(0.5).nullable(),
    summerStartDate: dateOnlySchema,
    summerEndDate: dateOnlySchema,
    ieltsExamDate: dateOnlySchema.nullable(),
    templateKey: z.enum(["kirito-summer-2026@1", "summer-os-flex@1"]),
    dailyStepTarget: z.number().int().min(1_000).max(50_000),
    dailyWaterMlTarget: z.number().int().min(500).max(8_000),
    dailyProteinGTarget: z.number().int().min(20).max(400),
    dailySleepMinutesTarget: z.number().int().min(240).max(720),
    healthDisclaimerAccepted: z.literal(true, { error: "请确认一般健康提示" }),
  })
  .superRefine((value, context) => {
    const duration =
      differenceInCalendarDays(value.summerEndDate, value.summerStartDate) + 1;
    if (duration < 7 || duration > 120) {
      context.addIssue({
        code: "custom",
        message: "计划长度需要在 7 至 120 天之间",
        path: ["summerEndDate"],
      });
    }
    if (
      value.targetWeightKg != null &&
      value.startingWeightKg != null &&
      value.targetWeightKg >= value.startingWeightKg
    ) {
      context.addIssue({
        code: "custom",
        message: "减重目标应低于起始体重；如目标不同，可暂时留空",
        path: ["targetWeightKg"],
      });
    }
    if (
      value.stretchTargetWeightKg != null &&
      value.targetWeightKg != null &&
      value.stretchTargetWeightKg > value.targetWeightKg
    ) {
      context.addIssue({
        code: "custom",
        message: "愿望体重不应高于主要目标体重",
        path: ["stretchTargetWeightKg"],
      });
    }
  });
