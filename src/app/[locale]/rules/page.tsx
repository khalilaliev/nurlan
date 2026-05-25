import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Card } from "@/components/ui/card";
import { FadeIn, Stagger } from "@/components/animated";
import { ShieldAlert, MessageCircle } from "lucide-react";
import {
  DEFAULT_LOCALE,
  isLocale,
  staticPageMetadata,
  type Locale,
} from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale: Locale = isLocale(raw) ? raw : DEFAULT_LOCALE;
  const t = await getTranslations({ locale, namespace: "seo" });
  return staticPageMetadata({
    locale,
    title: t("rulesTitle"),
    description: t("rulesDescription"),
    path: "/rules",
  });
}

type Rule = { n: number; title: string; body: string };

export default async function RulesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("rulesPage");
  const sections = t.raw("sections") as Rule[];

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-12">
      <FadeIn>
        <p className="mb-2 text-xs font-medium uppercase tracking-[0.3em] text-[var(--color-foreground-muted)]">
          {t("kicker")}
        </p>
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight gradient-text mb-4">
          {t("title")}
        </h1>
        <p className="text-base text-[var(--color-foreground-muted)] leading-relaxed mb-10 border-l-2 border-[var(--color-accent)]/50 pl-4">
          {t("intro")}
        </p>
      </FadeIn>

      <Stagger as="ol" className="space-y-3 mb-12">
        {sections.map((rule) => (
          <li key={rule.n}>
            <Card className="p-6 hover:border-[var(--color-border-strong)] transition-colors">
              <div className="flex items-start gap-4">
                <div className="shrink-0 h-10 w-10 rounded-full bg-gradient-to-br from-[var(--color-accent)] to-orange-500 flex items-center justify-center text-white font-semibold shadow-[var(--shadow-glow)]">
                  {rule.n}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-base font-semibold mb-1">{rule.title}</h2>
                  <p className="text-sm text-[var(--color-foreground-muted)] leading-relaxed">
                    {rule.body}
                  </p>
                </div>
              </div>
            </Card>
          </li>
        ))}
      </Stagger>

      <FadeIn delay={0.1}>
        <div className="grid sm:grid-cols-2 gap-4">
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-2 text-[var(--color-accent)]">
              <ShieldAlert className="h-4 w-4" />
              <h3 className="text-sm font-semibold">
                {t("enforcementTitle")}
              </h3>
            </div>
            <p className="text-sm text-[var(--color-foreground-muted)] leading-relaxed">
              {t("enforcementBody")}
            </p>
          </Card>
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-2 text-[var(--color-foreground)]">
              <MessageCircle className="h-4 w-4" />
              <h3 className="text-sm font-semibold">{t("appealTitle")}</h3>
            </div>
            <p className="text-sm text-[var(--color-foreground-muted)] leading-relaxed">
              {t("appealBody")}
            </p>
          </Card>
        </div>
      </FadeIn>
    </div>
  );
}
