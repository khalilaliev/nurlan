import { getTranslations, setRequestLocale } from "next-intl/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { FadeIn, Stagger, CountUp } from "@/components/animated";
import { formatRelativeTime } from "@/lib/utils";
import { FileText, Heart, MessageCircle, Eye, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AccountOverviewPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("account");

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, display_name, bio, avatar_url, created_at")
    .eq("id", user.id)
    .maybeSingle();

  const { data: myStories } = await supabase
    .from("stories")
    .select("id, view_count")
    .eq("author_id", user.id);

  const storyIds = (myStories ?? []).map((s) => s.id);
  const totalViews = (myStories ?? []).reduce((sum, s) => sum + (s.view_count ?? 0), 0);

  let reactionCount = 0;
  let commentCount = 0;
  if (storyIds.length > 0) {
    const [{ count: rc }, { count: cc }] = await Promise.all([
      supabase
        .from("reactions")
        .select("id", { count: "exact", head: true })
        .in("story_id", storyIds),
      supabase
        .from("comments")
        .select("id", { count: "exact", head: true })
        .in("story_id", storyIds),
    ]);
    reactionCount = rc ?? 0;
    commentCount = cc ?? 0;
  }

  const { data: recentStories } = await supabase
    .from("story_feed")
    .select("id, title, created_at, reaction_total, comment_count, view_count")
    .eq("author_id", user.id)
    .order("created_at", { ascending: false })
    .limit(3);

  const stats = [
    { key: "stories", value: storyIds.length, Icon: FileText, accent: "from-rose-500/30 to-rose-500/0" },
    { key: "reactionsReceived", value: reactionCount, Icon: Heart, accent: "from-pink-500/30 to-pink-500/0" },
    { key: "commentsReceived", value: commentCount, Icon: MessageCircle, accent: "from-indigo-500/30 to-indigo-500/0" },
    { key: "totalViews", value: totalViews, Icon: Eye, accent: "from-amber-500/30 to-amber-500/0" },
  ] as const;

  const displayName = profile?.display_name || profile?.username || "—";

  return (
    <div className="space-y-8">
      <FadeIn>
      <Card className="relative overflow-hidden p-6 sm:p-8">
        <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-[var(--color-accent-soft)] blur-3xl pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row gap-5 sm:items-center">
          <div
            className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-gradient-to-br from-[var(--color-accent)] to-orange-500 flex items-center justify-center text-2xl font-semibold text-white shadow-[var(--shadow-glow)] shrink-0"
            aria-hidden
          >
            {profile?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatar_url}
                alt=""
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              (profile?.username ?? "?").slice(0, 1).toUpperCase()
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">
              {displayName}
            </h2>
            {profile?.username && (
              <p className="text-sm text-[var(--color-foreground-muted)]">
                @{profile.username}
              </p>
            )}
            {profile?.bio && (
              <p className="mt-2 text-sm text-[var(--color-foreground-muted)] leading-relaxed">
                {profile.bio}
              </p>
            )}
            {profile?.created_at && (
              <p className="mt-3 text-xs text-[var(--color-foreground-subtle)]">
                {t("memberSince")} {formatRelativeTime(profile.created_at, locale)}
              </p>
            )}
          </div>
          {profile?.username && (
            <Button asChild variant="outline" size="sm" className="self-start">
              <Link href={`/user/${profile.username}`}>
                {t("publicProfile.stories")} →
              </Link>
            </Button>
          )}
        </div>
      </Card>
      </FadeIn>

      <Stagger
        as="div"
        className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
      >
        {stats.map((s) => (
          <Card
            key={s.key}
            className="relative overflow-hidden p-5 hover:border-[var(--color-border-strong)] hover:-translate-y-0.5 transition-all duration-200"
          >
            <div
              className={`absolute inset-0 bg-gradient-to-br ${s.accent} opacity-60 pointer-events-none`}
            />
            <div className="relative">
              <s.Icon className="h-4 w-4 text-[var(--color-foreground-muted)] mb-3" />
              <CountUp
                to={s.value}
                duration={1.2}
                className="block text-3xl font-semibold tracking-tight tabular-nums"
              />
              <div className="mt-1 text-xs uppercase tracking-wider text-[var(--color-foreground-subtle)]">
                {t(`stats.${s.key}`)}
              </div>
            </div>
          </Card>
        ))}
      </Stagger>

      <FadeIn delay={0.15}>
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold">{t("stories.title")}</h3>
          <Link
            href="/account/stories"
            className="text-xs text-[var(--color-foreground-muted)] hover:text-[var(--color-foreground)] flex items-center gap-1"
          >
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        {recentStories && recentStories.length > 0 ? (
          <ul className="divide-y divide-[var(--color-border)]">
            {recentStories.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/story/${s.id}`}
                  className="flex items-center gap-4 py-3 group"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-sm group-hover:text-[var(--color-accent)] transition-colors truncate">
                      {s.title}
                    </div>
                    <div className="text-xs text-[var(--color-foreground-subtle)] mt-0.5">
                      {formatRelativeTime(s.created_at, locale)}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-[var(--color-foreground-muted)] tabular-nums">
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {s.view_count}
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="h-3 w-3" />
                      {s.reaction_total}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="h-3 w-3" />
                      {s.comment_count}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-10">
            <p className="text-sm text-[var(--color-foreground-muted)] mb-4">
              {t("stories.empty")}
            </p>
            <Button asChild variant="accent" size="sm">
              <Link href="/submit">{t("stories.writeOne")}</Link>
            </Button>
          </div>
        )}
      </Card>
      </FadeIn>
    </div>
  );
}
