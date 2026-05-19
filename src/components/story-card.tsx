import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn, estimateReadingMinutes, formatRelativeTime } from "@/lib/utils";
import type { StoryFeedRow } from "@/lib/supabase/types";

const REACTION_EMOJI: Record<string, string> = {
  funny: "😂",
  insane: "😱",
  sad: "💔",
  cringe: "😬",
  mindblown: "🤯",
  viral: "🔥",
};

export function StoryCard({ story }: { story: StoryFeedRow }) {
  const locale = useLocale();
  const t = useTranslations();
  const minutes = estimateReadingMinutes(story.body);
  const categoryName =
    locale === "ru" ? story.category_name_ru : story.category_name_en;
  const preview =
    story.body.length > 280 ? story.body.slice(0, 280).trimEnd() + "…" : story.body;

  const topReactions = Object.entries(story.reaction_breakdown)
    .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))
    .slice(0, 3);

  return (
    <Link href={`/story/${story.id}`} className="block group">
      <Card
        className={cn(
          "p-6 hover:border-[var(--color-border-strong)] transition-all duration-200 group-hover:translate-y-[-2px]",
          story.is_featured && "border-[var(--color-accent)]/40",
        )}
      >
        <div className="flex items-center gap-2 mb-3 text-xs">
          <Badge>
            <span>{story.category_emoji}</span>
            <span>{categoryName}</span>
          </Badge>
          {story.is_featured && (
            <Badge className="border-[var(--color-accent)]/40 bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
              ★ Featured
            </Badge>
          )}
          <span className="text-[var(--color-foreground-subtle)] ml-auto">
            {formatRelativeTime(story.created_at, locale)}
          </span>
        </div>

        <h2 className="text-lg sm:text-xl font-semibold leading-snug tracking-tight text-[var(--color-foreground)] mb-2 group-hover:text-[var(--color-accent)] transition-colors">
          {story.title}
        </h2>
        <p className="text-sm text-[var(--color-foreground-muted)] leading-relaxed line-clamp-3">
          {preview}
        </p>

        <div className="mt-4 flex items-center justify-between text-xs text-[var(--color-foreground-subtle)]">
          <div className="flex items-center gap-3">
            <span>
              {story.is_anonymous ? t("story.anonymous") : `@${story.author_username}`}
            </span>
            <span>·</span>
            <span>
              {minutes} {t("story.minRead")}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {topReactions.length > 0 && (
              <div className="flex items-center gap-0.5">
                {topReactions.map(([type, n]) => (
                  <span key={type} className="flex items-center gap-0.5">
                    <span>{REACTION_EMOJI[type]}</span>
                    <span>{n}</span>
                  </span>
                ))}
              </div>
            )}
            <span>💬 {story.comment_count}</span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
