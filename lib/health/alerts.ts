import {
  calculateSafeWeightProjection,
  type WeightReading,
} from "@/lib/analytics";
import { addDateDays, differenceInCalendarDays } from "@/lib/seed/date";

export type HealthAlertKind =
  | "EXCESSIVE_WEIGHT_LOSS"
  | "LOW_SLEEP"
  | "DIZZINESS_OR_FAINTING"
  | "SEVERE_PAIN"
  | "INTAKE_CONCERN"
  | "CONSECUTIVE_HIGH_RPE";

export interface HealthLogInput {
  date: string;
  weightKg?: number | null;
  sleepMinutes?: number | null;
  dizzinessOrFainting?: boolean;
  painLevel?: number | null;
  intakeConcern?: boolean;
}

export interface WorkoutAlertInput {
  date: string;
  rpe?: number | null;
}

export interface HealthAlert {
  kind: HealthAlertKind;
  severity: "INFO" | "WARNING" | "URGENT";
  observedOn: string;
  title: string;
  message: string;
}

function latestDate(
  logs: HealthLogInput[],
  workouts: WorkoutAlertInput[],
): string | null {
  return (
    [...logs.map((item) => item.date), ...workouts.map((item) => item.date)]
      .sort()
      .at(-1) ?? null
  );
}

function hasSevenConsecutiveHighRpe(
  workouts: WorkoutAlertInput[],
  endDate: string,
): boolean {
  const highDates = new Set(
    workouts.filter((item) => (item.rpe ?? 0) >= 8).map((item) => item.date),
  );
  for (let offset = 0; offset < 7; offset += 1) {
    if (!highDates.has(addDateDays(endDate, -offset))) return false;
  }
  return true;
}

export function evaluateHealthAlerts(
  logs: HealthLogInput[],
  workouts: WorkoutAlertInput[] = [],
): HealthAlert[] {
  const asOf = latestDate(logs, workouts);
  if (!asOf) return [];
  const recentStart = addDateDays(asOf, -6);
  const recentLogs = logs.filter(
    (item) => item.date >= recentStart && item.date <= asOf,
  );
  const alerts: HealthAlert[] = [];

  const weights: WeightReading[] = logs.flatMap((item) =>
    item.weightKg == null ? [] : [{ date: item.date, weightKg: item.weightKg }],
  );
  if (weights.length >= 7) {
    const sorted = [...weights].sort((left, right) =>
      left.date.localeCompare(right.date),
    );
    const projection = calculateSafeWeightProjection(
      sorted,
      Math.max(30, sorted.at(-1)!.weightKg - 1),
    );
    if (projection.available && projection.cappedForSafety) {
      alerts.push({
        kind: "EXCESSIVE_WEIGHT_LOSS",
        severity: "WARNING",
        observedOn: asOf,
        title: "近期体重下降较快",
        message:
          "趋势超过每周约 1% 的一般安全提示线。请降低强度、优先补充与休息；如有不适请咨询专业人员。",
      });
    }
  }

  const sleeps = recentLogs.flatMap((item) =>
    item.sleepMinutes == null ? [] : [item.sleepMinutes],
  );
  if (
    sleeps.length >= 3 &&
    sleeps.reduce((sum, value) => sum + value, 0) / sleeps.length < 360
  ) {
    alerts.push({
      kind: "LOW_SLEEP",
      severity: "WARNING",
      observedOn: asOf,
      title: "近期睡眠偏少",
      message:
        "近七天已记录睡眠平均不足 6 小时。建议减少非必要负荷并优先恢复。",
    });
  }

  if (recentLogs.some((item) => item.dizzinessOrFainting)) {
    alerts.push({
      kind: "DIZZINESS_OR_FAINTING",
      severity: "URGENT",
      observedOn: asOf,
      title: "记录到头晕或晕厥",
      message:
        "请暂停高强度训练与限制性饮食，并尽快寻求合格医疗专业人员的建议；紧急情况请联系当地急救服务。",
    });
  }

  if (recentLogs.some((item) => (item.painLevel ?? 0) >= 7)) {
    alerts.push({
      kind: "SEVERE_PAIN",
      severity: "URGENT",
      observedOn: asOf,
      title: "记录到严重疼痛",
      message: "不要带痛硬撑。请停止相关活动，并考虑尽快咨询合格医疗专业人员。",
    });
  }

  if (recentLogs.filter((item) => item.intakeConcern).length >= 2) {
    alerts.push({
      kind: "INTAKE_CONCERN",
      severity: "WARNING",
      observedOn: asOf,
      title: "多次报告摄入担忧",
      message:
        "请避免进一步限制摄入，优先规律、均衡进食，并在担忧持续或伴随不适时寻求专业支持。",
    });
  }

  if (hasSevenConsecutiveHighRpe(workouts, asOf)) {
    alerts.push({
      kind: "CONSECUTIVE_HIGH_RPE",
      severity: "WARNING",
      observedOn: asOf,
      title: "连续七天高强度训练",
      message:
        "建议安排恢复日并降低训练强度。持续疲劳、疼痛或表现下降时请咨询专业人员。",
    });
  }
  return alerts;
}

export interface TargetPaceAssessment {
  plannedWeeklyPercent: number;
  exceedsOnePercentPerWeek: boolean;
  message: string;
}

export function assessTargetPace(
  startingWeightKg: number,
  targetWeightKg: number,
  startDate: string,
  targetDate: string,
): TargetPaceAssessment {
  const days = differenceInCalendarDays(targetDate, startDate);
  if (days < 1 || startingWeightKg <= 0 || targetWeightKg <= 0) {
    throw new RangeError("A valid weight and future target date are required");
  }
  const plannedWeeklyPercent =
    ((startingWeightKg - targetWeightKg) / startingWeightKg / days) * 700;
  const exceeds = plannedWeeklyPercent > 1;
  return {
    plannedWeeklyPercent: Number(plannedWeeklyPercent.toFixed(2)),
    exceedsOnePercentPerWeek: exceeds,
    message: exceeds
      ? "该目标所需速度超过每周约 1%。可保留为愿望，但不应转化为极端饮食或运动要求。"
      : "目标速度位于每周约 1% 的一般提示线以内，但仍需根据个人健康状况调整。",
  };
}
