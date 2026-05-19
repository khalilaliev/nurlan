"use client";

import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { toggleReaction } from "@/app/actions/reactions";
import type { ReactionType } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

const REACTIONS: { type: ReactionType; emoji: string }[] = [
  { type: "funny", emoji: "😂" },
  { type: "insane", emoji: "😱" },
  { type: "sad", emoji: "💔" },
  { type: "cringe", emoji: "😬" },
  { type: "mindblown", emoji: "🤯" },
  { type: "viral", emoji: "🔥" },
];

export function ReactionBar({
  storyId,
  counts,
  userReactions,
  isAuthed,
}: {
  storyId: string;
  counts: Partial<Record<ReactionType, number>>;
  userReactions: ReactionType[];
  isAuthed: boolean;
}) {
  const t = useTranslations("reactions");
  const [, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useState({
    counts: { ...counts } as Partial<Record<ReactionType, number>>,
    user: new Set(userReactions),
  });

  const onClick = (type: ReactionType) => {
    if (!isAuthed) return;
    const userHad = optimistic.user.has(type);
    const nextUser = new Set(optimistic.user);
    const nextCounts = { ...optimistic.counts };
    if (userHad) {
      nextUser.delete(type);
      nextCounts[type] = Math.max(0, (nextCounts[type] ?? 0) - 1);
    } else {
      nextUser.add(type);
      nextCounts[type] = (nextCounts[type] ?? 0) + 1;
    }
    setOptimistic({ counts: nextCounts, user: nextUser });
    startTransition(() => {
      toggleReaction(storyId, type);
    });
  };

  return (
    <div className="grid grid-cols-3 gap-2">
      {REACTIONS.map(({ type, emoji }) => {
        const count = optimistic.counts[type] ?? 0;
        const active = optimistic.user.has(type);
        return (
          <motion.button
            key={type}
            type="button"
            disabled={!isAuthed}
            onClick={() => onClick(type)}
            whileTap={{ scale: 0.92 }}
            className={cn(
              "flex flex-col items-center gap-1 rounded-[var(--radius)] border px-2 py-3 text-xs transition-all",
              "disabled:opacity-60 disabled:cursor-not-allowed",
              active
                ? "border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-foreground)]"
                : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-foreground-muted)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-foreground)]",
            )}
          >
            <span className="text-2xl leading-none">{emoji}</span>
            <span className="font-medium">{t(type)}</span>
            <span className="text-[var(--color-foreground-subtle)] tabular-nums">
              {count}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
