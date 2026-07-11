import type { IeltsSkill } from "./domain";

/** Input accepted by the submit_daily_checkin RPC. User identity is never supplied. */
export interface DailyCheckInRpcPayload {
  log_date: string;
  weight_kg?: number | null;
  weight_skipped: boolean;
  waist_cm?: number | null;
  waist_skipped?: boolean;
  sleep_minutes?: number | null;
  sleep_skipped?: boolean;
  sleep_quality?: number | null;
  steps?: number | null;
  steps_skipped?: boolean;
  water_ml?: number | null;
  water_skipped?: boolean;
  protein_g?: number | null;
  protein_skipped?: boolean;
  calories?: number | null;
  calories_skipped?: boolean;
  nutrition_quality_flags?: string[];
  meal_quality?: number | null;
  mood?: number | null;
  energy?: number | null;
  hunger?: number | null;
  pain_level?: number | null;
  dizziness_or_fainting?: boolean;
  intake_concern?: boolean;
  notes?: string | null;
}

export interface WorkoutRpcPayload {
  session_date?: string;
  workout_type: string;
  duration_minutes: number;
  rpe?: number | null;
  notes?: string | null;
}

export interface IeltsRpcPayload {
  session_date?: string;
  skill: IeltsSkill;
  source_material?: string | null;
  planned_minutes?: number | null;
  actual_minutes: number;
  raw_score?: number | null;
  estimated_band?: number | null;
  main_errors?: string | null;
  next_action?: string | null;
  attachment_url?: string | null;
}

export interface CheckInRpcResult {
  daily_log_id: string;
  workout_session_id: string | null;
  ielts_session_id: string | null;
  replayed: boolean;
}

export interface SeedPlanRpcResult {
  cycle_id: string;
  seed_run_id: string;
  payload_hash: string;
  inserted_plans: number;
  inserted_commitments: number;
  inserted_tasks: number;
  replayed: boolean;
}

export interface DuplicatePlanDayRpcResult {
  plan_id: string;
  plan_date: string;
  copied_commitments: number;
  copied_tasks: number;
}

export interface ResetPlanProgressRpcResult {
  cycle_id: string;
  reset_minimum_mode_days: number;
  reset_tasks: number;
  user_edits_preserved: true;
  completions_preserved: true;
  custom_content_preserved: true;
  tracking_history_preserved: true;
}
