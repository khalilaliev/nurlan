import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isCurrentUserAdmin } from "@/lib/supabase/admin-check";
import { AdminTabs } from "../admin-tabs";
import { AdminUsersList, type AdminUserRowData } from "./admin-users-list";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin");

  // Gate: admins only. notFound() keeps the route invisible to others
  // rather than confirming the path exists with a 403.
  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) notFound();

  // We need the admin client for two reasons:
  //   1. auth.users is in the protected auth schema; the anon/auth roles
  //      can't read email/created_at from it.
  //   2. We want to show stories-count per user, which we fetch alongside.
  const admin = createSupabaseAdminClient();

  const [authUsersRes, profilesRes, storiesRes] = await Promise.all([
    admin.auth.admin.listUsers({ perPage: 1000 }),
    admin.from("profiles").select("id, username, display_name, avatar_url, is_admin, created_at"),
    admin.from("stories").select("author_id"),
  ]);

  // ─── DIAGNOSTIC LOGGING (temporary) ──────────────────────────────────
  // Until we confirm the admin users list works against the current
  // database state, log the shape of every response so silent failures
  // (Supabase's classic { data: null, error: {...}, status: 200 } pattern)
  // are visible in the dev terminal.
  console.log("[admin/users] response shapes:", {
    authUsers: {
      count: authUsersRes.data?.users?.length ?? null,
      hasError: Boolean(authUsersRes.error),
      errorMessage: authUsersRes.error?.message ?? null,
    },
    profiles: {
      count: profilesRes.data?.length ?? null,
      hasError: Boolean(profilesRes.error),
      errorMessage: profilesRes.error?.message ?? null,
      status: profilesRes.status,
      statusText: profilesRes.statusText,
    },
    stories: {
      count: storiesRes.data?.length ?? null,
      hasError: Boolean(storiesRes.error),
      errorMessage: storiesRes.error?.message ?? null,
      status: storiesRes.status,
      statusText: storiesRes.statusText,
    },
  });
  // ─────────────────────────────────────────────────────────────────────

  const emailById = new Map<string, string>();
  for (const u of authUsersRes.data?.users ?? []) {
    if (u.email) emailById.set(u.id, u.email);
  }

  const storyCountById = new Map<string, number>();
  for (const s of storiesRes.data ?? []) {
    if (s.author_id) {
      storyCountById.set(s.author_id, (storyCountById.get(s.author_id) ?? 0) + 1);
    }
  }

  // The caller's own ID — used by the row component to disable the
  // delete button on the current admin's own row (we also block self-
  // delete server-side; this is purely so the button doesn't look live).
  const supabase = await createSupabaseServerClient();
  const {
    data: { user: caller },
  } = await supabase.auth.getUser();

  const rows: AdminUserRowData[] = (profilesRes.data ?? [])
    .map((p) => ({
      id: p.id,
      username: p.username,
      display_name: p.display_name,
      avatar_url: p.avatar_url,
      is_admin: p.is_admin,
      email: emailById.get(p.id) ?? "—",
      created_at: p.created_at,
      story_count: storyCountById.get(p.id) ?? 0,
    }))
    // Newest first
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));

  return (
    <div className="space-y-6">
      <AdminTabs />
      <div>
        <h2 className="text-lg font-semibold mb-1">{t("usersTitle")}</h2>
        <p className="text-sm text-[var(--color-foreground-muted)] mb-4">
          {t("usersSubtitle")}
        </p>
        <AdminUsersList users={rows} currentUserId={caller?.id ?? null} />
      </div>
    </div>
  );
}
