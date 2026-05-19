"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
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
