create or replace function public.health_check()
returns boolean
language sql
stable
security definer
set search_path = pg_catalog
as $$
  select true;
$$;

revoke all on function public.health_check() from public;
grant execute on function public.health_check() to anon, authenticated, service_role;

comment on function public.health_check() is
  'Non-sensitive liveness probe. Returns no application or user data.';
