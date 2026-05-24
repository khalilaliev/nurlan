import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/guard";
import { SubmitForm } from "./submit-form";
import { SetupNotice } from "@/components/setup-notice";

export default async function SubmitPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  if (!isSupabaseConfigured()) {
    return (
      <div className="mx-auto max-w-2xl px-4 sm:px-6 py-10">
        <SetupNotice />
      </div>
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login`);

  const [categoriesRes, profileRes] = await Promise.all([
    supabase
      .from("categories")
      .select("slug, name_en, name_ru, emoji")
      .order("display_order"),
    supabase
      .from("profiles")
      .select("rules_accepted_at")
      .eq("id", user.id)
      .maybeSingle(),
  ]);

  // ─── DIAGNOSTIC LOGGING (temporary) ──────────────────────────────────
  console.log("[submit/categories] response", {
    rowCount: categoriesRes.data?.length ?? null,
    error: categoriesRes.error,
    status: categoriesRes.status,
    statusText: categoriesRes.statusText,
  });
  console.log("[submit/profile] response", {
    userId: user.id,
    hasData: profileRes.data !== null,
    error: profileRes.error,
    status: profileRes.status,
    statusText: profileRes.statusText,
  });
  // ─────────────────────────────────────────────────────────────────────

  const categories = categoriesRes.data;
  const rulesAccepted = Boolean(profileRes.data?.rules_accepted_at);

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight gradient-text mb-2">
          {t("submit.title")}
        </h1>
        <p className="text-sm text-[var(--color-foreground-muted)]">
          {t("submit.subtitle")}
        </p>
      </header>
      <SubmitForm
        rulesAccepted={rulesAccepted}
        userId={user.id}
        categories={(categories ?? []).map((c) => ({
          slug: c.slug,
          name: locale === "ru" ? c.name_ru : c.name_en,
          emoji: c.emoji ?? "",
        }))}
      />
    </div>
  );
}
