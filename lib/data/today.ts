import "server-only";

import { isSupabaseConfigured, publicEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { demoTodayData } from "@/lib/data/demo";
import type { DashboardTask, TodayDashboardData } from "@/lib/data/types";

type UnknownRow = Record<string, unknown>;

function localDate(timezone: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function numberOrNull(value: unknown) {
  return typeof value === "number"
    ? value
    : value == null
      ? null
      : Number(value);
}

function mapTasks(rows: UnknownRow[]): DashboardTask[] {
  return rows.map((task) => ({
    id: String(task.id),
    title: String(task.title ?? "未命名任务"),
    description: task.description ? String(task.description) : null,
    category: String(task.category ?? "PERSONAL"),
    timeBlock:
      typeof task.planned_start === "string"
        ? task.planned_start < "12:00"
          ? "morning"
          : task.planned_start < "18:00"
            ? "day"
            : "evening"
        : "anytime",
    plannedStart: task.planned_start ? String(task.planned_start) : null,
    required: Boolean(task.required),
    minimumDayEligible: Boolean(task.minimum_day_eligible),
    status: String(
      task.status ?? "PENDING",
    ).toLowerCase() as DashboardTask["status"],
    rowVersion: Number(task.row_version ?? 0),
  }));
}

function completionScore(tasks: DashboardTask[]) {
  const total = tasks.reduce((sum, task) => sum + (task.required ? 2 : 1), 0);
  const done = tasks.reduce(
    (sum, task) =>
      sum + (task.status === "completed" ? (task.required ? 2 : 1) : 0),
    0,
  );
  return total ? Math.round((done / total) * 100) : 0;
}

export async function getTodayDashboard(): Promise<TodayDashboardData> {
  if (!isSupabaseConfigured() || publicEnv.demoMode) return demoTodayData;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return demoTodayData;

  const { data: profileData } = await supabase
    .from("profiles")
    .select(
      "display_name, timezone, target_weight_kg, stretch_target_weight_kg",
    )
    .eq("id", user.id)
    .maybeSingle();
  const profile = (profileData ?? {}) as UnknownRow;
  const timezone = String(profile.timezone ?? "Asia/Shanghai");
  const today = localDate(timezone);

  let { data: planData } = await supabase
    .from("daily_plans")
    .select(
      "id, plan_date, title, summary, day_category, intensity, minimum_mode_enabled",
    )
    .eq("plan_date", today)
    .maybeSingle();
  let isPreviewDate = false;
  if (!planData) {
    const { data: upcoming } = await supabase
      .from("daily_plans")
      .select(
        "id, plan_date, title, summary, day_category, intensity, minimum_mode_enabled",
      )
      .gte("plan_date", today)
      .order("plan_date")
      .limit(1)
      .maybeSingle();
    planData = upcoming;
    isPreviewDate = Boolean(upcoming);
  }
  if (!planData)
    return {
      ...demoTodayData,
      profile: {
        ...demoTodayData.profile,
        displayName: String(profile.display_name ?? "夏日行动者"),
        timezone,
      },
    };
  const plan = planData as UnknownRow;

  const [
    { data: taskData },
    { data: recentLogs },
    { data: ieltsRows },
    { data: healthAlerts },
  ] = await Promise.all([
    supabase
      .from("plan_tasks")
      .select(
        "id,title,description,category,planned_start,required,minimum_day_eligible,status,row_version",
      )
      .eq("daily_plan_id", plan.id)
      .order("sort_order"),
    supabase
      .from("daily_logs")
      .select(
        "log_date,weight_kg,steps,sleep_minutes,dizziness_or_fainting,pain_level",
      )
      .lte("log_date", plan.plan_date)
      .order("log_date", { ascending: false })
      .limit(14),
    supabase
      .from("ielts_sessions")
      .select("session_date,actual_minutes,next_action")
      .lte("session_date", plan.plan_date)
      .order("session_date", { ascending: false })
      .limit(12),
    supabase
      .from("health_alerts")
      .select("id,severity,title,message")
      .eq("status", "OPEN")
      .order("observed_on", { ascending: false })
      .limit(6),
  ]);

  const tasks = mapTasks((taskData ?? []) as UnknownRow[]);
  const logs = (recentLogs ?? []) as UnknownRow[];
  const weights = logs
    .map((row) => numberOrNull(row.weight_kg))
    .filter((v): v is number => v !== null)
    .slice(0, 7);
  const latestLog = logs.find((row) => row.log_date === plan.plan_date) ?? {};
  const ielts = (ieltsRows ?? []) as UnknownRow[];
  const minimumTasks = tasks.filter((task) => task.minimumDayEligible);
  const persistedAlerts = (healthAlerts ?? []).map((alert) => ({
    id: alert.id,
    tone:
      alert.severity === "URGENT"
        ? ("danger" as const)
        : alert.severity === "WARNING"
          ? ("warning" as const)
          : ("info" as const),
    title: alert.title,
    description: alert.message,
  }));
  const dangerLog = logs.find(
    (row) => row.dizziness_or_fainting || Number(row.pain_level ?? 0) >= 7,
  );

  return {
    profile: {
      displayName: String(
        profile.display_name ?? user.user_metadata.display_name ?? "夏日行动者",
      ),
      timezone,
      targetWeightKg: Number(profile.target_weight_kg ?? 75),
      stretchTargetWeightKg: numberOrNull(profile.stretch_target_weight_kg),
    },
    date: String(plan.plan_date),
    isPreviewDate,
    plan: {
      id: String(plan.id),
      title: String(plan.title),
      summary: String(plan.summary ?? ""),
      category: String(plan.day_category),
      intensity: (plan.intensity ??
        "MODERATE") as TodayDashboardData["plan"]["intensity"],
      minimumModeEnabled: Boolean(plan.minimum_mode_enabled),
    },
    tasks,
    metrics: {
      completion: completionScore(tasks),
      minimumCompletion: completionScore(minimumTasks),
      streak: 0,
      latestWeightKg: weights[0] ?? null,
      sevenDayWeightKg:
        weights.length >= 3
          ? Number(
              (weights.reduce((a, b) => a + b, 0) / weights.length).toFixed(1),
            )
          : null,
      todaySteps: numberOrNull(latestLog.steps),
      todaySleepHours: latestLog.sleep_minutes
        ? Number((Number(latestLog.sleep_minutes) / 60).toFixed(1))
        : null,
      ieltsMinutesThisWeek: ielts.reduce(
        (sum, row) => sum + Number(row.actual_minutes ?? 0),
        0,
      ),
    },
    alerts: persistedAlerts.length
      ? persistedAlerts
      : dangerLog
        ? [
            {
              id: "health-signal",
              tone: "danger",
              title: "请优先照顾身体",
              description:
                "你最近记录了眩晕或明显疼痛。请暂停高强度活动，并考虑咨询专业人士。",
            },
          ]
        : [],
    nextIeltsAction: String(
      ielts[0]?.next_action ?? "完成下一项计划中的 IELTS 任务",
    ),
  };
}
