"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type FollowError = "auth" | "self" | "db";

export async function followUser(
  targetUserId: string,
): Promise<{ ok: true } | { error: FollowError }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "auth" };
  if (user.id === targetUserId) return { error: "self" };

  const { error } = await supabase
    .from("follows")
    .insert({ follower_id: user.id, following_id: targetUserId });
  if (error) return { error: "db" };

  // Bust both locale variants of the target's profile page.
  await revalidateProfilePages(targetUserId);
  return { ok: true };
}

export async function unfollowUser(
  targetUserId: string,
): Promise<{ ok: true } | { error: FollowError }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "auth" };
  if (user.id === targetUserId) return { error: "self" };

  const { error } = await supabase
    .from("follows")
    .delete()
    .eq("follower_id", user.id)
    .eq("following_id", targetUserId);
  if (error) return { error: "db" };

  await revalidateProfilePages(targetUserId);
  return { ok: true };
}

async function revalidateProfilePages(userId: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", userId)
    .maybeSingle();
  if (!data?.username) return;
  revalidatePath(`/en/user/${data.username}`);
  revalidatePath(`/ru/user/${data.username}`);
}

export type ProfileRowLite = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
};

export async function listFollowers(userId: string): Promise<ProfileRowLite[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("follows")
    .select("follower:profiles!follows_follower_id_fkey(id, username, display_name, avatar_url), created_at")
    .eq("following_id", userId)
    .order("created_at", { ascending: false })
    .limit(100);
  const rows = (data ?? []) as Array<{ follower: ProfileRowLite | null }>;
  return rows.flatMap((r) => (r.follower ? [r.follower] : []));
}

export async function listFollowing(userId: string): Promise<ProfileRowLite[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("follows")
    .select("following:profiles!follows_following_id_fkey(id, username, display_name, avatar_url), created_at")
    .eq("follower_id", userId)
    .order("created_at", { ascending: false })
    .limit(100);
  const rows = (data ?? []) as Array<{ following: ProfileRowLite | null }>;
  return rows.flatMap((r) => (r.following ? [r.following] : []));
}
