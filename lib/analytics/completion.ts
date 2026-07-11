import type { TaskStatus } from "@/types/domain";

export interface CompletionTask {
  required: boolean;
  status: TaskStatus;
  minimumDayEligible?: boolean;
}

export interface CompletionScore {
  completedWeight: number;
  totalWeight: number;
  percent: number;
  completedTasks: number;
  totalTasks: number;
}

export function calculateCompletionScore(
  tasks: CompletionTask[],
): CompletionScore {
  const totalWeight = tasks.reduce(
    (sum, item) => sum + (item.required ? 2 : 1),
    0,
  );
  const completedWeight = tasks.reduce(
    (sum, item) =>
      sum + (item.status === "COMPLETED" ? (item.required ? 2 : 1) : 0),
    0,
  );
  return {
    completedWeight,
    totalWeight,
    percent:
      totalWeight === 0 ? 0 : Math.round((completedWeight / totalWeight) * 100),
    completedTasks: tasks.filter((item) => item.status === "COMPLETED").length,
    totalTasks: tasks.length,
  };
}

export function calculateMinimumDayScore(
  tasks: CompletionTask[],
): CompletionScore {
  return calculateCompletionScore(
    tasks.filter((item) => item.minimumDayEligible),
  );
}
