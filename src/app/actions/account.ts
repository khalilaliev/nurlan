"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

function getLocaleFromHeaders(h: Headers): "en" | "ru" {
  const referer = h.get("referer") ?? "";
  const match = referer.match(/\/(en|ru)(\/|$)/);
  return (match?.[1] as "en" | "ru") ?? "en";
}

const ProfileSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(24)
    .regex(/^[a-z0-9_]+$/),
  display_name: z.string().max(60).nullable(),
  bio: z.string().max(280).nullable(),
  avatar_url: z.string().url().max(500).nullable(),
});

export async function updateProfile(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "errorGeneric" as const };

  const trim = (v: FormDataEntryValue | null) => {
    const s = String(v ?? "").trim();
    return s.length === 0 ? null : s;
  };

  const parsed = ProfileSchema.safeParse({
    username: String(formData.get("username") ?? "")
      .trim()
      .toLowerCase(),
    display_name: trim(formData.get("display_name")),
    bio: trim(formData.get("bio")),
    avatar_url: trim(formData.get("avatar_url")),
  });
  if (!parsed.success) return { error: "errorUsernameInvalid" as const };

  const { error } = await supabase
    .from("profiles")
    .update({
      username: parsed.data.username,
      display_name: parsed.data.display_name,
      bio: parsed.data.bio,
      avatar_url: parsed.data.avatar_url,
    })
    .eq("id", user.id);

  if (error) {
    if (error.code === "23505") return { error: "errorUsernameTaken" as const };
    return { error: "errorGeneric" as const };
  }

  revalidatePath("/", "layout");
  return { ok: true as const };
}

export async function updateEmail(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "errorGeneric" as const };

  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "errorGeneric" as const };
  }

  const { error } = await supabase.auth.updateUser({ email });
  if (error) return { error: "errorGeneric" as const };

  return { ok: true as const };
}

export async function updatePassword(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "errorGeneric" as const };

  const password = String(formData.get("password") ?? "");
  if (password.length < 6) return { error: "errorGeneric" as const };

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: "errorGeneric" as const };

  return { ok: true as const };
}

export async function deleteStory(storyId: string) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "errorGeneric" as const };

  const { error } = await supabase
    .from("stories")
    .delete()
    .eq("id", storyId)
    .eq("author_id", user.id);
  if (error) return { error: "errorGeneric" as const };

  revalidatePath("/en");
  revalidatePath("/ru");
  revalidatePath("/en/account/stories");
  revalidatePath("/ru/account/stories");
  revalidatePath("/en/account");
  revalidatePath("/ru/account");
  return { ok: true as const };
}

export async function deleteAccount(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "errorGeneric" as const };

  const confirm = String(formData.get("confirm_username") ?? "")
    .trim()
    .toLowerCase();

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.username.toLowerCase() !== confirm) {
    return { error: "errorGeneric" as const };
  }

  const admin = createSupabaseAdminClient();
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) return { error: "errorGeneric" as const };

  await supabase.auth.signOut();
  const locale = getLocaleFromHeaders(await headers());
  revalidatePath("/", "layout");
  redirect(`/${locale}`);
}
