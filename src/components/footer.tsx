import { getTranslations } from "next-intl/server";
import { Send } from "lucide-react";
import { TwitchIcon, InstagramIcon } from "@/components/brand-icons";
import { Link } from "@/i18n/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { GuestControls } from "@/components/guest-controls";
import { FooterNewsletter } from "@/components/footer-newsletter";

async function getViewerUsername(): Promise<string | null> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return null;
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;
    const { data } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", user.id)
      .maybeSingle();
    return data?.username ?? null;
  } catch {
    return null;
  }
}

// Social links live outside the locale-prefixed Link helper because they're
// external. Telegram brand colour is its blue (#229ED9); we keep all three
// icons monochrome and use a hover tint so they read as a coherent set.
const SOCIAL_LINKS = [
  {
    href: "https://www.twitch.tv/nurlan921",
    label: "Twitch",
    Icon: TwitchIcon,
    hoverColor: "hover:text-[#9146FF]",
  },
  {
    href: "https://www.instagram.com/khalilaliev/",
    label: "Instagram",
    Icon: InstagramIcon,
    hoverColor: "hover:text-[#E1306C]",
  },
  {
    href: "https://t.me/nurlan912",
    label: "Telegram",
    Icon: Send,
    hoverColor: "hover:text-[#229ED9]",
  },
] as const;

export async function Footer() {
  const t = await getTranslations("footer");
  const username = await getViewerUsername();
  const isAuthed = Boolean(username);
  const year = new Date().getFullYear();

  const productLinks = [
    { href: "/", label: t("feed") },
    { href: "/submit", label: t("submit") },
  ];

  const companyLinks = [
    { href: "/about", label: t("about") },
    { href: "/news", label: t("news") },
    { href: "/contact", label: t("contact") },
  ];

  const accountLinks = isAuthed
    ? [
      { href: `/user/${username}`, label: t("myProfile") },
      { href: "/account", label: t("settings") },
    ]
    : [
      { href: "/login", label: t("login") },
      { href: "/signup", label: t("signup") },
    ];

  const legalLinks = [
    { href: "/privacy", label: t("privacy") },
    { href: "/rules", label: t("rules") },
  ];

  return (
    <footer className="relative mt-24 overflow-hidden border-t border-[var(--color-border)]">
      {/* Top edge gradient strip */}
      <div
        className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--color-accent)]/60 to-transparent"
        aria-hidden
      />

      {/* Soft gradient that fades the page into the footer */}
      <div
        className="absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-transparent to-[var(--color-surface-elevated)]/60"
        aria-hidden
      />

      {/* Decorative watermark monogram. */}
      <div
        className="pointer-events-none absolute -bottom-20 -right-10 select-none text-[18rem] font-bold leading-none opacity-[0.04] gradient-text"
        aria-hidden
      >
        n
      </div>

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 py-12 sm:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
          <div className="lg:col-span-2 space-y-4 max-w-sm">
            <div className="text-xl font-semibold gradient-text tracking-tight">
              nurlan
            </div>
            <p className="text-sm text-[var(--color-foreground-muted)] leading-relaxed">
              {t("tagline")}
            </p>

            {/* Social row */}
            <div className="flex items-center gap-2 pt-1">
              {SOCIAL_LINKS.map(({ href, label, Icon, hoverColor }) => (
                <a
                  key={href}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className={`group inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-foreground-muted)] transition-all duration-200 hover:border-[var(--color-border-strong)] hover:scale-110 hover:-translate-y-0.5 ${hoverColor}`}
                >
                  <Icon className="h-4 w-4 transition-transform" />
                </a>
              ))}
            </div>
          </div>

          <FooterColumn heading={t("product")} links={productLinks} />
          <FooterColumn heading={t("account")} links={accountLinks} />
          <div className="space-y-3">
            <FooterColumn heading={t("company")} links={companyLinks} />
            <FooterColumn heading={t("legal")} links={legalLinks} />
          </div>

          <div className="lg:col-span-5 lg:max-w-md">
            <h4 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-foreground-subtle)] mb-2">
              {t("newsletterTitle")}
            </h4>
            <p className="text-xs text-[var(--color-foreground-muted)] mb-3">
              {t("newsletterBody")}
            </p>
            <FooterNewsletter />
          </div>
        </div>

        <div className="pt-6 border-t border-[var(--color-border)] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[var(--color-foreground-subtle)]">
          <p className="text-center sm:text-left">
            © {year} Nurlan. {t("rights")}
          </p>

          <GuestControls />

          <p className="text-center sm:text-right font-medium tracking-tight">
            <span className="gradient-text">{t("signature")}</span>
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  heading,
  links,
}: {
  heading: string;
  links: { href: string; label: string }[];
}) {
  return (
    <div>
      <h4 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-foreground-subtle)] mb-3">
        {heading}
      </h4>
      <ul className="space-y-2">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="link-underline text-sm text-[var(--color-foreground-muted)] hover:text-[var(--color-foreground)] transition-colors"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
