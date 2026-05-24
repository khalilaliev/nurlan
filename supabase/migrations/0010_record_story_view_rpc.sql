-- 0010_record_story_view_rpc.sql
--
-- ─── PURPOSE ──────────────────────────────────────────────────────────
-- Replace the direct `INSERT INTO story_views` path (via PostgREST
-- upsert) with a SECURITY DEFINER RPC.
--
-- ─── WHY ──────────────────────────────────────────────────────────────
-- The original recordStoryView server action used:
--
--   supabase
--     .from("story_views")
--     .upsert({ story_id, viewer_id },
--             { onConflict: "story_id,viewer_id", ignoreDuplicates: true })
--
-- PostgREST translates that to:
--
--   INSERT INTO story_views (...)
--   VALUES (...)
--   ON CONFLICT (story_id, viewer_id) DO NOTHING
--   RETURNING *
--
-- For non-admin authenticated users this combination failed with
-- `42501 new row violates row-level security policy` even though:
--   - the WITH CHECK policy `auth.uid() = viewer_id` evaluates TRUE in
--     isolation,
--   - the policy is permissive, TO authenticated, with no restrictive
--     siblings,
--   - a plain `INSERT INTO story_views ...` from SQL Editor as the
--     authenticated role with the same JWT claims succeeds cleanly.
--
-- The conflict-resolution path of ON CONFLICT DO NOTHING combined with
-- PostgREST's `Prefer: return=representation` requires SELECT access on
-- the existing row, and `story_views` has no SELECT policy for
-- non-admins (by design — view records are private). PostgreSQL
-- surfaces this as a misleading WITH CHECK violation rather than a
-- SELECT denial.
--
-- ─── DESIGN ───────────────────────────────────────────────────────────
-- Wrap the insert in a SECURITY DEFINER function. The function runs as
-- its owner (postgres), bypassing the RLS on story_views entirely.
-- Safety is preserved because the function HARD-CODES `viewer_id`
-- to `auth.uid()` — the caller cannot inject a different viewer_id.
-- The same idempotency contract holds: ON CONFLICT DO NOTHING means
-- repeat views are silent no-ops and the AFTER INSERT trigger
-- `story_views_bump` only fires for genuinely new rows.
--
-- ─── ALTERNATIVES CONSIDERED ──────────────────────────────────────────
-- * Add a SELECT policy `auth.uid() = viewer_id` so PostgREST's conflict
--   path can read the existing row. Works, but exposes the join table
--   to per-user reads (low risk but unnecessary).
-- * Drop `ignoreDuplicates` and catch 23505 in app code. Works, but
--   adds a round trip on every repeat view and surfaces a "bad" error
--   from the DB just to swallow it.
-- * Use createSupabaseAdminClient (service role) from the server
--   action. Works, but ships service-role credentials through a
--   per-request code path that doesn't need them.
--
-- The RPC is the cleanest of the three.

set search_path = public;

create or replace function public.record_story_view(p_story_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
begin
  v_user_id := auth.uid();
  -- Anonymous viewer: silent no-op. Matches the previous app-layer
  -- behaviour where `if (!user) return;` skipped the insert.
  if v_user_id is null then
    return;
  end if;

  insert into story_views (story_id, viewer_id)
  values (p_story_id, v_user_id)
  on conflict (story_id, viewer_id) do nothing;
end;
$$;

-- Only authenticated users call this from PostgREST. Anon should never
-- reach the function (the app-layer check would have already bailed),
-- but we deliberately don't GRANT to anon either — defence in depth.
grant execute on function public.record_story_view(uuid) to authenticated;
