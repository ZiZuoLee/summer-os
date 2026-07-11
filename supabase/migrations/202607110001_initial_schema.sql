create schema if not exists extensions;
create schema if not exists private;

create extension if not exists pgcrypto with schema extensions;

comment on schema private is 'Server-only Summer OS state; not exposed through the Data API.';
revoke all on schema private from public, anon, authenticated;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default 'Summer OS 用户',
  timezone text not null default 'Asia/Shanghai',
  height_cm numeric(5, 2),
  starting_weight_kg numeric(5, 2),
  target_weight_kg numeric(5, 2),
  stretch_target_weight_kg numeric(5, 2),
  previous_ielts_band numeric(2, 1),
  summer_start_date date,
  summer_end_date date,
  nutrition_mode text not null default 'BALANCED',
  daily_step_target integer not null default 8000,
  daily_water_ml_target integer not null default 2000,
  daily_protein_g_target integer not null default 90,
  daily_sleep_minutes_target integer not null default 480,
  ielts_exam_date date,
  onboarding_completed boolean not null default false,
  health_disclaimer_acknowledged_at timestamptz,
  adult_acknowledged_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_display_name_length check (char_length(display_name) between 1 and 80),
  constraint profiles_timezone_length check (char_length(timezone) between 1 and 100),
  constraint profiles_height_range check (height_cm is null or height_cm between 100 and 250),
  constraint profiles_start_weight_range check (starting_weight_kg is null or starting_weight_kg between 30 and 350),
  constraint profiles_target_weight_range check (target_weight_kg is null or target_weight_kg between 30 and 350),
  constraint profiles_stretch_weight_range check (stretch_target_weight_kg is null or stretch_target_weight_kg between 30 and 350),
  constraint profiles_ielts_band_range check (previous_ielts_band is null or (previous_ielts_band between 0 and 9 and mod(previous_ielts_band, 0.5) = 0)),
  constraint profiles_plan_range check (
    (summer_start_date is null and summer_end_date is null)
    or (summer_start_date is not null and summer_end_date is not null and summer_end_date - summer_start_date between 6 and 119)
  ),
  constraint profiles_exam_in_range check (
    ielts_exam_date is null or summer_start_date is null or summer_end_date is null
    or ielts_exam_date between summer_start_date and summer_end_date
  ),
  constraint profiles_nutrition_mode check (nutrition_mode in ('BALANCED', 'PLATE_METHOD', 'MINDFUL', 'CUSTOM')),
  constraint profiles_step_target_range check (daily_step_target between 1000 and 50000),
  constraint profiles_water_target_range check (daily_water_ml_target between 500 and 8000),
  constraint profiles_protein_target_range check (daily_protein_g_target between 20 and 400),
  constraint profiles_sleep_target_range check (daily_sleep_minutes_target between 240 and 720)
);

create table public.app_preferences (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  theme text not null default 'SYSTEM',
  dashboard_density text not null default 'COMFORTABLE',
  locale text not null default 'zh-CN',
  week_starts_on smallint not null default 1,
  notification_preferences jsonb not null default '{"available":false}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint app_preferences_theme check (theme in ('LIGHT', 'DARK', 'SYSTEM')),
  constraint app_preferences_density check (dashboard_density in ('COMFORTABLE', 'COMPACT')),
  constraint app_preferences_locale check (locale = 'zh-CN'),
  constraint app_preferences_week_start check (week_starts_on = 1),
  constraint app_preferences_notifications_object check (jsonb_typeof(notification_preferences) = 'object')
);

create table public.plan_templates (
  key text primary key,
  version integer not null,
  name text not null,
  description text not null,
  definition jsonb not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint plan_templates_key_format check (key ~ '^[a-z0-9-]+@[1-9][0-9]*$'),
  constraint plan_templates_version_positive check (version > 0),
  constraint plan_templates_definition_object check (jsonb_typeof(definition) = 'object')
);

create table public.plan_cycles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  template_key text not null references public.plan_templates (key),
  template_version integer not null,
  timezone text not null,
  start_date date not null,
  end_date date not null,
  payload_hash text not null,
  seed_payload jsonb not null,
  status text not null default 'ACTIVE',
  last_seeded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint plan_cycles_id_user_unique unique (id, user_id),
  constraint plan_cycles_identity_unique unique (user_id, template_key, start_date, end_date),
  constraint plan_cycles_range check (end_date - start_date between 6 and 119),
  constraint plan_cycles_timezone_length check (char_length(timezone) between 1 and 100),
  constraint plan_cycles_hash_format check (payload_hash ~ '^[a-f0-9]{64}$'),
  constraint plan_cycles_payload_array check (jsonb_typeof(seed_payload) = 'array' and jsonb_array_length(seed_payload) between 7 and 120),
  constraint plan_cycles_status check (status in ('ACTIVE', 'ARCHIVED'))
);

create table public.recurring_commitments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  plan_cycle_id uuid not null,
  title text not null,
  kind text not null,
  days_of_week smallint[] not null,
  local_start_time time not null,
  local_end_time time not null,
  starts_on date,
  ends_on date,
  source text not null default 'USER',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint recurring_commitments_id_user_unique unique (id, user_id),
  constraint recurring_commitments_cycle_owner_fk foreign key (plan_cycle_id, user_id)
    references public.plan_cycles (id, user_id) on delete cascade,
  constraint recurring_commitments_title_length check (char_length(title) between 1 and 240),
  constraint recurring_commitments_kind check (kind in ('INTERNSHIP', 'COURSE', 'EXAM', 'PERSONAL')),
  constraint recurring_commitments_days check (cardinality(days_of_week) between 1 and 7 and days_of_week <@ array[0,1,2,3,4,5,6]::smallint[]),
  constraint recurring_commitments_times check (local_end_time > local_start_time),
  constraint recurring_commitments_dates check (starts_on is null or ends_on is null or starts_on <= ends_on),
  constraint recurring_commitments_source check (source in ('SEED', 'USER'))
);

create table public.daily_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  plan_cycle_id uuid,
  plan_date date not null,
  day_category text not null,
  intensity text not null,
  title text not null,
  summary text not null default '',
  source text not null default 'USER',
  seed_key text,
  minimum_mode_enabled boolean not null default false,
  user_modified_at timestamptz,
  row_version bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint daily_plans_id_user_unique unique (id, user_id),
  constraint daily_plans_user_date_unique unique (user_id, plan_date),
  constraint daily_plans_cycle_owner_fk foreign key (plan_cycle_id, user_id)
    references public.plan_cycles (id, user_id) on delete cascade,
  constraint daily_plans_category check (day_category in ('BASELINE', 'INTERNSHIP_PART_TIME', 'COURSE_DAY', 'WEEKEND_INTENSIVE', 'WEEKEND_RECOVERY', 'INTERNSHIP_FULL_TIME', 'IELTS_TAPER', 'EXAM_DAY', 'FINAL_REVIEW', 'FLEX_DAY')),
  constraint daily_plans_intensity check (intensity in ('LOW', 'MODERATE', 'HIGH')),
  constraint daily_plans_title_length check (char_length(title) between 1 and 240),
  constraint daily_plans_summary_length check (char_length(summary) <= 2000),
  constraint daily_plans_source check (source in ('SEED', 'USER', 'SYSTEM')),
  constraint daily_plans_seed_key check (source <> 'SEED' or seed_key is not null),
  constraint daily_plans_seed_key_length check (seed_key is null or char_length(seed_key) <= 300)
);

create table public.daily_commitments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  daily_plan_id uuid not null,
  title text not null,
  kind text not null,
  local_start_time time,
  local_end_time time,
  is_all_day boolean not null default false,
  source text not null default 'USER',
  seed_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint daily_commitments_id_user_unique unique (id, user_id),
  constraint daily_commitments_seed_unique unique (user_id, daily_plan_id, seed_key),
  constraint daily_commitments_plan_owner_fk foreign key (daily_plan_id, user_id)
    references public.daily_plans (id, user_id) on delete cascade,
  constraint daily_commitments_title_length check (char_length(title) between 1 and 240),
  constraint daily_commitments_kind check (kind in ('INTERNSHIP', 'COURSE', 'EXAM', 'PERSONAL')),
  constraint daily_commitments_times check (
    (is_all_day and local_start_time is null and local_end_time is null)
    or (not is_all_day and local_start_time is not null and local_end_time is not null and local_end_time > local_start_time)
  ),
  constraint daily_commitments_source check (source in ('SEED', 'USER', 'SYSTEM')),
  constraint daily_commitments_seed_key check (source <> 'SEED' or seed_key is not null),
  constraint daily_commitments_seed_key_length check (seed_key is null or char_length(seed_key) <= 300)
);

create table public.plan_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  daily_plan_id uuid not null,
  title text not null,
  description text,
  category text not null,
  planned_start time,
  planned_end time,
  estimated_minutes integer not null,
  required boolean not null default true,
  status text not null default 'PENDING',
  completed_at timestamptz,
  sort_order integer not null default 0,
  source text not null default 'USER',
  seed_key text,
  minimum_day_eligible boolean not null default false,
  user_modified_at timestamptz,
  row_version bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint plan_tasks_id_user_unique unique (id, user_id),
  constraint plan_tasks_seed_unique unique (user_id, daily_plan_id, seed_key),
  constraint plan_tasks_plan_owner_fk foreign key (daily_plan_id, user_id)
    references public.daily_plans (id, user_id) on delete cascade,
  constraint plan_tasks_title_length check (char_length(title) between 1 and 240),
  constraint plan_tasks_description_length check (description is null or char_length(description) <= 2000),
  constraint plan_tasks_category check (category in ('FIXED_COMMITMENT', 'FITNESS', 'NUTRITION', 'IELTS', 'GRE', 'RECOVERY', 'PLANNING', 'COURSE', 'INTERNSHIP', 'PERSONAL')),
  constraint plan_tasks_times check (planned_start is null or planned_end is null or planned_end > planned_start),
  constraint plan_tasks_duration check (estimated_minutes between 1 and 1440),
  constraint plan_tasks_status check (status in ('PENDING', 'COMPLETED', 'SKIPPED')),
  constraint plan_tasks_completed_at check ((status = 'COMPLETED' and completed_at is not null) or (status <> 'COMPLETED' and completed_at is null)),
  constraint plan_tasks_sort_order check (sort_order between 0 and 100000),
  constraint plan_tasks_source check (source in ('SEED', 'USER', 'SYSTEM')),
  constraint plan_tasks_seed_key check (source <> 'SEED' or seed_key is not null),
  constraint plan_tasks_seed_key_length check (seed_key is null or char_length(seed_key) <= 300)
);

create table public.daily_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  log_date date not null,
  weight_kg numeric(5, 2),
  weight_skipped boolean not null default false,
  waist_cm numeric(5, 2),
  waist_skipped boolean not null default false,
  sleep_minutes integer,
  sleep_skipped boolean not null default false,
  sleep_quality smallint,
  steps integer,
  steps_skipped boolean not null default false,
  water_ml integer,
  water_skipped boolean not null default false,
  protein_g integer,
  protein_skipped boolean not null default false,
  calories integer,
  calories_skipped boolean not null default false,
  nutrition_quality_flags text[] not null default '{}'::text[],
  meal_quality smallint,
  mood smallint,
  energy smallint,
  hunger smallint,
  pain_level smallint,
  dizziness_or_fainting boolean not null default false,
  intake_concern boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint daily_logs_id_user_unique unique (id, user_id),
  constraint daily_logs_user_date_unique unique (user_id, log_date),
  constraint daily_logs_weight_range check (weight_kg is null or weight_kg between 30 and 350),
  constraint daily_logs_weight_explicit check ((weight_kg is not null) <> weight_skipped),
  constraint daily_logs_waist_range check (waist_cm is null or waist_cm between 30 and 300),
  constraint daily_logs_waist_skip check (not (waist_cm is not null and waist_skipped)),
  constraint daily_logs_sleep_range check (sleep_minutes is null or sleep_minutes between 0 and 1440),
  constraint daily_logs_sleep_skip check (not (sleep_minutes is not null and sleep_skipped)),
  constraint daily_logs_sleep_quality check (sleep_quality is null or sleep_quality between 1 and 5),
  constraint daily_logs_steps_range check (steps is null or steps between 0 and 200000),
  constraint daily_logs_steps_skip check (not (steps is not null and steps_skipped)),
  constraint daily_logs_water_range check (water_ml is null or water_ml between 0 and 20000),
  constraint daily_logs_water_skip check (not (water_ml is not null and water_skipped)),
  constraint daily_logs_protein_range check (protein_g is null or protein_g between 0 and 1000),
  constraint daily_logs_protein_skip check (not (protein_g is not null and protein_skipped)),
  constraint daily_logs_calories_range check (calories is null or calories between 0 and 20000),
  constraint daily_logs_calories_skip check (not (calories is not null and calories_skipped)),
  constraint daily_logs_nutrition_flags check (nutrition_quality_flags <@ array['REGULAR_MEALS', 'PROTEIN_FORWARD', 'FRUIT_OR_VEGETABLES', 'MINDFUL_PORTION', 'FLEXIBLE_CHOICE']::text[]),
  constraint daily_logs_meal_quality check (meal_quality is null or meal_quality between 1 and 5),
  constraint daily_logs_mood check (mood is null or mood between 1 and 5),
  constraint daily_logs_energy check (energy is null or energy between 1 and 5),
  constraint daily_logs_hunger check (hunger is null or hunger between 1 and 5),
  constraint daily_logs_pain check (pain_level is null or pain_level between 0 and 10),
  constraint daily_logs_notes_length check (notes is null or char_length(notes) <= 4000)
);

create table public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  session_date date not null,
  workout_type text not null,
  duration_minutes integer not null,
  rpe smallint,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint workout_sessions_id_user_unique unique (id, user_id),
  constraint workout_sessions_type_length check (char_length(workout_type) between 1 and 80),
  constraint workout_sessions_duration check (duration_minutes between 1 and 600),
  constraint workout_sessions_rpe check (rpe is null or rpe between 1 and 10),
  constraint workout_sessions_notes_length check (notes is null or char_length(notes) <= 4000)
);

create table public.ielts_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  session_date date not null,
  skill text not null,
  source_material text,
  planned_minutes integer,
  actual_minutes integer not null,
  raw_score numeric(5, 2),
  estimated_band numeric(2, 1),
  main_errors text,
  next_action text,
  attachment_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ielts_sessions_id_user_unique unique (id, user_id),
  constraint ielts_sessions_skill check (skill in ('LISTENING', 'READING', 'WRITING_TASK_1', 'WRITING_TASK_2', 'SPEAKING', 'VOCABULARY', 'MOCK')),
  constraint ielts_sessions_source_length check (source_material is null or char_length(source_material) <= 500),
  constraint ielts_sessions_planned_minutes check (planned_minutes is null or planned_minutes between 1 and 600),
  constraint ielts_sessions_actual_minutes check (actual_minutes between 1 and 600),
  constraint ielts_sessions_raw_score check (raw_score is null or raw_score between 0 and 100),
  constraint ielts_sessions_band check (estimated_band is null or (estimated_band between 0 and 9 and mod(estimated_band, 0.5) = 0)),
  constraint ielts_sessions_errors_length check (main_errors is null or char_length(main_errors) <= 2000),
  constraint ielts_sessions_next_length check (next_action is null or char_length(next_action) <= 1000),
  constraint ielts_sessions_attachment_https check (attachment_url is null or attachment_url ~ '^https://'),
  constraint ielts_sessions_attachment_length check (attachment_url is null or char_length(attachment_url) <= 2048)
);

create table public.ielts_errors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  ielts_session_id uuid not null,
  skill text not null,
  error_type text not null,
  error_detail text not null,
  correction text,
  recurrence_count integer not null default 1,
  resolved boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ielts_errors_id_user_unique unique (id, user_id),
  constraint ielts_errors_session_owner_fk foreign key (ielts_session_id, user_id)
    references public.ielts_sessions (id, user_id) on delete cascade,
  constraint ielts_errors_skill check (skill in ('LISTENING', 'READING', 'WRITING_TASK_1', 'WRITING_TASK_2', 'SPEAKING', 'VOCABULARY', 'MOCK')),
  constraint ielts_errors_type_length check (char_length(error_type) between 1 and 120),
  constraint ielts_errors_detail_length check (char_length(error_detail) between 1 and 2000),
  constraint ielts_errors_correction_length check (correction is null or char_length(correction) <= 2000),
  constraint ielts_errors_recurrence check (recurrence_count between 1 and 10000)
);

create table public.gre_programs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  university text not null,
  program text not null,
  intake text,
  official_requirement_url text,
  requirement_status text not null default 'UNKNOWN',
  scholarship_relevance text,
  application_deadline date,
  notes text,
  verified_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint gre_programs_id_user_unique unique (id, user_id),
  constraint gre_programs_identity_unique unique (user_id, university, program, intake),
  constraint gre_programs_university_length check (char_length(university) between 1 and 240),
  constraint gre_programs_program_length check (char_length(program) between 1 and 240),
  constraint gre_programs_intake_length check (intake is null or char_length(intake) <= 80),
  constraint gre_programs_url_https check (official_requirement_url is null or official_requirement_url ~ '^https://'),
  constraint gre_programs_url_length check (official_requirement_url is null or char_length(official_requirement_url) <= 2048),
  constraint gre_programs_status check (requirement_status in ('REQUIRED', 'OPTIONAL', 'NOT_REQUIRED', 'NOT_ACCEPTED', 'UNKNOWN')),
  constraint gre_programs_scholarship_length check (scholarship_relevance is null or char_length(scholarship_relevance) <= 1000),
  constraint gre_programs_notes_length check (notes is null or char_length(notes) <= 4000)
);

create table public.gre_decisions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  plan_cycle_id uuid,
  decision text not null,
  rationale text not null,
  decided_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint gre_decisions_id_user_unique unique (id, user_id),
  constraint gre_decisions_user_cycle_unique unique (user_id, plan_cycle_id),
  constraint gre_decisions_cycle_owner_fk foreign key (plan_cycle_id, user_id)
    references public.plan_cycles (id, user_id) on delete cascade,
  constraint gre_decisions_decision check (decision in ('PREPARE', 'DO_NOT_PREPARE', 'DEFER_PENDING_SCHOOL_LIST')),
  constraint gre_decisions_rationale_length check (char_length(rationale) between 20 and 4000)
);

create table public.gre_checklist_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  plan_cycle_id uuid not null,
  question_key text not null,
  answer text not null default 'UNKNOWN',
  evidence_url text,
  notes text,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint gre_checklist_items_id_user_unique unique (id, user_id),
  constraint gre_checklist_items_question_unique unique (user_id, plan_cycle_id, question_key),
  constraint gre_checklist_items_cycle_owner_fk foreign key (plan_cycle_id, user_id)
    references public.plan_cycles (id, user_id) on delete cascade,
  constraint gre_checklist_items_question check (question_key in (
    'TARGET_PROGRAMS_LISTED', 'GRE_REQUIRED', 'GRE_OPTIONAL', 'GRE_NOT_CONSIDERED',
    'QUANT_SCORE_VALUE', 'ENOUGH_PREP_TIME', 'OPPORTUNITY_COST_ACCEPTABLE', 'COST_AND_AVAILABILITY_CHECKED'
  )),
  constraint gre_checklist_items_answer check (answer in ('YES', 'NO', 'UNKNOWN', 'NOT_APPLICABLE')),
  constraint gre_checklist_items_evidence_https check (evidence_url is null or evidence_url ~ '^https://'),
  constraint gre_checklist_items_evidence_length check (evidence_url is null or char_length(evidence_url) <= 2048),
  constraint gre_checklist_items_notes_length check (notes is null or char_length(notes) <= 2000)
);

create table public.weekly_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  plan_cycle_id uuid,
  week_start_date date not null,
  wins text not null,
  challenges text,
  adjustments text,
  recovery_rating smallint,
  burnout_rating smallint,
  stop_commitment text,
  next_week_focus text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint weekly_reviews_id_user_unique unique (id, user_id),
  constraint weekly_reviews_user_week_unique unique (user_id, week_start_date),
  constraint weekly_reviews_cycle_owner_fk foreign key (plan_cycle_id, user_id)
    references public.plan_cycles (id, user_id) on delete set null (plan_cycle_id),
  constraint weekly_reviews_monday check (extract(isodow from week_start_date) = 1),
  constraint weekly_reviews_wins_length check (char_length(wins) between 1 and 3000),
  constraint weekly_reviews_challenges_length check (challenges is null or char_length(challenges) <= 3000),
  constraint weekly_reviews_adjustments_length check (adjustments is null or char_length(adjustments) <= 3000),
  constraint weekly_reviews_recovery check (recovery_rating is null or recovery_rating between 1 and 5),
  constraint weekly_reviews_burnout check (burnout_rating is null or burnout_rating between 1 and 5),
  constraint weekly_reviews_stop_length check (stop_commitment is null or char_length(stop_commitment) <= 1000),
  constraint weekly_reviews_focus_length check (next_week_focus is null or char_length(next_week_focus) <= 1000)
);

create table public.health_alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null,
  severity text not null,
  observed_on date not null,
  title text not null,
  message text not null,
  status text not null default 'OPEN',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint health_alerts_id_user_unique unique (id, user_id),
  constraint health_alerts_dedupe unique (user_id, kind, observed_on),
  constraint health_alerts_kind check (kind in ('EXCESSIVE_WEIGHT_LOSS', 'LOW_SLEEP', 'DIZZINESS_OR_FAINTING', 'SEVERE_PAIN', 'INTAKE_CONCERN', 'CONSECUTIVE_HIGH_RPE')),
  constraint health_alerts_severity check (severity in ('INFO', 'WARNING', 'URGENT')),
  constraint health_alerts_title_length check (char_length(title) between 1 and 240),
  constraint health_alerts_message_length check (char_length(message) between 1 and 2000),
  constraint health_alerts_status check (status in ('OPEN', 'ACKNOWLEDGED', 'RESOLVED'))
);

create table public.alert_acknowledgements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  health_alert_id uuid not null,
  note text,
  acknowledged_at timestamptz not null default now(),
  constraint alert_acknowledgements_id_user_unique unique (id, user_id),
  constraint alert_acknowledgements_alert_unique unique (user_id, health_alert_id),
  constraint alert_acknowledgements_alert_owner_fk foreign key (health_alert_id, user_id)
    references public.health_alerts (id, user_id) on delete cascade,
  constraint alert_acknowledgements_note_length check (note is null or char_length(note) <= 1000)
);

create table public.seed_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  plan_cycle_id uuid not null,
  idempotency_key text not null,
  payload_hash text not null,
  status text not null default 'PENDING',
  inserted_plans integer not null default 0,
  inserted_commitments integer not null default 0,
  inserted_tasks integer not null default 0,
  response jsonb,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  constraint seed_runs_id_user_unique unique (id, user_id),
  constraint seed_runs_idempotency_unique unique (user_id, idempotency_key),
  constraint seed_runs_cycle_owner_fk foreign key (plan_cycle_id, user_id)
    references public.plan_cycles (id, user_id) on delete cascade,
  constraint seed_runs_idempotency_length check (char_length(idempotency_key) between 8 and 100),
  constraint seed_runs_hash_format check (payload_hash ~ '^[a-f0-9]{64}$'),
  constraint seed_runs_status check (status in ('PENDING', 'COMPLETED')),
  constraint seed_runs_counts check (inserted_plans >= 0 and inserted_commitments >= 0 and inserted_tasks >= 0),
  constraint seed_runs_completion check ((status = 'COMPLETED') = (completed_at is not null and response is not null))
);

create table private.mutation_receipts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  operation text not null,
  idempotency_key text not null,
  request_hash text not null,
  response jsonb,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  constraint mutation_receipts_idempotency_unique unique (user_id, operation, idempotency_key),
  constraint mutation_receipts_operation_length check (char_length(operation) between 1 and 80),
  constraint mutation_receipts_idempotency_length check (char_length(idempotency_key) between 8 and 100),
  constraint mutation_receipts_hash_format check (request_hash ~ '^[a-f0-9]{64}$'),
  constraint mutation_receipts_completion check ((response is null and completed_at is null) or (response is not null and completed_at is not null))
);

create table private.beta_settings (
  singleton boolean primary key default true check (singleton),
  signup_open boolean not null default true,
  max_users integer not null default 100 check (max_users between 1 and 10000),
  updated_at timestamptz not null default now()
);

insert into private.beta_settings (singleton, signup_open, max_users)
values (true, true, 100)
on conflict (singleton) do nothing;

insert into public.plan_templates (key, version, name, description, definition)
values
  (
    'kirito-summer-2026@1',
    1,
    'Kirito 2026 夏季模板',
    '不可变的 2026-07-13 至 2026-08-31 五十天参考模板。',
    '{"start_date":"2026-07-13","end_date":"2026-08-31","timezone":"Asia/Shanghai","days":50,"immutable":true}'::jsonb
  ),
  (
    'summer-os-flex@1',
    1,
    'Summer OS 灵活模板',
    '支持 7 至 120 天、IANA 时区、重复承诺和特殊事件。',
    '{"minimum_days":7,"maximum_days":120,"immutable":true}'::jsonb
  )
on conflict (key) do nothing;

create index plan_cycles_user_dates_idx on public.plan_cycles (user_id, start_date, end_date);
create index recurring_commitments_user_cycle_idx on public.recurring_commitments (user_id, plan_cycle_id);
create index daily_plans_user_date_idx on public.daily_plans (user_id, plan_date);
create index daily_commitments_user_plan_idx on public.daily_commitments (user_id, daily_plan_id);
create index plan_tasks_user_plan_sort_idx on public.plan_tasks (user_id, daily_plan_id, sort_order);
create index plan_tasks_user_status_idx on public.plan_tasks (user_id, status, completed_at);
create index daily_logs_user_date_idx on public.daily_logs (user_id, log_date desc);
create index workout_sessions_user_date_idx on public.workout_sessions (user_id, session_date desc);
create index ielts_sessions_user_date_idx on public.ielts_sessions (user_id, session_date desc);
create index ielts_errors_user_session_idx on public.ielts_errors (user_id, ielts_session_id, resolved);
create index gre_programs_user_status_idx on public.gre_programs (user_id, requirement_status);
create index gre_checklist_items_user_cycle_idx on public.gre_checklist_items (user_id, plan_cycle_id, question_key);
create index weekly_reviews_user_date_idx on public.weekly_reviews (user_id, week_start_date desc);
create index health_alerts_user_status_idx on public.health_alerts (user_id, status, observed_on desc);
create index seed_runs_user_created_idx on public.seed_runs (user_id, created_at desc);
