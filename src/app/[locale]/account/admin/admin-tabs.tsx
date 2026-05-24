"use client";

import { useTranslations } from "next-intl";
import { FileText, Users } from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

// Sub-tab bar shown above both the Stories moderation view (/account/admin)
// and the Users moderation view (/account/admin/users). Stays in client land
// so we can read pathname for the active state.
export function AdminTabs() {
  const t = useTranslations("admin");
  const pathname = usePathname();

  const tabs = [
    { href: "/account/admin", label: t("tabStories"), Icon: FileText },
    { href: "/account/admin/users", label: t("tabUsers"), Icon: Users },
  ];

  return (
    <div className="flex items-center gap-1 p-1 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] w-fit mb-6">
      {tabs.map(({ href, label, Icon }) => {
        // Exact-match for /account/admin (stories), starts-with for users
        // so /admin/users/* would also light it up if we ever add detail
        // pages.
        const isActive =
          href === "/account/admin"
            ? pathname === "/account/admin"
            : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "inline-flex items-center gap-2 px-3.5 py-2 rounded-[var(--radius)] text-sm font-medium transition-all duration-200",
              isActive
                ? "bg-[var(--color-accent)] text-[var(--color-accent-foreground)] shadow-[var(--shadow-glow)]"
                : "text-[var(--color-foreground-muted)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-surface-elevated)]",
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        );
      })}
    </div>
  );
}
