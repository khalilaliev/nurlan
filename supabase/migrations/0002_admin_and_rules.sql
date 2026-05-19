-- Admin role + rules acceptance + moderation capabilities.
-- Run after 0001_init.sql. Paste into Supabase SQL editor and run.

set search_path = public;

-- ---------- profile columns ----------
alter table profiles add column if not exists is_admin boolean not null default false;
alter table profiles add column if not exists rules_accepted_at timestamptz;

create index if not exists profiles_is_admin_idx on profiles (is_admin) where is_admin = true;

-- ---------- admin helper ----------
-- Centralized check used by RLS. SECURITY DEFINER so policies can read the flag
-- without recursive RLS on profiles.
create or replace function is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select p.is_admin from profiles p where p.id = auth.uid()),
    false
  );
$$;

-- ---------- admin auto-promotion ----------
-- Whenever a profile is created for the configured admin email, flip is_admin.
-- The admin email is hardcoded to the platform owner; change here if it ever moves.
create or replace function maybe_promote_admin()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  user_email text;
begin
  select email into user_email from auth.users where id = new.id;
  if user_email = 'khalilaliev0@gmail.com' then
    new.is_admin := true;
  end if;
  return new;
end;
$$;

drop trigger if exists on_profile_insert_promote_admin on profiles;
create trigger on_profile_insert_promote_admin
before insert on profiles
for each row execute function maybe_promote_admin();

-- One-time backfill for an admin profile that already exists.
update profiles
   set is_admin = true
 where id in (
   select id from auth.users where email = 'khalilaliev0@gmail.com'
 );

-- ---------- RLS: admin overrides ----------
-- Replace existing policies with versions that also grant admin.

drop policy if exists stories_select on stories;
create policy stories_select on stories for select
  using (status = 'published' or author_id = auth.uid() or is_admin());

drop policy if exists stories_update on stories;
create policy stories_update on stories for update
  using (auth.uid() = author_id or is_admin());

drop policy if exists stories_delete on stories;
create policy stories_delete on stories for delete
  using (auth.uid() = author_id or is_admin());

drop policy if exists comments_select on comments;
create policy comments_select on comments for select
  using (
    is_admin()
    or exists (
      select 1 from stories s
      where s.id = story_id
        and (s.status = 'published' or s.author_id = auth.uid())
    )
  );

drop policy if exists comments_update on comments;
create policy comments_update on comments for update
  using (auth.uid() = author_id or is_admin());

drop policy if exists comments_delete on comments;
create policy comments_delete on comments for delete
  using (auth.uid() = author_id or is_admin());

-- reports: admins can read for moderation; existing insert policy unchanged.
drop policy if exists reports_select on reports;
create policy reports_select on reports for select
  using (is_admin());

drop policy if exists reports_update on reports;
create policy reports_update on reports for update
  using (is_admin());

-- ---------- feed view: hide removed stories ----------
-- Already filters status='published', so removed stories disappear automatically.
-- Admins query the underlying `stories` table directly when moderating.
