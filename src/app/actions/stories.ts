"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const StorySchema = z.object({
  title: z.string().min(3).max(200),
  body: z.string().min(20).max(50000),
  category_slug: z.enum([
    "life",
    "relationships",
    "school",
    "work",
    "cringe",
    "horror",
    "weird",
  ]),
  is_anonymous: z.boolean(),
  tags: z.array(z.string()).max(8),
  language: z.enum(["en", "ru"]),
});

function getLocaleFromHeaders(h: Headers): "en" | "ru" {
  const referer = h.get("referer") ?? "";
  const match = referer.match(/\/(en|ru)(\/|$)/);
  return (match?.[1] as "en" | "ru") ?? "en";
}

export async function createStory(formData: FormData) {
  const locale = getLocaleFromHeaders(await headers());
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "errorAuth" as const };

  const parsed = StorySchema.safeParse({
    title: String(formData.get("title") ?? "").trim(),
    body: String(formData.get("body") ?? "").trim(),
    category_slug: String(formData.get("category_slug") ?? ""),
    is_anonymous: formData.get("is_anonymous") === "on",
    tags: String(formData.get("tags") ?? "")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 8),
    language: locale,
  });
  if (!parsed.success) return { error: "errorGeneric" as const };

  const { data, error } = await supabase
    .from("stories")
    .insert({
      author_id: user.id,
      title: parsed.data.title,
      body: parsed.data.body,
      category_slug: parsed.data.category_slug,
      is_anonymous: parsed.data.is_anonymous,
      tags: parsed.data.tags,
      language: parsed.data.language,
    })
    .select("id")
    .single();

  if (error || !data?.id) return { error: "errorGeneric" as const };

  revalidatePath(`/${locale}`);
  const newId: string = data.id;
  return { ok: true as const, id: newId };
}
