create or replace function public.seed_plan_cycle(
  p_template_key text,
  p_timezone text,
  p_start_date date,
  p_end_date date,
  p_days jsonb,
  p_idempotency_key text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_template_version integer;
  v_payload_hash text;
  v_cycle_id uuid;
  v_seed_run_id uuid;
  v_existing_hash text;
  v_existing_response jsonb;
  v_day_count integer;
  v_unique_day_count integer;
  v_first_date date;
  v_last_date date;
  v_day jsonb;
  v_item jsonb;
  v_plan_id uuid;
  v_plan_cycle_id uuid;
  v_plan_source text;
  v_plan_modified_at timestamptz;
  v_row_count integer;
  v_inserted_plans integer := 0;
  v_inserted_commitments integer := 0;
  v_inserted_tasks integer := 0;
  v_response jsonb;
  v_category_counts record;
begin
  if v_user_id is null then
    raise exception using errcode = '42501', message = 'Authentication required';
  end if;
  if p_template_key is null or char_length(p_template_key) > 100 then
    raise exception using errcode = '22023', message = 'Invalid template key';
  end if;
  if p_idempotency_key is null or char_length(p_idempotency_key) not between 8 and 100 then
    raise exception using errcode = '22023', message = 'Invalid idempotency key';
  end if;
  if p_end_date - p_start_date not between 6 and 119 then
    raise exception using errcode = '22023', message = 'Plan must contain 7 to 120 days';
  end if;
  if not exists (select 1 from pg_catalog.pg_timezone_names where name = p_timezone) then
    raise exception using errcode = '22023', message = 'Invalid IANA timezone';
  end if;
  if jsonb_typeof(p_days) <> 'array' or jsonb_array_length(p_days) not between 7 and 120 then
    raise exception using errcode = '22023', message = 'Days must be a JSON array containing 7 to 120 items';
  end if;
  if pg_column_size(p_days) > 2097152 then
    raise exception using errcode = '22023', message = 'Seed payload exceeds 2 MiB';
  end if;

  select version into v_template_version
  from public.plan_templates
  where key = p_template_key and is_active;
  if v_template_version is null then
    raise exception using errcode = '22023', message = 'Unknown or inactive template';
  end if;

  v_payload_hash := encode(
    extensions.digest(pg_catalog.convert_to(p_days::text, 'UTF8'), 'sha256'),
    'hex'
  );
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(v_user_id::text || ':' || p_template_key || ':' || p_start_date::text, 0)
  );

  select payload_hash, response
  into v_existing_hash, v_existing_response
  from public.seed_runs
  where user_id = v_user_id and idempotency_key = p_idempotency_key;

  if found then
    if v_existing_hash <> v_payload_hash then
      raise exception using errcode = '22023', message = 'Idempotency key was already used with a different payload';
    end if;
    if v_existing_response is null then
      raise exception using errcode = '40001', message = 'Matching seed request is still pending';
    end if;
    return v_existing_response || '{"replayed":true}'::jsonb;
  end if;

  select
    count(*),
    count(distinct item.value ->> 'date'),
    min((item.value ->> 'date')::date),
    max((item.value ->> 'date')::date)
  into v_day_count, v_unique_day_count, v_first_date, v_last_date
  from jsonb_array_elements(p_days) as item(value);

  if v_day_count <> p_end_date - p_start_date + 1
    or v_unique_day_count <> v_day_count
    or v_first_date <> p_start_date
    or v_last_date <> p_end_date then
    raise exception using errcode = '22023', message = 'Seed dates must be unique and contiguous across the requested range';
  end if;

  if p_template_key = 'kirito-summer-2026@1' then
    if p_start_date <> date '2026-07-13' or p_end_date <> date '2026-08-31'
      or p_timezone <> 'Asia/Shanghai' or v_day_count <> 50 then
      raise exception using errcode = '22023', message = 'The Kirito template has an immutable date range and timezone';
    end if;

    select
      count(*) filter (where value ->> 'category' = 'BASELINE') as baseline,
      count(*) filter (where value ->> 'category' = 'INTERNSHIP_PART_TIME') as internship_part_time,
      count(*) filter (where value ->> 'category' = 'COURSE_DAY') as course_day,
      count(*) filter (where value ->> 'category' = 'WEEKEND_INTENSIVE') as weekend_intensive,
      count(*) filter (where value ->> 'category' = 'WEEKEND_RECOVERY') as weekend_recovery,
      count(*) filter (where value ->> 'category' = 'INTERNSHIP_FULL_TIME') as internship_full_time,
      count(*) filter (where value ->> 'category' = 'IELTS_TAPER') as ielts_taper,
      count(*) filter (where value ->> 'category' = 'EXAM_DAY') as exam_day,
      count(*) filter (where value ->> 'category' = 'FINAL_REVIEW') as final_review
    into v_category_counts
    from jsonb_array_elements(p_days);

    if v_category_counts.baseline <> 1
      or v_category_counts.internship_part_time <> 11
      or v_category_counts.course_day <> 8
      or v_category_counts.weekend_intensive <> 6
      or v_category_counts.weekend_recovery <> 6
      or v_category_counts.internship_full_time <> 10
      or v_category_counts.ielts_taper <> 6
      or v_category_counts.exam_day <> 1
      or v_category_counts.final_review <> 1 then
      raise exception using errcode = '22023', message = 'Kirito template category counts do not match version 1';
    end if;
  end if;

  insert into public.plan_cycles (
    user_id,
    template_key,
    template_version,
    timezone,
    start_date,
    end_date,
    payload_hash,
    seed_payload,
    last_seeded_at
  ) values (
    v_user_id,
    p_template_key,
    v_template_version,
    p_timezone,
    p_start_date,
    p_end_date,
    v_payload_hash,
    p_days,
    now()
  )
  on conflict (user_id, template_key, start_date, end_date)
  do update set
    timezone = excluded.timezone,
    payload_hash = excluded.payload_hash,
    seed_payload = excluded.seed_payload,
    last_seeded_at = now()
  returning id into v_cycle_id;

  insert into public.seed_runs (
    user_id,
    plan_cycle_id,
    idempotency_key,
    payload_hash
  ) values (
    v_user_id,
    v_cycle_id,
    p_idempotency_key,
    v_payload_hash
  ) returning id into v_seed_run_id;

  for v_day in select value from jsonb_array_elements(p_days)
  loop
    if jsonb_typeof(v_day) <> 'object'
      or jsonb_typeof(coalesce(v_day -> 'commitments', '[]'::jsonb)) <> 'array'
      or jsonb_typeof(coalesce(v_day -> 'tasks', '[]'::jsonb)) <> 'array' then
      raise exception using errcode = '22023', message = 'Each day must contain commitment and task arrays';
    end if;
    if jsonb_array_length(coalesce(v_day -> 'commitments', '[]'::jsonb)) > 20
      or jsonb_array_length(coalesce(v_day -> 'tasks', '[]'::jsonb)) > 100 then
      raise exception using errcode = '22023', message = 'A day exceeds commitment or task limits';
    end if;

    insert into public.daily_plans (
      user_id,
      plan_cycle_id,
      plan_date,
      day_category,
      intensity,
      title,
      summary,
      source,
      seed_key
    ) values (
      v_user_id,
      v_cycle_id,
      (v_day ->> 'date')::date,
      v_day ->> 'category',
      v_day ->> 'intensity',
      v_day ->> 'title',
      coalesce(v_day ->> 'summary', ''),
      'SEED',
      v_day ->> 'date'
    )
    on conflict (user_id, plan_date) do nothing;
    get diagnostics v_row_count = row_count;
    v_inserted_plans := v_inserted_plans + v_row_count;

    select id, plan_cycle_id, source, user_modified_at
    into v_plan_id, v_plan_cycle_id, v_plan_source, v_plan_modified_at
    from public.daily_plans
    where user_id = v_user_id and plan_date = (v_day ->> 'date')::date;

    if v_plan_source = 'SEED' and v_plan_modified_at is null and v_plan_cycle_id = v_cycle_id then
      for v_item in
        select value from jsonb_array_elements(coalesce(v_day -> 'commitments', '[]'::jsonb))
      loop
        if nullif(v_item ->> 'seed_key', '') is null then
          raise exception using errcode = '22023', message = 'Seed commitments require a stable seed_key';
        end if;
        insert into public.daily_commitments (
          user_id,
          daily_plan_id,
          title,
          kind,
          local_start_time,
          local_end_time,
          is_all_day,
          source,
          seed_key
        ) values (
          v_user_id,
          v_plan_id,
          v_item ->> 'title',
          v_item ->> 'kind',
          nullif(v_item ->> 'start_time', '')::time,
          nullif(v_item ->> 'end_time', '')::time,
          coalesce((v_item ->> 'is_all_day')::boolean, false),
          'SEED',
          v_item ->> 'seed_key'
        ) on conflict (user_id, daily_plan_id, seed_key) do nothing;
        get diagnostics v_row_count = row_count;
        v_inserted_commitments := v_inserted_commitments + v_row_count;
      end loop;

      for v_item in
        select value from jsonb_array_elements(coalesce(v_day -> 'tasks', '[]'::jsonb))
      loop
        if nullif(v_item ->> 'seed_key', '') is null then
          raise exception using errcode = '22023', message = 'Seed tasks require a stable seed_key';
        end if;
        insert into public.plan_tasks (
          user_id,
          daily_plan_id,
          title,
          description,
          category,
          planned_start,
          planned_end,
          estimated_minutes,
          required,
          sort_order,
          source,
          seed_key,
          minimum_day_eligible
        ) values (
          v_user_id,
          v_plan_id,
          v_item ->> 'title',
          nullif(v_item ->> 'description', ''),
          v_item ->> 'category',
          nullif(v_item ->> 'planned_start', '')::time,
          nullif(v_item ->> 'planned_end', '')::time,
          (v_item ->> 'estimated_minutes')::integer,
          coalesce((v_item ->> 'required')::boolean, true),
          coalesce((v_item ->> 'sort_order')::integer, 0),
          'SEED',
          v_item ->> 'seed_key',
          coalesce((v_item ->> 'minimum_day_eligible')::boolean, false)
        ) on conflict (user_id, daily_plan_id, seed_key) do nothing;
        get diagnostics v_row_count = row_count;
        v_inserted_tasks := v_inserted_tasks + v_row_count;
      end loop;
    end if;
  end loop;

  v_response := jsonb_build_object(
    'cycle_id', v_cycle_id,
    'seed_run_id', v_seed_run_id,
    'payload_hash', v_payload_hash,
    'inserted_plans', v_inserted_plans,
    'inserted_commitments', v_inserted_commitments,
    'inserted_tasks', v_inserted_tasks,
    'replayed', false
  );

  update public.seed_runs
  set
    status = 'COMPLETED',
    inserted_plans = v_inserted_plans,
    inserted_commitments = v_inserted_commitments,
    inserted_tasks = v_inserted_tasks,
    response = v_response,
    completed_at = now()
  where id = v_seed_run_id and user_id = v_user_id;

  return v_response;
end;
$$;

create or replace function public.set_task_status(
  p_task_id uuid,
  p_status text,
  p_expected_row_version bigint
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_task record;
begin
  if v_user_id is null then
    raise exception using errcode = '42501', message = 'Authentication required';
  end if;
  if p_status not in ('PENDING', 'COMPLETED', 'SKIPPED') or p_expected_row_version < 0 then
    raise exception using errcode = '22023', message = 'Invalid task status request';
  end if;

  update public.plan_tasks
  set
    status = p_status,
    completed_at = case when p_status = 'COMPLETED' then now() else null end
  where id = p_task_id
    and user_id = v_user_id
    and row_version = p_expected_row_version
  returning id, status, completed_at, row_version into v_task;

  if not found then
    raise exception using errcode = '40001', message = 'Task was changed or is not accessible';
  end if;
  return jsonb_build_object(
    'id', v_task.id,
    'status', v_task.status,
    'completed_at', v_task.completed_at,
    'row_version', v_task.row_version
  );
end;
$$;

create or replace function public.submit_daily_checkin(
  p_idempotency_key text,
  p_log jsonb,
  p_workout jsonb default null,
  p_ielts jsonb default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_request_hash text;
  v_existing_hash text;
  v_existing_response jsonb;
  v_receipt_id uuid;
  v_log_id uuid;
  v_workout_id uuid;
  v_ielts_id uuid;
  v_log_date date;
  v_response jsonb;
begin
  if v_user_id is null then
    raise exception using errcode = '42501', message = 'Authentication required';
  end if;
  if p_idempotency_key is null or char_length(p_idempotency_key) not between 8 and 100 then
    raise exception using errcode = '22023', message = 'Invalid idempotency key';
  end if;
  if jsonb_typeof(p_log) <> 'object'
    or (p_workout is not null and jsonb_typeof(p_workout) <> 'object')
    or (p_ielts is not null and jsonb_typeof(p_ielts) <> 'object') then
    raise exception using errcode = '22023', message = 'Invalid check-in payload';
  end if;
  if pg_column_size(jsonb_build_object('log', p_log, 'workout', p_workout, 'ielts', p_ielts)) > 65536 then
    raise exception using errcode = '22023', message = 'Check-in payload exceeds 64 KiB';
  end if;

  v_log_date := (p_log ->> 'log_date')::date;
  v_request_hash := encode(
    extensions.digest(
      pg_catalog.convert_to(
        jsonb_build_object('log', p_log, 'workout', p_workout, 'ielts', p_ielts)::text,
        'UTF8'
      ),
      'sha256'
    ),
    'hex'
  );
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(v_user_id::text || ':daily-checkin:' || p_idempotency_key, 0)
  );

  select request_hash, response
  into v_existing_hash, v_existing_response
  from private.mutation_receipts
  where user_id = v_user_id
    and operation = 'SUBMIT_DAILY_CHECKIN'
    and idempotency_key = p_idempotency_key;

  if found then
    if v_existing_hash <> v_request_hash then
      raise exception using errcode = '22023', message = 'Idempotency key was already used with a different payload';
    end if;
    if v_existing_response is null then
      raise exception using errcode = '40001', message = 'Matching check-in is still pending';
    end if;
    return v_existing_response || '{"replayed":true}'::jsonb;
  end if;

  insert into private.mutation_receipts (
    user_id,
    operation,
    idempotency_key,
    request_hash
  ) values (
    v_user_id,
    'SUBMIT_DAILY_CHECKIN',
    p_idempotency_key,
    v_request_hash
  ) returning id into v_receipt_id;

  insert into public.daily_logs (
    user_id,
    log_date,
    weight_kg,
    weight_skipped,
    waist_cm,
    waist_skipped,
    sleep_minutes,
    sleep_skipped,
    sleep_quality,
    steps,
    steps_skipped,
    water_ml,
    water_skipped,
    protein_g,
    protein_skipped,
    calories,
    calories_skipped,
    nutrition_quality_flags,
    meal_quality,
    mood,
    energy,
    hunger,
    pain_level,
    dizziness_or_fainting,
    intake_concern,
    notes
  ) values (
    v_user_id,
    v_log_date,
    nullif(p_log ->> 'weight_kg', '')::numeric,
    coalesce((p_log ->> 'weight_skipped')::boolean, false),
    nullif(p_log ->> 'waist_cm', '')::numeric,
    coalesce((p_log ->> 'waist_skipped')::boolean, false),
    nullif(p_log ->> 'sleep_minutes', '')::integer,
    coalesce((p_log ->> 'sleep_skipped')::boolean, false),
    nullif(p_log ->> 'sleep_quality', '')::smallint,
    nullif(p_log ->> 'steps', '')::integer,
    coalesce((p_log ->> 'steps_skipped')::boolean, false),
    nullif(p_log ->> 'water_ml', '')::integer,
    coalesce((p_log ->> 'water_skipped')::boolean, false),
    nullif(p_log ->> 'protein_g', '')::integer,
    coalesce((p_log ->> 'protein_skipped')::boolean, false),
    nullif(p_log ->> 'calories', '')::integer,
    coalesce((p_log ->> 'calories_skipped')::boolean, false),
    array(select jsonb_array_elements_text(coalesce(p_log -> 'nutrition_quality_flags', '[]'::jsonb))),
    nullif(p_log ->> 'meal_quality', '')::smallint,
    nullif(p_log ->> 'mood', '')::smallint,
    nullif(p_log ->> 'energy', '')::smallint,
    nullif(p_log ->> 'hunger', '')::smallint,
    nullif(p_log ->> 'pain_level', '')::smallint,
    coalesce((p_log ->> 'dizziness_or_fainting')::boolean, false),
    coalesce((p_log ->> 'intake_concern')::boolean, false),
    nullif(p_log ->> 'notes', '')
  )
  on conflict (user_id, log_date) do update set
    weight_kg = excluded.weight_kg,
    weight_skipped = excluded.weight_skipped,
    waist_cm = excluded.waist_cm,
    waist_skipped = excluded.waist_skipped,
    sleep_minutes = excluded.sleep_minutes,
    sleep_skipped = excluded.sleep_skipped,
    sleep_quality = excluded.sleep_quality,
    steps = excluded.steps,
    steps_skipped = excluded.steps_skipped,
    water_ml = excluded.water_ml,
    water_skipped = excluded.water_skipped,
    protein_g = excluded.protein_g,
    protein_skipped = excluded.protein_skipped,
    calories = excluded.calories,
    calories_skipped = excluded.calories_skipped,
    nutrition_quality_flags = excluded.nutrition_quality_flags,
    meal_quality = excluded.meal_quality,
    mood = excluded.mood,
    energy = excluded.energy,
    hunger = excluded.hunger,
    pain_level = excluded.pain_level,
    dizziness_or_fainting = excluded.dizziness_or_fainting,
    intake_concern = excluded.intake_concern,
    notes = excluded.notes
  returning id into v_log_id;

  if p_workout is not null then
    insert into public.workout_sessions (
      user_id,
      session_date,
      workout_type,
      duration_minutes,
      rpe,
      notes
    ) values (
      v_user_id,
      coalesce(nullif(p_workout ->> 'session_date', '')::date, v_log_date),
      p_workout ->> 'workout_type',
      (p_workout ->> 'duration_minutes')::integer,
      nullif(p_workout ->> 'rpe', '')::smallint,
      nullif(p_workout ->> 'notes', '')
    ) returning id into v_workout_id;
  end if;

  if p_ielts is not null then
    insert into public.ielts_sessions (
      user_id,
      session_date,
      skill,
      source_material,
      planned_minutes,
      actual_minutes,
      raw_score,
      estimated_band,
      main_errors,
      next_action,
      attachment_url
    ) values (
      v_user_id,
      coalesce(nullif(p_ielts ->> 'session_date', '')::date, v_log_date),
      p_ielts ->> 'skill',
      nullif(p_ielts ->> 'source_material', ''),
      nullif(p_ielts ->> 'planned_minutes', '')::integer,
      (p_ielts ->> 'actual_minutes')::integer,
      nullif(p_ielts ->> 'raw_score', '')::numeric,
      nullif(p_ielts ->> 'estimated_band', '')::numeric,
      nullif(p_ielts ->> 'main_errors', ''),
      nullif(p_ielts ->> 'next_action', ''),
      nullif(p_ielts ->> 'attachment_url', '')
    ) returning id into v_ielts_id;
  end if;

  v_response := jsonb_build_object(
    'daily_log_id', v_log_id,
    'workout_session_id', v_workout_id,
    'ielts_session_id', v_ielts_id,
    'replayed', false
  );
  update private.mutation_receipts
  set response = v_response, completed_at = now()
  where id = v_receipt_id and user_id = v_user_id;
  return v_response;
end;
$$;

comment on function public.seed_plan_cycle(text, text, date, date, jsonb, text) is
  'Transactional, concurrent-safe, non-destructive plan seeding. Identity always comes from auth.uid().';
comment on function public.submit_daily_checkin(text, jsonb, jsonb, jsonb) is
  'Atomically writes a daily log and optional workout/IELTS records with replay-safe idempotency.';
comment on function public.set_task_status(uuid, text, bigint) is
  'Explicit task status mutation with optimistic row-version protection.';

revoke execute on function public.seed_plan_cycle(text, text, date, date, jsonb, text) from public, anon;
revoke execute on function public.submit_daily_checkin(text, jsonb, jsonb, jsonb) from public, anon;
revoke execute on function public.set_task_status(uuid, text, bigint) from public, anon;
grant execute on function public.seed_plan_cycle(text, text, date, date, jsonb, text) to authenticated;
grant execute on function public.submit_daily_checkin(text, jsonb, jsonb, jsonb) to authenticated;
grant execute on function public.set_task_status(uuid, text, bigint) to authenticated;
