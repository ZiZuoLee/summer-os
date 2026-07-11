create or replace function public.duplicate_plan_day(
  p_source_date date,
  p_target_date date
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_source public.daily_plans%rowtype;
  v_target_id uuid;
  v_commitment_count integer;
  v_task_count integer;
begin
  if v_user_id is null then
    raise exception using errcode = '42501', message = 'Authentication required';
  end if;
  if p_source_date is null or p_target_date is null or p_source_date = p_target_date then
    raise exception using errcode = '22023', message = 'Source and target dates must be different';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(v_user_id::text || ':duplicate-plan:' || p_target_date::text, 0)
  );
  select * into v_source
  from public.daily_plans
  where user_id = v_user_id and plan_date = p_source_date;
  if not found then
    raise exception using errcode = '22023', message = 'Source plan is not available';
  end if;
  if exists (
    select 1 from public.daily_plans where user_id = v_user_id and plan_date = p_target_date
  ) then
    raise exception using errcode = '23505', message = 'A plan already exists on the target date';
  end if;

  insert into public.daily_plans (
    user_id,
    plan_date,
    day_category,
    intensity,
    title,
    summary,
    source,
    minimum_mode_enabled,
    user_modified_at
  ) values (
    v_user_id,
    p_target_date,
    v_source.day_category,
    v_source.intensity,
    left(v_source.title || '（副本）', 240),
    v_source.summary,
    'USER',
    false,
    now()
  ) returning id into v_target_id;

  insert into public.daily_commitments (
    user_id,
    daily_plan_id,
    title,
    kind,
    local_start_time,
    local_end_time,
    is_all_day,
    source
  )
  select
    v_user_id,
    v_target_id,
    title,
    kind,
    local_start_time,
    local_end_time,
    is_all_day,
    'USER'
  from public.daily_commitments
  where user_id = v_user_id and daily_plan_id = v_source.id;
  get diagnostics v_commitment_count = row_count;

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
    status,
    completed_at,
    sort_order,
    source,
    minimum_day_eligible,
    user_modified_at
  )
  select
    v_user_id,
    v_target_id,
    title,
    description,
    category,
    planned_start,
    planned_end,
    estimated_minutes,
    required,
    'PENDING',
    null,
    sort_order,
    'USER',
    minimum_day_eligible,
    now()
  from public.plan_tasks
  where user_id = v_user_id and daily_plan_id = v_source.id
  order by sort_order, created_at;
  get diagnostics v_task_count = row_count;

  return jsonb_build_object(
    'plan_id', v_target_id,
    'plan_date', p_target_date,
    'copied_commitments', v_commitment_count,
    'copied_tasks', v_task_count
  );
end;
$$;

create or replace function public.restore_plan_day(
  p_plan_date date,
  p_confirmation text
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_cycle public.plan_cycles%rowtype;
  v_day jsonb;
  v_item jsonb;
  v_plan_id uuid;
  v_row_count integer;
  v_inserted_plan integer := 0;
  v_inserted_commitments integer := 0;
  v_inserted_tasks integer := 0;
begin
  if v_user_id is null then
    raise exception using errcode = '42501', message = 'Authentication required';
  end if;
  if p_confirmation is distinct from ('RESTORE ' || p_plan_date::text) then
    raise exception using errcode = '22023', message = 'Exact day restore confirmation is required';
  end if;

  select * into v_cycle
  from public.plan_cycles
  where user_id = v_user_id
    and p_plan_date between start_date and end_date
    and status = 'ACTIVE'
  order by created_at desc
  limit 1;
  if not found then
    raise exception using errcode = '22023', message = 'Plan cycle is not available for this date';
  end if;

  select value into v_day
  from jsonb_array_elements(v_cycle.seed_payload)
  where value ->> 'date' = p_plan_date::text;
  if v_day is null then
    raise exception using errcode = '22023', message = 'Stored template day is not available';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(v_user_id::text || ':restore-day:' || p_plan_date::text, 0)
  );

  insert into public.daily_plans (
    user_id, plan_cycle_id, plan_date, day_category, intensity, title, summary, source, seed_key
  ) values (
    v_user_id, v_cycle.id, p_plan_date, v_day ->> 'category', v_day ->> 'intensity',
    v_day ->> 'title', coalesce(v_day ->> 'summary', ''), 'SEED', p_plan_date::text
  ) on conflict (user_id, plan_date) do nothing;
  get diagnostics v_inserted_plan = row_count;

  select id into v_plan_id
  from public.daily_plans
  where user_id = v_user_id and plan_date = p_plan_date and plan_cycle_id = v_cycle.id;
  if v_plan_id is null then
    raise exception using errcode = '22023', message = 'A user-created day occupies this date and was left unchanged';
  end if;

  for v_item in select value from jsonb_array_elements(coalesce(v_day -> 'commitments', '[]'::jsonb))
  loop
    insert into public.daily_commitments (
      user_id, daily_plan_id, title, kind, local_start_time, local_end_time, is_all_day, source, seed_key
    ) values (
      v_user_id, v_plan_id, v_item ->> 'title', v_item ->> 'kind',
      nullif(v_item ->> 'start_time', '')::time,
      nullif(v_item ->> 'end_time', '')::time,
      coalesce((v_item ->> 'is_all_day')::boolean, false), 'SEED', v_item ->> 'seed_key'
    ) on conflict (user_id, daily_plan_id, seed_key) do nothing;
    get diagnostics v_row_count = row_count;
    v_inserted_commitments := v_inserted_commitments + v_row_count;
  end loop;

  for v_item in select value from jsonb_array_elements(coalesce(v_day -> 'tasks', '[]'::jsonb))
  loop
    insert into public.plan_tasks (
      user_id, daily_plan_id, title, description, category, planned_start, planned_end,
      estimated_minutes, required, sort_order, source, seed_key, minimum_day_eligible
    ) values (
      v_user_id, v_plan_id, v_item ->> 'title', nullif(v_item ->> 'description', ''),
      v_item ->> 'category', nullif(v_item ->> 'planned_start', '')::time,
      nullif(v_item ->> 'planned_end', '')::time, (v_item ->> 'estimated_minutes')::integer,
      coalesce((v_item ->> 'required')::boolean, true),
      coalesce((v_item ->> 'sort_order')::integer, 0), 'SEED', v_item ->> 'seed_key',
      coalesce((v_item ->> 'minimum_day_eligible')::boolean, false)
    ) on conflict (user_id, daily_plan_id, seed_key) do nothing;
    get diagnostics v_row_count = row_count;
    v_inserted_tasks := v_inserted_tasks + v_row_count;
  end loop;

  return jsonb_build_object(
    'plan_date', p_plan_date,
    'inserted_plan', v_inserted_plan,
    'inserted_commitments', v_inserted_commitments,
    'inserted_tasks', v_inserted_tasks,
    'user_edits_preserved', true,
    'completions_preserved', true,
    'custom_content_preserved', true
  );
end;
$$;

create or replace function public.reset_plan_progress(
  p_plan_cycle_id uuid,
  p_confirmation text
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_cycle public.plan_cycles%rowtype;
  v_response jsonb;
begin
  if v_user_id is null then
    raise exception using errcode = '42501', message = 'Authentication required';
  end if;
  if p_confirmation is distinct from ('RESET ' || p_plan_cycle_id::text) then
    raise exception using errcode = '22023', message = 'Exact reset confirmation is required';
  end if;
  select * into v_cycle
  from public.plan_cycles
  where id = p_plan_cycle_id and user_id = v_user_id;
  if not found then
    raise exception using errcode = '22023', message = 'Plan cycle is not available';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(v_user_id::text || ':reset-plan:' || p_plan_cycle_id::text, 0)
  );
  v_response := public.seed_plan_cycle(
    v_cycle.template_key,
    v_cycle.timezone,
    v_cycle.start_date,
    v_cycle.end_date,
    v_cycle.seed_payload,
    'safe-reset:' || extensions.gen_random_uuid()::text
  );

  return v_response || jsonb_build_object(
    'cycle_id', p_plan_cycle_id,
    'reset_minimum_mode_days', 0,
    'reset_tasks', 0,
    'user_edits_preserved', true,
    'completions_preserved', true,
    'custom_content_preserved', true,
    'tracking_history_preserved', true
  );
end;
$$;

comment on function public.duplicate_plan_day(date, date) is
  'Copies one owned day to an empty target date as user content; source and history remain untouched.';
comment on function public.reset_plan_progress(uuid, text) is
  'Requires RESET <cycle-uuid>; safely reapplies the stored immutable seed payload without overwriting user edits, completions, custom content, or tracking history.';
comment on function public.restore_plan_day(date, text) is
  'Requires RESTORE <date>; restores only missing seeded content for one owned template day while preserving edits, completion state, custom content, and history.';

revoke execute on function public.duplicate_plan_day(date, date) from public, anon;
revoke execute on function public.reset_plan_progress(uuid, text) from public, anon;
revoke execute on function public.restore_plan_day(date, text) from public, anon;
grant execute on function public.duplicate_plan_day(date, date) to authenticated;
grant execute on function public.reset_plan_progress(uuid, text) to authenticated;
grant execute on function public.restore_plan_day(date, text) to authenticated;
