import { IELTS_SKILLS } from "@/types/domain";
import type {
  DailyCheckInRpcPayload,
  IeltsRpcPayload,
  WorkoutRpcPayload,
} from "@/types/rpc";
import { z } from "zod";

import {
  dateOnlySchema,
  idempotencyKeySchema,
  notesSchema,
  optionalHttpsUrlSchema,
} from "./common";

export const workoutEntrySchema = z.object({
  sessionDate: dateOnlySchema.optional(),
  workoutType: z.string().trim().min(1, "请选择活动类型").max(80),
  durationMinutes: z.number().int().min(1).max(600),
  rpe: z.number().int().min(1).max(10).nullable().optional(),
  notes: notesSchema,
});

export const ieltsEntrySchema = z.object({
  sessionDate: dateOnlySchema.optional(),
  skill: z.enum(IELTS_SKILLS),
  sourceMaterial: z.string().trim().max(500).nullable().optional(),
  plannedMinutes: z.number().int().min(1).max(600).nullable().optional(),
  actualMinutes: z.number().int().min(1).max(600),
  rawScore: z.number().min(0).max(100).nullable().optional(),
  estimatedBand: z.number().min(0).max(9).multipleOf(0.5).nullable().optional(),
  mainErrors: z.string().trim().max(2000).nullable().optional(),
  nextAction: z.string().trim().max(1000).nullable().optional(),
  attachmentUrl: optionalHttpsUrlSchema,
});

export const dailyCheckInSchema = z
  .object({
    idempotencyKey: idempotencyKeySchema,
    logDate: dateOnlySchema,
    weightKg: z.number().min(30).max(350).nullable(),
    weightSkipped: z.boolean(),
    waistCm: z.number().min(30).max(300).nullable().optional(),
    waistSkipped: z.boolean().optional().default(false),
    sleepMinutes: z.number().int().min(0).max(1_440).nullable().optional(),
    sleepSkipped: z.boolean().optional().default(false),
    sleepQuality: z.number().int().min(1).max(5).nullable().optional(),
    steps: z.number().int().min(0).max(200_000).nullable().optional(),
    stepsSkipped: z.boolean().optional().default(false),
    waterMl: z.number().int().min(0).max(20_000).nullable().optional(),
    waterSkipped: z.boolean().optional().default(false),
    proteinG: z.number().int().min(0).max(1_000).nullable().optional(),
    proteinSkipped: z.boolean().optional().default(false),
    calories: z.number().int().min(0).max(20_000).nullable().optional(),
    caloriesSkipped: z.boolean().optional().default(false),
    nutritionQualityFlags: z
      .array(
        z.enum([
          "REGULAR_MEALS",
          "PROTEIN_FORWARD",
          "FRUIT_OR_VEGETABLES",
          "MINDFUL_PORTION",
          "FLEXIBLE_CHOICE",
        ]),
      )
      .max(5)
      .optional()
      .default([]),
    mealQuality: z.number().int().min(1).max(5).nullable().optional(),
    mood: z.number().int().min(1).max(5).nullable().optional(),
    energy: z.number().int().min(1).max(5).nullable().optional(),
    hunger: z.number().int().min(1).max(5).nullable().optional(),
    painLevel: z.number().int().min(0).max(10).nullable().optional(),
    dizzinessOrFainting: z.boolean().optional().default(false),
    intakeConcern: z.boolean().optional().default(false),
    notes: notesSchema,
    workout: workoutEntrySchema.nullable().optional(),
    ielts: ieltsEntrySchema.nullable().optional(),
  })
  .superRefine((value, context) => {
    if ((value.weightKg == null) === !value.weightSkipped) {
      context.addIssue({
        code: "custom",
        message: "请记录体重或明确选择跳过（二选一）",
        path: ["weightKg"],
      });
    }
  });

export type DailyCheckInInput = z.infer<typeof dailyCheckInSchema>;

export function toCheckInRpcPayload(input: DailyCheckInInput): {
  p_idempotency_key: string;
  p_log: DailyCheckInRpcPayload;
  p_workout: WorkoutRpcPayload | null;
  p_ielts: IeltsRpcPayload | null;
} {
  return {
    p_idempotency_key: input.idempotencyKey,
    p_log: {
      log_date: input.logDate,
      weight_kg: input.weightKg,
      weight_skipped: input.weightSkipped,
      waist_cm: input.waistCm,
      waist_skipped: input.waistSkipped,
      sleep_minutes: input.sleepMinutes,
      sleep_skipped: input.sleepSkipped,
      sleep_quality: input.sleepQuality,
      steps: input.steps,
      steps_skipped: input.stepsSkipped,
      water_ml: input.waterMl,
      water_skipped: input.waterSkipped,
      protein_g: input.proteinG,
      protein_skipped: input.proteinSkipped,
      calories: input.calories,
      calories_skipped: input.caloriesSkipped,
      nutrition_quality_flags: input.nutritionQualityFlags,
      meal_quality: input.mealQuality,
      mood: input.mood,
      energy: input.energy,
      hunger: input.hunger,
      pain_level: input.painLevel,
      dizziness_or_fainting: input.dizzinessOrFainting,
      intake_concern: input.intakeConcern,
      notes: input.notes,
    },
    p_workout: input.workout
      ? {
          session_date: input.workout.sessionDate,
          workout_type: input.workout.workoutType,
          duration_minutes: input.workout.durationMinutes,
          rpe: input.workout.rpe,
          notes: input.workout.notes,
        }
      : null,
    p_ielts: input.ielts
      ? {
          session_date: input.ielts.sessionDate,
          skill: input.ielts.skill,
          source_material: input.ielts.sourceMaterial,
          planned_minutes: input.ielts.plannedMinutes,
          actual_minutes: input.ielts.actualMinutes,
          raw_score: input.ielts.rawScore,
          estimated_band: input.ielts.estimatedBand,
          main_errors: input.ielts.mainErrors,
          next_action: input.ielts.nextAction,
          attachment_url: input.ielts.attachmentUrl,
        }
      : null,
  };
}
