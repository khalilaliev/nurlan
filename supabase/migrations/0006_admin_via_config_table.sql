-- 0006_admin_via_config_table.sql
-- Removes hardcoded admin email from migration code.
-- Admin email is now stored in app_config table, populated manually
-- via Supabase SQL Editor (not in git).

set search_path = public;

-- ---------- private config table ----------
create table if not exists app_config (
  key   text primary key,
  value text not null
);

-- Lock it down: no policies = no access for anon/authenticated users.
-- Only service_role (server-side) and SECURITY DEFINER functions can read it.
alter table app_config enable row level security;

-- ---------- drop the old hardcoded trigger and function ----------
drop trigger if exists on_profile_insert_promote_admin on profiles;
drop function if exists maybe_promote_admin();

-- ---------- new trigger reads admin email from app_config ----------
create or replace function maybe_promote_admin()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  user_email  text;
  admin_email text;
begin
  select value into admin_email from app_config where key = 'admin_email';

  if admin_email is null or admin_email = '' then
    return new;
  end if;

  select email into user_email from auth.users where id = new.id;

  if user_email = admin_email then
    new.is_admin := true;
  end if;

  return new;
end;
$$;

create trigger on_profile_insert_promote_admin
before insert on profiles
for each row execute function maybe_promote_admin();

-- ---------- one-time backfill ----------
do $$
declare
  admin_email text;
begin
  select value into admin_email from app_config where key = 'admin_email';

  if admin_email is not null and admin_email <> '' then
    update profiles
       set is_admin = true
     where id in (
       select id from auth.users where email = admin_email
     );
  end if;
end $$;