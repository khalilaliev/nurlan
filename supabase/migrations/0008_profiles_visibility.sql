-- 0008_profiles_visibility.sql
--
-- ─── THREAT MODEL ──────────────────────────────────────────────────────
--
-- Migration 0004 added `profiles.is_profile_public boolean default true`
-- and a UI toggle in account settings. Despite that, the existing
-- profiles_select policy from 0001 was:
--
--     create policy profiles_select on profiles for select using (true);
--
-- which lets anyone (including unauthenticated visitors) read every
-- profile regardless of the flag. A user who flips their profile to
-- private still has their display_name, bio, avatar_url, reputation,
-- follower/following relationships, and is_profile_public itself
-- readable by anyone hitting PostgREST. The setting was effectively
-- a no-op — a quiet privacy regression that we documented to users.
--
-- This migration replaces ONLY the SELECT policy. INSERT and UPDATE
-- policies are untouched — the user can always write their own row;
-- admins are already covered by the existing rules.
--
-- After this migration:
--   - Public profiles            -> readable by everyone (anon ok)
--   - Private profiles           -> readable only by the owner OR an admin
--   - Anonymous user querying    -> sees only is_profile_public = true rows
--
-- ────────────────────────────────────────────────────────────────────────

set search_path = public;

drop policy if exists profiles_select on profiles;
create policy profiles_select on profiles for select
  using (
    is_profile_public
    or auth.uid() = id
    or is_admin()
  );
