"use client";

import { usePathname } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, FileText, Activity, Settings } from "lucide-react";

const items = [
  {
    href: "/account",
    labelKey: "overview",
    Icon: LayoutDashboard,
    exact: true,
  },
  {
    href: "/account/stories",
    labelKey: "stories",
    Icon: FileText,
    exact: false,
  },
  {
    href: "/account/activity",
    labelKey: "activity",
    Icon: Activity,
    exact: false,
  },
  {
    href: "/account/settings",
    labelKey: "settings",
    Icon: Settings,
    exact: false,
  },
] as const;

export function AccountTabs() {
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations("account.tabs");

  const stripLocale = (p: string) => {
    const prefix = `/${locale}`;
    if (p === prefix) return "/";
    if (p.startsWith(prefix + "/")) return p.slice(prefix.length);
    return p;
  };
  const current = stripLocale(pathname);

  return (
    <nav className="flex flex-wrap gap-1 p-1 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)]">
      {items.map((item) => {
        const active = item.exact
          ? current === item.href
          : current === item.href || current.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-2 px-3 sm:px-4 py-2 rounded-[var(--radius)] text-sm font-medium transition-all",
              active
                ? "bg-[var(--color-accent)] text-[var(--color-accent-foreground)] shadow-[var(--shadow-glow)]"
                : "text-[var(--color-foreground-muted)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-surface-elevated)]",
            )}
          >
            <item.Icon className="h-4 w-4" />
            <span>{t(item.labelKey)}</span>
          </Link>
        );
      })}
    </nav>
  );
}
