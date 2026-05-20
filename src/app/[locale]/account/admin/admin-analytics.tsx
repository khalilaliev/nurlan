"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { Users, FileText, Trash2, MessageCircle } from "lucide-react";
import gsap from "gsap";
import { CountUp } from "@/components/animated";

type Metric = {
  key: "metricUsers" | "metricStories" | "metricDeleted" | "metricComments";
  value: number;
  Icon: React.ComponentType<{ className?: string }>;
  glow: string;
  ring: string;
};

export function AdminAnalytics({
  users,
  stories,
  deleted,
  comments,
}: {
  users: number;
  stories: number;
  deleted: number;
  comments: number;
}) {
  const t = useTranslations("admin");
  const containerRef = useRef<HTMLDivElement>(null);

  const metrics: Metric[] = [
    {
      key: "metricUsers",
      value: users,
      Icon: Users,
      glow: "from-rose-500/30 via-rose-500/10",
      ring: "ring-rose-500/20",
    },
    {
      key: "metricStories",
      value: stories,
      Icon: FileText,
      glow: "from-amber-500/30 via-amber-500/10",
      ring: "ring-amber-500/20",
    },
    {
      key: "metricDeleted",
      value: deleted,
      Icon: Trash2,
      glow: "from-zinc-500/25 via-zinc-500/10",
      ring: "ring-zinc-500/20",
    },
    {
      key: "metricComments",
      value: comments,
      Icon: MessageCircle,
      glow: "from-indigo-500/30 via-indigo-500/10",
      ring: "ring-indigo-500/20",
    },
  ];

  useEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      const cards = containerRef.current?.querySelectorAll(
        "[data-metric-card]",
      );
      if (!cards || cards.length === 0) return;
      gsap.fromTo(
        cards,
        { opacity: 0, y: 16, scale: 0.96 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.7,
          stagger: 0.09,
          ease: "power3.out",
        },
      );
    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold mb-1">{t("analyticsTitle")}</h2>
        <p className="text-sm text-[var(--color-foreground-muted)]">
          {t("analyticsSubtitle")}
        </p>
      </div>
      <div
        ref={containerRef}
        className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
      >
        {metrics.map((m, i) => (
          <div
            key={m.key}
            data-metric-card
            className={`relative overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)]/60 backdrop-blur-xl p-5 ring-1 ${m.ring}`}
          >
            <div
              className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${m.glow} to-transparent opacity-80`}
              aria-hidden
            />
            <div
              className="pointer-events-none absolute -top-12 -right-12 h-32 w-32 rounded-full bg-white/5 blur-3xl"
              aria-hidden
            />
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="h-9 w-9 rounded-[var(--radius)] bg-white/5 backdrop-blur flex items-center justify-center border border-white/10">
                  <m.Icon className="h-4 w-4 text-[var(--color-foreground)]" />
                </div>
                <span className="text-[10px] uppercase tracking-wider text-[var(--color-foreground-subtle)] font-medium">
                  #{String(i + 1).padStart(2, "0")}
                </span>
              </div>
              <CountUp
                to={m.value}
                duration={1.4}
                delay={0.2 + i * 0.08}
                className="block text-3xl sm:text-4xl font-semibold tracking-tight tabular-nums leading-none mb-1.5"
              />
              <div className="text-xs uppercase tracking-wider text-[var(--color-foreground-muted)] font-medium">
                {t(m.key)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
