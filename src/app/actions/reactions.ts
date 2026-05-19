"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ReactionType } from "@/lib/supabase/types";

const VALID: ReactionType[] = [
  "funny",
  "insane",
  "sad",
  "cringe",
  "mindblown",
  "viral",
];

export async function toggleReaction(storyId: string, type: ReactionType) {
  if (!VALID.includes(type)) return { error: "invalid_type" as const };

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "auth" as const };

  const { data: existing } = await supabase
    .from("reactions")
    .select("id")
    .eq("story_id", storyId)
    .eq("user_id", user.id)
    .eq("type", type)
    .maybeSingle();

  if (existing) {
    await supabase.from("reactions").delete().eq("id", existing.id);
  } else {
    await supabase.from("reactions").insert({
      story_id: storyId,
      user_id: user.id,
      type,
    });
  }

  revalidatePath(`/en/story/${storyId}`);
  revalidatePath(`/ru/story/${storyId}`);
  return { ok: true as const };
}
