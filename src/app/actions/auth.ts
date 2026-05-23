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

// Triggers a password-reset email. Supabase silently no-ops if the address
// doesn't exist — we mirror that on our side by always returning success.
// This prevents email enumeration: an attacker can't probe whether an
// address is registered by watching for different responses.
export async function requestPasswordReset(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  if (!email || !email.includes("@")) {
    return { error: "errorInvalidEmail" as const };
  }
  const supabase = await createSupabaseServerClient();
  const headerList = await headers();
  const origin =
    headerList.get("origin") ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "http://localhost:3000";
  const locale = getLocaleFromHeaders(headerList);
  // emailRedirectTo on resetPasswordForEmail is the URL Supabase puts in
  // the email link. We route through the existing OAuth/email callback so
  // the recovery code is exchanged for a session, then forward to the
  // reset form. The user lands there already authenticated with a
  // recovery session and can immediately set a new password.
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/api/auth/callback?next=/${locale}/reset-password`,
  });
  return { ok: true as const };
}

// Updates the authenticated user's password. Called from the
// /reset-password page after the recovery session has been established
// by the OAuth callback exchanging the code from the email link.
export async function updatePassword(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  if (password.length < 6) {
    return { error: "errorShortPassword" as const };
  }
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "errorNoSession" as const };
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: "errorGeneric" as const };
  return { ok: true as const };
}
