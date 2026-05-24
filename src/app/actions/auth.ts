"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  authLimiter,
  checkRateLimit,
  getClientIp,
} from "@/lib/rate-limit";

function getLocaleFromHeaders(h: Headers): string {
  const referer = h.get("referer") ?? "";
  const match = referer.match(/\/(en|ru)(\/|$)/);
  return match?.[1] ?? "en";
}

export async function signIn(formData: FormData) {
  // Rate-limit before any DB work — cheapest possible rejection path
  // for password-spray / credential-stuffing scripts.
  const ip = getClientIp(await headers());
  const rl = await checkRateLimit(authLimiter, ip);
  if (!rl.success) return { error: "errorRateLimited" as const };

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
  // Rate-limit first. Each signup costs us a Supabase confirmation
  // email, so unbounded volume is a real $$ risk on top of database
  // pollution.
  const ip = getClientIp(await headers());
  const rl = await checkRateLimit(authLimiter, ip);
  if (!rl.success) return { error: "errorRateLimited" as const };

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
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${origin}/api/auth/callback` },
  });
  if (error) {
    console.error("[signUp] supabase rejected:", {
      message: error.message,
      status: error.status,
      code: error.code,
    });
    return { error: "errorGeneric" as const };
  }

  // Duplicate-email detection.
  //
  // The clean signal is `data.user.created_at`. For a fresh signup
  // Supabase populates this with NOW; for a duplicate, it returns the
  // original user row with its ORIGINAL created_at (seconds, minutes,
  // or days ago). Comparing against the wall clock with a 5-second
  // grace window for request latency cleanly distinguishes the two
  // cases regardless of the dashboard's "Confirm email" setting and
  // regardless of whether auth.identities is populated correctly.
  //
  // Why not check identities length: in some DB states (e.g. after a
  // partial schema reset) the auth.identities table doesn't get a row
  // for fresh signups, so identities=[] is ambiguous between "new"
  // and "duplicate". created_at age is unambiguous.
  //
  // Why not check data.user.identities at all: same reason — unreliable.
  //
  // Edge case: if data.user is null (confirm-email OFF + duplicate on
  // older Supabase versions), treat as duplicate.
  const FRESH_THRESHOLD_MS = 5_000;
  if (!data.user) {
    console.warn("[signUp] email already registered (null user):", email);
    return { error: "errorEmailTaken" as const };
  }
  const ageMs = Date.now() - new Date(data.user.created_at).getTime();
  if (ageMs > FRESH_THRESHOLD_MS) {
    console.warn("[signUp] email already registered:", email, {
      user_age_ms: ageMs,
    });
    return { error: "errorEmailTaken" as const };
  }
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
  // Rate-limit so an attacker can't email-bomb arbitrary addresses
  // (Supabase has its own provider limits, but we shouldn't be the
  // amplifier).
  const headerList = await headers();
  const ip = getClientIp(headerList);
  const rl = await checkRateLimit(authLimiter, ip);
  if (!rl.success) return { error: "errorRateLimited" as const };

  const email = String(formData.get("email") ?? "").trim();
  if (!email || !email.includes("@")) {
    return { error: "errorInvalidEmail" as const };
  }
  const supabase = await createSupabaseServerClient();
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
