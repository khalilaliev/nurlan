"use client";

import { useState, useTransition } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Trash2, Eye, EyeOff, Star, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatRelativeTime } from "@/lib/utils";
import {
  adminRemoveStory,
  adminRestoreStory,
  adminHardDeleteStory,
  adminToggleFeature,
} from "@/app/actions/admin";

type Status = "published" | "flagged" | "removed" | "draft";

export type AdminStoryRowData = {
  id: string;
  title: string;
  status: Status;
  is_featured: boolean;
  created_at: string;
  author_username: string;
  author_id: string;
  is_anonymous: boolean;
};

const STATUS_STYLES: Record<Status, string> = {
  published:
    "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  removed: "bg-red-500/10 text-red-400 border-red-500/20",
  flagged: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  draft: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
};

export function AdminStoryRow({ story }: { story: AdminStoryRowData }) {
  const t = useTranslations("admin");
  const locale = useLocale();
  const [status, setStatus] = useState<Status>(story.status);
  const [featured, setFeatured] = useState(story.is_featured);
  const [hardDeleteConfirming, setHardDeleteConfirming] = useState(false);
  const [hardDeleted, setHardDeleted] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (hardDeleted) return null;

  const removed = status === "removed";

  const handle = (fn: () => Promise<{ error: string } | { ok: true }>) => {
    startTransition(async () => {
      await fn();
    });
  };

  return (
    <li className="p-4 sm:p-5 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-border-strong)] transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-2 text-xs">
            <span
              className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 ${STATUS_STYLES[status]}`}
            >
              {t(
                ("filter" +
                  status.charAt(0).toUpperCase() +
                  status.slice(1)) as
                  | "filterPublished"
                  | "filterRemoved"
                  | "filterFlagged"
                  | "filterDraft",
              )}
            </span>
            {featured && (
              <span className="inline-flex items-center gap-1 rounded-full border border-[var(--color-accent)]/30 bg-[var(--color-accent-soft)] px-2 py-0.5 text-[var(--color-accent)]">
                ★ Featured
              </span>
            )}
            <span className="text-[var(--color-foreground-subtle)]">
              {formatRelativeTime(story.created_at, locale)}
            </span>
            <span className="text-[var(--color-foreground-subtle)]">·</span>
            <Link
              href={`/u/${story.author_username}`}
              className="text-[var(--color-foreground-muted)] hover:text-[var(--color-foreground)]"
            >
              @{story.author_username}
              {story.is_anonymous && " (anon)"}
            </Link>
          </div>
          <h3 className="text-base font-semibold leading-snug tracking-tight">
            {story.title}
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Button asChild variant="ghost" size="sm" className="gap-1">
            <Link href={`/story/${story.id}`}>
              <ExternalLink className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t("view")}</span>
            </Link>
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isPending}
            onClick={() =>
              handle(async () => {
                const next = !featured;
                const res = await adminToggleFeature(story.id, next);
                if (res && "ok" in res) setFeatured(next);
                return res;
              })
            }
            className="gap-1"
            title={featured ? t("unfeature") : t("feature")}
          >
            <Star
              className={
                featured
                  ? "h-3.5 w-3.5 fill-[var(--color-accent)] text-[var(--color-accent)]"
                  : "h-3.5 w-3.5"
              }
            />
          </Button>

          {removed ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={() =>
                handle(async () => {
                  const res = await adminRestoreStory(story.id);
                  if (res && "ok" in res) setStatus("published");
                  return res;
                })
              }
              className="gap-1"
            >
              <Eye className="h-3.5 w-3.5" />
              {t("restore")}
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={() =>
                handle(async () => {
                  const res = await adminRemoveStory(story.id);
                  if (res && "ok" in res) setStatus("removed");
                  return res;
                })
              }
              className="gap-1"
            >
              <EyeOff className="h-3.5 w-3.5" />
              {t("remove")}
            </Button>
          )}

          <Button
            type="button"
            variant={hardDeleteConfirming ? "accent" : "ghost"}
            size="sm"
            disabled={isPending}
            onClick={() => {
              if (!hardDeleteConfirming) {
                setHardDeleteConfirming(true);
                setTimeout(() => setHardDeleteConfirming(false), 4000);
                return;
              }
              handle(async () => {
                const res = await adminHardDeleteStory(story.id);
                if (res && "ok" in res) setHardDeleted(true);
                return res;
              });
            }}
            className="gap-1"
            title={t("hardDelete")}
          >
            <Trash2 className="h-3.5 w-3.5" />
            {hardDeleteConfirming && (
              <span className="text-xs">{t("hardDeleteConfirm")}</span>
            )}
          </Button>
        </div>
      </div>
    </li>
  );
}
