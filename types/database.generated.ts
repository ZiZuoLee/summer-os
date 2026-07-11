/**
 * Public-schema types matching the checked-in migrations.
 * Regenerate after any schema change with: npm run db:types
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type GeneratedTable<Row, Required extends keyof Row = never> = {
  Row: Row;
  Insert: Pick<Row, Required> & Partial<Row>;
  Update: Partial<Row>;
  Relationships: [];
};

type Timestamped = { created_at: string; updated_at: string };

export type Database = {
  public: {
    Tables: {
      profiles: GeneratedTable<
        Timestamped & {
          id: string;
          display_name: string;
          timezone: string;
          height_cm: number | null;
          starting_weight_kg: number | null;
          target_weight_kg: number | null;
          stretch_target_weight_kg: number | null;
          previous_ielts_band: number | null;
          summer_start_date: string | null;
          summer_end_date: string | null;
          nutrition_mode: string;
          daily_step_target: number;
          daily_water_ml_target: number;
          daily_protein_g_target: number;
          daily_sleep_minutes_target: number;
          ielts_exam_date: string | null;
          onboarding_completed: boolean;
          health_disclaimer_acknowledged_at: string | null;
          adult_acknowledged_at: string | null;
        },
        "id"
      >;
      app_preferences: GeneratedTable<
        Timestamped & {
          user_id: string;
          theme: string;
          dashboard_density: string;
          locale: string;
          week_starts_on: number;
          notification_preferences: Json;
        },
        "user_id"
      >;
      plan_templates: GeneratedTable<
        {
          key: string;
          version: number;
          name: string;
          description: string;
          definition: Json;
          is_active: boolean;
          created_at: string;
        },
        "key" | "version" | "name" | "description" | "definition"
      >;
      plan_cycles: GeneratedTable<
        Timestamped & {
          id: string;
          user_id: string;
          template_key: string;
          template_version: number;
          timezone: string;
          start_date: string;
          end_date: string;
          payload_hash: string;
          seed_payload: Json;
          status: string;
          last_seeded_at: string | null;
        },
        | "user_id"
        | "template_key"
        | "template_version"
        | "timezone"
        | "start_date"
        | "end_date"
        | "payload_hash"
        | "seed_payload"
      >;
      recurring_commitments: GeneratedTable<
        Timestamped & {
          id: string;
          user_id: string;
          plan_cycle_id: string;
          title: string;
          kind: string;
          days_of_week: number[];
          local_start_time: string;
          local_end_time: string;
          starts_on: string | null;
          ends_on: string | null;
          source: string;
        },
        | "user_id"
        | "plan_cycle_id"
        | "title"
        | "kind"
        | "days_of_week"
        | "local_start_time"
        | "local_end_time"
      >;
      daily_plans: GeneratedTable<
        Timestamped & {
          id: string;
          user_id: string;
          plan_cycle_id: string | null;
          plan_date: string;
          day_category: string;
          intensity: string;
          title: string;
          summary: string;
          source: string;
          seed_key: string | null;
          minimum_mode_enabled: boolean;
          user_modified_at: string | null;
          row_version: number;
        },
        "user_id" | "plan_date" | "day_category" | "intensity" | "title"
      >;
      daily_commitments: GeneratedTable<
        Timestamped & {
          id: string;
          user_id: string;
          daily_plan_id: string;
          title: string;
          kind: string;
          local_start_time: string | null;
          local_end_time: string | null;
          is_all_day: boolean;
          source: string;
          seed_key: string | null;
        },
        "user_id" | "daily_plan_id" | "title" | "kind"
      >;
      plan_tasks: GeneratedTable<
        Timestamped & {
          id: string;
          user_id: string;
          daily_plan_id: string;
          title: string;
          description: string | null;
          category: string;
          planned_start: string | null;
          planned_end: string | null;
          estimated_minutes: number;
          required: boolean;
          status: string;
          completed_at: string | null;
          sort_order: number;
          source: string;
          seed_key: string | null;
          minimum_day_eligible: boolean;
          user_modified_at: string | null;
          row_version: number;
        },
        "user_id" | "daily_plan_id" | "title" | "category" | "estimated_minutes"
      >;
      daily_logs: GeneratedTable<
        Timestamped & {
          id: string;
          user_id: string;
          log_date: string;
          weight_kg: number | null;
          weight_skipped: boolean;
          waist_cm: number | null;
          waist_skipped: boolean;
          sleep_minutes: number | null;
          sleep_skipped: boolean;
          sleep_quality: number | null;
          steps: number | null;
          steps_skipped: boolean;
          water_ml: number | null;
          water_skipped: boolean;
          protein_g: number | null;
          protein_skipped: boolean;
          calories: number | null;
          calories_skipped: boolean;
          nutrition_quality_flags: string[];
          meal_quality: number | null;
          mood: number | null;
          energy: number | null;
          hunger: number | null;
          pain_level: number | null;
          dizziness_or_fainting: boolean;
          intake_concern: boolean;
          notes: string | null;
        },
        "user_id" | "log_date" | "weight_skipped"
      >;
      workout_sessions: GeneratedTable<
        Timestamped & {
          id: string;
          user_id: string;
          session_date: string;
          workout_type: string;
          duration_minutes: number;
          rpe: number | null;
          notes: string | null;
        },
        "user_id" | "session_date" | "workout_type" | "duration_minutes"
      >;
      ielts_sessions: GeneratedTable<
        Timestamped & {
          id: string;
          user_id: string;
          session_date: string;
          skill: string;
          source_material: string | null;
          planned_minutes: number | null;
          actual_minutes: number;
          raw_score: number | null;
          estimated_band: number | null;
          main_errors: string | null;
          next_action: string | null;
          attachment_url: string | null;
        },
        "user_id" | "session_date" | "skill" | "actual_minutes"
      >;
      ielts_errors: GeneratedTable<
        Timestamped & {
          id: string;
          user_id: string;
          ielts_session_id: string;
          skill: string;
          error_type: string;
          error_detail: string;
          correction: string | null;
          recurrence_count: number;
          resolved: boolean;
        },
        "user_id" | "ielts_session_id" | "skill" | "error_type" | "error_detail"
      >;
      gre_programs: GeneratedTable<
        Timestamped & {
          id: string;
          user_id: string;
          university: string;
          program: string;
          intake: string | null;
          official_requirement_url: string | null;
          requirement_status: string;
          scholarship_relevance: string | null;
          application_deadline: string | null;
          notes: string | null;
          verified_date: string | null;
        },
        "user_id" | "university" | "program"
      >;
      gre_decisions: GeneratedTable<
        Timestamped & {
          id: string;
          user_id: string;
          plan_cycle_id: string | null;
          decision: string;
          rationale: string;
          decided_at: string;
        },
        "user_id" | "decision" | "rationale"
      >;
      gre_checklist_items: GeneratedTable<
        Timestamped & {
          id: string;
          user_id: string;
          plan_cycle_id: string;
          question_key: string;
          answer: string;
          evidence_url: string | null;
          notes: string | null;
          verified_at: string | null;
        },
        "user_id" | "plan_cycle_id" | "question_key"
      >;
      weekly_reviews: GeneratedTable<
        Timestamped & {
          id: string;
          user_id: string;
          plan_cycle_id: string | null;
          week_start_date: string;
          wins: string;
          challenges: string | null;
          adjustments: string | null;
          recovery_rating: number | null;
          burnout_rating: number | null;
          stop_commitment: string | null;
          next_week_focus: string | null;
        },
        "user_id" | "week_start_date" | "wins"
      >;
      health_alerts: GeneratedTable<
        Timestamped & {
          id: string;
          user_id: string;
          kind: string;
          severity: string;
          observed_on: string;
          title: string;
          message: string;
          status: string;
        },
        "user_id" | "kind" | "severity" | "observed_on" | "title" | "message"
      >;
      alert_acknowledgements: GeneratedTable<
        {
          id: string;
          user_id: string;
          health_alert_id: string;
          note: string | null;
          acknowledged_at: string;
        },
        "user_id" | "health_alert_id"
      >;
      seed_runs: GeneratedTable<
        {
          id: string;
          user_id: string;
          plan_cycle_id: string;
          idempotency_key: string;
          payload_hash: string;
          status: string;
          inserted_plans: number;
          inserted_commitments: number;
          inserted_tasks: number;
          response: Json | null;
          created_at: string;
          completed_at: string | null;
        },
        "user_id" | "plan_cycle_id" | "idempotency_key" | "payload_hash"
      >;
    };
    Views: { [_ in never]: never };
    Functions: {
      duplicate_plan_day: {
        Args: { p_source_date: string; p_target_date: string };
        Returns: Json;
      };
      hook_enforce_beta_capacity: { Args: { event: Json }; Returns: Json };
      reset_plan_progress: {
        Args: { p_plan_cycle_id: string; p_confirmation: string };
        Returns: Json;
      };
      restore_plan_day: {
        Args: { p_plan_date: string; p_confirmation: string };
        Returns: Json;
      };
      seed_plan_cycle: {
        Args: {
          p_template_key: string;
          p_timezone: string;
          p_start_date: string;
          p_end_date: string;
          p_days: Json;
          p_idempotency_key: string;
        };
        Returns: Json;
      };
      set_task_status: {
        Args: {
          p_task_id: string;
          p_status: string;
          p_expected_row_version: number;
        };
        Returns: Json;
      };
      submit_daily_checkin: {
        Args: {
          p_idempotency_key: string;
          p_log: Json;
          p_workout?: Json | null;
          p_ielts?: Json | null;
        };
        Returns: Json;
      };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};

type PublicSchema = Database["public"];
export type Tables<
  NameOrOptions extends
    keyof PublicSchema["Tables"] | { schema: keyof Database },
  TableName extends (NameOrOptions extends { schema: keyof Database }
    ? keyof Database[NameOrOptions["schema"]]["Tables"]
    : never) = never,
> = NameOrOptions extends { schema: keyof Database }
  ? Database[NameOrOptions["schema"]]["Tables"][TableName] extends {
      Row: infer Row;
    }
    ? Row
    : never
  : NameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][NameOrOptions] extends { Row: infer Row }
      ? Row
      : never
    : never;

export type TablesInsert<Name extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][Name] extends { Insert: infer Insert }
    ? Insert
    : never;
export type TablesUpdate<Name extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][Name] extends { Update: infer Update }
    ? Update
    : never;
