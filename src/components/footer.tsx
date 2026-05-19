import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export async function Footer() {
  const t = await getTranslations("footer");
  const year = new Date().getFullYear();

  const cols = [
    {
      heading: t("product"),
      links: [
        { href: "/", label: t("feed") },
        { href: "/submit", label: t("submit") },
      ],
    },
    {
      heading: t("company"),
      links: [
        { href: "/about", label: t("about") },
        { href: "/news", label: t("news") },
      ],
    },
    {
      heading: t("legal"),
      links: [
        { href: "/privacy", label: t("privacy") },
        { href: "/rules", label: t("rules") },
      ],
    },
  ] as const;

  return (
    <footer className="border-t border-[var(--color-border)] mt-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-10">
          <div className="col-span-2 sm:col-span-1">
            <div className="text-lg font-semibold gradient-text tracking-tight mb-2">
              nurlan
            </div>
            <p className="text-xs text-[var(--color-foreground-subtle)] leading-relaxed max-w-xs">
              {t("tagline")}
            </p>
          </div>

          {cols.map((col) => (
            <div key={col.heading}>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-foreground-muted)] mb-3">
                {col.heading}
              </h4>
              <ul className="space-y-2">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-[var(--color-foreground-muted)] hover:text-[var(--color-foreground)] transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-6 border-t border-[var(--color-border)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-[var(--color-foreground-subtle)]">
          <p>
            © {year} Nurlan. {t("rights")}
          </p>
        </div>
      </div>
    </footer>
  );
}
