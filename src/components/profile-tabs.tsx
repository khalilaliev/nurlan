"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { FileText, MessageSquare, Heart } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { StoryCard } from "@/components/story-card";
import { Card } from "@/components/ui/card";
import { Stagger } from "@/components/animated";
import { formatRelativeTime } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { StoryFeedRow } from "@/lib/supabase/types";

type Tab = "stories" | "comments" | "reactions";

export type CommentItem = {
  id: string;
  body: string;
  created_at: string;
  story_id: string;
  story_title: string;
};

export type ReactionItem = {
  story: StoryFeedRow;
  type: string;
};

const REACTION_EMOJI: Record<string, string> = {
  funny: "😂",
  insane: "😱",
  sad: "💔",
  cringe: "😬",
  mindblown: "🤯",
  viral: "🔥",
};

export function ProfileTabs({
  stories,
  comments,
  reactions,
}: {
  stories: StoryFeedRow[];
  comments: CommentItem[];
  reactions: ReactionItem[];
}) {
  const t = useTranslations("profile");
  const locale = useLocale();
  const [tab, setTab] = useState<Tab>("stories");

  return (
    <div>
      <div
        className="admin-tabs flex items-center gap-1 p-1 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] w-full max-w-full overflow-x-auto mb-6"
      // style={{
      //   WebkitMaskImage:
      //     "linear-gradient(to right, black calc(100% - 24px), transparent)",
      //   maskImage:
      //     "linear-gradient(to right, black calc(100% - 24px), transparent)",
      // }}
      >
        <TabButton
          active={tab === "stories"}
          onClick={() => setTab("stories")}
          Icon={FileText}
          label={t("tabs.stories")}
          count={stories.length}
        />
        <TabButton
          active={tab === "comments"}
          onClick={() => setTab("comments")}
          Icon={MessageSquare}
          label={t("tabs.comments")}
          count={comments.length}
        />
        <TabButton
          active={tab === "reactions"}
          onClick={() => setTab("reactions")}
          Icon={Heart}
          label={t("tabs.reactions")}
          count={reactions.length}
        />
      </div>

      {tab === "stories" && (
        <>
          {stories.length === 0 ? (
            <Empty>{t("noStories")}</Empty>
          ) : (
            <Stagger as="ul" className="space-y-4">
              {stories.map((story) => (
                <li key={story.id}>
                  <StoryCard story={story} />
                </li>
              ))}
            </Stagger>
          )}
        </>
      )}

      {tab === "comments" && (
        <>
          {comments.length === 0 ? (
            <Empty>{t("noComments")}</Empty>
          ) : (
            <Stagger as="ul" className="space-y-3">
              {comments.map((c) => (
                <li key={c.id}>
                  <Card className="p-5">
                    <Link
                      href={`/story/${c.story_id}`}
                      className="text-xs text-[var(--color-foreground-subtle)] hover:text-[var(--color-foreground)] transition-colors"
                    >
                      {t("commentOn")}{" "}
                      <span className="font-medium text-[var(--color-foreground-muted)] hover:text-[var(--color-accent)] transition-colors">
                        {c.story_title}
                      </span>
                    </Link>
                    <p className="mt-2 text-sm text-[var(--color-foreground)] whitespace-pre-wrap leading-relaxed">
                      {c.body}
                    </p>
                    <p className="mt-2 text-xs text-[var(--color-foreground-subtle)]">
                      {formatRelativeTime(c.created_at, locale)}
                    </p>
                  </Card>
                </li>
              ))}
            </Stagger>
          )}
        </>
      )}

      {tab === "reactions" && (
        <>
          {reactions.length === 0 ? (
            <Empty>{t("noReactions")}</Empty>
          ) : (
            <Stagger as="ul" className="space-y-3">
              {reactions.map((r) => (
                <li key={`${r.story.id}-${r.type}`}>
                  <Card className="p-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="h-10 w-10 rounded-full bg-[var(--color-surface-elevated)] flex items-center justify-center text-xl shrink-0"
                        aria-hidden
                      >
                        {REACTION_EMOJI[r.type] ?? "👍"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-[var(--color-foreground-subtle)]">
                          {t("reactedTo")}
                        </p>
                        <Link
                          href={`/story/${r.story.id}`}
                          className="text-sm font-medium text-[var(--color-foreground)] hover:text-[var(--color-accent)] transition-colors truncate block"
                        >
                          {r.story.title}
                        </Link>
                      </div>
                    </div>
                  </Card>
                </li>
              ))}
            </Stagger>
          )}
        </>
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  Icon,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  Icon: React.ComponentType<{ className?: string }>;
  label: string;
  count: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "cursor-pointer shrink-0 inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-[var(--radius)] text-sm font-medium transition-all whitespace-nowrap",
        active
          ? "bg-[var(--color-accent)] text-[var(--color-accent-foreground)] shadow-[var(--shadow-glow)]"
          : "text-[var(--color-foreground-muted)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-surface-elevated)]",
      )}
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
      <span
        className={cn(
          "text-xs tabular-nums",
          active ? "text-white/80" : "text-[var(--color-foreground-subtle)]",
        )}
      >
        {count}
      </span>
    </button>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <Card className="p-8 text-center">
      <p className="text-sm text-[var(--color-foreground-muted)]">{children}</p>
    </Card>
  );
}
