import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/guard";
import { SetupNotice } from "@/components/setup-notice";
import { Card } from "@/components/ui/card";
import { StoryCard } from "@/components/story-card";
import { formatRelativeTime } from "@/lib/utils";
import { FileText, Heart, Eye } from "lucide-react";
import type { StoryFeedRow } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ locale: string; username: string }>;
}) {
  const { locale, username } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("account.publicProfile");

  if (!isSupabaseConfigured()) {
    return (
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
        <SetupNotice />
      </div>
    );
  }

  const supabase = await createSupabaseServerClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, display_name, bio, avatar_url, created_at")
    .eq("username", username.toLowerCase())
    .maybeSingle();

  if (!profile) notFound();

  const { data: stories } = await supabase
    .from("story_feed")
    .select("*")
    .eq("author_id", profile.id)
    .eq("is_anonymous", false)
    .order("created_at", { ascending: false })
    .limit(20);

  const list = (stories ?? []) as StoryFeedRow[];

  const totalViews = list.reduce((s, st) => s + (st.view_count ?? 0), 0);
  const totalReactions = list.reduce(
    (s, st) => s + (st.reaction_total ?? 0),
    0,
  );

  const displayName = profile.display_name || profile.username;

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
      <Card className="relative overflow-hidden p-6 sm:p-8 mb-8">
        <div className="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-[var(--color-accent-soft)] blur-3xl pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row gap-5 sm:items-center">
          <div
            className="h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-gradient-to-br from-[var(--color-accent)] to-orange-500 flex items-center justify-center text-3xl font-semibold text-white shadow-[var(--shadow-glow)] shrink-0"
            aria-hidden
          >
            {profile.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatar_url}
                alt=""
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              profile.username.slice(0, 1).toUpperCase()
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
              {displayName}
            </h1>
            <p className="text-sm text-[var(--color-foreground-muted)]">
              @{profile.username}
            </p>
            {profile.bio && (
              <p className="mt-3 text-sm text-[var(--color-foreground-muted)] leading-relaxed max-w-prose">
                {profile.bio}
              </p>
            )}
            <p className="mt-3 text-xs text-[var(--color-foreground-subtle)]">
              {t("joinedOn")} {formatRelativeTime(profile.created_at, locale)}
            </p>
          </div>
        </div>

        <div className="relative mt-6 grid grid-cols-3 gap-2 sm:gap-3">
          <Stat icon={FileText} value={list.length} />
          <Stat icon={Heart} value={totalReactions} />
          <Stat icon={Eye} value={totalViews} />
        </div>
      </Card>

      <h2 className="text-base font-semibold mb-4 px-1">{t("stories")}</h2>

      {list.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-sm text-[var(--color-foreground-muted)]">
            {t("noStories")}
          </p>
        </Card>
      ) : (
        <ul className="space-y-4">
          {list.map((story) => (
            <li key={story.id}>
              <StoryCard story={story} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Stat({
  icon: Icon,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: number;
}) {
  return (
    <div className="flex items-center gap-2 p-3 rounded-[var(--radius)] bg-[var(--color-surface-elevated)] border border-[var(--color-border)]">
      <Icon className="h-4 w-4 text-[var(--color-foreground-muted)]" />
      <span className="text-base font-semibold tabular-nums">
        {value.toLocaleString()}
      </span>
    </div>
  );
}
