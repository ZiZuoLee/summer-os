"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { isSupabaseConfigured, publicEnv } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { evaluateHealthAlerts } from "@/lib/health";
import {
  dailyCheckInSchema,
  greDecisionSchema,
  greProgramSchema,
  ieltsSessionSchema,
  weeklyReviewSchema,
} from "@/lib/validation";

export type MutationState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string[]>;
};

function demoResult(message = "演示模式不会写入生产数据库。"): MutationState {
  return { status: "success", message };
}

function valueOrNull(value: FormDataEntryValue | null) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function numberOrNull(value: FormDataEntryValue | null) {
  const stringValue = valueOrNull(value);
  if (stringValue === null) return null;
  const number = Number(stringValue);
  return Number.isFinite(number) ? number : null;
}

export async function setTaskStatusAction(formData: FormData) {
  const parsed = z
    .object({
      taskId: z.string().uuid(),
      status: z.enum(["pending", "completed", "skipped"]),
      rowVersion: z.coerce.number().int().nonnegative(),
    })
    .safeParse({
      taskId: formData.get("taskId"),
      status: formData.get("status"),
      rowVersion: formData.get("rowVersion"),
    });
  if (!parsed.success) return { ok: false, code: "INVALID_INPUT" } as const;
  if (!isSupabaseConfigured() || publicEnv.demoMode)
    return { ok: true, demo: true } as const;

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("set_task_status", {
    p_task_id: parsed.data.taskId,
    p_status: parsed.data.status.toUpperCase(),
    p_expected_row_version: parsed.data.rowVersion,
  });
  if (error) return { ok: false, code: "SAVE_FAILED" } as const;
  revalidatePath("/today");
  return { ok: true, data } as const;
}

export async function setMinimumModeAction(formData: FormData) {
  if (!isSupabaseConfigured() || publicEnv.demoMode) {
    revalidatePath("/today");
    return;
  }
  const planId = z.string().uuid().safeParse(formData.get("planId"));
  if (!planId.success) return;
  const supabase = await createClient();
  await supabase
    .from("daily_plans")
    .update({ minimum_mode_enabled: formData.get("enabled") === "true" })
    .eq("id", planId.data);
  revalidatePath("/today");
}

export async function submitCheckinAction(
  _state: MutationState,
  formData: FormData,
): Promise<MutationState> {
  const date = z.string().date().safeParse(formData.get("logDate"));
  if (!date.success) return { status: "error", message: "日期格式不正确。" };
  if (!isSupabaseConfigured() || publicEnv.demoMode)
    return demoResult("演示打卡已在当前页面预览，不会保存真实健康数据。");

  const skippedMetrics = formData.getAll("skippedMetrics").map(String);
  const weight = numberOrNull(formData.get("weightKg"));
  if (weight === null && !skippedMetrics.includes("weight")) {
    return { status: "error", message: "请填写体重，或明确选择“跳过体重”。" };
  }
  const nutritionFlagMap: Record<string, string> = {
    protein_forward: "PROTEIN_FORWARD",
    vegetables: "FRUIT_OR_VEGETABLES",
    mindful_portion: "MINDFUL_PORTION",
    regular_meals: "REGULAR_MEALS",
  };
  const metricValues: Record<string, number | null> = {
    weight,
    waist: numberOrNull(formData.get("waistCm")),
    sleep: numberOrNull(formData.get("sleepHours")),
    steps: numberOrNull(formData.get("steps")),
    water: numberOrNull(formData.get("waterMl")),
    protein: numberOrNull(formData.get("proteinG")),
    calories: numberOrNull(formData.get("calories")),
  };
  const conflict = skippedMetrics.find(
    (metric) => metricValues[metric] !== null,
  );
  if (conflict)
    return { status: "error", message: "已填写的指标不能同时标记为跳过。" };
  const log = {
    log_date: date.data,
    weight_kg: weight,
    weight_skipped: skippedMetrics.includes("weight"),
    waist_cm: metricValues.waist,
    waist_skipped: skippedMetrics.includes("waist"),
    sleep_minutes:
      metricValues.sleep == null ? null : Math.round(metricValues.sleep * 60),
    sleep_skipped: skippedMetrics.includes("sleep"),
    sleep_quality: numberOrNull(formData.get("sleepQuality")),
    steps: metricValues.steps,
    steps_skipped: skippedMetrics.includes("steps"),
    water_ml: metricValues.water,
    water_skipped: skippedMetrics.includes("water"),
    protein_g: metricValues.protein,
    protein_skipped: skippedMetrics.includes("protein"),
    calories: metricValues.calories,
    calories_skipped: skippedMetrics.includes("calories"),
    nutrition_quality_flags: formData
      .getAll("mealQualityFlags")
      .map(String)
      .map((flag) => nutritionFlagMap[flag])
      .filter(Boolean),
    mood: numberOrNull(formData.get("mood")),
    energy: numberOrNull(formData.get("energy")),
    hunger: numberOrNull(formData.get("hunger")),
    pain_level: numberOrNull(formData.get("painLevel")),
    dizziness_or_fainting: formData.get("dizzinessOrFainting") === "on",
    intake_concern: formData.get("intakeConcern") === "on",
    notes: valueOrNull(formData.get("notes")),
  };
  const workoutType = valueOrNull(formData.get("workoutType"));
  const workoutMinutes = numberOrNull(formData.get("workoutMinutes"));
  if (workoutType && (!workoutMinutes || workoutMinutes < 1)) {
    return {
      status: "error",
      message: "记录运动时，请填写至少 1 分钟的时长。",
    };
  }
  const workout = workoutType
    ? {
        session_date: date.data,
        workout_type: workoutType,
        duration_minutes: workoutMinutes,
        rpe: numberOrNull(formData.get("workoutRpe")),
        notes: null,
      }
    : null;
  const ieltsMinutes = numberOrNull(formData.get("ieltsMinutes"));
  const ielts = ieltsMinutes
    ? {
        session_date: date.data,
        skill: String(formData.get("ieltsSkill") ?? "VOCABULARY"),
        source_material: "快速打卡",
        planned_minutes: ieltsMinutes,
        actual_minutes: ieltsMinutes,
        next_action: valueOrNull(formData.get("ieltsNextAction")),
      }
    : null;

  const idempotencyKey =
    valueOrNull(formData.get("idempotencyKey")) ?? crypto.randomUUID();
  const validated = dailyCheckInSchema.safeParse({
    idempotencyKey,
    logDate: date.data,
    weightKg: metricValues.weight,
    weightSkipped: skippedMetrics.includes("weight"),
    waistCm: metricValues.waist,
    waistSkipped: skippedMetrics.includes("waist"),
    sleepMinutes:
      metricValues.sleep == null ? null : Math.round(metricValues.sleep * 60),
    sleepSkipped: skippedMetrics.includes("sleep"),
    sleepQuality: numberOrNull(formData.get("sleepQuality")),
    steps: metricValues.steps,
    stepsSkipped: skippedMetrics.includes("steps"),
    waterMl: metricValues.water,
    waterSkipped: skippedMetrics.includes("water"),
    proteinG: metricValues.protein,
    proteinSkipped: skippedMetrics.includes("protein"),
    calories: metricValues.calories,
    caloriesSkipped: skippedMetrics.includes("calories"),
    nutritionQualityFlags: log.nutrition_quality_flags,
    mood: numberOrNull(formData.get("mood")),
    energy: numberOrNull(formData.get("energy")),
    hunger: numberOrNull(formData.get("hunger")),
    painLevel: numberOrNull(formData.get("painLevel")),
    dizzinessOrFainting: formData.get("dizzinessOrFainting") === "on",
    intakeConcern: formData.get("intakeConcern") === "on",
    notes: valueOrNull(formData.get("notes")),
    workout: workoutType
      ? {
          sessionDate: date.data,
          workoutType,
          durationMinutes: workoutMinutes,
          rpe: numberOrNull(formData.get("workoutRpe")),
          notes: null,
        }
      : null,
    ielts: ieltsMinutes
      ? {
          sessionDate: date.data,
          skill: String(formData.get("ieltsSkill") ?? "VOCABULARY"),
          sourceMaterial: "快速打卡",
          plannedMinutes: ieltsMinutes,
          actualMinutes: ieltsMinutes,
          nextAction: valueOrNull(formData.get("ieltsNextAction")),
        }
      : null,
  });
  if (!validated.success) {
    return {
      status: "error",
      message: validated.error.issues[0]?.message ?? "打卡数据不符合要求。",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("submit_daily_checkin", {
    p_idempotency_key: idempotencyKey,
    p_log: log,
    p_workout: workout,
    p_ielts: ielts,
  });
  if (error)
    return { status: "error", message: "打卡没有保存，请检查网络后重试。" };
  const userId = (await supabase.auth.getUser()).data.user?.id;
  if (userId) {
    const [{ data: recentLogs }, { data: recentWorkouts }] = await Promise.all([
      supabase
        .from("daily_logs")
        .select(
          "log_date,weight_kg,sleep_minutes,dizziness_or_fainting,pain_level,intake_concern",
        )
        .order("log_date", { ascending: false })
        .limit(60),
      supabase
        .from("workout_sessions")
        .select("session_date,rpe")
        .order("session_date", { ascending: false })
        .limit(60),
    ]);
    const alerts = evaluateHealthAlerts(
      (recentLogs ?? []).map((item) => ({
        date: item.log_date,
        weightKg: item.weight_kg,
        sleepMinutes: item.sleep_minutes,
        dizzinessOrFainting: item.dizziness_or_fainting,
        painLevel: item.pain_level,
        intakeConcern: item.intake_concern,
      })),
      (recentWorkouts ?? []).map((item) => ({
        date: item.session_date,
        rpe: item.rpe,
      })),
    );
    if (alerts.length) {
      await supabase.from("health_alerts").upsert(
        alerts.map((alert) => ({
          user_id: userId,
          kind: alert.kind,
          severity: alert.severity,
          observed_on: alert.observedOn,
          title: alert.title,
          message: alert.message,
          status: "OPEN",
        })),
        { onConflict: "user_id,kind,observed_on" },
      );
    }
  }
  revalidatePath("/today");
  revalidatePath("/analytics");
  return { status: "success", message: "今天的打卡已安全保存。" };
}

export async function acknowledgeHealthAlertAction(formData: FormData) {
  if (!isSupabaseConfigured() || publicEnv.demoMode) {
    revalidatePath("/today");
    return;
  }
  const alertId = z.string().uuid().safeParse(formData.get("alertId"));
  if (!alertId.success) return;
  const supabase = await createClient();
  const userId = (await supabase.auth.getUser()).data.user?.id;
  if (!userId) return;
  await supabase.from("alert_acknowledgements").upsert(
    {
      user_id: userId,
      health_alert_id: alertId.data,
    },
    { onConflict: "user_id,health_alert_id" },
  );
  revalidatePath("/today");
}

export async function addIeltsSessionAction(
  _state: MutationState,
  formData: FormData,
): Promise<MutationState> {
  const parsed = ieltsSessionSchema.safeParse({
    sessionDate: formData.get("sessionDate"),
    skill: formData.get("skill"),
    sourceMaterial: valueOrNull(formData.get("sourceMaterial")),
    plannedMinutes: numberOrNull(formData.get("plannedMinutes")),
    actualMinutes: numberOrNull(formData.get("actualMinutes")),
    rawScore: numberOrNull(formData.get("rawScore")),
    estimatedBand: numberOrNull(formData.get("estimatedBand")),
    mainErrors: valueOrNull(formData.get("mainErrors")),
    nextAction: valueOrNull(formData.get("nextAction")),
    attachmentUrl: valueOrNull(formData.get("attachmentUrl")),
  });
  if (!parsed.success)
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "IELTS 记录不完整。",
    };
  if (!isSupabaseConfigured() || publicEnv.demoMode)
    return demoResult("演示 IELTS 记录已预览。 ");
  const supabase = await createClient();
  const userId = (await supabase.auth.getUser()).data.user?.id;
  if (!userId) return { status: "error", message: "登录已过期，请重新登录。" };
  const { error } = await supabase.from("ielts_sessions").insert({
    user_id: userId,
    session_date: parsed.data.sessionDate,
    skill: parsed.data.skill,
    source_material: parsed.data.sourceMaterial,
    planned_minutes: parsed.data.plannedMinutes,
    actual_minutes: parsed.data.actualMinutes,
    raw_score: parsed.data.rawScore,
    estimated_band: parsed.data.estimatedBand,
    main_errors: parsed.data.mainErrors,
    next_action: parsed.data.nextAction,
    attachment_url: parsed.data.attachmentUrl,
  });
  if (error) return { status: "error", message: "IELTS 记录保存失败。" };
  revalidatePath("/ielts");
  return { status: "success", message: "IELTS 练习已记录。" };
}

export async function addGreProgramAction(
  _state: MutationState,
  formData: FormData,
): Promise<MutationState> {
  const parsed = greProgramSchema.safeParse({
    university: formData.get("university"),
    program: formData.get("program"),
    intake: valueOrNull(formData.get("intake")),
    officialRequirementUrl: valueOrNull(formData.get("officialRequirementUrl")),
    requirementStatus: formData.get("requirementStatus"),
    scholarshipRelevance: valueOrNull(formData.get("scholarshipRelevance")),
    applicationDeadline: valueOrNull(formData.get("applicationDeadline")),
    notes: valueOrNull(formData.get("notes")),
    verifiedDate: valueOrNull(formData.get("verifiedDate")),
  });
  if (!parsed.success)
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "项目资料不完整。",
    };
  if (!isSupabaseConfigured() || publicEnv.demoMode)
    return demoResult("演示项目已预览，不会保存。 ");
  const supabase = await createClient();
  const userId = (await supabase.auth.getUser()).data.user?.id;
  if (!userId) return { status: "error", message: "登录已过期，请重新登录。" };
  const { error } = await supabase.from("gre_programs").insert({
    user_id: userId,
    university: parsed.data.university,
    program: parsed.data.program,
    intake: parsed.data.intake,
    official_requirement_url: parsed.data.officialRequirementUrl,
    requirement_status: parsed.data.requirementStatus,
    scholarship_relevance: parsed.data.scholarshipRelevance,
    application_deadline: parsed.data.applicationDeadline,
    notes: parsed.data.notes,
    verified_date: parsed.data.verifiedDate,
  });
  if (error) return { status: "error", message: "项目研究记录保存失败。" };
  revalidatePath("/gre");
  return { status: "success", message: "项目要求已记录，请定期重新核验官网。" };
}

export async function saveGreDecisionAction(
  _state: MutationState,
  formData: FormData,
): Promise<MutationState> {
  const parsed = greDecisionSchema.safeParse({
    decision: formData.get("decision"),
    rationale: formData.get("rationale"),
  });
  if (!parsed.success)
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "请补充决策依据。",
    };
  if (!isSupabaseConfigured() || publicEnv.demoMode)
    return demoResult("演示 GRE 决策已预览。");
  const supabase = await createClient();
  const userId = (await supabase.auth.getUser()).data.user?.id;
  if (!userId) return { status: "error", message: "登录已过期，请重新登录。" };
  const { data: cycle } = await supabase
    .from("plan_cycles")
    .select("id")
    .eq("status", "ACTIVE")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!cycle) return { status: "error", message: "请先创建一个有效计划周期。" };
  const { error: decisionError } = await supabase.from("gre_decisions").upsert(
    {
      user_id: userId,
      plan_cycle_id: cycle.id,
      decision: parsed.data.decision,
      rationale: parsed.data.rationale,
      decided_at: new Date().toISOString(),
    },
    { onConflict: "user_id,plan_cycle_id" },
  );
  if (decisionError) return { status: "error", message: "GRE 决策未能保存。" };

  const questionKeys = [
    "TARGET_PROGRAMS_LISTED",
    "GRE_REQUIRED",
    "COST_AND_AVAILABILITY_CHECKED",
    "ENOUGH_PREP_TIME",
    "OPPORTUNITY_COST_ACCEPTABLE",
    "QUANT_SCORE_VALUE",
  ] as const;
  const selected = new Set(formData.getAll("checklist").map(String));
  const { error: checklistError } = await supabase
    .from("gre_checklist_items")
    .upsert(
      questionKeys.map((questionKey) => ({
        user_id: userId,
        plan_cycle_id: cycle.id,
        question_key: questionKey,
        answer: selected.has(questionKey) ? "YES" : "UNKNOWN",
        verified_at: selected.has(questionKey)
          ? new Date().toISOString()
          : null,
      })),
      { onConflict: "user_id,plan_cycle_id,question_key" },
    );
  if (checklistError)
    return {
      status: "error",
      message: "决策已保存，但检查清单未能更新，请重试。",
    };
  revalidatePath("/gre");
  return { status: "success", message: "GRE 决策与依据已保存。" };
}

export async function saveWeeklyReviewAction(
  _state: MutationState,
  formData: FormData,
): Promise<MutationState> {
  const parsed = weeklyReviewSchema.safeParse({
    weekStartDate: formData.get("weekStartDate"),
    wins: formData.get("wins"),
    challenges: valueOrNull(formData.get("challenges")),
    adjustments: valueOrNull(formData.get("adjustments")),
    recoveryRating: numberOrNull(formData.get("recoveryRating")),
    burnoutRating: numberOrNull(formData.get("burnoutRating")),
    stopCommitment: valueOrNull(formData.get("stopCommitment")),
    nextWeekFocus: valueOrNull(formData.get("nextWeekFocus")),
  });
  if (!parsed.success)
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "周复盘不完整。",
    };
  if (!isSupabaseConfigured() || publicEnv.demoMode)
    return demoResult("演示周复盘已预览。 ");
  const supabase = await createClient();
  const userId = (await supabase.auth.getUser()).data.user?.id;
  if (!userId) return { status: "error", message: "登录已过期，请重新登录。" };
  const payload = {
    user_id: userId,
    week_start_date: parsed.data.weekStartDate,
    wins: parsed.data.wins,
    challenges: parsed.data.challenges,
    adjustments: parsed.data.adjustments,
    recovery_rating: parsed.data.recoveryRating,
    burnout_rating: parsed.data.burnoutRating,
    stop_commitment: parsed.data.stopCommitment,
    next_week_focus: parsed.data.nextWeekFocus,
  };
  const { error } = await supabase
    .from("weekly_reviews")
    .upsert(payload, { onConflict: "user_id,week_start_date" });
  if (error) return { status: "error", message: "周复盘保存失败。" };
  revalidatePath("/weekly-review");
  return { status: "success", message: "周复盘已保存。" };
}

export async function updatePlanDayAction(
  _state: MutationState,
  formData: FormData,
): Promise<MutationState> {
  if (!isSupabaseConfigured() || publicEnv.demoMode)
    return demoResult("演示计划修改已预览。");
  const parsed = z
    .object({
      planId: z.string().uuid(),
      title: z.string().trim().min(1).max(240),
      summary: z.string().trim().max(2000),
      category: z.enum([
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
      ]),
      intensity: z.enum(["LOW", "MODERATE", "HIGH"]),
    })
    .safeParse({
      planId: formData.get("planId"),
      title: formData.get("title"),
      summary: formData.get("summary") ?? "",
      category: formData.get("category"),
      intensity: formData.get("intensity"),
    });
  if (!parsed.success)
    return { status: "error", message: "计划内容不完整，请检查后重试。" };
  const supabase = await createClient();
  const { error } = await supabase
    .from("daily_plans")
    .update({
      title: parsed.data.title,
      summary: parsed.data.summary,
      day_category: parsed.data.category,
      intensity: parsed.data.intensity,
    })
    .eq("id", parsed.data.planId);
  if (error) return { status: "error", message: "计划保存失败，请稍后重试。" };
  revalidatePath("/plan");
  revalidatePath("/calendar");
  revalidatePath("/today");
  return { status: "success", message: "当天计划已保存。" };
}

export async function addPlanTaskAction(
  _state: MutationState,
  formData: FormData,
): Promise<MutationState> {
  if (!isSupabaseConfigured() || publicEnv.demoMode)
    return demoResult("演示任务已预览。");
  const parsed = z
    .object({
      planId: z.string().uuid(),
      title: z.string().trim().min(1).max(240),
      category: z.enum([
        "FITNESS",
        "NUTRITION",
        "IELTS",
        "GRE",
        "RECOVERY",
        "PLANNING",
        "COURSE",
        "INTERNSHIP",
        "PERSONAL",
      ]),
      minutes: z.coerce.number().int().min(1).max(1440),
      required: z.boolean(),
    })
    .safeParse({
      planId: formData.get("planId"),
      title: formData.get("taskTitle"),
      category: formData.get("taskCategory"),
      minutes: formData.get("taskMinutes"),
      required: formData.get("taskRequired") === "on",
    });
  if (!parsed.success) return { status: "error", message: "任务信息不完整。" };
  const supabase = await createClient();
  const userId = (await supabase.auth.getUser()).data.user?.id;
  if (!userId) return { status: "error", message: "登录已过期，请重新登录。" };
  const { data: lastTask } = await supabase
    .from("plan_tasks")
    .select("sort_order")
    .eq("daily_plan_id", parsed.data.planId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const { error } = await supabase.from("plan_tasks").insert({
    user_id: userId,
    daily_plan_id: parsed.data.planId,
    title: parsed.data.title,
    category: parsed.data.category,
    estimated_minutes: parsed.data.minutes,
    required: parsed.data.required,
    minimum_day_eligible: parsed.data.required,
    sort_order: Number(lastTask?.sort_order ?? 0) + 10,
    source: "USER",
  });
  if (error) return { status: "error", message: "任务添加失败。" };
  revalidatePath("/plan");
  revalidatePath("/today");
  return { status: "success", message: "自定义任务已添加。" };
}

export async function updatePlanTaskAction(
  _state: MutationState,
  formData: FormData,
): Promise<MutationState> {
  if (!isSupabaseConfigured() || publicEnv.demoMode)
    return demoResult("演示任务编辑已预览。");
  const parsed = z
    .object({
      taskId: z.string().uuid(),
      title: z.string().trim().min(1).max(240),
      category: z.enum([
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
      ]),
      minutes: z.coerce.number().int().min(1).max(1440),
      required: z.boolean(),
      minimumDayEligible: z.boolean(),
    })
    .safeParse({
      taskId: formData.get("taskId"),
      title: formData.get("title"),
      category: formData.get("category"),
      minutes: formData.get("minutes"),
      required: formData.get("required") === "on",
      minimumDayEligible: formData.get("minimumDayEligible") === "on",
    });
  if (!parsed.success)
    return { status: "error", message: "任务修改内容不完整。" };
  const supabase = await createClient();
  const { error } = await supabase
    .from("plan_tasks")
    .update({
      title: parsed.data.title,
      category: parsed.data.category,
      estimated_minutes: parsed.data.minutes,
      required: parsed.data.required,
      minimum_day_eligible: parsed.data.minimumDayEligible,
    })
    .eq("id", parsed.data.taskId);
  if (error) return { status: "error", message: "任务修改未能保存。" };
  revalidatePath("/plan");
  revalidatePath("/today");
  return { status: "success", message: "任务已更新。" };
}

const commitmentInputSchema = z
  .object({
    title: z.string().trim().min(1).max(240),
    kind: z.enum(["INTERNSHIP", "COURSE", "EXAM", "PERSONAL"]),
    startTime: z
      .string()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
      .nullable(),
    endTime: z
      .string()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
      .nullable(),
    isAllDay: z.boolean(),
  })
  .superRefine((value, context) => {
    if (
      !value.isAllDay &&
      (!value.startTime || !value.endTime || value.endTime <= value.startTime)
    ) {
      context.addIssue({
        code: "custom",
        path: ["endTime"],
        message: "非全天安排需要有效的起止时间。",
      });
    }
  });

export async function addPlanCommitmentAction(
  _state: MutationState,
  formData: FormData,
): Promise<MutationState> {
  if (!isSupabaseConfigured() || publicEnv.demoMode)
    return demoResult("演示固定安排已预览。");
  const parsed = commitmentInputSchema.safeParse({
    title: formData.get("commitmentTitle"),
    kind: formData.get("commitmentKind"),
    startTime: valueOrNull(formData.get("commitmentStart")),
    endTime: valueOrNull(formData.get("commitmentEnd")),
    isAllDay: formData.get("commitmentAllDay") === "on",
  });
  const planId = z.string().uuid().safeParse(formData.get("planId"));
  if (!parsed.success || !planId.success)
    return { status: "error", message: "固定安排信息不完整。" };
  const supabase = await createClient();
  const userId = (await supabase.auth.getUser()).data.user?.id;
  if (!userId) return { status: "error", message: "登录已过期，请重新登录。" };
  const { error } = await supabase.from("daily_commitments").insert({
    user_id: userId,
    daily_plan_id: planId.data,
    title: parsed.data.title,
    kind: parsed.data.kind,
    local_start_time: parsed.data.isAllDay ? null : parsed.data.startTime,
    local_end_time: parsed.data.isAllDay ? null : parsed.data.endTime,
    is_all_day: parsed.data.isAllDay,
    source: "USER",
  });
  if (error) return { status: "error", message: "固定安排未能添加。" };
  revalidatePath("/plan");
  revalidatePath("/today");
  return { status: "success", message: "固定安排已添加。" };
}

export async function updatePlanCommitmentAction(
  _state: MutationState,
  formData: FormData,
): Promise<MutationState> {
  if (!isSupabaseConfigured() || publicEnv.demoMode)
    return demoResult("演示固定安排编辑已预览。");
  const parsed = commitmentInputSchema.safeParse({
    title: formData.get("title"),
    kind: formData.get("kind"),
    startTime: valueOrNull(formData.get("startTime")),
    endTime: valueOrNull(formData.get("endTime")),
    isAllDay: formData.get("isAllDay") === "on",
  });
  const commitmentId = z
    .string()
    .uuid()
    .safeParse(formData.get("commitmentId"));
  if (!parsed.success || !commitmentId.success)
    return { status: "error", message: "固定安排修改内容不完整。" };
  const supabase = await createClient();
  const { error } = await supabase
    .from("daily_commitments")
    .update({
      title: parsed.data.title,
      kind: parsed.data.kind,
      local_start_time: parsed.data.isAllDay ? null : parsed.data.startTime,
      local_end_time: parsed.data.isAllDay ? null : parsed.data.endTime,
      is_all_day: parsed.data.isAllDay,
    })
    .eq("id", commitmentId.data);
  if (error) return { status: "error", message: "固定安排修改未能保存。" };
  revalidatePath("/plan");
  revalidatePath("/today");
  return { status: "success", message: "固定安排已更新。" };
}

export async function duplicatePlanDayAction(
  _state: MutationState,
  formData: FormData,
): Promise<MutationState> {
  const parsed = z
    .object({ sourceDate: z.string().date(), targetDate: z.string().date() })
    .safeParse({
      sourceDate: formData.get("sourceDate"),
      targetDate: formData.get("targetDate"),
    });
  if (!parsed.success)
    return { status: "error", message: "请选择有效的目标日期。" };
  if (!isSupabaseConfigured() || publicEnv.demoMode)
    return demoResult("演示日期复制已预览。");
  const supabase = await createClient();
  const { error } = await supabase.rpc("duplicate_plan_day", {
    p_source_date: parsed.data.sourceDate,
    p_target_date: parsed.data.targetDate,
  });
  if (error)
    return {
      status: "error",
      message: "目标日期已有计划，或复制操作未能完成。",
    };
  revalidatePath("/plan");
  revalidatePath("/calendar");
  return { status: "success", message: "当天计划已复制，完成状态已重置。" };
}

export async function resetPlanProgressAction(
  _state: MutationState,
  formData: FormData,
): Promise<MutationState> {
  const parsed = z
    .object({ cycleId: z.string().uuid(), confirmation: z.string() })
    .safeParse({
      cycleId: formData.get("cycleId"),
      confirmation: formData.get("confirmation"),
    });
  if (
    !parsed.success ||
    parsed.data.confirmation !== `RESET ${parsed.data.cycleId}`
  ) {
    return { status: "error", message: "确认文字不匹配，未进行重置。" };
  }
  if (!isSupabaseConfigured() || publicEnv.demoMode)
    return demoResult("演示安全重置已预览；编辑、完成状态与历史都不会被覆盖。");
  const supabase = await createClient();
  const { error } = await supabase.rpc("reset_plan_progress", {
    p_plan_cycle_id: parsed.data.cycleId,
    p_confirmation: parsed.data.confirmation,
  });
  if (error)
    return { status: "error", message: "重置失败，所有记录保持原状。" };
  revalidatePath("/plan");
  revalidatePath("/today");
  revalidatePath("/calendar");
  return {
    status: "success",
    message:
      "模板已安全重新应用；用户编辑、完成状态、自定义内容与所有历史均已保留。",
  };
}

export async function restorePlanDayAction(
  _state: MutationState,
  formData: FormData,
): Promise<MutationState> {
  const parsed = z
    .object({ planDate: z.string().date(), confirmation: z.string() })
    .safeParse({
      planDate: formData.get("planDate"),
      confirmation: formData.get("confirmation"),
    });
  if (
    !parsed.success ||
    parsed.data.confirmation !== `RESTORE ${parsed.data.planDate}`
  ) {
    return { status: "error", message: "确认文字不匹配，当天计划保持原状。" };
  }
  if (!isSupabaseConfigured() || publicEnv.demoMode)
    return demoResult("演示单日恢复已预览；编辑与完成状态都会保留。");
  const supabase = await createClient();
  const { error } = await supabase.rpc("restore_plan_day", {
    p_plan_date: parsed.data.planDate,
    p_confirmation: parsed.data.confirmation,
  });
  if (error)
    return {
      status: "error",
      message: "当天模板内容未能恢复，原数据没有改变。",
    };
  revalidatePath("/plan");
  revalidatePath("/today");
  revalidatePath("/calendar");
  return {
    status: "success",
    message: "缺失的当天模板内容已补回；编辑、完成状态和自定义内容均已保留。",
  };
}

export async function updateSettingsAction(
  _state: MutationState,
  formData: FormData,
): Promise<MutationState> {
  const parsed = z
    .object({
      displayName: z.string().trim().min(1).max(80),
      timezone: z.string().trim().min(1).max(100),
      targetWeightKg: z.number().min(30).max(350).nullable(),
      stretchTargetWeightKg: z.number().min(30).max(350).nullable(),
      stepTarget: z.number().int().min(1000).max(50000),
      waterTargetMl: z.number().int().min(500).max(8000),
      proteinTargetG: z.number().int().min(20).max(400),
      sleepTargetMinutes: z.number().int().min(240).max(720),
      ieltsExamDate: z.string().date().nullable(),
    })
    .safeParse({
      displayName: formData.get("displayName"),
      timezone: formData.get("timezone"),
      targetWeightKg: numberOrNull(formData.get("targetWeightKg")),
      stretchTargetWeightKg: numberOrNull(
        formData.get("stretchTargetWeightKg"),
      ),
      stepTarget: numberOrNull(formData.get("stepTarget")),
      waterTargetMl: numberOrNull(formData.get("waterTargetMl")),
      proteinTargetG: numberOrNull(formData.get("proteinTargetG")),
      sleepTargetMinutes: numberOrNull(formData.get("sleepTargetMinutes")),
      ieltsExamDate: valueOrNull(formData.get("ieltsExamDate")),
    });
  if (!parsed.success)
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "设置内容不符合要求。",
    };
  if (!isSupabaseConfigured() || publicEnv.demoMode)
    return demoResult("演示设置已应用到当前界面。 ");
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: parsed.data.displayName,
      timezone: parsed.data.timezone,
      target_weight_kg: parsed.data.targetWeightKg,
      stretch_target_weight_kg: parsed.data.stretchTargetWeightKg,
      daily_step_target: parsed.data.stepTarget,
      daily_water_ml_target: parsed.data.waterTargetMl,
      daily_protein_g_target: parsed.data.proteinTargetG,
      daily_sleep_minutes_target: parsed.data.sleepTargetMinutes,
      ielts_exam_date: parsed.data.ieltsExamDate,
    })
    .eq("id", (await supabase.auth.getUser()).data.user?.id ?? "");
  if (error) return { status: "error", message: "设置保存失败。" };
  revalidatePath("/settings");
  return { status: "success", message: "设置已保存。" };
}

export async function deleteAccountAction(
  _state: MutationState,
  formData: FormData,
): Promise<MutationState> {
  if (!isSupabaseConfigured() || publicEnv.demoMode)
    return { status: "error", message: "演示模式没有可删除的账号。" };
  const typedEmail = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const confirmation = formData.get("confirmation");
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (
    !user?.email ||
    typedEmail !== user.email.toLowerCase() ||
    confirmation !== "DELETE"
  ) {
    return { status: "error", message: "邮箱或确认文字不匹配。" };
  }
  const { error: reauthError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password,
  });
  if (reauthError)
    return { status: "error", message: "密码不正确，账号未删除。" };
  let admin: ReturnType<typeof createAdminClient>;
  try {
    admin = createAdminClient();
  } catch {
    return {
      status: "error",
      message: "账户删除服务暂时不可用，数据未被删除。",
    };
  }
  const { error } = await admin.auth.admin.deleteUser(user.id, false);
  if (error) {
    console.error("Account deletion admin request failed", {
      name: error.name,
      status: error.status,
      code: error.code,
    });
    return { status: "error", message: "账号删除失败，请稍后重试。" };
  }
  await supabase.auth.signOut();
  redirect("/?deleted=1");
}
