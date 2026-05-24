"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isCurrentUserAdmin } from "@/lib/supabase/admin-check";

async function requireAdmin() {
  const ok = await isCurrentUserAdmin();
  if (!ok) return null;
  return await createSupabaseServerClient();
}

function revalidateFeeds() {
  revalidatePath("/en");
  revalidatePath("/ru");
  revalidatePath("/en/account/admin");
  revalidatePath("/ru/account/admin");
}

export async function adminRemoveStory(storyId: string) {
  const supabase = await requireAdmin();
  if (!supabase) return { error: "forbidden" as const };
  const { error } = await supabase
    .from("stories")
    .update({ status: "removed" })
    .eq("id", storyId);
  if (error) return { error: "db" as const };
  revalidateFeeds();
  return { ok: true as const };
}

export async function adminRestoreStory(storyId: string) {
  const supabase = await requireAdmin();
  if (!supabase) return { error: "forbidden" as const };
  const { error } = await supabase
    .from("stories")
    .update({ status: "published" })
    .eq("id", storyId);
  if (error) return { error: "db" as const };
  revalidateFeeds();
  return { ok: true as const };
}

export async function adminHardDeleteStory(storyId: string) {
  const supabase = await requireAdmin();
  if (!supabase) return { error: "forbidden" as const };
  const { error } = await supabase.from("stories").delete().eq("id", storyId);
  if (error) return { error: "db" as const };
  revalidateFeeds();
  return { ok: true as const };
}

export async function adminToggleFeature(storyId: string, value: boolean) {
  const supabase = await requireAdmin();
  if (!supabase) return { error: "forbidden" as const };
  const { error } = await supabase
    .from("stories")
    .update({ is_featured: value })
    .eq("id", storyId);
  if (error) return { error: "db" as const };
  revalidateFeeds();
  return { ok: true as const };
}

export async function adminDeleteComment(commentId: string) {
  const supabase = await requireAdmin();
  if (!supabase) return { error: "forbidden" as const };
  const { data: row } = await supabase
    .from("comments")
    .select("story_id")
    .eq("id", commentId)
    .maybeSingle();
  const { error } = await supabase.from("comments").delete().eq("id", commentId);
  if (error) return { error: "db" as const };
  if (row?.story_id) {
    revalidatePath(`/en/story/${row.story_id}`);
    revalidatePath(`/ru/story/${row.story_id}`);
  }
  return { ok: true as const };
}

/**
 * Permanently delete a user from the platform.
 *
 * Three safety gates before we touch anything:
 *   1. Caller must be admin (requireAdmin → null if not).
 *   2. The target's username must match the username the admin typed
 *      into the confirmation modal (passed in `confirmUsername`).
 *      Prevents fat-fingering the wrong row in a list of many users.
 *   3. The admin cannot delete themselves (would lock the platform's
 *      moderator out — defend against accidental self-deletion).
 *
 * Deletion path: `supabase.auth.admin.deleteUser(targetUserId)` which
 * removes the auth.users row. FK cascades wipe everything downstream —
 * profiles, stories, comments, reactions, follows, story_views, etc.
 * No row-level work needed here.
 *
 * Requires the SUPABASE_SERVICE_ROLE_KEY env var (used by the admin
 * client). This only runs in server code, so the key never leaves the
 * server.
 */
export async function adminDeleteUser(
  targetUserId: string,
  confirmUsername: string,
) {
  const supabase = await requireAdmin();
  if (!supabase) return { error: "forbidden" as const };

  const {
    data: { user: caller },
  } = await supabase.auth.getUser();
  if (!caller) return { error: "forbidden" as const };

  // Block self-deletion.
  if (caller.id === targetUserId) return { error: "selfDelete" as const };

  // Confirm username match — defends against clicking the wrong row.
  const { data: target } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", targetUserId)
    .maybeSingle();
  if (!target) return { error: "notFound" as const };
  if (target.username.toLowerCase() !== confirmUsername.trim().toLowerCase()) {
    return { error: "usernameMismatch" as const };
  }

  // Service-role delete: removes auth.users → cascades through every
  // FK that references it.
  const admin = createSupabaseAdminClient();
  const { error } = await admin.auth.admin.deleteUser(targetUserId);
  if (error) {
    console.error("[adminDeleteUser] failed:", {
      targetUserId,
      message: error.message,
    });
    return { error: "db" as const };
  }

  // Invalidate any cached page that might have shown this user's name.
  revalidatePath("/en/account/admin/users");
  revalidatePath("/ru/account/admin/users");
  revalidateFeeds();
  return { ok: true as const };
}
