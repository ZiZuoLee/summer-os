begin;

create extension if not exists pgtap with schema extensions;
-- Hosted Supabase may install pgTAP in its dedicated `pgtap` schema while the
-- local stack installs it in `extensions`; support both locations.
set local search_path = public, extensions, pgtap, pg_catalog;
select extensions.plan(13);

select extensions.has_table('public', 'profiles', 'profiles table exists');
select extensions.has_table('public', 'daily_plans', 'daily_plans table exists');
select extensions.has_table('public', 'daily_logs', 'daily_logs table exists');

select extensions.ok(
  not exists (
    select 1
    from pg_catalog.pg_class as relation
    join pg_catalog.pg_namespace as namespace on namespace.oid = relation.relnamespace
    where namespace.nspname = 'public'
      and relation.relname = any(array[
        'profiles', 'app_preferences', 'plan_cycles', 'recurring_commitments',
        'daily_plans', 'daily_commitments', 'plan_tasks', 'daily_logs',
        'workout_sessions', 'ielts_sessions', 'ielts_errors', 'gre_programs',
        'gre_decisions', 'gre_checklist_items', 'weekly_reviews', 'health_alerts',
        'alert_acknowledgements', 'seed_runs'
      ])
      and not relation.relrowsecurity
  ),
  'RLS is enabled on every public user-owned table'
);

select extensions.has_function(
  'public', 'seed_plan_cycle', array['text', 'text', 'date', 'date', 'jsonb', 'text'],
  'seed_plan_cycle RPC exists'
);
select extensions.has_function(
  'public', 'submit_daily_checkin', array['text', 'jsonb', 'jsonb', 'jsonb'],
  'submit_daily_checkin RPC exists'
);
select extensions.has_function(
  'public', 'set_task_status', array['uuid', 'text', 'bigint'],
  'set_task_status RPC exists'
);
select extensions.has_function(
  'public', 'duplicate_plan_day', array['date', 'date'],
  'duplicate_plan_day RPC exists'
);
select extensions.has_function(
  'public', 'reset_plan_progress', array['uuid', 'text'],
  'reset_plan_progress RPC exists'
);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  (
    '00000000-0000-0000-0000-000000000000',
    '10000000-0000-0000-0000-000000000001',
    'authenticated', 'authenticated', 'pgtap-a@example.test', '', now(),
    '{"provider":"email","providers":["email"]}', '{}', now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '20000000-0000-0000-0000-000000000002',
    'authenticated', 'authenticated', 'pgtap-b@example.test', '', now(),
    '{"provider":"email","providers":["email"]}', '{}', now(), now()
  );

insert into public.daily_logs (user_id, log_date, weight_kg, weight_skipped)
values
  ('10000000-0000-0000-0000-000000000001', '2031-01-01', 80, false),
  ('20000000-0000-0000-0000-000000000002', '2031-01-01', 70, false);

set local role authenticated;
set local request.jwt.claim.sub = '10000000-0000-0000-0000-000000000001';
select extensions.results_eq(
  $$select count(*) from public.daily_logs$$,
  array[1::bigint],
  'user A sees only their row'
);

set local request.jwt.claim.sub = '20000000-0000-0000-0000-000000000002';
select extensions.results_eq(
  $$select count(*) from public.daily_logs$$,
  array[1::bigint],
  'user B sees only their row'
);
select extensions.throws_ok(
  $$insert into public.daily_logs (user_id, log_date, weight_kg, weight_skipped)
    values ('10000000-0000-0000-0000-000000000001', '2031-01-02', 79, false)$$,
  '42501',
  'new row violates row-level security policy for table "daily_logs"',
  'cross-user insert is rejected by RLS'
);

reset role;
insert into public.plan_cycles (
  user_id, template_key, template_version, timezone, start_date, end_date, payload_hash, seed_payload
) values (
  '10000000-0000-0000-0000-000000000001', 'summer-os-flex@1', 1,
  'UTC', '2031-02-01', '2031-02-07', repeat('a', 64),
  jsonb_build_array('{}'::jsonb, '{}'::jsonb, '{}'::jsonb, '{}'::jsonb, '{}'::jsonb, '{}'::jsonb, '{}'::jsonb)
);
select extensions.throws_ok(
  $$insert into public.daily_plans (
      user_id, plan_cycle_id, plan_date, day_category, intensity, title
    ) select
      '20000000-0000-0000-0000-000000000002', id, '2031-02-01', 'FLEX_DAY', 'LOW', 'forged'
    from public.plan_cycles
    where user_id = '10000000-0000-0000-0000-000000000001'$$,
  '23503',
  'insert or update on table "daily_plans" violates foreign key constraint "daily_plans_cycle_owner_fk"',
  'composite ownership FK rejects a forged parent'
);

select * from extensions.finish();
rollback;
