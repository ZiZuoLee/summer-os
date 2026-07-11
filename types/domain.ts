export const DAY_CATEGORIES = [
  "BASELINE",
  "INTERNSHIP_PART_TIME",
  "COURSE_DAY",
  "WEEKEND_INTENSIVE",
  "WEEKEND_RECOVERY",
  "INTERNSHIP_FULL_TIME",
  "IELTS_TAPER",
  "EXAM_DAY",
  "FINAL_REVIEW",
  "FLEX_DAY",
] as const;

export type DayCategory = (typeof DAY_CATEGORIES)[number];

export const PLAN_INTENSITIES = ["LOW", "MODERATE", "HIGH"] as const;
export type PlanIntensity = (typeof PLAN_INTENSITIES)[number];

export const TASK_CATEGORIES = [
  "FIXED_COMMITMENT",
  "FITNESS",
  "NUTRITION",
  "IELTS",
  "GRE",
  "RECOVERY",
  "PLANNING",
  "COURSE",
  "INTERNSHIP",
  "PERSONAL",
] as const;
export type TaskCategory = (typeof TASK_CATEGORIES)[number];

export const TASK_STATUSES = ["PENDING", "COMPLETED", "SKIPPED"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const IELTS_SKILLS = [
  "LISTENING",
  "READING",
  "WRITING_TASK_1",
  "WRITING_TASK_2",
  "SPEAKING",
  "VOCABULARY",
  "MOCK",
] as const;
export type IeltsSkill = (typeof IELTS_SKILLS)[number];

export const GRE_REQUIREMENT_STATUSES = [
  "REQUIRED",
  "OPTIONAL",
  "NOT_REQUIRED",
  "NOT_ACCEPTED",
  "UNKNOWN",
] as const;
export type GreRequirementStatus = (typeof GRE_REQUIREMENT_STATUSES)[number];

export const GRE_DECISIONS = [
  "PREPARE",
  "DO_NOT_PREPARE",
  "DEFER_PENDING_SCHOOL_LIST",
] as const;
export type GreDecision = (typeof GRE_DECISIONS)[number];

export interface ActionSuccess<T> {
  ok: true;
  data: T;
}

export interface ActionFailure {
  ok: false;
  code:
    | "AUTH_REQUIRED"
    | "FORBIDDEN"
    | "VALIDATION_ERROR"
    | "CONFLICT"
    | "CAPACITY_REACHED"
    | "INTERNAL_ERROR";
  message: string;
  fieldErrors?: Record<string, string[]>;
}

export type ActionResult<T> = ActionSuccess<T> | ActionFailure;
