"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function getLocaleFromHeaders(h: Headers): string {
  const referer = h.get("referer") ?? "";
  const match = referer.match(/\/(en|ru)(\/|$)/);
  return match?.[1] ?? "en";
}

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) {
    return { error: "errorCredentials" as const };
  }
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "errorCredentials" as const };

  const locale = getLocaleFromHeaders(await headers());
  redirect(`/${locale}`);
}

export async function signUp(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || password.length < 6) {
    return { error: "errorGeneric" as const };
  }
  const supabase = await createSupabaseServerClient();
  const headerList = await headers();
  const origin =
    headerList.get("origin") ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "http://localhost:3000";
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${origin}/api/auth/callback` },
  });
  if (error) return { error: "errorGeneric" as const };
  return { ok: true as const };
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  const locale = getLocaleFromHeaders(await headers());
  revalidatePath("/", "layout");
  redirect(`/${locale}`);
}
