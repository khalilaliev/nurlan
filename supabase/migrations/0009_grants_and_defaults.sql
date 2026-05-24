-- 0009_grants_and_defaults.sql
--
-- ─── PURPOSE ──────────────────────────────────────────────────────────
-- Codify the GRANT chain on the `public` schema that Supabase normally
-- pre-configures at project init. On a fresh Supabase project this
-- migration is largely a no-op (defaults are already in place), but it
-- exists for two reasons:
--
--   1. INSURANCE — if anyone ever runs `drop schema public cascade`
--      again, re-running migrations rebuilds the grants in lockstep.
--      No more multi-hour debugging session chasing "permission denied"
--      errors across four different roles.
--
--   2. DOCUMENTATION — makes the role surface explicit. A new
--      contributor reading the migrations sees exactly which roles can
--      touch what.
--
-- All statements below are idempotent. Re-running this migration is a
-- no-op when grants already exist.
--
-- ─── ROLE RESPONSIBILITIES ────────────────────────────────────────────
-- anon                — unauthenticated visitors hitting PostgREST.
--                       SELECT only by default. INSERT explicitly on
--                       newsletter_subscribers + contact_messages so
--                       the public forms work without login. RLS gates
--                       which rows they actually see / can write.
--
-- authenticated       — logged-in users via PostgREST. Full CRUD; RLS
--                       gates which rows they touch.
--
-- service_role        — the server-side admin client
--                       (createSupabaseAdminClient). BYPASSRLS attribute
--                       + full privileges so no operation is artificially
--                       blocked.
--
-- supabase_auth_admin — GoTrue's internal database role. Needs full
--                       CRUD on public schema because:
--                         - handle_new_user trigger writes to profiles
--                         - auth.admin.deleteUser cascades through every
--                           FK that references auth.users.id
--                       Without these grants both auth flows fail with
--                       the wrapped error "Database error finding/loading
--                       users" — exactly the symptom that triggered
--                       this migration's existence.
--
-- ─── DEFAULT PRIVILEGES ───────────────────────────────────────────────
-- ALTER DEFAULT PRIVILEGES applies to objects created AFTER the
-- statement runs, BY THE ROLE that runs it (typically `postgres` for
-- migrations). Without these, the next migration that creates a table
-- re-introduces the "permission denied" bug. Anon INSERT defaults are
-- deliberately NOT broadened to future tables — that stays explicit
-- per-table so security-sensitive write paths can't be added by
-- accident.
-- ──────────────────────────────────────────────────────────────────────

set search_path = public;

-- ─── Schema USAGE ─────────────────────────────────────────────────────
grant usage on schema public
  to anon, authenticated, service_role, supabase_auth_admin;

-- ─── anon ─────────────────────────────────────────────────────────────
grant select on all tables in schema public to anon;

-- Explicit anon INSERT on the two intake tables (newsletter signup +
-- contact form). Their RLS policies have `with check (true)` so the
-- writes go through. Other tables have RLS requiring auth.uid() =
-- author_id, which anon can never satisfy regardless of GRANT.
grant insert on newsletter_subscribers, contact_messages to anon;

-- ─── authenticated ────────────────────────────────────────────────────
grant select, insert, update, delete
  on all tables in schema public
  to authenticated;

-- ─── service_role ─────────────────────────────────────────────────────
grant all privileges on all tables    in schema public to service_role;
grant all privileges on all sequences in schema public to service_role;
grant all privileges on all functions in schema public to service_role;

-- ─── supabase_auth_admin ──────────────────────────────────────────────
grant select, insert, update, delete
  on all tables in schema public
  to supabase_auth_admin;
grant usage, select on all sequences in schema public to supabase_auth_admin;

-- ─── Sequences for anon / authenticated ───────────────────────────────
grant usage, select on all sequences in schema public
  to anon, authenticated;

-- ─── DEFAULT PRIVILEGES — future objects inherit grants ───────────────
-- These apply to tables/sequences/functions created BY THE CURRENT ROLE
-- after this statement runs. Migrations run as the postgres role, so
-- any future migration that creates a table gets these grants attached
-- automatically.

alter default privileges in schema public
  grant select on tables to anon;
-- NB: deliberately NOT granting anon INSERT/UPDATE/DELETE by default.
-- Future tables that need anonymous writes must grant explicitly so
-- it's visible in code review.

alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public
  grant usage, select on sequences to authenticated;

alter default privileges in schema public
  grant all privileges on tables to service_role;
alter default privileges in schema public
  grant all privileges on sequences to service_role;
alter default privileges in schema public
  grant all privileges on functions to service_role;

alter default privileges in schema public
  grant select, insert, update, delete on tables to supabase_auth_admin;
alter default privileges in schema public
  grant usage, select on sequences to supabase_auth_admin;
