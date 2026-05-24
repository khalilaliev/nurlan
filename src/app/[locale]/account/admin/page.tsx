import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isCurrentUserAdmin } from "@/lib/supabase/admin-check";
import { AdminFilters } from "./admin-filters";
import { AdminAnalytics } from "./admin-analytics";
import { AdminTabs } from "./admin-tabs";
import type { AdminStoryRowData } from "./admin-story-row";

export const dynamic = "force-dynamic";

export default async function AdminPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin");

  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) notFound();

  const supabase = await createSupabaseServerClient();

  const [
    usersRes,
    activeStoriesRes,
    deletedStoriesRes,
    commentsRes,
    storiesRes,
  ] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    // Active = anything that isn't soft-removed. Includes published/flagged/draft.
    supabase
      .from("stories")
      .select("id", { count: "exact", head: true })
      .neq("status", "removed"),
    supabase
      .from("stories")
      .select("id", { count: "exact", head: true })
      .eq("status", "removed"),
    supabase.from("comments").select("id", { count: "exact", head: true }),
    supabase
      .from("stories")
      .select(
        "id, title, status, is_featured, created_at, author_id, is_anonymous",
      )
      .order("created_at", { ascending: false })
      .limit(200),
  ]);

  const stories = storiesRes.data ?? [];
  const authorIds = Array.from(new Set(stories.map((s) => s.author_id)));

  const usernameById = new Map<string, string>();
  if (authorIds.length > 0) {
    const { data: profs } = await supabase
      .from("profiles")
      .select("id, username")
      .in("id", authorIds);
    for (const p of profs ?? []) usernameById.set(p.id, p.username);
  }

  const rows: AdminStoryRowData[] = stories.map((s) => ({
    id: s.id,
    title: s.title,
    status: s.status,
    is_featured: s.is_featured,
    created_at: s.created_at,
    author_id: s.author_id,
    author_username: usernameById.get(s.author_id) ?? "unknown",
    is_anonymous: s.is_anonymous,
  }));

  return (
    <div className="space-y-8">
      <AdminAnalytics
        users={usersRes.count ?? 0}
        stories={activeStoriesRes.count ?? 0}
        deleted={deletedStoriesRes.count ?? 0}
        comments={commentsRes.count ?? 0}
      />
      <div>
        <AdminTabs />
        <h2 className="text-lg font-semibold mb-1">{t("title")}</h2>
        <p className="text-sm text-[var(--color-foreground-muted)] mb-4">
          {t("subtitle")}
        </p>
        <AdminFilters stories={rows} />
      </div>
    </div>
  );
}
