"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const CommentSchema = z.object({
  story_id: z.string().uuid(),
  body: z.string().min(1).max(5000),
  parent_id: z.string().uuid().nullish(),
  is_anonymous: z.boolean().default(false),
});

export async function createComment(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "auth" as const };

  const parentRaw = formData.get("parent_id");
  const parsed = CommentSchema.safeParse({
    story_id: String(formData.get("story_id") ?? ""),
    body: String(formData.get("body") ?? "").trim(),
    parent_id: parentRaw ? String(parentRaw) : null,
    is_anonymous: formData.get("is_anonymous") === "on",
  });
  if (!parsed.success) return { error: "validation" as const };

  const { error } = await supabase.from("comments").insert({
    story_id: parsed.data.story_id,
    body: parsed.data.body,
    parent_id: parsed.data.parent_id ?? null,
    author_id: user.id,
    is_anonymous: parsed.data.is_anonymous,
  });
  if (error) return { error: "db" as const };

  revalidatePath(`/en/story/${parsed.data.story_id}`);
  revalidatePath(`/ru/story/${parsed.data.story_id}`);
  return { ok: true as const };
}

export async function voteComment(commentId: string, vote: 1 | -1) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "auth" as const };

  const { data: existing } = await supabase
    .from("comment_votes")
    .select("vote")
    .eq("comment_id", commentId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing && existing.vote === vote) {
    await supabase
      .from("comment_votes")
      .delete()
      .eq("comment_id", commentId)
      .eq("user_id", user.id);
  } else {
    await supabase
      .from("comment_votes")
      .upsert({ comment_id: commentId, user_id: user.id, vote });
  }
  return { ok: true as const };
}
