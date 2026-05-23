-- 0007_protect_restricted_columns.sql
--
-- ─── THREAT MODEL ──────────────────────────────────────────────────────────
--
-- Supabase exposes every column of every table for direct PostgREST writes
-- whenever a row-level UPDATE policy allows it. Our RLS policies are
-- row-scoped only:
--
--     profiles_update  using (auth.uid() = id)
--     stories_update   using (auth.uid() = author_id or is_admin())
--     comments_update  using (auth.uid() = author_id or is_admin())
--
-- They authorize WHO can change a row, but they don't restrict WHICH
-- COLUMNS may be changed. An authenticated user holding a normal JWT can
-- send (with their own access token):
--
--     PATCH /rest/v1/profiles?id=eq.<their-id>
--         { "is_admin": true, "reputation": 999999 }
--
--     PATCH /rest/v1/stories?id=eq.<their-story-id>
--         { "is_featured": true, "view_count": 999999,
--           "status": "published", "ai_score": {"viral_potential": 100} }
--
--     PATCH /rest/v1/comments?id=eq.<their-comment-id>
--         { "upvote_count": 9999, "is_pinned": true }
--
-- Every one of those is accepted today. The first is the worst: a single
-- PATCH grants permanent moderator powers — admin can hard-delete other
-- people's stories, read all reports, restore removed content, see the
-- contents of `app_config` indirectly via SQL functions.
--
-- The story / comment variants enable lower-grade abuse: self-featuring,
-- inflating "viral" reactions, restoring removed content as the original
-- author, and forging the upvote leaderboard.
--
--
-- ─── DEFENCE ───────────────────────────────────────────────────────────────
--
-- For each affected table this migration installs a BEFORE UPDATE row
-- trigger that runs SECURITY DEFINER and decides whether the caller is
-- allowed to mutate the restricted column subset. The bypass conditions,
-- in priority order, are:
--
--   1. `app.bypass_protect = 'true'`   — set as a transaction-local
--      session variable by trusted internal triggers
--      (`recount_comment_votes`, `bump_story_view_count`) so the
--      denormalised counter updates they do legitimately are not reverted.
--   2. JWT role = 'service_role'       — the admin client (used only
--      server-side from `createSupabaseAdminClient`) is fully trusted.
--   3. No JWT context at all           — direct DB access via Supabase
--      Dashboard SQL Editor, psql, migrations. Treated as superuser path.
--   4. `is_admin()` = true             — an existing admin holding a
--      normal authenticated JWT can edit anything from PostgREST.
--
-- If none of those is true, every protected column on the NEW row is
-- overwritten with the OLD value before the UPDATE proceeds. The user's
-- allowed-column changes (body, title, tags, username, bio, etc.) still
-- go through unchanged; only the protected ones are quietly reverted.
--
-- WHY SILENTLY-REVERT INSTEAD OF RAISE-EXCEPTION:
-- A 403/400 response would let an attacker enumerate which columns are
-- guarded ("set is_admin=true → error. Set just reputation=99 → success?
-- Aha — reputation is unguarded"). Reverting gives back a 204 No Content
-- as if the patch succeeded; a follow-up read shows the row unchanged.
-- Wastes the attacker's time, leaks no schema-level information.
-- ───────────────────────────────────────────────────────────────────────────

set search_path = public;


-- ─── helper: decide whether the caller may bypass column protection ───────
-- Stable + SECURITY DEFINER so it can read session settings written by
-- PostgREST (`request.jwt.claims`) and the per-tx bypass flag set by
-- our trusted system triggers, regardless of the trigger function's
-- own privileges. `set search_path = public` blocks search-path hijacks.
create or replace function protect_caller_is_trusted()
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  bypass_flag text;
  jwt_role    text;
begin
  -- (1) Explicit per-transaction trust flag from internal triggers.
  bypass_flag := nullif(current_setting('app.bypass_protect', true), '');
  if bypass_flag = 'true' then
    return true;
  end if;

  -- (2) JWT role pulled from PostgREST's per-request settings.
  --     Old supabase: `request.jwt.claim.role` (dotted, individual claim).
  --     New supabase: `request.jwt.claims` (full JSON object).
  --     Read both for forward+backward compatibility.
  jwt_role := coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role',
    ''
  );

  if jwt_role = 'service_role' then
    return true;
  end if;

  -- (3) Empty JWT context = not coming through PostgREST. That means
  --     Supabase Dashboard SQL Editor, psql with a privileged user, or a
  --     migration. These run as postgres/supabase_admin and we already
  --     trust them.
  if jwt_role = '' then
    return true;
  end if;

  -- (4) Authenticated user — only allowed to bypass column protection
  --     if they're already an admin.
  return is_admin();
exception
  when others then
    -- Fail closed: any unexpected error reading session state → treat as
    -- untrusted. Better to silently revert columns than accidentally let
    -- something escalate.
    return false;
end;
$$;


-- ─── profiles ─────────────────────────────────────────────────────────────
-- Protected columns (revert to OLD if untrusted caller):
--   is_admin    — admin status; the whole point of this migration
--   reputation  — system-managed score
--   id          — primary key; should never change post-creation
--   created_at  — system clock
-- Unprotected (user may freely change their own):
--   username, display_name, avatar_url, bio, is_profile_public,
--   rules_accepted_at, updated_at
create or replace function protect_restricted_profile_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if protect_caller_is_trusted() then
    return new;
  end if;

  new.is_admin   := old.is_admin;
  new.reputation := old.reputation;
  new.id         := old.id;
  new.created_at := old.created_at;
  return new;
end;
$$;

drop trigger if exists profiles_protect_columns on profiles;
create trigger profiles_protect_columns
before update on profiles
for each row execute function protect_restricted_profile_columns();


-- ─── stories ──────────────────────────────────────────────────────────────
-- Protected columns:
--   is_featured  — admin moderation flag
--   status       — admin moderation flag ('removed' → undo not allowed)
--   view_count   — system, bumped only via story_views trigger
--   ai_score     — system-generated
--   author_id    — fixed at creation
--   created_at   — system
--   id           — primary key
-- Unprotected (author may edit):
--   title, body, category_slug, tags, is_anonymous, media_urls,
--   language, updated_at
create or replace function protect_restricted_story_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if protect_caller_is_trusted() then
    return new;
  end if;

  new.is_featured := old.is_featured;
  new.status      := old.status;
  new.view_count  := old.view_count;
  new.ai_score    := old.ai_score;
  new.author_id   := old.author_id;
  new.created_at  := old.created_at;
  new.id          := old.id;
  return new;
end;
$$;

drop trigger if exists stories_protect_columns on stories;
create trigger stories_protect_columns
before update on stories
for each row execute function protect_restricted_story_columns();


-- ─── comments ─────────────────────────────────────────────────────────────
-- Protected columns:
--   upvote_count  — system, driven by comment_votes recount trigger
--   is_pinned     — admin/moderator flag
--   story_id      — structural; reparenting changes thread topology
--   parent_id     — structural; reparenting breaks reply threading
--   author_id     — fixed at creation
--   created_at    — system
--   id            — primary key
-- Unprotected (author may edit):
--   body, is_anonymous
create or replace function protect_restricted_comment_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if protect_caller_is_trusted() then
    return new;
  end if;

  new.upvote_count := old.upvote_count;
  new.is_pinned    := old.is_pinned;
  new.story_id     := old.story_id;
  new.parent_id    := old.parent_id;
  new.author_id    := old.author_id;
  new.created_at   := old.created_at;
  new.id           := old.id;
  return new;
end;
$$;

drop trigger if exists comments_protect_columns on comments;
create trigger comments_protect_columns
before update on comments
for each row execute function protect_restricted_comment_columns();


-- ─── make existing system triggers bypass the new protection ─────────────
-- These two functions legitimately mutate columns we just protected.
-- Both are SECURITY DEFINER and were created in earlier migrations.
-- We redefine them here (via CREATE OR REPLACE — non-destructive, doesn't
-- touch the old migration file) to set the bypass flag at the top of
-- each invocation. `set_config(..., true)` makes the setting TRANSACTION-
-- LOCAL; it evaporates at COMMIT/ROLLBACK so there's no bleed-over.

-- Originally defined in 0001_init.sql.
create or replace function recount_comment_votes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare target_id uuid;
begin
  target_id := coalesce(new.comment_id, old.comment_id);
  perform set_config('app.bypass_protect', 'true', true);
  update comments
     set upvote_count = coalesce((
       select sum(vote)::int from comment_votes where comment_id = target_id
     ), 0)
   where id = target_id;
  return null;
end;
$$;

-- Originally defined in 0004_story_views.sql.
create or replace function bump_story_view_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform set_config('app.bypass_protect', 'true', true);
  update stories
     set view_count = view_count + 1
   where id = new.story_id;
  return new;
end;
$$;
