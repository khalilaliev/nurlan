"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { ShieldAlert, EyeOff, Eye, Trash2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  adminRemoveStory,
  adminRestoreStory,
  adminHardDeleteStory,
  adminToggleFeature,
} from "@/app/actions/admin";

type Status = "published" | "flagged" | "removed" | "draft";

export function AdminStoryActions({
  storyId,
  initialStatus,
  initialFeatured,
}: {
  storyId: string;
  initialStatus: Status;
  initialFeatured: boolean;
}) {
  const t = useTranslations("admin");
  const router = useRouter();
  const [status, setStatus] = useState<Status>(initialStatus);
  const [featured, setFeatured] = useState(initialFeatured);
  const [hardConfirm, setHardConfirm] = useState(false);
  const [isPending, startTransition] = useTransition();

  const removed = status === "removed";

  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-accent)]/30 bg-[var(--color-accent-soft)]/30 p-4">
      <div className="flex items-center gap-2 mb-3 text-xs font-medium text-[var(--color-accent)] uppercase tracking-wider">
        <ShieldAlert className="h-3.5 w-3.5" />
        {t("adminBadge")}
      </div>
      <div className="flex flex-wrap gap-2">
        {removed ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                const res = await adminRestoreStory(storyId);
                if (res && "ok" in res) setStatus("published");
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
              startTransition(async () => {
                const res = await adminRemoveStory(storyId);
                if (res && "ok" in res) setStatus("removed");
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
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              const next = !featured;
              const res = await adminToggleFeature(storyId, next);
              if (res && "ok" in res) setFeatured(next);
            })
          }
          className="gap-1"
        >
          <Star
            className={
              featured
                ? "h-3.5 w-3.5 fill-[var(--color-accent)] text-[var(--color-accent)]"
                : "h-3.5 w-3.5"
            }
          />
          {featured ? t("unfeature") : t("feature")}
        </Button>

        <Button
          type="button"
          variant={hardConfirm ? "accent" : "ghost"}
          size="sm"
          disabled={isPending}
          onClick={() => {
            if (!hardConfirm) {
              setHardConfirm(true);
              setTimeout(() => setHardConfirm(false), 4000);
              return;
            }
            startTransition(async () => {
              const res = await adminHardDeleteStory(storyId);
              if (res && "ok" in res) router.push("/");
            });
          }}
          className="gap-1"
        >
          <Trash2 className="h-3.5 w-3.5" />
          {hardConfirm ? t("hardDeleteConfirm") : t("hardDelete")}
        </Button>
      </div>
    </div>
  );
}
