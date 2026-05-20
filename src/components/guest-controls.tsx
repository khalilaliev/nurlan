"use client";

import { useEffect, useState, useTransition } from "react";
import { useLocale } from "next-intl";
import { Moon, Sun } from "lucide-react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { cn } from "@/lib/utils";

type Theme = "light" | "dark";

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  const stored = window.localStorage.getItem("theme");
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: light)").matches
    ? "light"
    : "dark";
}

export function GuestControls() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const [theme, setTheme] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setTheme(getInitialTheme());
    setMounted(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem("theme", theme);
  }, [theme, mounted]);

  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
        aria-label="Toggle theme"
        className="cursor-pointer h-9 w-9 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] flex items-center justify-center text-[var(--color-foreground-muted)] hover:text-[var(--color-foreground)] hover:border-[var(--color-border-strong)] transition-colors"
      >
        {mounted && theme === "light" ? (
          <Moon className="h-4 w-4" />
        ) : (
          <Sun className="h-4 w-4" />
        )}
      </button>
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
              "cursor-pointer px-2.5 py-1 rounded-full uppercase font-semibold tracking-wide transition-colors",
              l === locale
                ? "bg-[var(--color-foreground)] text-[var(--color-background)]"
                : "text-[var(--color-foreground-muted)] hover:text-[var(--color-foreground)]",
            )}
          >
            {l}
          </button>
        ))}
      </div>
    </div>
  );
}
