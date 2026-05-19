"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import gsap from "gsap";
import { Sparkles, Flame, Eye, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

export type FeedSort = "new" | "best" | "top" | "trending";

const ITEMS: { key: FeedSort; Icon: React.ComponentType<{ className?: string }> }[] =
  [
    { key: "new", Icon: Sparkles },
    { key: "best", Icon: Flame },
    { key: "top", Icon: Eye },
    { key: "trending", Icon: TrendingUp },
  ];

export function FeedFilters({ active }: { active: FeedSort }) {
  const t = useTranslations("feed.filters");
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ref.current,
        { opacity: 0, y: -8 },
        { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" },
      );
    });
    return () => ctx.revert();
  }, []);

  const goto = (sort: FeedSort) => {
    const next = new URLSearchParams(params?.toString() ?? "");
    if (sort === "new") next.delete("sort");
    else next.set("sort", sort);
    const qs = next.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  };

  return (
    <div
      ref={ref}
      className="relative flex flex-wrap items-center gap-1 p-1 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] w-fit"
    >
      {ITEMS.map(({ key, Icon }) => {
        const isActive = key === active;
        return (
          <button
            key={key}
            type="button"
            onClick={() => goto(key)}
            className={cn(
              "relative inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-[var(--radius)] text-sm font-medium transition-all duration-200",
              isActive
                ? "bg-[var(--color-accent)] text-[var(--color-accent-foreground)] shadow-[var(--shadow-glow)]"
                : "text-[var(--color-foreground-muted)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-surface-elevated)]",
            )}
            aria-current={isActive ? "page" : undefined}
          >
            <Icon className="h-4 w-4" />
            <span>{t(key)}</span>
            <span
              className={cn(
                "hidden lg:inline text-[10px] font-normal opacity-70",
                isActive ? "text-white/85" : "",
              )}
            >
              · {t(`${key}Hint`)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
