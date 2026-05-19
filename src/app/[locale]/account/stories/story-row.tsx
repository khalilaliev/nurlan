"use client";

import { useState, useTransition } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Eye, Heart, MessageCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatRelativeTime } from "@/lib/utils";
import { deleteStory } from "@/app/actions/account";

export function StoryRow({
  story,
}: {
  story: {
    id: string;
    title: string;
    created_at: string;
    view_count: number;
    reaction_total: number;
    comment_count: number;
    category_emoji: string | null;
    category_name_en: string;
    category_name_ru: string;
  };
}) {
  const t = useTranslations("account.stories");
  const locale = useLocale();
  const [confirming, setConfirming] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [error, setError] = useState(false);
  const [isPending, startTransition] = useTransition();

  const categoryName =
    locale === "ru" ? story.category_name_ru : story.category_name_en;

  if (deleted) return null;

  return (
    <li className="group relative p-4 sm:p-5 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-border-strong)] transition-colors">
      <div className="flex items-start gap-3 sm:gap-4">
        <Link href={`/story/${story.id}`} className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1.5 text-xs text-[var(--color-foreground-subtle)]">
            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-surface-elevated)] border border-[var(--color-border)] px-2 py-0.5">
              <span>{story.category_emoji}</span>
              <span>{categoryName}</span>
            </span>
            <span>·</span>
            <span>{formatRelativeTime(story.created_at, locale)}</span>
          </div>
          <h3 className="text-base font-semibold leading-snug tracking-tight group-hover:text-[var(--color-accent)] transition-colors">
            {story.title}
          </h3>
          <div className="mt-2 flex items-center gap-4 text-xs text-[var(--color-foreground-muted)] tabular-nums">
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {story.view_count}
            </span>
            <span className="flex items-center gap-1">
              <Heart className="h-3 w-3" />
              {story.reaction_total}
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle className="h-3 w-3" />
              {story.comment_count}
            </span>
          </div>
        </Link>

        <div className="flex flex-col items-end gap-2 shrink-0">
          <Button
            type="button"
            variant={confirming ? "accent" : "outline"}
            size="sm"
            disabled={isPending}
            onClick={() => {
              if (!confirming) {
                setConfirming(true);
                setTimeout(() => setConfirming(false), 4000);
                return;
              }
              startTransition(async () => {
                const res = await deleteStory(story.id);
                if (res && "error" in res) {
                  setError(true);
                  setConfirming(false);
                } else {
                  setDeleted(true);
                }
              });
            }}
            className="gap-1"
          >
            <Trash2 className="h-3.5 w-3.5" />
            {isPending ? t("deleting") : confirming ? t("deleteConfirm") : t("delete")}
          </Button>
          {error && (
            <span className="text-xs text-[var(--color-accent)]">!</span>
          )}
        </div>
      </div>
    </li>
  );
}
