"use client";

import { usePathname } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FileText,
  Activity,
  Settings,
  ShieldAlert,
} from "lucide-react";

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

export function AccountTabs({ isAdmin = false }: { isAdmin?: boolean }) {
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations("account.tabs");
  const tAdmin = useTranslations("admin");

  const stripLocale = (p: string) => {
    const prefix = `/${locale}`;
    if (p === prefix) return "/";
    if (p.startsWith(prefix + "/")) return p.slice(prefix.length);
    return p;
  };
  const current = stripLocale(pathname);

  const renderItem = (
    href: string,
    label: string,
    Icon: React.ComponentType<{ className?: string }>,
    exact: boolean,
    accent: boolean,
  ) => {
    const active = exact
      ? current === href
      : current === href || current.startsWith(href + "/");
    return (
      <Link
        key={href}
        href={href}
        className={cn(
          "flex items-center gap-2 px-3 sm:px-4 py-2 rounded-[var(--radius)] text-sm font-medium transition-all",
          active
            ? "bg-[var(--color-accent)] text-[var(--color-accent-foreground)] shadow-[var(--shadow-glow)]"
            : accent
              ? "text-[var(--color-accent)] hover:bg-[var(--color-accent-soft)]"
              : "text-[var(--color-foreground-muted)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-surface-elevated)]",
        )}
      >
        <Icon className="h-4 w-4" />
        <span>{label}</span>
      </Link>
    );
  };

  return (
    <nav className="flex flex-wrap gap-1 p-1 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)]">
      {items.map((item) =>
        renderItem(item.href, t(item.labelKey), item.Icon, item.exact, false),
      )}
      {isAdmin &&
        renderItem(
          "/account/admin",
          tAdmin("tabLabel"),
          ShieldAlert,
          false,
          true,
        )}
    </nav>
  );
}
