"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslations, useLocale } from "next-intl";
import {
  Sparkles,
  Sun,
  Moon,
  Globe,
  User,
  Settings,
  LogOut,
  LogIn,
  ShieldAlert,
  X,
} from "lucide-react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { signOut } from "@/app/actions/auth";
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

export function MobileMenu({
  profile,
  isAdmin,
}: {
  profile: {
    username: string;
    email: string;
    avatarUrl: string | null;
  } | null;
  isAdmin: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <div className="flex items-center sm:hidden">
        <BurgerButton open={menuOpen} onClick={() => setMenuOpen(!menuOpen)} />
      </div>

      <AnimatePresence>
        {menuOpen && (
          <MenuPanel
            profile={profile}
            isAdmin={isAdmin}
            onClose={() => setMenuOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

function CloseButton({ onClose }: { onClose: () => void }) {
  const t = useTranslations("nav");
  return (
    <button
      type="button"
      onClick={onClose}
      aria-label={t("menuClose")}
      className={cn(
        "cursor-pointer absolute top-4 right-4 z-10",
        "h-11 w-11 rounded-full",
        "flex items-center justify-center",
        "border border-[var(--color-border)] bg-[var(--color-surface-elevated)]/60 backdrop-blur",
        "text-[var(--color-foreground-muted)]",
        "transition-all duration-200 ease-out",
        "hover:rotate-90 hover:text-[var(--color-foreground)] hover:border-[var(--color-accent)]/50 hover:bg-[var(--color-accent-soft)]/40",
        "hover:shadow-[0_4px_24px_-6px_rgba(225,29,72,0.35)]",
        "active:scale-95",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]",
      )}
    >
      <X className="h-5 w-5" />
    </button>
  );
}

function BurgerButton({
  open,
  onClick,
}: {
  open: boolean;
  onClick: () => void;
}) {
  const t = useTranslations("nav");
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={open ? t("menuClose") : t("menuOpen")}
      aria-expanded={open}
      className="cursor-pointer h-10 w-10 rounded-full flex items-center justify-center text-[var(--color-foreground)] hover:bg-[var(--color-surface-elevated)] transition-colors"
    >
      <div className="relative h-4 w-5">
        <span
          className={cn(
            "absolute left-0 right-0 h-[2px] bg-current rounded-full transition-all duration-200 ease-out",
            open ? "top-1/2 -translate-y-1/2 rotate-45" : "top-0",
          )}
        />
        <span
          className={cn(
            "absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[2px] bg-current rounded-full transition-opacity duration-200",
            open ? "opacity-0" : "opacity-100",
          )}
        />
        <span
          className={cn(
            "absolute left-0 right-0 h-[2px] bg-current rounded-full transition-all duration-200 ease-out",
            open ? "top-1/2 -translate-y-1/2 -rotate-45" : "bottom-0",
          )}
        />
      </div>
    </button>
  );
}

function MenuPanel({
  profile,
  isAdmin,
  onClose,
}: {
  profile: {
    username: string;
    email: string;
    avatarUrl: string | null;
  } | null;
  isAdmin: boolean;
  onClose: () => void;
}) {
  const t = useTranslations("nav");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const [theme, setTheme] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setMounted(true);
    setTheme(getInitialTheme());
    previouslyFocused.current = document.activeElement as HTMLElement | null;
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem("theme", theme);
  }, [theme, mounted]);

  // Body scroll lock + Escape + focus trap.
  useEffect(() => {
    document.body.style.overflow = "hidden";

    const focusables = () =>
      panelRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])',
      ) ?? [];

    // Focus the first focusable element when the menu mounts.
    setTimeout(() => {
      const list = focusables();
      list[0]?.focus();
    }, 50);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const list = Array.from(focusables());
      if (list.length === 0) return;
      const first = list[0];
      const last = list[list.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
      previouslyFocused.current?.focus?.();
    };
  }, [onClose]);

  if (!mounted) return null;

  const initial = (profile?.username ?? "?").slice(0, 1).toUpperCase();
  const navigate = (href: string) => {
    onClose();
    router.push(href);
  };

  return createPortal(
    <div className="fixed inset-0 z-[200] sm:hidden">
      <motion.div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        aria-hidden
      />
      <motion.div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={t("menu")}
        className="absolute top-0 right-0 bottom-0 w-[88vw] max-w-sm bg-[var(--color-surface)] border-l border-[var(--color-border)] shadow-2xl flex flex-col overflow-y-auto"
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 320, damping: 32 }}
      >
        <CloseButton onClose={onClose} />
        <div className="p-5 pt-16">
          {profile ? (
            <button
              type="button"
              onClick={() => navigate(`/user/${profile.username}`)}
              className="cursor-pointer w-full flex items-center gap-3 p-3 rounded-[var(--radius-lg)] bg-[var(--color-surface-elevated)] border border-[var(--color-border)] hover:border-[var(--color-border-strong)] transition-colors text-left"
            >
              <div className="h-11 w-11 rounded-full overflow-hidden bg-gradient-to-br from-[var(--color-accent)] to-orange-500 flex items-center justify-center text-base font-semibold text-white shrink-0 ring-2 ring-white/10">
                {profile.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.avatarUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  initial
                )}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold truncate">
                  @{profile.username}
                </div>
                <div className="text-xs text-[var(--color-foreground-subtle)] truncate">
                  {profile.email}
                </div>
              </div>
            </button>
          ) : (
            <div className="text-xl font-semibold gradient-text tracking-tight">
              nurlan
            </div>
          )}
        </div>

        <div className="px-3">
          <MenuLink
            primary
            icon={<Sparkles className="h-4 w-4" />}
            label={t("submit")}
            onClick={() => navigate("/submit")}
          />
        </div>

        <Divider />

        <SectionLabel icon={<Sun className="h-3 w-3" />}>
          {t("menuTheme")}
        </SectionLabel>
        <div className="px-3">
          <div className="flex gap-1 p-1 rounded-[var(--radius)] bg-[var(--color-surface-elevated)] border border-[var(--color-border)]">
            <Pill
              active={theme === "dark"}
              onClick={() => setTheme("dark")}
              icon={<Moon className="h-3.5 w-3.5" />}
              label={t("menuThemeDark")}
            />
            <Pill
              active={theme === "light"}
              onClick={() => setTheme("light")}
              icon={<Sun className="h-3.5 w-3.5" />}
              label={t("menuThemeLight")}
            />
          </div>
        </div>

        <SectionLabel icon={<Globe className="h-3 w-3" />}>
          {t("menuLanguage")}
        </SectionLabel>
        <div className="px-3">
          <div className="flex gap-1 p-1 rounded-[var(--radius)] bg-[var(--color-surface-elevated)] border border-[var(--color-border)]">
            {routing.locales.map((l) => (
              <button
                key={l}
                type="button"
                disabled={pending}
                onClick={() =>
                  startTransition(() => router.replace(pathname, { locale: l }))
                }
                className={cn(
                  "cursor-pointer flex-1 px-3 py-1.5 rounded-[8px] text-xs uppercase font-semibold tracking-wide transition-colors",
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

        <Divider />

        <div className="px-3 pb-4 space-y-0.5">
          {profile ? (
            <>
              <MenuLink
                icon={<User className="h-4 w-4" />}
                label={t("menuMyProfile")}
                onClick={() => navigate(`/user/${profile.username}`)}
              />
              <MenuLink
                icon={<Settings className="h-4 w-4" />}
                label={t("menuSettings")}
                onClick={() => navigate("/account")}
              />
              {isAdmin && (
                <MenuLink
                  accent
                  icon={<ShieldAlert className="h-4 w-4" />}
                  label={t("menuAdmin")}
                  onClick={() => navigate("/account/admin")}
                />
              )}
              <form
                action={async () => {
                  onClose();
                  await signOut();
                }}
              >
                <button
                  type="submit"
                  className="cursor-pointer w-full flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius)] text-sm font-medium text-[var(--color-foreground-muted)] hover:text-[var(--color-accent)] hover:bg-[var(--color-accent-soft)]/40 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  {t("menuLogout")}
                </button>
              </form>
            </>
          ) : (
            <>
              <MenuLink
                icon={<LogIn className="h-4 w-4" />}
                label={t("login")}
                onClick={() => navigate("/login")}
              />
              <MenuLink
                primary
                icon={<User className="h-4 w-4" />}
                label={t("signup")}
                onClick={() => navigate("/signup")}
              />
            </>
          )}
        </div>
      </motion.div>
    </div>,
    document.body,
  );
}

function MenuLink({
  icon,
  label,
  onClick,
  primary,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  primary?: boolean;
  accent?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "cursor-pointer w-full flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius)] text-sm font-medium transition-colors",
        primary &&
          "bg-[var(--color-accent)] text-[var(--color-accent-foreground)] hover:brightness-110 shadow-[var(--shadow-glow)]",
        accent &&
          "text-[var(--color-accent)] hover:bg-[var(--color-accent-soft)]/50",
        !primary &&
          !accent &&
          "text-[var(--color-foreground-muted)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-surface-elevated)]",
      )}
    >
      <span className="shrink-0">{icon}</span>
      <span className="flex-1 text-left">{label}</span>
    </button>
  );
}

function Pill({
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
        "cursor-pointer flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-[8px] text-xs font-semibold transition-colors",
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

function Divider() {
  return <div className="h-px bg-[var(--color-border)] mx-5 my-3" />;
}

function SectionLabel({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="text-[10px] uppercase tracking-[0.12em] text-[var(--color-foreground-subtle)] font-semibold flex items-center gap-1.5 px-5 mb-2 mt-1">
      {icon}
      {children}
    </div>
  );
}

