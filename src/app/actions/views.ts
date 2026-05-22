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
export async function recordStoryView(storyId: string): Promise<void> {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    await supabase
      .from("story_views")
      .upsert(
        { story_id: storyId, viewer_id: user.id },
        { onConflict: "story_id,viewer_id", ignoreDuplicates: true },
      );
  } catch {
    // Don't surface — a view count is a nice-to-have, not load-bearing.
  }
}
