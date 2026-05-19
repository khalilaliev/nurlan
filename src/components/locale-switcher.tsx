"use client";

import { useTransition } from "react";
import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { cn } from "@/lib/utils";

export function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-0.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] p-0.5 text-xs">
      {routing.locales.map((l) => (
        <button
          key={l}
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(() => {
              router.replace(pathname, { locale: l });
            })
          }
          className={cn(
            "px-2 py-1 rounded-full uppercase font-medium tracking-wide transition-colors",
            l === locale
              ? "bg-[var(--color-foreground)] text-[var(--color-background)]"
              : "text-[var(--color-foreground-muted)] hover:text-[var(--color-foreground)]",
          )}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
