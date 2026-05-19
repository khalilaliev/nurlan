"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/guard";

export type SearchResult = {
  id: string;
  title: string;
  category_emoji: string | null;
  author_username: string;
  is_anonymous: boolean;
};

export async function searchStories(query: string): Promise<SearchResult[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  if (!isSupabaseConfigured()) return [];

  try {
    const supabase = await createSupabaseServerClient();

    const pattern = `%${q.replace(/[\\%_]/g, (m) => `\\${m}`)}%`;
    const { data } = await supabase
      .from("story_feed")
      .select(
        "id, title, category_emoji, author_username, is_anonymous, created_at",
      )
      .or(`title.ilike.${pattern},author_username.ilike.${pattern}`)
      .order("created_at", { ascending: false })
      .limit(8);

    return (data ?? []).map((r) => ({
      id: r.id,
      title: r.title,
      category_emoji: r.category_emoji,
      author_username: r.author_username,
      is_anonymous: r.is_anonymous,
    }));
  } catch {
    return [];
  }
}
