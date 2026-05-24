"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

// Record one view for the current user on the given story. Idempotent: the
// underlying table has a (story_id, viewer_id) primary key, and we use
// `upsert ... ignoreDuplicates`, so calling this twice for the same user is
// a silent no-op. The view_count column on stories is bumped via a DB
// trigger only on truly new inserts, so re-visits don't inflate the number.
//
// Anonymous viewers (no auth.uid()) don't count — by design. If you ever
// want them to count, you'd swap to an IP/cookie-based row with weaker
// uniqueness guarantees and a much messier abuse story.
// Calls the SECURITY DEFINER RPC `record_story_view`, which inserts one
// (story_id, viewer_id) row idempotently. We bypass direct table writes
// because PostgREST's upsert (INSERT ... ON CONFLICT DO NOTHING +
// return=representation) interacts badly with our RLS setup for
// non-admin viewers — the conflict-resolution path surfaces as a
// WITH CHECK violation even when the check would pass. The RPC enforces
// `viewer_id = auth.uid()` internally, so RLS-bypass is safe here.
export async function recordStoryView(storyId: string): Promise<void> {
  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.rpc("record_story_view", {
      p_story_id: storyId,
    });
    if (error) {
      console.warn("[recordStoryView] rpc failed:", {
        storyId,
        message: error.message,
        code: error.code,
      });
    }
  } catch (e) {
    console.error("[recordStoryView] threw:", e);
  }
}
