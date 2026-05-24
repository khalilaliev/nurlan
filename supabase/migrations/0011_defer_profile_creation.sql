-- 0011_defer_profile_creation.sql
--
-- ─── PURPOSE ──────────────────────────────────────────────────────────
-- Stop creating profiles for unconfirmed signups. A user is now
-- "registered" only after they click the email confirmation link
-- (or sign in via OAuth, which pre-confirms).
--
-- ─── WHY ──────────────────────────────────────────────────────────────
-- Until this migration, `handle_new_user` fired AFTER INSERT on
-- auth.users — meaning a profile was created the moment Supabase
-- accepted the signup, BEFORE email confirmation. Side effects:
--
--   * The email is "locked" by an unconfirmed auth.users row + its
--     profile; the would-be user can't try again with the same address
--     without us showing "already registered" (when really nothing has
--     happened yet from the user's perspective).
--   * Abandoned signups (people who never confirm) accumulate as ghost
--     profiles, clutter the admin panel, and pollute the username
--     namespace (since handle_new_user does collision-avoidance).
--   * The admin auto-promotion trigger (maybe_promote_admin) fires on
--     profile insert — so an attacker who knew the configured admin
--     email could create a half-baked admin profile just by hitting
--     submit on the signup form. Not exploitable to a session, but
--     poor hygiene.
--
-- ─── DESIGN ───────────────────────────────────────────────────────────
-- Two trigger paths, both creating a profile through the shared helper
-- `create_profile_for_user`:
--
--   A. handle_new_user (AFTER INSERT on auth.users) — fires for every
--      new auth user. Now early-returns if email_confirmed_at IS NULL.
--      Covers the OAuth case: Google/Twitch sign-ins arrive with the
--      email already verified by the provider, so email_confirmed_at
--      is non-NULL on the very first INSERT and the profile gets
--      created immediately.
--
--   B. handle_user_email_confirmed (AFTER UPDATE OF email_confirmed_at)
--      — fires when Supabase flips email_confirmed_at from NULL → SET
--      after the user clicks the confirmation link. This is the email-
--      signup path. Idempotent: if a profile already exists (e.g.
--      manually backfilled or some race we didn't anticipate), it
--      no-ops cleanly.
--
-- ─── KNOCK-ON EFFECTS ─────────────────────────────────────────────────
-- * The duplicate-email check in src/app/actions/auth.ts (signUp) is
--   updated in the same commit to read email_confirmed_at directly
--   instead of the previous fragile created_at-age heuristic.
--
-- * Existing UNCONFIRMED auth.users rows from before this migration
--   keep their profiles (we don't delete on apply). If you want a
--   clean slate, run the cleanup at the bottom of this file
--   separately, AFTER applying the migration. Deletes via auth.users
--   cascade through every FK so profiles + everything else go too.
--
-- * maybe_promote_admin still fires BEFORE INSERT on profiles — its
--   behaviour is unchanged. It now just fires later (at confirmation)
--   for the email-signup path. Admin auto-promotion still works.

set search_path = public;

-- ─── shared helper: actually create the profile row ─────────────────
-- Extracted from handle_new_user so both triggers share one source of
-- truth for username generation + collision avoidance.
create or replace function create_profile_for_user(
  p_user_id  uuid,
  p_email    text,
  p_raw_meta jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  base_username text;
  candidate     text;
  suffix        int := 0;
begin
  base_username := lower(
    coalesce(
      p_raw_meta->>'username',
      split_part(p_email, '@', 1),
      'user'
    )
  );
  base_username := regexp_replace(base_username, '[^a-z0-9_]', '', 'g');
  if base_username = '' then base_username := 'user'; end if;

  candidate := base_username;
  while exists (select 1 from profiles where username = candidate) loop
    suffix := suffix + 1;
    candidate := base_username || suffix::text;
  end loop;

  insert into profiles (id, username, display_name)
  values (
    p_user_id,
    candidate,
    coalesce(p_raw_meta->>'display_name', candidate)
  );
end;
$$;

-- ─── path A: OAuth (pre-confirmed on insert) ─────────────────────────
-- Replace the original handle_new_user so it only creates the profile
-- when the row arrives already confirmed.
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Email signup: email_confirmed_at is NULL on INSERT. Defer to
  -- handle_user_email_confirmed which fires when the user confirms.
  if new.email_confirmed_at is null then
    return new;
  end if;

  perform create_profile_for_user(new.id, new.email, new.raw_user_meta_data);
  return new;
end;
$$;

-- ─── path B: email signup (profile created on confirmation) ──────────
create or replace function handle_user_email_confirmed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Only act on the NULL → non-NULL transition. Skip every other
  -- UPDATE on auth.users (password change, metadata edit, etc.).
  if old.email_confirmed_at is not null then return new; end if;
  if new.email_confirmed_at is null then return new; end if;

  -- Idempotency: if the profile already exists (e.g. backfill,
  -- manual insert, or a future migration that creates it earlier),
  -- skip rather than collide on the PK.
  if exists (select 1 from profiles where id = new.id) then
    return new;
  end if;

  perform create_profile_for_user(new.id, new.email, new.raw_user_meta_data);
  return new;
end;
$$;

drop trigger if exists on_auth_user_email_confirmed on auth.users;
create trigger on_auth_user_email_confirmed
after update of email_confirmed_at on auth.users
for each row execute function handle_user_email_confirmed();

-- ─── CLEANUP (manual, OPTIONAL) ──────────────────────────────────────
-- Run this in SQL Editor AFTER applying the migration if you want to
-- nuke abandoned/unconfirmed signups left over from before this fix.
-- Cascades through FKs (profiles, follows, story_views, etc.).
--
--   delete from auth.users where email_confirmed_at is null;
--
-- Not run automatically because deleting auth.users via raw SQL
-- bypasses GoTrue's bookkeeping (e.g. session/refresh-token cleanup).
-- For most cases that's fine — the FK CASCADE handles it — but it's
-- the user's call to make explicitly.
