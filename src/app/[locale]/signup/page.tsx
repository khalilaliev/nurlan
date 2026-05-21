import { setRequestLocale, getTranslations } from "next-intl/server";
import { Card } from "@/components/ui/card";
import { SignupForm } from "./signup-form";

export default async function SignupPage({
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
            {t("signupTitle")}
          </h1>
          <p className="text-sm text-[var(--color-foreground-muted)]">
            {t("signupSubtitle")}
          </p>
        </header>
        <SignupForm />
      </Card>
    </div>
  );
}
