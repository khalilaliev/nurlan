"use client";

import { useMemo, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Trash2, ShieldAlert, Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatRelativeTime } from "@/lib/utils";
import { DeleteUserModal } from "./delete-user-modal";

export type AdminUserRowData = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  is_admin: boolean;
  email: string;
  created_at: string;
  story_count: number;
};

export function AdminUsersList({
  users,
  currentUserId,
}: {
  users: AdminUserRowData[];
  currentUserId: string | null;
}) {
  const t = useTranslations("admin");
  const locale = useLocale();
  const [query, setQuery] = useState("");
  const [pendingDelete, setPendingDelete] = useState<AdminUserRowData | null>(
    null,
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length === 0) return users;
    return users.filter(
      (u) =>
        u.username.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.display_name?.toLowerCase().includes(q) ?? false),
    );
  }, [users, query]);

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-foreground-subtle)]"
          aria-hidden
        />
        <Input
          placeholder={t("usersSearch")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-[var(--color-foreground-muted)] py-10 text-center">
          {t("usersEmpty")}
        </p>
      ) : (
        <ul className="space-y-2">
          {filtered.map((u) => {
            const isSelf = u.id === currentUserId;
            const initial = u.username.slice(0, 1).toUpperCase();
            return (
              <li key={u.id}>
                <Card className="p-4 flex items-center gap-3 sm:gap-4 flex-wrap sm:flex-nowrap">
                  <div className="h-10 w-10 rounded-full overflow-hidden bg-gradient-to-br from-[var(--color-accent)] to-orange-500 flex items-center justify-center text-sm font-semibold text-white shrink-0 ring-2 ring-white/10">
                    {u.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={u.avatar_url}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      initial
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm truncate">
                        @{u.username}
                      </span>
                      {u.is_admin && (
                        <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded-full bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
                          <ShieldAlert className="h-3 w-3" />
                          {t("adminBadge")}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-[var(--color-foreground-subtle)] truncate">
                      {u.email}
                    </div>
                  </div>

                  <div className="hidden sm:block text-xs text-[var(--color-foreground-subtle)] tabular-nums whitespace-nowrap">
                    {u.story_count} {t("usersStories")}
                  </div>

                  <div className="hidden sm:block text-xs text-[var(--color-foreground-subtle)] whitespace-nowrap">
                    {t("usersJoined")} {formatRelativeTime(u.created_at, locale)}
                  </div>

                  <button
                    type="button"
                    onClick={() => setPendingDelete(u)}
                    disabled={isSelf}
                    title={isSelf ? t("errorSelfDelete") : undefined}
                    aria-label={t("usersDelete")}
                    className="cursor-pointer h-8 w-8 rounded-[var(--radius)] flex items-center justify-center text-[var(--color-foreground-muted)] hover:text-[var(--color-accent)] hover:bg-[var(--color-accent-soft)]/40 transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-[var(--color-foreground-muted)]"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      {pendingDelete && (
        <DeleteUserModal
          user={pendingDelete}
          onClose={() => setPendingDelete(null)}
        />
      )}
    </div>
  );
}
