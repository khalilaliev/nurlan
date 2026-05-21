import { useLocale, useTranslations } from "next-intl";
import { Play, Images } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn, estimateReadingMinutes, formatRelativeTime } from "@/lib/utils";
import { kindForUrl } from "@/lib/media/constants";
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

  const mediaUrls = story.media_urls ?? [];
  const firstMedia = mediaUrls[0];
  const firstMediaKind = firstMedia ? kindForUrl(firstMedia) : null;
  const extraMediaCount = mediaUrls.length > 1 ? mediaUrls.length - 1 : 0;

  // The whole card behaves like a link to the story, but the username badge is
  // a *separate* link to the author's profile. Nesting two <a> tags is invalid
  // HTML, so we render the card-wide click target as an absolutely positioned
  // <Link> that sits BEHIND the rest of the content. Other interactive
  // elements (the username link) sit above it with their own z-index.
  return (
    <Card
      className={cn(
        "group relative p-6 hover:border-[var(--color-border-strong)] transition-all duration-200",
        story.is_featured && "border-[var(--color-accent)]/40",
      )}
    >
      <Link
        href={`/story/${story.id}`}
        className="absolute inset-0 z-0 rounded-[var(--radius-lg)]"
        aria-label={story.title}
      />

      <div className="relative z-10 pointer-events-none">
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

        <h2 className="text-lg sm:text-xl font-semibold leading-snug tracking-tight text-[var(--color-foreground)] group-hover:text-[var(--color-accent)] mb-2 transition-colors">
          {story.title}
        </h2>

        {firstMedia && (
          <div className="relative my-3 overflow-hidden rounded-[var(--radius-lg)] bg-[var(--color-surface-elevated)] aspect-video">
            {firstMediaKind === "image" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={firstMedia}
                alt=""
                className="h-full w-full object-cover transition-transform duration-300"
              />
            ) : (
              <>
                <video
                  src={firstMedia}
                  className="h-full w-full object-cover"
                  muted
                  playsInline
                  preload="metadata"
                />
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/20">
                  <div className="h-12 w-12 rounded-full bg-black/60 backdrop-blur flex items-center justify-center">
                    <Play className="h-5 w-5 text-white fill-white ml-0.5" />
                  </div>
                </div>
              </>
            )}
            {extraMediaCount > 0 && (
              <div className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-full bg-black/60 backdrop-blur px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-white">
                <Images className="h-3 w-3" />+{extraMediaCount}
              </div>
            )}
          </div>
        )}

        <p className="text-sm text-[var(--color-foreground-muted)] leading-relaxed line-clamp-3">
          {preview}
        </p>
      </div>

      <div className="relative z-10 mt-4 flex items-center justify-between text-xs text-[var(--color-foreground-subtle)]">
        <div className="flex items-center gap-3">
          {story.is_anonymous ? (
            <span className="pointer-events-none">{t("story.anonymous")}</span>
          ) : (
            <Link
              href={`/user/${story.author_username}`}
              className="hover:text-[var(--color-accent)] transition-colors"
            >
              @{story.author_username}
            </Link>
          )}
          <span className="pointer-events-none">·</span>
          <span className="pointer-events-none">
            {minutes} {t("story.minRead")}
          </span>
        </div>
        <div className="flex items-center gap-3 pointer-events-none">
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
  );
}
