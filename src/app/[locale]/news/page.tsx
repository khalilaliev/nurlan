import { getTranslations, setRequestLocale } from "next-intl/server";
import { Card } from "@/components/ui/card";
import { FadeIn, Stagger } from "@/components/animated";

export const metadata = { title: "News" };

type Item = {
  date: string;
  tag: string;
  title: string;
  body: string;
};

const TAG_STYLES: Record<string, string> = {
  Release:
    "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  Релиз: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  Polish: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  Полировка: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  Coming: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  Готовится: "bg-amber-500/10 text-amber-400 border-amber-500/20",
};

export default async function NewsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("news");
  const items = t.raw("items") as Item[];

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-12 sm:py-20">
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
        <p className="text-base sm:text-lg text-[var(--color-foreground-muted)] leading-relaxed max-w-xl mb-16">
          {t("lede")}
        </p>
      </FadeIn>

      <Stagger as="ol" className="relative space-y-6 pl-6 sm:pl-8">
        <div
          className="absolute left-2 sm:left-3 top-2 bottom-2 w-px bg-gradient-to-b from-[var(--color-accent)]/40 via-[var(--color-border)] to-transparent"
          aria-hidden
        />
        {items.map((item, i) => (
          <li key={i} className="relative">
            <div
              className="absolute -left-6 sm:-left-8 top-6 h-3 w-3 rounded-full bg-[var(--color-accent)] shadow-[var(--shadow-glow)] ring-4 ring-[var(--color-background)]"
              aria-hidden
            />
            <Card className="p-6 hover:border-[var(--color-border-strong)] transition-colors">
              <div className="flex items-center gap-2 flex-wrap mb-2 text-xs">
                <span className="text-[var(--color-foreground-subtle)]">
                  {item.date}
                </span>
                <span className="text-[var(--color-foreground-subtle)]">·</span>
                <span
                  className={`inline-flex items-center rounded-full border px-2 py-0.5 ${TAG_STYLES[item.tag] ?? "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"}`}
                >
                  {item.tag}
                </span>
              </div>
              <h2 className="text-lg font-semibold tracking-tight mb-1.5">
                {item.title}
              </h2>
              <p className="text-sm text-[var(--color-foreground-muted)] leading-relaxed">
                {item.body}
              </p>
            </Card>
          </li>
        ))}
      </Stagger>
    </div>
  );
}
