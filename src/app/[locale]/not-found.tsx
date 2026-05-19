import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  const t = useTranslations("notFound");

  return (
    <div className="relative mx-auto flex min-h-[80vh] max-w-3xl flex-col items-center justify-center px-4 sm:px-6 py-16 text-center overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center"
        aria-hidden
      >
        <span className="text-[clamp(18rem,55vw,42rem)] font-bold leading-none gradient-text opacity-25 select-none tracking-tighter">
          {t("kicker")}
        </span>
      </div>

      <p className="mb-3 text-xs font-medium uppercase tracking-[0.3em] text-[var(--color-foreground-muted)]">
        {t("kicker")}
      </p>

      <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight gradient-text mb-4 relative">
        {t("title")}
      </h1>

      <p className="max-w-md text-sm sm:text-base text-[var(--color-foreground-muted)] leading-relaxed">
        {t("subtitle")}
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button asChild variant="accent" size="lg">
          <Link href="/">{t("backHome")}</Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/submit">✨ {t("writeOne")}</Link>
        </Button>
      </div>
    </div>
  );
}
