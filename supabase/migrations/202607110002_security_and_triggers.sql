create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create or replace function public.set_planning_record_metadata()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  new.row_version := old.row_version + 1;

  if tg_table_name = 'daily_plans' then
    if new.day_category is distinct from old.day_category
      or new.intensity is distinct from old.intensity
      or new.title is distinct from old.title
      or new.summary is distinct from old.summary
      or new.minimum_mode_enabled is distinct from old.minimum_mode_enabled then
      new.user_modified_at := coalesce(new.user_modified_at, now());
    end if;
  elsif tg_table_name = 'plan_tasks' then
    if new.title is distinct from old.title
      or new.description is distinct from old.description
      or new.category is distinct from old.category
      or new.planned_start is distinct from old.planned_start
      or new.planned_end is distinct from old.planned_end
      or new.estimated_minutes is distinct from old.estimated_minutes
      or new.required is distinct from old.required
      or new.minimum_day_eligible is distinct from old.minimum_day_eligible
      or new.sort_order is distinct from old.sort_order then
      new.user_modified_at := coalesce(new.user_modified_at, now());
    end if;
  end if;
  return new;
end;
$$;

create or replace function public.validate_iana_timezone()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not exists (select 1 from pg_catalog.pg_timezone_names where name = new.timezone) then
    raise exception using errcode = '22023', message = 'Invalid IANA timezone';
  end if;
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();
create trigger profiles_validate_timezone before insert or update of timezone on public.profiles
for each row execute function public.validate_iana_timezone();
create trigger app_preferences_set_updated_at before update on public.app_preferences
for each row execute function public.set_updated_at();
create trigger plan_cycles_set_updated_at before update on public.plan_cycles
for each row execute function public.set_updated_at();
create trigger plan_cycles_validate_timezone before insert or update of timezone on public.plan_cycles
for each row execute function public.validate_iana_timezone();
create trigger recurring_commitments_set_updated_at before update on public.recurring_commitments
for each row execute function public.set_updated_at();
create trigger daily_plans_set_metadata before update on public.daily_plans
for each row execute function public.set_planning_record_metadata();
create trigger daily_commitments_set_updated_at before update on public.daily_commitments
for each row execute function public.set_updated_at();
create trigger plan_tasks_set_metadata before update on public.plan_tasks
for each row execute function public.set_planning_record_metadata();
create trigger daily_logs_set_updated_at before update on public.daily_logs
for each row execute function public.set_updated_at();
create trigger workout_sessions_set_updated_at before update on public.workout_sessions
for each row execute function public.set_updated_at();
create trigger ielts_sessions_set_updated_at before update on public.ielts_sessions
for each row execute function public.set_updated_at();
create trigger ielts_errors_set_updated_at before update on public.ielts_errors
for each row execute function public.set_updated_at();
create trigger gre_programs_set_updated_at before update on public.gre_programs
for each row execute function public.set_updated_at();
create trigger gre_decisions_set_updated_at before update on public.gre_decisions
for each row execute function public.set_updated_at();
create trigger gre_checklist_items_set_updated_at before update on public.gre_checklist_items
for each row execute function public.set_updated_at();
create trigger weekly_reviews_set_updated_at before update on public.weekly_reviews
for each row execute function public.set_updated_at();
create trigger health_alerts_set_updated_at before update on public.health_alerts
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_display_name text;
begin
  v_display_name := nullif(trim(coalesce(new.raw_user_meta_data ->> 'display_name', '')), '');
  insert into public.profiles (
    id,
    display_name,
    health_disclaimer_acknowledged_at,
    adult_acknowledged_at
  ) values (
    new.id,
    left(coalesce(v_display_name, split_part(coalesce(new.email, 'Summer OS 用户'), '@', 1)), 80),
    case when new.raw_user_meta_data ->> 'health_disclaimer_accepted' = 'true' then now() end,
    case when new.raw_user_meta_data ->> 'adult_acknowledged' = 'true' then now() end
  ) on conflict (id) do nothing;

  insert into public.app_preferences (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.acknowledge_health_alert()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  update public.health_alerts
  set status = 'ACKNOWLEDGED'
  where id = new.health_alert_id and user_id = new.user_id;
  return new;
end;
$$;

create trigger alert_acknowledgements_update_alert
after insert on public.alert_acknowledgements
for each row execute function public.acknowledge_health_alert();

create or replace function public.hook_enforce_beta_capacity(event jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_signup_open boolean;
  v_max_users integer;
  v_user_count integer;
  v_provider text;
begin
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('summer-os-beta-capacity', 0));

  v_provider := coalesce(event -> 'user' -> 'app_metadata' ->> 'provider', 'email');
  if v_provider <> 'email' then
    return jsonb_build_object(
      'error', jsonb_build_object(
        'http_code', 403,
        'message', 'Summer OS currently supports email and password sign-up only.'
      )
    );
  end if;

  select signup_open, max_users
  into v_signup_open, v_max_users
  from private.beta_settings
  where singleton;

  if not coalesce(v_signup_open, false) then
    return jsonb_build_object(
      'error', jsonb_build_object('http_code', 403, 'message', 'Public beta sign-up is currently closed.')
    );
  end if;

  select count(*) into v_user_count
  from auth.users
  where deleted_at is null and not coalesce(is_anonymous, false);

  if v_user_count >= v_max_users then
    return jsonb_build_object(
      'error', jsonb_build_object('http_code', 429, 'message', 'Summer OS beta capacity has been reached.')
    );
  end if;

  return '{}'::jsonb;
end;
$$;

comment on function public.hook_enforce_beta_capacity(jsonb) is
  'Configure as the Supabase Before User Created hook to enforce email-only sign-up and the 100-user beta cap.';

grant execute on function public.hook_enforce_beta_capacity(jsonb) to supabase_auth_admin;
revoke execute on function public.hook_enforce_beta_capacity(jsonb) from public, anon, authenticated;

alter table public.profiles enable row level security;
alter table public.profiles force row level security;
alter table public.app_preferences enable row level security;
alter table public.app_preferences force row level security;
alter table public.plan_templates enable row level security;
alter table public.plan_templates force row level security;
alter table public.plan_cycles enable row level security;
alter table public.plan_cycles force row level security;
alter table public.recurring_commitments enable row level security;
alter table public.recurring_commitments force row level security;
alter table public.daily_plans enable row level security;
alter table public.daily_plans force row level security;
alter table public.daily_commitments enable row level security;
alter table public.daily_commitments force row level security;
alter table public.plan_tasks enable row level security;
alter table public.plan_tasks force row level security;
alter table public.daily_logs enable row level security;
alter table public.daily_logs force row level security;
alter table public.workout_sessions enable row level security;
alter table public.workout_sessions force row level security;
alter table public.ielts_sessions enable row level security;
alter table public.ielts_sessions force row level security;
alter table public.ielts_errors enable row level security;
alter table public.ielts_errors force row level security;
alter table public.gre_programs enable row level security;
alter table public.gre_programs force row level security;
alter table public.gre_decisions enable row level security;
alter table public.gre_decisions force row level security;
alter table public.gre_checklist_items enable row level security;
alter table public.gre_checklist_items force row level security;
alter table public.weekly_reviews enable row level security;
alter table public.weekly_reviews force row level security;
alter table public.health_alerts enable row level security;
alter table public.health_alerts force row level security;
alter table public.alert_acknowledgements enable row level security;
alter table public.alert_acknowledgements force row level security;
alter table public.seed_runs enable row level security;
alter table public.seed_runs force row level security;
alter table private.mutation_receipts enable row level security;
alter table private.mutation_receipts force row level security;

create policy profiles_owner_all on public.profiles
for all to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy app_preferences_owner_all on public.app_preferences
for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy plan_templates_read_active on public.plan_templates
for select to anon, authenticated
using (is_active);

create policy plan_cycles_owner_all on public.plan_cycles
for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy recurring_commitments_owner_all on public.recurring_commitments
for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy daily_plans_owner_all on public.daily_plans
for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy daily_commitments_owner_all on public.daily_commitments
for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy plan_tasks_owner_all on public.plan_tasks
for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy daily_logs_owner_all on public.daily_logs
for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy workout_sessions_owner_all on public.workout_sessions
for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy ielts_sessions_owner_all on public.ielts_sessions
for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy ielts_errors_owner_all on public.ielts_errors
for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy gre_programs_owner_all on public.gre_programs
for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy gre_decisions_owner_all on public.gre_decisions
for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy gre_checklist_items_owner_all on public.gre_checklist_items
for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy weekly_reviews_owner_all on public.weekly_reviews
for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy health_alerts_owner_all on public.health_alerts
for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy alert_acknowledgements_owner_all on public.alert_acknowledgements
for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy seed_runs_owner_select on public.seed_runs
for select to authenticated
using ((select auth.uid()) = user_id);

revoke all on public.plan_templates from anon, authenticated;
grant select on public.plan_templates to anon, authenticated;

grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.app_preferences to authenticated;
grant select, insert, update, delete on public.plan_cycles to authenticated;
grant select, insert, update, delete on public.recurring_commitments to authenticated;
grant select, insert, update, delete on public.daily_plans to authenticated;
grant select, insert, update, delete on public.daily_commitments to authenticated;
grant select, insert, update, delete on public.plan_tasks to authenticated;
grant select, insert, update, delete on public.daily_logs to authenticated;
grant select, insert, update, delete on public.workout_sessions to authenticated;
grant select, insert, update, delete on public.ielts_sessions to authenticated;
grant select, insert, update, delete on public.ielts_errors to authenticated;
grant select, insert, update, delete on public.gre_programs to authenticated;
grant select, insert, update, delete on public.gre_decisions to authenticated;
grant select, insert, update, delete on public.gre_checklist_items to authenticated;
grant select, insert, update, delete on public.weekly_reviews to authenticated;
grant select, insert, update, delete on public.health_alerts to authenticated;
grant select, insert, update, delete on public.alert_acknowledgements to authenticated;
grant select on public.seed_runs to authenticated;

revoke all on all tables in schema private from public, anon, authenticated;
revoke all on all functions in schema private from public, anon, authenticated;
