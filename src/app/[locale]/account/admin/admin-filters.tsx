"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  AdminStoryRow,
  type AdminStoryRowData,
} from "./admin-story-row";

// Order: active states first, then "removed" (the soft-deleted bucket), then
// the rare "all" escape hatch on the far right.
const FILTERS = ["published", "flagged", "draft", "removed", "all"] as const;
type Filter = (typeof FILTERS)[number];

const FILTER_KEY: Record<Filter, "filterAll" | "filterPublished" | "filterFlagged" | "filterRemoved" | "filterDraft"> = {
  all: "filterAll",
  published: "filterPublished",
  flagged: "filterFlagged",
  removed: "filterRemoved",
  draft: "filterDraft",
};

export function AdminFilters({ stories }: { stories: AdminStoryRowData[] }) {
  const t = useTranslations("admin");
  const [filter, setFilter] = useState<Filter>("published");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return stories.filter((s) => {
      if (filter !== "all" && s.status !== filter) return false;
      if (!q) return true;
      return (
        s.title.toLowerCase().includes(q) ||
        s.author_username.toLowerCase().includes(q)
      );
    });
  }, [stories, filter, query]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-1 p-1 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] overflow-x-auto">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={cn(
                "px-3 py-1.5 rounded-[var(--radius)] text-xs font-medium transition-all whitespace-nowrap",
                filter === f
                  ? "bg-[var(--color-accent)] text-[var(--color-accent-foreground)]"
                  : "text-[var(--color-foreground-muted)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-surface-elevated)]",
              )}
            >
              {t(FILTER_KEY[f])}
            </button>
          ))}
        </div>
        <Input
          placeholder={t("search")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-[var(--color-foreground-muted)] py-10 text-center">
          {t("empty")}
        </p>
      ) : (
        <ul className="space-y-3">
          {filtered.map((s) => (
            <AdminStoryRow key={s.id} story={s} />
          ))}
        </ul>
      )}
    </div>
  );
}
