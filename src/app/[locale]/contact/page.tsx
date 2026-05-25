import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Send, Mail, ArrowUpRight } from "lucide-react";
import { TwitchIcon, InstagramIcon } from "@/components/brand-icons";
import { Card } from "@/components/ui/card";
import { FadeIn } from "@/components/animated";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  DEFAULT_LOCALE,
  isLocale,
  staticPageMetadata,
  type Locale,
} from "@/lib/seo";
import { ContactForm } from "./contact-form";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale: Locale = isLocale(raw) ? raw : DEFAULT_LOCALE;
  const t = await getTranslations({ locale, namespace: "seo" });
  return staticPageMetadata({
    locale,
    title: t("contactTitle"),
    description: t("contactDescription"),
    path: "/contact",
  });
}

async function getViewerDefaults(): Promise<{
  name: string;
  email: string;
}> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL)
    return { name: "", email: "" };
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { name: "", email: "" };
    const { data } = await supabase
      .from("profiles")
      .select("username, display_name")
      .eq("id", user.id)
      .maybeSingle();
    return {
      name: data?.display_name ?? data?.username ?? "",
      email: user.email ?? "",
    };
  } catch {
    return { name: "", email: "" };
  }
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("contact");
  const defaults = await getViewerDefaults();

  return (
    <div className="relative mx-auto max-w-5xl px-4 sm:px-6 py-16 sm:py-20 overflow-hidden">
      {/* Soft accent orb behind the title — a tiny visual hook.
          The wrapper above has `overflow-hidden` so this orb (576px wide)
          doesn't push the page beyond the viewport on phones — that was
          the source of the horizontal swipe on mobile. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 h-72 w-[36rem] rounded-full bg-[var(--color-accent)]/10 blur-3xl"
      />

      <FadeIn>
        <div className="relative mb-12 text-center">
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-[var(--color-foreground-muted)] mb-3">
            {t("kicker")}
          </p>
          <h1 className="text-4xl sm:text-6xl font-semibold tracking-tight gradient-text leading-[1.05] mb-4">
            {t("title")}
          </h1>
          <p className="mx-auto max-w-xl text-base sm:text-lg text-[var(--color-foreground-muted)] leading-relaxed">
            {t("lede")}
          </p>
        </div>
      </FadeIn>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px] items-start">
        <FadeIn delay={0.05}>
          <Card className="p-6 sm:p-8 shadow-2xl shadow-[var(--color-accent)]/5">
            <ContactForm
              defaultName={defaults.name}
              defaultEmail={defaults.email}
            />
          </Card>
        </FadeIn>

        <FadeIn delay={0.12}>
          <div className="space-y-3">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--color-foreground-subtle)] mb-3 px-1">
              {t("or")}
            </p>

            <ChannelCard
              href="https://www.twitch.tv/nurlan921"
              label="Twitch"
              hint={t("channels.twitch")}
              Icon={TwitchIcon}
              accent="#9146FF"
            />
            <ChannelCard
              href="https://www.instagram.com/khalilaliev/"
              label="Instagram"
              hint={t("channels.instagram")}
              Icon={InstagramIcon}
              accent="#E1306C"
            />
            <ChannelCard
              href="https://t.me/nurlan912"
              label="Telegram"
              hint={t("channels.telegram")}
              Icon={Send}
              accent="#229ED9"
            />
            <ChannelCard
              href="mailto:khalilaliev0@gmail.com"
              label="khalilaliev0@gmail.com"
              hint={t("channels.email")}
              Icon={Mail}
              accent="var(--color-accent)"
              external={false}
            />
          </div>
        </FadeIn>
      </div>
    </div>
  );
}

function ChannelCard({
  href,
  label,
  hint,
  Icon,
  accent,
  external = true,
}: {
  href: string;
  label: string;
  hint: string;
  Icon: React.ComponentType<{ className?: string }>;
  accent: string;
  external?: boolean;
}) {
  // Each card uses `group-hover` and `group-active` so the press-down state
  // on a touch device shows the same accent glow + arrow shift as a real
  // hover on desktop. focus-visible covers keyboard reachability.
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className="group relative flex items-center gap-4 p-4 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-border-strong)] active:border-[var(--color-border-strong)] focus-visible:border-[var(--color-border-strong)] focus-visible:outline-none hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 overflow-hidden"
    >
      {/* Per-channel accent glow — appears on hover, active, and focus. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-12 -right-12 h-32 w-32 rounded-full blur-2xl opacity-0 group-hover:opacity-100 group-active:opacity-100 group-focus-visible:opacity-100 transition-opacity duration-300"
        style={{ background: accent }}
      />
      <div
        className="relative shrink-0 h-10 w-10 rounded-full flex items-center justify-center border border-[var(--color-border)] bg-[var(--color-surface-elevated)] transition-colors"
        style={{ color: accent }}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="relative min-w-0 flex-1">
        <div className="text-sm font-semibold text-[var(--color-foreground)] truncate">
          {label}
        </div>
        <div className="text-xs text-[var(--color-foreground-subtle)] truncate">
          {hint}
        </div>
      </div>
      <ArrowUpRight className="relative h-4 w-4 shrink-0 text-[var(--color-foreground-subtle)] group-hover:text-[var(--color-foreground)] group-active:text-[var(--color-foreground)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-active:translate-x-0.5 group-active:-translate-y-0.5 transition-all" />
    </a>
  );
}
