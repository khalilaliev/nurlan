"use client";

import { useState, useTransition } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatRelativeTime } from "@/lib/utils";
import { deleteComment } from "@/app/actions/comments";

export function ActivityCommentRow({
  comment,
}: {
  comment: {
    id: string;
    body: string;
    created_at: string;
    story_id: string;
    story_title: string;
  };
}) {
  const t = useTranslations("account.activity");
  const locale = useLocale();
  const [confirming, setConfirming] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (deleted) return null;

  return (
    <li className="p-4 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-border-strong)] transition-colors">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <Link
            href={`/story/${comment.story_id}`}
            className="text-xs text-[var(--color-foreground-subtle)] hover:text-[var(--color-foreground)]"
          >
            {t("on")} <span className="underline">{comment.story_title}</span>
          </Link>
          <p className="mt-1.5 text-sm text-[var(--color-foreground-muted)] leading-relaxed whitespace-pre-wrap line-clamp-3">
            {comment.body}
          </p>
          <p className="mt-1.5 text-xs text-[var(--color-foreground-subtle)]">
            {formatRelativeTime(comment.created_at, locale)}
          </p>
        </div>
        <Button
          type="button"
          variant={confirming ? "accent" : "ghost"}
          size="sm"
          disabled={isPending}
          onClick={() => {
            if (!confirming) {
              setConfirming(true);
              setTimeout(() => setConfirming(false), 4000);
              return;
            }
            startTransition(async () => {
              const res = await deleteComment(comment.id);
              if (!res || "ok" in res) setDeleted(true);
            });
          }}
          className="shrink-0 gap-1"
          aria-label={t("delete")}
        >
          <Trash2 className="h-3.5 w-3.5" />
          {confirming && <span>{t("deleteConfirm")}</span>}
        </Button>
      </div>
    </li>
  );
}
