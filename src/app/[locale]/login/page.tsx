import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Card } from "@/components/ui/card";
import { LoginForm } from "./login-form";

// Auth pages: don't index, don't crawl onward links. There's nothing
// useful here for search engines and indexing the login URL is the
// kind of thing that ends up in "users.json" credential lists.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("auth");
  return (
    <div className="mx-auto max-w-md px-4 sm:px-6 py-16">
      <Card className="p-6 sm:p-8 shadow-xl">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight gradient-text mb-1">
            {t("loginTitle")}
          </h1>
          <p className="text-sm text-[var(--color-foreground-muted)]">
            {t("loginSubtitle")}
          </p>
        </header>
        <LoginForm />
      </Card>
    </div>
  );
}
