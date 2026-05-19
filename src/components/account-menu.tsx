"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useTranslations, useLocale } from "next-intl";
import {
  Settings,
  ShieldAlert,
  Sun,
  Moon,
  Globe,
  LogOut,
  Check,
} from "lucide-react";
import gsap from "gsap";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { signOut } from "@/app/actions/auth";

type Theme = "light" | "dark";

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  const stored = window.localStorage.getItem("theme");
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: light)").matches
    ? "light"
    : "dark";
}

export function AccountMenu({
  username,
  email,
  avatarUrl,
  isAdmin,
}: {
  username: string;
  email: string;
  avatarUrl: string | null;
  isAdmin: boolean;
}) {
  const t = useTranslations("nav");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);
  const [pending, startTransition] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

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

  // Outside click + Escape close
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  // Animate panel
  useEffect(() => {
    if (!panelRef.current) return;
    if (open) {
      gsap.fromTo(
        panelRef.current,
        { opacity: 0, y: -8, scale: 0.96 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.22,
          ease: "power3.out",
        },
      );
    }
  }, [open]);

  const switchLocale = (next: (typeof routing.locales)[number]) => {
    startTransition(() => {
      router.replace(pathname, { locale: next });
    });
  };

  const initial = (username || "?").slice(0, 1).toUpperCase();

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t("menu")}
        className={cn(
          "h-9 w-9 rounded-full overflow-hidden border-2 transition-all flex items-center justify-center bg-gradient-to-br from-[var(--color-accent)] to-orange-500 text-white text-sm font-semibold shadow-[var(--shadow-glow)]",
          open
            ? "border-[var(--color-accent)] scale-105"
            : "border-transparent hover:scale-105",
        )}
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          initial
        )}
      </button>

      {open && (
        <div
          ref={panelRef}
          role="menu"
          className="absolute right-0 top-full mt-2 w-72 z-50 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl overflow-hidden"
        >
          {/* User header */}
          <div className="relative p-4 border-b border-[var(--color-border)]">
            <div
              className="pointer-events-none absolute -top-16 -right-16 h-32 w-32 rounded-full bg-[var(--color-accent-soft)] blur-3xl"
              aria-hidden
            />
            <div className="relative flex items-center gap-3">
              <div className="h-10 w-10 rounded-full overflow-hidden bg-gradient-to-br from-[var(--color-accent)] to-orange-500 flex items-center justify-center text-white text-sm font-semibold shrink-0">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  initial
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold truncate">
                  @{username}
                </div>
                <div className="text-xs text-[var(--color-foreground-subtle)] truncate">
                  {email}
                </div>
              </div>
            </div>
          </div>

          {/* Account actions */}
          <div className="p-1.5">
            <MenuLink
              href="/account"
              icon={<Settings className="h-4 w-4" />}
              label={t("menuSettings")}
              onClick={() => setOpen(false)}
            />
            {isAdmin && (
              <MenuLink
                href="/account/admin"
                icon={<ShieldAlert className="h-4 w-4" />}
                label={t("menuAdmin")}
                accent
                onClick={() => setOpen(false)}
              />
            )}
          </div>

          <div className="border-t border-[var(--color-border)]" />

          {/* Theme */}
          <div className="p-3">
            <div className="text-[10px] uppercase tracking-wider text-[var(--color-foreground-subtle)] mb-2 font-medium px-1">
              {t("menuTheme")}
            </div>
            <div className="flex gap-1 p-1 rounded-[var(--radius)] bg-[var(--color-surface-elevated)]">
              <ThemeButton
                active={mounted && theme === "dark"}
                onClick={() => setTheme("dark")}
                icon={<Moon className="h-3.5 w-3.5" />}
                label={t("menuThemeDark")}
              />
              <ThemeButton
                active={mounted && theme === "light"}
                onClick={() => setTheme("light")}
                icon={<Sun className="h-3.5 w-3.5" />}
                label={t("menuThemeLight")}
              />
            </div>
          </div>

          <div className="border-t border-[var(--color-border)]" />

          {/* Language */}
          <div className="p-3">
            <div className="text-[10px] uppercase tracking-wider text-[var(--color-foreground-subtle)] mb-2 font-medium flex items-center gap-1.5 px-1">
              <Globe className="h-3 w-3" />
              {t("menuLanguage")}
            </div>
            <div className="flex gap-1 p-1 rounded-[var(--radius)] bg-[var(--color-surface-elevated)]">
              {routing.locales.map((l) => (
                <button
                  key={l}
                  type="button"
                  disabled={pending}
                  onClick={() => switchLocale(l)}
                  className={cn(
                    "flex-1 px-3 py-1.5 rounded-[6px] text-xs uppercase font-medium tracking-wide transition-colors flex items-center justify-center gap-1",
                    l === locale
                      ? "bg-[var(--color-foreground)] text-[var(--color-background)]"
                      : "text-[var(--color-foreground-muted)] hover:text-[var(--color-foreground)]",
                  )}
                >
                  {l === locale && <Check className="h-3 w-3" />}
                  {l}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-[var(--color-border)]" />

          {/* Logout */}
          <form action={signOut} className="p-1.5">
            <button
              type="submit"
              className="w-full flex items-center gap-3 px-3 py-2 rounded-[var(--radius)] text-sm text-[var(--color-foreground-muted)] hover:text-[var(--color-accent)] hover:bg-[var(--color-accent-soft)]/30 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              {t("menuLogout")}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function MenuLink({
  href,
  icon,
  label,
  accent,
  onClick,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  accent?: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-[var(--radius)] text-sm transition-colors",
        accent
          ? "text-[var(--color-accent)] hover:bg-[var(--color-accent-soft)]/40"
          : "text-[var(--color-foreground-muted)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-surface-elevated)]",
      )}
      role="menuitem"
    >
      {icon}
      {label}
    </Link>
  );
}

function ThemeButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-[6px] text-xs font-medium transition-colors",
        active
          ? "bg-[var(--color-foreground)] text-[var(--color-background)]"
          : "text-[var(--color-foreground-muted)] hover:text-[var(--color-foreground)]",
      )}
    >
      {icon}
      {label}
    </button>
  );
}
