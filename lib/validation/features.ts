import {
  DAY_CATEGORIES,
  GRE_DECISIONS,
  GRE_REQUIREMENT_STATUSES,
  IELTS_SKILLS,
  PLAN_INTENSITIES,
  TASK_CATEGORIES,
  TASK_STATUSES,
} from "@/types/domain";
import { z } from "zod";

import { dateOnlySchema, notesSchema, optionalHttpsUrlSchema } from "./common";

export const setTaskStatusSchema = z.object({
  taskId: z.string().uuid(),
  status: z.enum(TASK_STATUSES),
  expectedRowVersion: z.number().int().nonnegative(),
});

export const planTaskSchema = z
  .object({
    id: z.string().uuid().optional(),
    title: z.string().trim().min(1).max(240),
    description: z.string().trim().max(2000).nullable().optional(),
    category: z.enum(TASK_CATEGORIES),
    plannedStart: z
      .string()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
      .nullable()
      .optional(),
    plannedEnd: z
      .string()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
      .nullable()
      .optional(),
    estimatedMinutes: z.number().int().min(1).max(1_440),
    required: z.boolean(),
    status: z.enum(TASK_STATUSES).default("PENDING"),
    minimumDayEligible: z.boolean(),
    sortOrder: z.number().int().min(0).max(100_000),
  })
  .refine(
    (value) =>
      !value.plannedStart ||
      !value.plannedEnd ||
      value.plannedStart < value.plannedEnd,
    { message: "结束时间需要晚于开始时间", path: ["plannedEnd"] },
  );

export const dailyPlanEditorSchema = z.object({
  id: z.string().uuid(),
  planDate: dateOnlySchema,
  category: z.enum(DAY_CATEGORIES),
  intensity: z.enum(PLAN_INTENSITIES),
  title: z.string().trim().min(1).max(240),
  summary: z.string().trim().max(2000),
  expectedRowVersion: z.number().int().nonnegative(),
  tasks: z.array(planTaskSchema).max(100),
});

export const ieltsSessionSchema = z.object({
  sessionDate: dateOnlySchema,
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

export const greProgramSchema = z.object({
  university: z.string().trim().min(1).max(240),
  program: z.string().trim().min(1).max(240),
  intake: z.string().trim().max(80).nullable().optional(),
  officialRequirementUrl: optionalHttpsUrlSchema,
  requirementStatus: z.enum(GRE_REQUIREMENT_STATUSES),
  scholarshipRelevance: z.string().trim().max(1000).nullable().optional(),
  applicationDeadline: dateOnlySchema.nullable().optional(),
  notes: notesSchema,
  verifiedDate: dateOnlySchema.nullable().optional(),
});

export const greDecisionSchema = z.object({
  decision: z.enum(GRE_DECISIONS),
  rationale: z.string().trim().min(20, "请简要记录证据与取舍").max(4000),
});

export const greChecklistItemSchema = z.object({
  planCycleId: z.string().uuid(),
  questionKey: z.enum([
    "TARGET_PROGRAMS_LISTED",
    "GRE_REQUIRED",
    "GRE_OPTIONAL",
    "GRE_NOT_CONSIDERED",
    "QUANT_SCORE_VALUE",
    "ENOUGH_PREP_TIME",
    "OPPORTUNITY_COST_ACCEPTABLE",
    "COST_AND_AVAILABILITY_CHECKED",
  ]),
  answer: z.enum(["YES", "NO", "UNKNOWN", "NOT_APPLICABLE"]),
  evidenceUrl: optionalHttpsUrlSchema,
  notes: z.string().trim().max(2000).nullable().optional(),
});

export const weeklyReviewSchema = z.object({
  weekStartDate: dateOnlySchema,
  wins: z.string().trim().min(1).max(3000),
  challenges: z.string().trim().max(3000).nullable().optional(),
  adjustments: z.string().trim().max(3000).nullable().optional(),
  recoveryRating: z.number().int().min(1).max(5).nullable().optional(),
  burnoutRating: z.number().int().min(1).max(5).nullable().optional(),
  stopCommitment: z.string().trim().max(1000).nullable().optional(),
  nextWeekFocus: z.string().trim().max(1000).nullable().optional(),
});
