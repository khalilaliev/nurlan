import { getTranslations, setRequestLocale } from "next-intl/server";
import { Card } from "@/components/ui/card";
import { FadeIn, Stagger } from "@/components/animated";

export const metadata = { title: "Privacy Policy" };

type Section = { title: string; body: string };

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("privacy");
  const sections = t.raw("sections") as Section[];

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-12">
      <FadeIn>
        <p className="mb-2 text-xs font-medium uppercase tracking-[0.3em] text-[var(--color-foreground-muted)]">
          {t("kicker")}
        </p>
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight gradient-text mb-3">
          {t("title")}
        </h1>
        <p className="text-xs text-[var(--color-foreground-subtle)] mb-6">
          {t("updated")} 2026-05-19
        </p>
        <p className="text-base text-[var(--color-foreground-muted)] leading-relaxed mb-10 border-l-2 border-[var(--color-accent)]/50 pl-4">
          {t("intro")}
        </p>
      </FadeIn>

      <Stagger as="div" className="space-y-4">
        {sections.map((s, i) => (
          <Card key={i} className="p-6">
            <h2 className="text-base font-semibold mb-2">{s.title}</h2>
            <p className="text-sm text-[var(--color-foreground-muted)] leading-relaxed whitespace-pre-wrap">
              {s.body}
            </p>
          </Card>
        ))}
      </Stagger>
    </div>
  );
}
