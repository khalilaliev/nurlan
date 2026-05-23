"use client";

import {
  forwardRef,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
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
} from "lucide-react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { signOut } from "@/app/actions/auth";
import { cn } from "@/lib/utils";
import { useTheme } from "@/lib/use-theme";


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
  const [open, setOpen] = useState(false);
  const burgerRef = useRef<HTMLButtonElement>(null);

  // The desktop nav fits at sm (640px) when the user is logged in (a single
  // avatar + Submit button). When logged out, the same row has Submit +
  // theme/locale controls + Log in + Sign up — it needs the lg breakpoint
  // (1024px) to fit comfortably. So the burger button has to follow:
  // visible up to whichever breakpoint the desktop nav starts using.
  // Both class strings must appear as literals so Tailwind generates them.
  const wrapperHidden = profile ? "sm:hidden" : "lg:hidden";

  return (
    <>
      <div className={cn("flex items-center", wrapperHidden)}>
        <BurgerButton
          ref={burgerRef}
          open={open}
          onClick={() => setOpen((v) => !v)}
        />
      </div>

      <AnimatePresence>
        {open && (
          <MenuPanel
            profile={profile}
            isAdmin={isAdmin}
            burgerRef={burgerRef}
            onClose={() => setOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

type BurgerProps = { open: boolean; onClick: () => void };

const BurgerButton = forwardRef<HTMLButtonElement, BurgerProps>(
  function BurgerButton({ open, onClick }, ref) {
    const t = useTranslations("nav");
    return (
      <button
        ref={ref}
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
  },
);

function MenuPanel({
  profile,
  isAdmin,
  burgerRef,
  onClose,
}: {
  profile: {
    username: string;
    email: string;
    avatarUrl: string | null;
  } | null;
  isAdmin: boolean;
  burgerRef: React.RefObject<HTMLButtonElement | null>;
  onClose: () => void;
}) {
  const t = useTranslations("nav");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  // Shared theme state via <html data-theme> observer — flipping here
  // also updates the footer icon and the account-menu pills automatically.
  const [theme, setTheme] = useTheme();
  const mounted = theme !== null;
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on outside click or Escape. We deliberately don't lock body
  // scroll — the menu is small and floats; the user should still be able
  // to interact with the page (any tap outside also closes the menu).
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (panelRef.current?.contains(target)) return;
      if (burgerRef.current?.contains(target)) return;
      onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose, burgerRef]);

  if (!mounted) return null;

  const initial = (profile?.username ?? "?").slice(0, 1).toUpperCase();
  const navigate = (href: string) => {
    onClose();
    router.push(href);
  };

  return createPortal(
    <motion.div
      ref={panelRef}
      role="dialog"
      aria-modal="false"
      aria-label={t("menu")}
      // Anchored top-right, drops below the header (which is ~64px tall).
      // 50vw on small screens, capped so it never gets unwieldy. Auto height
      // with an internal scroll fallback if the user adds a lot of content
      // later.
      className={cn(
        "fixed right-0 top-[64px] z-[160]",
        // Match the burger's visibility breakpoint: hidden when the desktop
        // nav has taken over, so resizing up doesn't leave a stranded panel.
        profile ? "sm:hidden" : "lg:hidden",
        "w-[75vw] min-w-[300px] max-w-[560px]",
        "max-h-[calc(100vh-80px)] overflow-y-auto",
        "rounded-bl-2xl",
        "border-l border-b border-[var(--color-border)]",
        "shadow-[-12px_12px_36px_-16px_rgba(0,0,0,0.35)]",
        // Frosted-glass treatment matches the scrolled header.
        "bg-[color-mix(in_oklab,var(--color-surface)_82%,transparent)] backdrop-blur-xl backdrop-saturate-150",
      )}
      initial={{ opacity: 0, x: 24, y: -8 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      exit={{ opacity: 0, x: 24, y: -8 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="p-4 sm:p-5 space-y-3">
        {profile && (
          <button
            type="button"
            onClick={() => navigate(`/user/${profile.username}`)}
            className="cursor-pointer w-full flex items-center gap-3 p-2.5 rounded-[var(--radius-lg)] bg-[var(--color-surface-elevated)] border border-[var(--color-border)] hover:border-[var(--color-border-strong)] transition-colors text-left"
          >
            <div className="h-10 w-10 rounded-full overflow-hidden bg-gradient-to-br from-[var(--color-accent)] to-orange-500 flex items-center justify-center text-sm font-semibold text-white shrink-0 ring-2 ring-white/10">
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
              <div className="text-[11px] text-[var(--color-foreground-subtle)] truncate">
                {profile.email}
              </div>
            </div>
          </button>
        )}

        <MenuLink
          primary
          icon={<Sparkles className="h-4 w-4" />}
          label={t("submit")}
          onClick={() => navigate("/submit")}
        />

        {profile && (
          <>
            <Divider />

            {/* 1. My Profile  2. Settings  (3. Admin if applicable) */}
            <div className="space-y-0.5">
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
            </div>
          </>
        )}

        <Divider />

        {/* 3. Theme */}
        <SectionLabel icon={<Sun className="h-3 w-3" />}>
          {t("menuTheme")}
        </SectionLabel>
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

        {/* 4. Language */}
        <SectionLabel icon={<Globe className="h-3 w-3" />}>
          {t("menuLanguage")}
        </SectionLabel>
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

        <Divider />

        {/* 5. Log Out (or guest auth links) */}
        <div className="space-y-0.5">
          {profile ? (
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
      </div>
    </motion.div>,
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
  return <div className="h-px bg-[var(--color-border)] my-1" />;
}

function SectionLabel({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="text-[10px] uppercase tracking-[0.12em] text-[var(--color-foreground-subtle)] font-semibold flex items-center gap-1.5 mb-1.5 mt-2">
      {icon}
      {children}
    </div>
  );
}
