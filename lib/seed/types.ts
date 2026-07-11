import type { DayCategory, PlanIntensity, TaskCategory } from "@/types/domain";

export type CommitmentKind = "INTERNSHIP" | "COURSE" | "EXAM" | "PERSONAL";

export interface SeedCommitment {
  seedKey: string;
  title: string;
  kind: CommitmentKind;
  startTime: string | null;
  endTime: string | null;
  isAllDay?: boolean;
}

export interface SeedTask {
  seedKey: string;
  title: string;
  description?: string;
  category: TaskCategory;
  plannedStart?: string;
  plannedEnd?: string;
  estimatedMinutes: number;
  required: boolean;
  minimumDayEligible: boolean;
  sortOrder: number;
}

export interface SeedDay {
  date: string;
  category: DayCategory;
  intensity: PlanIntensity;
  title: string;
  summary: string;
  commitments: SeedCommitment[];
  tasks: SeedTask[];
}

export interface GeneratedPlan {
  templateKey: string;
  templateVersion: number;
  timezone: string;
  startDate: string;
  endDate: string;
  payloadHash: string;
  days: SeedDay[];
}

export interface FlexCommitmentRule {
  id: string;
  title: string;
  kind: CommitmentKind;
  /** JavaScript weekday values: Sunday=0 ... Saturday=6. */
  daysOfWeek: number[];
  startTime: string;
  endTime: string;
  startsOn?: string;
  endsOn?: string;
}

export interface FlexSpecialEvent {
  id: string;
  date: string;
  title: string;
  category: DayCategory;
  summary?: string;
  isAllDay?: boolean;
  startTime?: string;
  endTime?: string;
}

export interface FlexPlanConfig {
  startDate: string;
  endDate: string;
  timezone: string;
  commitments?: FlexCommitmentRule[];
  specialEvents?: FlexSpecialEvent[];
  includeStudyTasks?: boolean;
  includeWellnessTasks?: boolean;
}
