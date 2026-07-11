import type { GeneratedPlan } from "./types";
import type { Json } from "@/types/database.generated";

export interface SeedPlanRpcArgs {
  p_template_key: string;
  p_timezone: string;
  p_start_date: string;
  p_end_date: string;
  p_days: Json;
  p_idempotency_key: string;
}

export function toSeedPlanRpcArgs(
  plan: GeneratedPlan,
  idempotencyKey: string,
): SeedPlanRpcArgs {
  return {
    p_template_key: plan.templateKey,
    p_timezone: plan.timezone,
    p_start_date: plan.startDate,
    p_end_date: plan.endDate,
    p_days: plan.days.map((day) => ({
      date: day.date,
      category: day.category,
      intensity: day.intensity,
      title: day.title,
      summary: day.summary,
      commitments: day.commitments.map((item) => ({
        seed_key: item.seedKey,
        title: item.title,
        kind: item.kind,
        start_time: item.startTime,
        end_time: item.endTime,
        is_all_day: item.isAllDay ?? false,
      })),
      tasks: day.tasks.map((item) => ({
        seed_key: item.seedKey,
        title: item.title,
        description: item.description ?? null,
        category: item.category,
        planned_start: item.plannedStart ?? null,
        planned_end: item.plannedEnd ?? null,
        estimated_minutes: item.estimatedMinutes,
        required: item.required,
        minimum_day_eligible: item.minimumDayEligible,
        sort_order: item.sortOrder,
      })),
    })),
    p_idempotency_key: idempotencyKey,
  };
}
