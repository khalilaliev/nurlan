"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function getLocale(h: Headers): "en" | "ru" {
  const referer = h.get("referer") ?? "";
  const m = referer.match(/\/(en|ru)(\/|$)/);
  return (m?.[1] as "en" | "ru") ?? "en";
}

// ---------- Newsletter ----------

const NewsletterSchema = z.object({
  email: z.string().email().max(320),
});

export async function subscribeNewsletter(
  formData: FormData,
): Promise<{ ok: true } | { error: "invalid" | "db" }> {
  const parsed = NewsletterSchema.safeParse({
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
  });
  if (!parsed.success) return { error: "invalid" };

  const locale = getLocale(await headers());

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // upsert on unique(email) so re-subscribing is silent (no error spam,
    // no duplicate row). We just refresh source/locale.
    const { error } = await supabase
      .from("newsletter_subscribers")
      .upsert(
        {
          email: parsed.data.email,
          user_id: user?.id ?? null,
          locale,
          source: "footer",
        },
        { onConflict: "email" },
      );

    if (error) return { error: "db" };
    return { ok: true };
  } catch {
    return { error: "db" };
  }
}

// ---------- Contact ----------

const ContactSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email().max(320),
  subject: z.string().max(200).optional().or(z.literal("")),
  body: z.string().min(10).max(5000),
});

export async function sendContactMessage(
  formData: FormData,
): Promise<{ ok: true } | { error: "invalid" | "db" }> {
  const parsed = ContactSchema.safeParse({
    name: String(formData.get("name") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
    subject: String(formData.get("subject") ?? "").trim(),
    body: String(formData.get("body") ?? "").trim(),
  });
  if (!parsed.success) return { error: "invalid" };

  const locale = getLocale(await headers());

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase.from("contact_messages").insert({
      name: parsed.data.name,
      email: parsed.data.email,
      subject: parsed.data.subject || null,
      body: parsed.data.body,
      user_id: user?.id ?? null,
      locale,
    });

    if (error) return { error: "db" };
    return { ok: true };
  } catch {
    return { error: "db" };
  }
}
