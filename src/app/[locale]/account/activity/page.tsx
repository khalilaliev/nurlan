import { getTranslations, setRequestLocale } from "next-intl/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { formatRelativeTime } from "@/lib/utils";
import { ActivityCommentRow } from "./comment-row";

const REACTION_EMOJI: Record<string, string> = {
  funny: "😂",
  insane: "😱",
  sad: "💔",
  cringe: "😬",
  mindblown: "🤯",
  viral: "🔥",
};

export const dynamic = "force-dynamic";

export default async function ActivityPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("account.activity");

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [commentsRes, reactionsRes] = await Promise.all([
    supabase
      .from("comments")
      .select("id, body, created_at, story_id")
      .eq("author_id", user.id)
      .order("created_at", { ascending: false })
      .limit(40),
    supabase
      .from("reactions")
      .select("id, type, created_at, story_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(40),
  ]);

  const myComments = commentsRes.data ?? [];
  const myReactions = reactionsRes.data ?? [];

  const storyIds = Array.from(
    new Set([
      ...myComments.map((c) => c.story_id),
      ...myReactions.map((r) => r.story_id),
    ]),
  );

  const titleById = new Map<string, string>();
  if (storyIds.length > 0) {
    const { data: stories } = await supabase
      .from("story_feed")
      .select("id, title")
      .in("id", storyIds);
    for (const s of stories ?? []) titleById.set(s.id, s.title);
  }

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-base font-semibold mb-3">{t("commentsHeading")}</h2>
        {myComments.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-sm text-[var(--color-foreground-muted)]">
              {t("emptyComments")}
            </p>
          </Card>
        ) : (
          <ul className="space-y-3">
            {myComments.map((c) => (
              <ActivityCommentRow
                key={c.id}
                comment={{
                  id: c.id,
                  body: c.body,
                  created_at: c.created_at,
                  story_id: c.story_id,
                  story_title: titleById.get(c.story_id) ?? "—",
                }}
              />
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-base font-semibold mb-3">{t("reactionsHeading")}</h2>
        {myReactions.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-sm text-[var(--color-foreground-muted)]">
              {t("emptyReactions")}
            </p>
          </Card>
        ) : (
          <ul className="space-y-2">
            {myReactions.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/story/${r.story_id}`}
                  className="flex items-center gap-3 p-3 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-border-strong)] transition-colors"
                >
                  <span className="text-xl shrink-0">
                    {REACTION_EMOJI[r.type] ?? "•"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">
                      {titleById.get(r.story_id) ?? "—"}
                    </div>
                    <div className="text-xs text-[var(--color-foreground-subtle)]">
                      {formatRelativeTime(r.created_at, locale)}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
