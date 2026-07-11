import "server-only";

import {
  calculateCompletionScore,
  calculateCorrelation,
  calculateSafeWeightProjection,
  type CorrelationResult,
  type WeightProjection,
} from "@/lib/analytics";
import { generateKiritoPlan } from "@/lib/seed";
import { isSupabaseConfigured, publicEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

type Row = Record<string, unknown>;

function isDemo() {
  return !isSupabaseConfigured() || publicEnv.demoMode;
}

export type CalendarDay = {
  id: string;
  planCycleId: string | null;
  date: string;
  title: string;
  summary: string;
  category: string;
  intensity: string;
  completion: number;
  taskCount: number;
};

export async function getCalendarDays(): Promise<CalendarDay[]> {
  if (isDemo()) {
    return generateKiritoPlan().days.map((day, index) => ({
      id: `demo-${day.date}`,
      planCycleId: null,
      date: day.date,
      title: day.title,
      summary: day.summary,
      category: day.category,
      intensity: day.intensity,
      completion: index < 4 ? [100, 72, 46, 18][index] : 0,
      taskCount: day.tasks.length,
    }));
  }
  const supabase = await createClient();
  const { data: plans } = await supabase
    .from("daily_plans")
    .select("id,plan_cycle_id,plan_date,title,summary,day_category,intensity")
    .order("plan_date");
  if (!plans?.length) return [];
  const ids = plans.map((plan) => plan.id);
  const { data: tasks } = await supabase
    .from("plan_tasks")
    .select("daily_plan_id,status,required")
    .in("daily_plan_id", ids);
  return plans.map((plan) => {
    const planTasks =
      tasks?.filter((task) => task.daily_plan_id === plan.id) ?? [];
    const total = planTasks.reduce(
      (sum, task) => sum + (task.required ? 2 : 1),
      0,
    );
    const done = planTasks.reduce(
      (sum, task) =>
        sum + (task.status === "COMPLETED" ? (task.required ? 2 : 1) : 0),
      0,
    );
    return {
      id: plan.id,
      planCycleId: plan.plan_cycle_id,
      date: plan.plan_date,
      title: plan.title,
      summary: plan.summary,
      category: plan.day_category,
      intensity: plan.intensity,
      completion: total ? Math.round((done / total) * 100) : 0,
      taskCount: planTasks.length,
    };
  });
}

export type AnalyticsPageData = {
  weights: { label: string; value: number }[];
  steps: { label: string; value: number }[];
  sleep: { label: string; value: number }[];
  mood: { label: string; value: number }[];
  latestWeight: number | null;
  weightChange: number | null;
  averageSteps: number | null;
  averageSleep: number | null;
  workouts: number;
  ieltsMinutes: number;
  sampleCount: number;
  projection: WeightProjection;
  completionPercent: number;
  ieltsBySkill: { skill: string; minutes: number }[];
  sleepMoodCorrelation: CorrelationResult;
};

export async function getAnalyticsData(
  filters: { from?: string; to?: string; limit?: number } = {},
): Promise<AnalyticsPageData> {
  if (isDemo()) {
    const allDates = [
      "2026-07-13",
      "2026-07-16",
      "2026-07-20",
      "2026-07-24",
      "2026-07-28",
      "2026-08-01",
      "2026-08-05",
    ];
    const dates = allDates
      .filter(
        (date) =>
          (!filters.from || date >= filters.from) &&
          (!filters.to || date <= filters.to),
      )
      .slice(-(filters.limit ?? allDates.length));
    const labels = dates.map((date) => date.slice(5));
    const weightByDate = new Map(
      allDates.map((date, index) => [
        date,
        [83, 82.7, 82.2, 81.9, 81.5, 81.2, 80.9][index],
      ]),
    );
    const demoWeights = dates.map((date) => weightByDate.get(date)!);
    const demoSteps = dates.map(
      (date) =>
        [8200, 10400, 9600, 11200, 7400, 12800, 10100][allDates.indexOf(date)],
    );
    const demoSleep = dates.map(
      (date) => [7.4, 7.1, 6.8, 7.6, 7.2, 8.0, 7.5][allDates.indexOf(date)],
    );
    return {
      weights: labels.map((label, index) => ({
        label,
        value: demoWeights[index],
      })),
      steps: labels.map((label, index) => ({ label, value: demoSteps[index] })),
      sleep: labels.map((label, index) => ({ label, value: demoSleep[index] })),
      mood: dates.map((date) => ({
        label: date.slice(5),
        value: [6, 7, 6, 8, 7, 8, 8][allDates.indexOf(date)],
      })),
      latestWeight: demoWeights.at(-1) ?? null,
      weightChange:
        demoWeights.length >= 2
          ? Number((demoWeights.at(-1)! - demoWeights[0]).toFixed(1))
          : null,
      averageSteps: demoSteps.length
        ? Math.round(
            demoSteps.reduce((sum, value) => sum + value, 0) / demoSteps.length,
          )
        : null,
      averageSleep: demoSleep.length
        ? Number(
            (
              demoSleep.reduce((sum, value) => sum + value, 0) /
              demoSleep.length
            ).toFixed(1),
          )
        : null,
      workouts: 6,
      ieltsMinutes: 485,
      sampleCount: dates.length,
      projection: calculateSafeWeightProjection(
        dates.map((date, index) => ({ date, weightKg: demoWeights[index] })),
        75,
      ),
      completionPercent: 68,
      ieltsBySkill: [
        { skill: "听力", minutes: 170 },
        { skill: "阅读", minutes: 125 },
        { skill: "写作", minutes: 110 },
        { skill: "口语", minutes: 80 },
      ],
      sleepMoodCorrelation: calculateCorrelation(
        demoSleep.map((sleepHours, index) => ({
          x: sleepHours,
          y: [6, 7, 6, 8, 7, 8, 8][allDates.indexOf(dates[index])],
        })),
      ),
    };
  }
  const supabase = await createClient();
  let logsQuery = supabase
    .from("daily_logs")
    .select("log_date,weight_kg,steps,sleep_minutes,mood")
    .order("log_date");
  let workoutsQuery = supabase
    .from("workout_sessions")
    .select("id,session_date");
  let ieltsQuery = supabase
    .from("ielts_sessions")
    .select("actual_minutes,session_date,skill");
  if (filters.from) {
    logsQuery = logsQuery.gte("log_date", filters.from);
    workoutsQuery = workoutsQuery.gte("session_date", filters.from);
    ieltsQuery = ieltsQuery.gte("session_date", filters.from);
  }
  if (filters.to) {
    logsQuery = logsQuery.lte("log_date", filters.to);
    workoutsQuery = workoutsQuery.lte("session_date", filters.to);
    ieltsQuery = ieltsQuery.lte("session_date", filters.to);
  }
  const [
    { data: logs },
    { data: workouts },
    { data: ielts },
    { data: profile },
    { data: taskRows },
  ] = await Promise.all([
    logsQuery.limit(filters.limit ?? 120),
    workoutsQuery.limit(500),
    ieltsQuery.limit(500),
    supabase.from("profiles").select("target_weight_kg").maybeSingle(),
    supabase.from("plan_tasks").select("required,status").limit(5000),
  ]);
  const rows = (logs ?? []) as Row[];
  const toPoints = (key: string, transform = (value: number) => value) =>
    rows
      .filter((row) => row[key] != null)
      .map((row) => ({
        label: String(row.log_date).slice(5),
        value: transform(Number(row[key])),
      }));
  const weights = toPoints("weight_kg");
  const steps = toPoints("steps");
  const sleep = toPoints("sleep_minutes", (value) =>
    Number((value / 60).toFixed(1)),
  );
  const mood = toPoints("mood");
  const weightReadings = rows
    .filter((row) => row.weight_kg != null)
    .map((row) => ({
      date: String(row.log_date),
      weightKg: Number(row.weight_kg),
    }));
  const targetWeight = Number(profile?.target_weight_kg ?? 75);
  const completion = calculateCompletionScore(
    (taskRows ?? []).map((task) => ({
      required: task.required,
      status: task.status,
    })),
  );
  const skillMinutes = new Map<string, number>();
  for (const session of ielts ?? [])
    skillMinutes.set(
      session.skill,
      (skillMinutes.get(session.skill) ?? 0) +
        Number(session.actual_minutes ?? 0),
    );
  const correlationPairs = rows
    .filter((row) => row.sleep_minutes != null && row.mood != null)
    .map((row) => ({ x: Number(row.sleep_minutes) / 60, y: Number(row.mood) }));
  return {
    weights,
    steps,
    sleep,
    mood,
    latestWeight: weights.at(-1)?.value ?? null,
    weightChange:
      weights.length >= 2
        ? Number((weights.at(-1)!.value - weights[0].value).toFixed(1))
        : null,
    averageSteps: steps.length
      ? Math.round(
          steps.reduce((sum, point) => sum + point.value, 0) / steps.length,
        )
      : null,
    averageSleep: sleep.length
      ? Number(
          (
            sleep.reduce((sum, point) => sum + point.value, 0) / sleep.length
          ).toFixed(1),
        )
      : null,
    workouts: workouts?.length ?? 0,
    ieltsMinutes: (ielts ?? []).reduce(
      (sum, item) => sum + Number(item.actual_minutes ?? 0),
      0,
    ),
    sampleCount: rows.length,
    projection: calculateSafeWeightProjection(weightReadings, targetWeight),
    completionPercent: completion.percent,
    ieltsBySkill: [...skillMinutes.entries()]
      .map(([skill, minutes]) => ({ skill, minutes }))
      .sort((a, b) => b.minutes - a.minutes),
    sleepMoodCorrelation: calculateCorrelation(correlationPairs),
  };
}

export type IeltsSessionView = {
  id: string;
  date: string;
  skill: string;
  minutes: number;
  band: number | null;
  nextAction: string | null;
  mainErrors: string | null;
};

export async function getIeltsSessions(): Promise<IeltsSessionView[]> {
  if (isDemo())
    return [
      {
        id: "i1",
        date: "2026-07-13",
        skill: "LISTENING",
        minutes: 45,
        band: 7.5,
        nextAction: "复盘地图题与拼写",
        mainErrors: "地图题方位词与复数拼写",
      },
      {
        id: "i2",
        date: "2026-07-15",
        skill: "READING",
        minutes: 40,
        band: 7,
        nextAction: "练习证据定位",
        mainErrors: "判断题把推断当作原文事实",
      },
      {
        id: "i3",
        date: "2026-07-18",
        skill: "MOCK",
        minutes: 150,
        band: 7.5,
        nextAction: "整理重复错误",
        mainErrors: "写作结论段时间不足",
      },
    ];
  const supabase = await createClient();
  const { data } = await supabase
    .from("ielts_sessions")
    .select(
      "id,session_date,skill,actual_minutes,estimated_band,next_action,main_errors",
    )
    .order("session_date", { ascending: false })
    .limit(100);
  return (data ?? []).map((row) => ({
    id: row.id,
    date: row.session_date,
    skill: row.skill,
    minutes: row.actual_minutes,
    band: row.estimated_band,
    nextAction: row.next_action,
    mainErrors: row.main_errors,
  }));
}

export type GreProgramView = {
  id: string;
  university: string;
  program: string;
  status: string;
  deadline: string | null;
  url: string | null;
  verifiedDate: string | null;
};

export async function getGrePrograms(): Promise<GreProgramView[]> {
  if (isDemo())
    return [
      {
        id: "g1",
        university: "示例大学 A",
        program: "Computer Science",
        status: "OPTIONAL",
        deadline: "2026-12-01",
        url: "https://example.edu/requirements",
        verifiedDate: "2026-08-02",
      },
      {
        id: "g2",
        university: "示例大学 B",
        program: "Data Science",
        status: "NOT_REQUIRED",
        deadline: "2027-01-10",
        url: "https://example.edu/admissions",
        verifiedDate: "2026-08-04",
      },
    ];
  const supabase = await createClient();
  const { data } = await supabase
    .from("gre_programs")
    .select(
      "id,university,program,requirement_status,application_deadline,official_requirement_url,verified_date",
    )
    .order("university");
  return (data ?? []).map((row) => ({
    id: row.id,
    university: row.university,
    program: row.program,
    status: row.requirement_status,
    deadline: row.application_deadline,
    url: row.official_requirement_url,
    verifiedDate: row.verified_date,
  }));
}

export type GreDecisionView = {
  cycleId: string | null;
  decision: "PREPARE" | "DO_NOT_PREPARE" | "DEFER_PENDING_SCHOOL_LIST";
  rationale: string;
  completedChecks: string[];
};

export async function getGreDecision(): Promise<GreDecisionView> {
  if (isDemo())
    return {
      cycleId: null,
      decision: "DEFER_PENDING_SCHOOL_LIST",
      rationale: "先核验完整学校清单与官方要求，再决定是否投入备考时间。",
      completedChecks: [
        "TARGET_PROGRAMS_LISTED",
        "COST_AND_AVAILABILITY_CHECKED",
      ],
    };
  const supabase = await createClient();
  const { data: cycle } = await supabase
    .from("plan_cycles")
    .select("id")
    .eq("status", "ACTIVE")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!cycle)
    return {
      cycleId: null,
      decision: "DEFER_PENDING_SCHOOL_LIST",
      rationale: "",
      completedChecks: [],
    };
  const [{ data: decision }, { data: checks }] = await Promise.all([
    supabase
      .from("gre_decisions")
      .select("decision,rationale")
      .eq("plan_cycle_id", cycle.id)
      .maybeSingle(),
    supabase
      .from("gre_checklist_items")
      .select("question_key,answer")
      .eq("plan_cycle_id", cycle.id),
  ]);
  return {
    cycleId: cycle.id,
    decision: (decision?.decision ??
      "DEFER_PENDING_SCHOOL_LIST") as GreDecisionView["decision"],
    rationale: decision?.rationale ?? "",
    completedChecks: (checks ?? [])
      .filter((item) => item.answer === "YES")
      .map((item) => item.question_key),
  };
}

export async function getPlanEditorData(date?: string) {
  const days = await getCalendarDays();
  const selected = days.find((day) => day.date === date) ?? days[0] ?? null;
  if (!selected)
    return {
      days,
      selected: null,
      tasks: [] as Row[],
      commitments: [] as Row[],
    };
  if (isDemo()) {
    const seedDay = generateKiritoPlan().days.find(
      (day) => day.date === selected.date,
    );
    return {
      days,
      selected,
      tasks:
        seedDay?.tasks.map((task) => ({ ...task, status: "pending" })) ?? [],
      commitments:
        seedDay?.commitments.map((commitment) => ({
          ...commitment,
          id: commitment.seedKey,
        })) ?? [],
    };
  }
  const supabase = await createClient();
  const [{ data: tasks }, { data: commitments }] = await Promise.all([
    supabase
      .from("plan_tasks")
      .select("*")
      .eq("daily_plan_id", selected.id)
      .order("sort_order"),
    supabase
      .from("daily_commitments")
      .select("*")
      .eq("daily_plan_id", selected.id)
      .order("local_start_time"),
  ]);
  return {
    days,
    selected,
    tasks: (tasks ?? []) as Row[],
    commitments: (commitments ?? []) as Row[],
  };
}

export async function getSettingsProfile() {
  if (isDemo())
    return {
      displayName: "Kirito",
      timezone: "Asia/Shanghai",
      targetWeightKg: 75,
      stretchTargetWeightKg: 73,
      stepTarget: 10000,
      waterTargetMl: 2500,
      proteinTargetG: 130,
      sleepTargetMinutes: 450,
      ieltsExamDate: "2026-08-29",
      email: "demo@summer-os.local",
    };
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userData.user?.id ?? "")
    .maybeSingle();
  const row = (data ?? {}) as Row;
  return {
    displayName: String(row.display_name ?? ""),
    timezone: String(row.timezone ?? "Asia/Shanghai"),
    targetWeightKg: Number(row.target_weight_kg ?? 75),
    stretchTargetWeightKg: Number(row.stretch_target_weight_kg ?? 73),
    stepTarget: Number(row.daily_step_target ?? 10000),
    waterTargetMl: Number(row.daily_water_ml_target ?? 2500),
    proteinTargetG: Number(row.daily_protein_g_target ?? 130),
    sleepTargetMinutes: Number(row.daily_sleep_minutes_target ?? 450),
    ieltsExamDate: String(row.ielts_exam_date ?? ""),
    email: userData.user?.email ?? "",
  };
}

export type WeeklyReviewData = {
  weekStartDate: string;
  wins: string;
  challenges: string;
  adjustments: string;
  recoveryRating: number | null;
  burnoutRating: number | null;
  stopCommitment: string;
  nextWeekFocus: string;
};

export async function getWeeklyReviewData(
  weekStartDate: string,
): Promise<WeeklyReviewData> {
  if (isDemo()) {
    return {
      weekStartDate,
      wins: "完成了核心任务，也给恢复留出了空间。",
      challenges: "工作日精力波动，晚间学习容易拖延。",
      adjustments: "把最难的学习任务前移，低精力日启用最低完成版。",
      recoveryRating: 4,
      burnoutRating: 2,
      stopCommitment: "停止用熬夜补偿白天没完成的任务。",
      nextWeekFocus: "稳定睡眠，并完成两次 IELTS 错题复盘。",
    };
  }
  const supabase = await createClient();
  const { data } = await supabase
    .from("weekly_reviews")
    .select(
      "week_start_date,wins,challenges,adjustments,recovery_rating,burnout_rating,stop_commitment,next_week_focus",
    )
    .eq("week_start_date", weekStartDate)
    .maybeSingle();
  return {
    weekStartDate,
    wins: data?.wins ?? "",
    challenges: data?.challenges ?? "",
    adjustments: data?.adjustments ?? "",
    recoveryRating: data?.recovery_rating ?? null,
    burnoutRating: data?.burnout_rating ?? null,
    stopCommitment: data?.stop_commitment ?? "",
    nextWeekFocus: data?.next_week_focus ?? "",
  };
}
