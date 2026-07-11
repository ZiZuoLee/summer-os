"use server";

import { redirect } from "next/navigation";
import {
  generateFlexPlan,
  generateKiritoPlan,
  toSeedPlanRpcArgs,
} from "@/lib/seed";
import { isSupabaseConfigured, publicEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { onboardingSchema } from "@/app/onboarding/schema";

export type OnboardingState = {
  status: "idle" | "error";
  message?: string;
  fieldErrors?: Record<string, string[]>;
};

function optionalString(value: FormDataEntryValue | null) {
  return typeof value === "string" && value ? value : undefined;
}

export async function completeOnboardingAction(
  _state: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  if (!isSupabaseConfigured()) {
    if (publicEnv.demoMode) redirect("/today");
    return { status: "error", message: "数据库尚未配置，暂时无法保存设置。" };
  }

  const parsed = onboardingSchema.safeParse({
    displayName: formData.get("displayName"),
    timezone: formData.get("timezone"),
    heightCm: formData.get("heightCm"),
    startingWeightKg: formData.get("startingWeightKg"),
    targetWeightKg: formData.get("targetWeightKg"),
    stretchTargetWeightKg: optionalString(
      formData.get("stretchTargetWeightKg"),
    ),
    previousIeltsBand: formData.get("previousIeltsBand"),
    templateKey: formData.get("templateKey"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    nutritionMode: formData.get("nutritionMode"),
    stepTarget: formData.get("stepTarget"),
    waterTargetMl: formData.get("waterTargetMl"),
    proteinTargetG: formData.get("proteinTargetG"),
    sleepTargetMinutes: formData.get("sleepTargetMinutes"),
    ieltsExamDate: optionalString(formData.get("ieltsExamDate")),
  });
  if (!parsed.success) {
    return { status: "error", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "error", message: "登录已失效，请重新登录。" };

  const data = parsed.data;
  const internshipDays = formData.getAll("internshipDays").map(Number);
  const courseDays = formData.getAll("courseDays").map(Number);
  const plan =
    data.templateKey === "kirito-summer-2026"
      ? generateKiritoPlan()
      : generateFlexPlan({
          startDate: data.startDate,
          endDate: data.endDate,
          timezone: data.timezone,
          commitments: [
            ...(internshipDays.length
              ? [
                  {
                    id: "onboarding-internship",
                    title: "实习 / 工作",
                    kind: "INTERNSHIP" as const,
                    daysOfWeek: internshipDays,
                    startTime: "09:00",
                    endTime: "17:30",
                  },
                ]
              : []),
            ...(courseDays.length
              ? [
                  {
                    id: "onboarding-course",
                    title: "课程",
                    kind: "COURSE" as const,
                    daysOfWeek: courseDays,
                    startTime: "09:00",
                    endTime: "11:30",
                  },
                ]
              : []),
          ],
          specialEvents: data.ieltsExamDate
            ? [
                {
                  id: "ielts-exam",
                  date: data.ieltsExamDate,
                  title: "IELTS 考试（待确认）",
                  category: "EXAM_DAY",
                  isAllDay: true,
                },
              ]
            : [],
        });

  const profilePayload = {
    display_name: data.displayName,
    timezone: data.timezone,
    height_cm: data.heightCm,
    starting_weight_kg: data.startingWeightKg,
    target_weight_kg: data.targetWeightKg,
    stretch_target_weight_kg: data.stretchTargetWeightKg ?? null,
    previous_ielts_band: data.previousIeltsBand,
    summer_start_date: plan.startDate,
    summer_end_date: plan.endDate,
    nutrition_mode: data.nutritionMode,
    daily_step_target: data.stepTarget,
    daily_water_ml_target: data.waterTargetMl,
    daily_protein_g_target: data.proteinTargetG,
    daily_sleep_minutes_target: data.sleepTargetMinutes,
    ielts_exam_date: data.ieltsExamDate ?? null,
    onboarding_completed: false,
    adult_acknowledged_at: new Date().toISOString(),
    health_disclaimer_acknowledged_at: new Date().toISOString(),
  };

  const { error: profileError } = await supabase
    .from("profiles")
    .update(profilePayload)
    .eq("id", user.id);
  if (profileError)
    return { status: "error", message: "无法保存个人设置，请稍后重试。" };

  const rpcArgs = toSeedPlanRpcArgs(
    plan,
    `onboarding:${user.id}:${plan.payloadHash}`,
  );
  const { error: seedError } = await supabase.rpc("seed_plan_cycle", rpcArgs);
  if (seedError)
    return {
      status: "error",
      message: "计划生成失败，你的设置已安全保留，请重试。",
    };

  const { error: completeError } = await supabase
    .from("profiles")
    .update({ onboarding_completed: true })
    .eq("id", user.id);
  if (completeError)
    return {
      status: "error",
      message: "计划已生成，但完成状态保存失败，请重试。",
    };

  redirect("/today");
}
