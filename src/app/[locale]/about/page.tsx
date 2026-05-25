import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { FadeIn, Stagger } from "@/components/animated";
import { Heart, Volume2, EyeOff } from "lucide-react";
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
    title: t("aboutTitle"),
    description: t("aboutDescription"),
    path: "/about",
  });
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("about");

  const values = [
    { Icon: Heart, title: t("value1Title"), body: t("value1Body") },
    { Icon: Volume2, title: t("value2Title"), body: t("value2Body") },
    { Icon: EyeOff, title: t("value3Title"), body: t("value3Body") },
  ];

  const sections = [
    { title: t("section1Title"), body: t("section1Body") },
    { title: t("section2Title"), body: t("section2Body") },
    { title: t("section3Title"), body: t("section3Body") },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-12 sm:py-20">
      <FadeIn>
        <p className="mb-3 text-xs font-medium uppercase tracking-[0.3em] text-[var(--color-foreground-muted)]">
          {t("kicker")}
        </p>
      </FadeIn>
      <FadeIn delay={0.1}>
        <h1 className="text-4xl sm:text-6xl font-semibold tracking-tight gradient-text mb-6 leading-[1.05]">
          {t("title")}
        </h1>
      </FadeIn>
      <FadeIn delay={0.2}>
        <p className="text-lg sm:text-xl text-[var(--color-foreground-muted)] leading-relaxed max-w-2xl mb-16">
          {t("lede")}
        </p>
      </FadeIn>

      <Stagger as="div" className="grid sm:grid-cols-3 gap-4 mb-20">
        {sections.map((s, i) => (
          <Card key={i} className="p-6 hover:border-[var(--color-border-strong)] transition-colors">
            <div className="text-xs font-medium uppercase tracking-wider text-[var(--color-foreground-subtle)] mb-3">
              0{i + 1}
            </div>
            <h2 className="text-base font-semibold mb-2">{s.title}</h2>
            <p className="text-sm text-[var(--color-foreground-muted)] leading-relaxed">
              {s.body}
            </p>
          </Card>
        ))}
      </Stagger>

      <FadeIn>
        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-8">
          {t("valuesTitle")}
        </h2>
      </FadeIn>

      <Stagger as="div" className="space-y-4 mb-20">
        {values.map(({ Icon, title, body }, i) => (
          <Card
            key={i}
            className="p-6 flex items-start gap-5 hover:border-[var(--color-border-strong)] transition-colors"
          >
            <div className="shrink-0 h-12 w-12 rounded-[var(--radius)] bg-[var(--color-accent-soft)] flex items-center justify-center">
              <Icon className="h-5 w-5 text-[var(--color-accent)]" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-base font-semibold mb-1">{title}</h3>
              <p className="text-sm text-[var(--color-foreground-muted)] leading-relaxed">
                {body}
              </p>
            </div>
          </Card>
        ))}
      </Stagger>

      <FadeIn>
        <Card className="relative overflow-hidden p-8 sm:p-12 text-center">
          <div
            className="pointer-events-none absolute -top-32 -left-32 h-80 w-80 rounded-full bg-[var(--color-accent-soft)] blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-32 -right-32 h-80 w-80 rounded-full bg-orange-500/10 blur-3xl"
            aria-hidden
          />
          <div className="relative">
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight gradient-text mb-3">
              {t("ctaTitle")}
            </h2>
            <p className="text-base text-[var(--color-foreground-muted)] mb-6 max-w-md mx-auto">
              {t("ctaBody")}
            </p>
            <Button asChild variant="accent" size="lg">
              <Link href="/submit">✨ {t("ctaButton")}</Link>
            </Button>
          </div>
        </Card>
      </FadeIn>
    </div>
  );
}
