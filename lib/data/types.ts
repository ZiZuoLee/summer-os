export type TaskStatus = "pending" | "completed" | "skipped";

export type DashboardTask = {
  id: string;
  title: string;
  description?: string | null;
  category: string;
  timeBlock: "morning" | "day" | "evening" | "anytime";
  plannedStart?: string | null;
  required: boolean;
  minimumDayEligible: boolean;
  status: TaskStatus;
  rowVersion: number;
};

export type DashboardAlert = {
  id: string;
  tone: "info" | "warning" | "danger";
  title: string;
  description: string;
};

export type TodayDashboardData = {
  profile: {
    displayName: string;
    timezone: string;
    targetWeightKg: number;
    stretchTargetWeightKg: number | null;
  };
  date: string;
  isPreviewDate: boolean;
  plan: {
    id: string;
    title: string;
    summary: string;
    category: string;
    intensity: "LOW" | "MODERATE" | "HIGH";
    minimumModeEnabled: boolean;
  };
  tasks: DashboardTask[];
  metrics: {
    completion: number;
    minimumCompletion: number;
    streak: number;
    latestWeightKg: number | null;
    sevenDayWeightKg: number | null;
    todaySteps: number | null;
    todaySleepHours: number | null;
    ieltsMinutesThisWeek: number;
  };
  alerts: DashboardAlert[];
  nextIeltsAction: string;
};
