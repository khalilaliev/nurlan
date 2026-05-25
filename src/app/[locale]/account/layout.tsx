import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/guard";
import { isCurrentUserAdmin } from "@/lib/supabase/admin-check";
import { SetupNotice } from "@/components/setup-notice";
import { AccountTabs } from "@/components/account-tabs";

// Applies to every page nested under /account/* — overview, settings,
// stories, activity, admin, admin/users. None of these should be
// indexed: they're either personal data, admin tooling, or both.
// Layout-level metadata cascades unless a child page overrides it.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AccountLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("account");

  if (!isSupabaseConfigured()) {
    return (
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-10">
        <SetupNotice />
      </div>
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login`);

  const isAdmin = await isCurrentUserAdmin();

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10">
      <header className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight gradient-text mb-2">
          {t("title")}
        </h1>
        <p className="text-sm text-[var(--color-foreground-muted)]">
          {t("subtitle")}
        </p>
      </header>

      <div className="mb-8">
        <AccountTabs isAdmin={isAdmin} />
      </div>

      {children}
    </div>
  );
}
