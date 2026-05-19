import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/guard";
import { SetupNotice } from "@/components/setup-notice";
import { AccountTabs } from "@/components/account-tabs";

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
        <AccountTabs />
      </div>

      {children}
    </div>
  );
}
