"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { detectMagic, fetchFirstBytes } from "@/lib/media/magic-bytes";
import { kindForUrl } from "@/lib/media/constants";

const MAX_MEDIA = 5;

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
  media_urls: z.array(z.string().url()).max(MAX_MEDIA),
});

function getLocaleFromHeaders(h: Headers): "en" | "ru" {
  const referer = h.get("referer") ?? "";
  const match = referer.match(/\/(en|ru)(\/|$)/);
  return (match?.[1] as "en" | "ru") ?? "en";
}

function parseStoryFormData(formData: FormData, locale: "en" | "ru") {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const allowedMediaPrefix = supabaseUrl
    ? `${supabaseUrl.replace(/\/$/, "")}/storage/v1/object/public/story-media/`
    : null;

  const rawMedia = formData
    .getAll("media_urls")
    .map((v) => String(v).trim())
    .filter((v) => v.length > 0);
  const mediaUrls = allowedMediaPrefix
    ? rawMedia.filter((u) => u.startsWith(allowedMediaPrefix)).slice(0, MAX_MEDIA)
    : [];

  return StorySchema.safeParse({
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
    media_urls: mediaUrls,
  });
}

// Server-side magic-byte check on each uploaded media URL. Files are already
// in our bucket (RLS prevented anyone else from putting them there), but we
// re-validate the actual signature in case the client bypassed its own checks.
async function validateMediaSignatures(urls: string[]): Promise<boolean> {
  for (const url of urls) {
    try {
      const bytes = await fetchFirstBytes(url, 16);
      const detected = detectMagic(bytes);
      const expected = kindForUrl(url);
      if (detected !== expected) return false;
    } catch {
      return false;
    }
  }
  return true;
}

function revalidateStoryPages(storyId: string, locale: string) {
  revalidatePath(`/${locale}`);
  revalidatePath(`/en/story/${storyId}`);
  revalidatePath(`/ru/story/${storyId}`);
}

export async function createStory(formData: FormData) {
  const locale = getLocaleFromHeaders(await headers());
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "errorAuth" as const };

  const parsed = parseStoryFormData(formData, locale);
  if (!parsed.success) return { error: "errorGeneric" as const };

  if (parsed.data.media_urls.length > 0) {
    const ok = await validateMediaSignatures(parsed.data.media_urls);
    if (!ok) return { error: "errorBadMedia" as const };
  }

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
      media_urls: parsed.data.media_urls,
    })
    .select("id")
    .single();

  if (error || !data?.id) return { error: "errorGeneric" as const };

  revalidatePath(`/${locale}`);
  const newId: string = data.id;
  return { ok: true as const, id: newId };
}

export async function updateStory(storyId: string, formData: FormData) {
  const locale = getLocaleFromHeaders(await headers());
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "errorAuth" as const };

  // Author-only edit. Even though the RLS policy enforces this too, we check
  // explicitly here for a cleaner error response and so we never even attempt
  // the update if the caller isn't the author. (Admin moderation goes through
  // adminRemoveStory / adminRestoreStory, not this endpoint.)
  const { data: existing } = await supabase
    .from("stories")
    .select("author_id")
    .eq("id", storyId)
    .maybeSingle();
  if (!existing) return { error: "errorNotFound" as const };
  if (existing.author_id !== user.id) return { error: "errorForbidden" as const };

  const parsed = parseStoryFormData(formData, locale);
  if (!parsed.success) return { error: "errorGeneric" as const };

  if (parsed.data.media_urls.length > 0) {
    const ok = await validateMediaSignatures(parsed.data.media_urls);
    if (!ok) return { error: "errorBadMedia" as const };
  }

  const { error } = await supabase
    .from("stories")
    .update({
      title: parsed.data.title,
      body: parsed.data.body,
      category_slug: parsed.data.category_slug,
      is_anonymous: parsed.data.is_anonymous,
      tags: parsed.data.tags,
      language: parsed.data.language,
      media_urls: parsed.data.media_urls,
      updated_at: new Date().toISOString(),
    })
    .eq("id", storyId);

  if (error) return { error: "errorGeneric" as const };

  revalidateStoryPages(storyId, locale);
  return { ok: true as const, id: storyId };
}
