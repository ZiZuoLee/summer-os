import { z } from "zod";

export const onboardingSchema = z.object({
  displayName: z.string().trim().min(1, "请输入昵称").max(40),
  timezone: z.string().min(1).max(80),
  heightCm: z.coerce.number().min(100).max(250),
  startingWeightKg: z.coerce.number().min(30).max(300),
  targetWeightKg: z.coerce.number().min(30).max(300),
  stretchTargetWeightKg: z.coerce.number().min(30).max(300).optional(),
  previousIeltsBand: z.coerce.number().min(0).max(9).multipleOf(0.5),
  templateKey: z.enum(["kirito-summer-2026", "summer-os-flex"]),
  startDate: z.string().date(),
  endDate: z.string().date(),
  nutritionMode: z.enum(["BALANCED", "PLATE_METHOD", "MINDFUL", "CUSTOM"]),
  stepTarget: z.coerce.number().int().min(1000).max(50000),
  waterTargetMl: z.coerce.number().int().min(500).max(8000),
  proteinTargetG: z.coerce.number().int().min(20).max(400),
  sleepTargetMinutes: z.coerce.number().int().min(240).max(720),
  ieltsExamDate: z.string().date().optional(),
});
