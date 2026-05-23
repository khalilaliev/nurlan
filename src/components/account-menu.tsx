"use client";

import { useEffect, useLayoutEffect, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { useTranslations, useLocale } from "next-intl";
import {
  Settings,
  ShieldAlert,
  Sun,
  Moon,
  Globe,
  LogOut,
  Check,
  User,
} from "lucide-react";
import gsap from "gsap";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { useTheme } from "@/lib/use-theme";
import { signOut } from "@/app/actions/auth";

const PANEL_WIDTH = 320;
const GAP = 12;

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
  // Shared theme state — same hook is used by GuestControls (footer) and
  // MobileMenu, so a flip here updates the footer icon automatically via
  // the MutationObserver on <html data-theme>.
  const [theme, setTheme] = useTheme();
  const mounted = theme !== null;
  const [pending, startTransition] = useTransition();
  const [coords, setCoords] = useState<{ top: number; right: number }>({
    top: 0,
    right: 0,
  });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const recalc = () => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    setCoords({
      top: rect.bottom + GAP,
      right: window.innerWidth - rect.right,
    });
  };

  useLayoutEffect(() => {
    if (!open) return;
    recalc();
    const handle = () => recalc();
    window.addEventListener("resize", handle);
    window.addEventListener("scroll", handle, true);
    return () => {
      window.removeEventListener("resize", handle);
      window.removeEventListener("scroll", handle, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        buttonRef.current?.contains(target) ||
        panelRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
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
  }, [open]);

  useEffect(() => {
    if (!panelRef.current || !open) return;
    gsap.fromTo(
      panelRef.current,
      { opacity: 0, y: -10, scale: 0.95 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.22,
        ease: "power3.out",
        transformOrigin: "top right",
      },
    );
  }, [open]);

  const switchLocale = (next: (typeof routing.locales)[number]) => {
    startTransition(() => {
      router.replace(pathname, { locale: next });
      setOpen(false);
    });
  };

  const initial = (username || "?").slice(0, 1).toUpperCase();

  return (
    <>
      <button
        ref={buttonRef}
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

      {mounted && open &&
        createPortal(
          <div
            ref={panelRef}
            role="menu"
            style={{
              position: "fixed",
              top: coords.top,
              right: coords.right,
              width: PANEL_WIDTH,
              maxHeight: "calc(100vh - 5rem)",
              overflowY: "auto",
              zIndex: 9999,
            }}
            className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl"
          >
            <div className="relative overflow-hidden rounded-t-[var(--radius-xl)]">
              <div
                className="pointer-events-none absolute -top-20 -right-16 h-40 w-40 rounded-full bg-[var(--color-accent)]/25 blur-3xl"
                aria-hidden
              />
              <div
                className="pointer-events-none absolute -bottom-12 -left-12 h-28 w-28 rounded-full bg-orange-500/20 blur-3xl"
                aria-hidden
              />
              <div className="relative flex items-center gap-3 p-4 pb-5">
                <div className="h-11 w-11 rounded-full overflow-hidden bg-gradient-to-br from-[var(--color-accent)] to-orange-500 flex items-center justify-center text-white text-base font-semibold shrink-0 ring-2 ring-white/10">
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
                  <div className="text-sm font-semibold tracking-tight truncate">
                    @{username}
                  </div>
                  <div className="text-xs text-[var(--color-foreground-subtle)] truncate">
                    {email}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-2 pb-2 space-y-0.5">
              <MenuLink
                href={`/user/${username}`}
                icon={<User className="h-4 w-4" />}
                label={t("menuMyProfile")}
                onClick={() => setOpen(false)}
              />
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

            <Divider />

            <div className="px-3 py-3">
              <SectionLabel icon={<Sun className="h-3 w-3" />}>
                {t("menuTheme")}
              </SectionLabel>
              <div className="flex gap-1 p-1 rounded-[var(--radius)] bg-[var(--color-surface-elevated)] border border-[var(--color-border)]">
                <PillButton
                  active={mounted && theme === "dark"}
                  onClick={() => setTheme("dark")}
                  icon={<Moon className="h-3.5 w-3.5" />}
                  label={t("menuThemeDark")}
                />
                <PillButton
                  active={mounted && theme === "light"}
                  onClick={() => setTheme("light")}
                  icon={<Sun className="h-3.5 w-3.5" />}
                  label={t("menuThemeLight")}
                />
              </div>
            </div>

            <Divider />

            <div className="px-3 py-3">
              <SectionLabel icon={<Globe className="h-3 w-3" />}>
                {t("menuLanguage")}
              </SectionLabel>
              <div className="flex gap-1 p-1 rounded-[var(--radius)] bg-[var(--color-surface-elevated)] border border-[var(--color-border)]">
                {routing.locales.map((l) => (
                  <button
                    key={l}
                    type="button"
                    disabled={pending}
                    onClick={() => switchLocale(l)}
                    className={cn(
                      "flex-1 px-3 py-1.5 rounded-[8px] text-xs uppercase font-semibold tracking-wide transition-colors flex items-center justify-center gap-1.5",
                      l === locale
                        ? "bg-[var(--color-foreground)] text-[var(--color-background)] shadow-sm"
                        : "text-[var(--color-foreground-muted)] hover:text-[var(--color-foreground)]",
                    )}
                  >
                    {l === locale && <Check className="h-3 w-3" />}
                    {l}
                  </button>
                ))}
              </div>
            </div>

            <Divider />

            <form action={signOut} className="p-2">
              <button
                type="submit"
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius)] text-sm font-medium text-[var(--color-foreground-muted)] hover:text-[var(--color-accent)] hover:bg-[var(--color-accent-soft)]/40 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                {t("menuLogout")}
              </button>
            </form>
          </div>,
          document.body,
        )}
    </>
  );
}

function Divider() {
  return <div className="h-px bg-[var(--color-border)] mx-3" />;
}

function SectionLabel({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="text-[10px] uppercase tracking-[0.12em] text-[var(--color-foreground-subtle)] mb-2 font-semibold flex items-center gap-1.5 px-0.5">
      {icon}
      {children}
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
        "flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius)] text-sm font-medium transition-colors",
        accent
          ? "text-[var(--color-accent)] hover:bg-[var(--color-accent-soft)]/50"
          : "text-[var(--color-foreground-muted)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-surface-elevated)]",
      )}
      role="menuitem"
    >
      <span className="shrink-0">{icon}</span>
      <span>{label}</span>
    </Link>
  );
}

function PillButton({
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
        "flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-[8px] text-xs font-semibold transition-colors",
        active
          ? "bg-[var(--color-foreground)] text-[var(--color-background)] shadow-sm"
          : "text-[var(--color-foreground-muted)] hover:text-[var(--color-foreground)]",
      )}
    >
      {icon}
      {label}
    </button>
  );
}
