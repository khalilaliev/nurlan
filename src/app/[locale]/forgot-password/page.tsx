import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Card } from "@/components/ui/card";
import { ForgotPasswordForm } from "./forgot-password-form";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function ForgotPasswordPage({
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
            {t("forgotTitle")}
          </h1>
          <p className="text-sm text-[var(--color-foreground-muted)]">
            {t("forgotSubtitle")}
          </p>
        </header>
        <ForgotPasswordForm />
      </Card>
    </div>
  );
}
