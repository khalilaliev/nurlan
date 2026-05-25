import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Lock } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/guard";
import { SetupNotice } from "@/components/setup-notice";
import { Card } from "@/components/ui/card";
import { FadeIn, CountUp } from "@/components/animated";
import { FollowButton } from "@/components/follow-button";
import { ShareProfileButton } from "@/components/share-profile-button";
import { MessageButton } from "@/components/message-button";
import { FollowListTrigger } from "@/components/follow-list-modal";
import {
  ProfileTabs,
  type CommentItem,
  type ReactionItem,
} from "@/components/profile-tabs";
import { formatRelativeTime } from "@/lib/utils";
import { FileText, Heart, MessageSquare, Eye } from "lucide-react";
import {
  DEFAULT_LOCALE,
  buildAlternates,
  isLocale,
  ogLocale,
  type Locale,
} from "@/lib/seo";
import type { StoryFeedRow } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

// Profile metadata.
//
// Behaviour:
//   - Profile not found → defaults + noindex (don't index 404-equivalent URLs)
//   - Profile exists but is private → render a generic title with
//     noindex/nofollow so crawlers don't waste budget on a locked page
//   - Profile public → full title (templated), description (bio or
//     fallback), avatar as og:image, canonical + hreflang
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; username: string }>;
}): Promise<Metadata> {
  const { locale: raw, username } = await params;
  const locale: Locale = isLocale(raw) ? raw : DEFAULT_LOCALE;
  const profileT = await getTranslations({ locale, namespace: "profile" });
  const seoT = await getTranslations({ locale, namespace: "seo" });

  const alternates = buildAlternates(locale, `/user/${username}`);
  const url = alternates.canonical as string;

  if (!isSupabaseConfigured()) {
    return {
      title: `@${username}`,
      alternates,
      robots: { index: false, follow: false },
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("username, display_name, bio, avatar_url, is_profile_public")
    .eq("username", username.toLowerCase())
    .maybeSingle();

  if (!profile) {
    return {
      title: `@${username}`,
      alternates,
      robots: { index: false, follow: false },
    };
  }

  if (!profile.is_profile_public) {
    return {
      title: profileT("title", { username: profile.username }),
      alternates,
      robots: { index: false, follow: false },
    };
  }

  const title = profileT("title", { username: profile.username });
  const description =
    profile.bio?.trim() ||
    seoT("profileDefaultDescription", { username: profile.username });

  return {
    title,
    description,
    alternates,
    openGraph: {
      title,
      description,
      type: "profile",
      locale: ogLocale(locale),
      url,
      images: profile.avatar_url ? [{ url: profile.avatar_url }] : undefined,
    },
    twitter: {
      card: profile.avatar_url ? "summary" : "summary",
      title,
      description,
      images: profile.avatar_url ? [profile.avatar_url] : undefined,
    },
  };
}

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ locale: string; username: string }>;
}) {
  const { locale, username } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("profile");

  if (!isSupabaseConfigured()) {
    return (
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
        <SetupNotice />
      </div>
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user: viewer },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "id, username, display_name, bio, avatar_url, created_at, is_profile_public",
    )
    .eq("username", username.toLowerCase())
    .maybeSingle();

  if (!profile) notFound();

  const isOwn = viewer?.id === profile.id;
  const isPrivate = !profile.is_profile_public && !isOwn;

  // Counts — cheap to compute on the profile load.
  const [followersCountRes, followingCountRes, isFollowingRes] =
    await Promise.all([
      supabase
        .from("follows")
        .select("follower_id", { count: "exact", head: true })
        .eq("following_id", profile.id),
      supabase
        .from("follows")
        .select("following_id", { count: "exact", head: true })
        .eq("follower_id", profile.id),
      viewer && !isOwn
        ? supabase
            .from("follows")
            .select("follower_id")
            .eq("follower_id", viewer.id)
            .eq("following_id", profile.id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

  const followersCount = followersCountRes.count ?? 0;
  const followingCount = followingCountRes.count ?? 0;
  const isFollowing = Boolean(isFollowingRes.data);

  let stories: StoryFeedRow[] = [];
  let commentItems: CommentItem[] = [];
  let reactionItems: ReactionItem[] = [];
  let totalReactions = 0;
  let totalCommentsReceived = 0;
  let totalViews = 0;

  if (!isPrivate) {
    const { data: storyRows } = await supabase
      .from("story_feed")
      .select("*")
      .eq("author_id", profile.id)
      .eq("is_anonymous", false)
      .order("created_at", { ascending: false })
      .limit(40);
    stories = (storyRows ?? []) as StoryFeedRow[];

    totalReactions = stories.reduce((s, r) => s + (r.reaction_total ?? 0), 0);
    totalCommentsReceived = stories.reduce(
      (s, r) => s + (r.comment_count ?? 0),
      0,
    );
    totalViews = stories.reduce((s, r) => s + (r.view_count ?? 0), 0);

    // Comments tab: this user's comments (non-anonymous), most recent first,
    // joined with their stories for context.
    const { data: commentRows } = await supabase
      .from("comments")
      .select("id, body, created_at, story_id, is_anonymous")
      .eq("author_id", profile.id)
      .eq("is_anonymous", false)
      .order("created_at", { ascending: false })
      .limit(30);

    const storyIds = Array.from(
      new Set((commentRows ?? []).map((c) => c.story_id)),
    );
    const titleByStoryId = new Map<string, string>();
    if (storyIds.length > 0) {
      const { data: titles } = await supabase
        .from("story_feed")
        .select("id, title")
        .in("id", storyIds);
      for (const row of titles ?? []) titleByStoryId.set(row.id, row.title);
    }

    commentItems = (commentRows ?? [])
      .filter((c) => titleByStoryId.has(c.story_id))
      .map((c) => ({
        id: c.id,
        body: c.body,
        created_at: c.created_at,
        story_id: c.story_id,
        story_title: titleByStoryId.get(c.story_id) ?? "",
      }));

    // Reactions tab: stories this user has reacted to.
    const { data: reactionRows } = await supabase
      .from("reactions")
      .select("type, story_id, created_at")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(30);

    const reactionStoryIds = Array.from(
      new Set((reactionRows ?? []).map((r) => r.story_id)),
    );
    if (reactionStoryIds.length > 0) {
      const { data: reactStories } = await supabase
        .from("story_feed")
        .select("*")
        .in("id", reactionStoryIds);
      const storyById = new Map<string, StoryFeedRow>();
      for (const s of (reactStories ?? []) as StoryFeedRow[]) {
        storyById.set(s.id, s);
      }
      reactionItems = (reactionRows ?? [])
        .filter((r) => storyById.has(r.story_id))
        .map((r) => ({
          story: storyById.get(r.story_id)!,
          type: r.type as string,
        }));
    }
  }

  const displayName = profile.display_name || profile.username;
  const initial = profile.username.slice(0, 1).toUpperCase();

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
      <FadeIn>
        <Card className="relative overflow-hidden p-6 sm:p-8 mb-6">
          <div
            className="pointer-events-none absolute -top-24 -left-24 h-64 w-64 rounded-full bg-[var(--color-accent-soft)] blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-24 -right-16 h-56 w-56 rounded-full bg-orange-500/10 blur-3xl"
            aria-hidden
          />
          <div className="relative flex flex-col sm:flex-row gap-5 sm:items-start">
            <div
              className="h-24 w-24 sm:h-28 sm:w-28 rounded-full bg-gradient-to-br from-[var(--color-accent)] to-orange-500 flex items-center justify-center text-4xl font-semibold text-white shadow-[var(--shadow-glow)] shrink-0 ring-2 ring-white/10"
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
                initial
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-start gap-3 justify-between">
                <div className="min-w-0">
                  <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight gradient-text">
                    {displayName}
                  </h1>
                  <p className="text-sm text-[var(--color-foreground-muted)]">
                    @{profile.username}
                  </p>
                </div>
                {!isOwn && (
                  <div className="flex flex-wrap items-center gap-2">
                    <FollowButton
                      targetUserId={profile.id}
                      initialFollowing={isFollowing}
                      isAuthed={Boolean(viewer)}
                    />
                    <MessageButton />
                    <ShareProfileButton />
                  </div>
                )}
                {isOwn && (
                  <span className="text-xs uppercase tracking-wider font-semibold text-[var(--color-foreground-subtle)] border border-[var(--color-border)] rounded-full px-3 py-1">
                    {t("yourProfile")}
                  </span>
                )}
              </div>
              {profile.bio && (
                <p className="mt-3 text-sm text-[var(--color-foreground-muted)] leading-relaxed max-w-prose">
                  {profile.bio}
                </p>
              )}
              <p className="mt-3 text-xs text-[var(--color-foreground-subtle)]">
                {t("joinedOn")}{" "}
                {formatRelativeTime(profile.created_at, locale)}
              </p>
              <div className="mt-4 flex items-center gap-5">
                <FollowListTrigger
                  userId={profile.id}
                  mode="followers"
                  count={followersCount}
                  label={t("followers")}
                  emptyLabel={t("noFollowers")}
                />
                <FollowListTrigger
                  userId={profile.id}
                  mode="following"
                  count={followingCount}
                  label={t("following")}
                  emptyLabel={t("noFollowing")}
                />
              </div>
            </div>
          </div>

          {!isPrivate && (
            <div className="relative mt-6 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
              <Stat icon={FileText} value={stories.length} label={t("stats.stories")} />
              <Stat icon={Heart} value={totalReactions} label={t("stats.reactions")} />
              <Stat
                icon={MessageSquare}
                value={totalCommentsReceived}
                label={t("stats.comments")}
              />
              <Stat icon={Eye} value={totalViews} label={t("stats.views")} />
            </div>
          )}
        </Card>
      </FadeIn>

      {isPrivate ? (
        <FadeIn delay={0.1}>
          <Card className="p-10 text-center">
            <div className="mx-auto h-14 w-14 rounded-full bg-[var(--color-surface-elevated)] border border-[var(--color-border)] flex items-center justify-center mb-3">
              <Lock className="h-6 w-6 text-[var(--color-foreground-muted)]" />
            </div>
            <h2 className="text-base font-semibold mb-1.5">{t("private")}</h2>
            <p className="text-sm text-[var(--color-foreground-muted)]">
              {t("privateBody")}
            </p>
          </Card>
        </FadeIn>
      ) : (
        <FadeIn delay={0.1}>
          <ProfileTabs
            stories={stories}
            comments={commentItems}
            reactions={reactionItems}
          />
        </FadeIn>
      )}
    </div>
  );
}

function Stat({
  icon: Icon,
  value,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: number;
  label: string;
}) {
  return (
    <div className="flex flex-col gap-1.5 p-3.5 rounded-[var(--radius-lg)] bg-[var(--color-surface-elevated)] border border-[var(--color-border)]">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-semibold text-[var(--color-foreground-subtle)]">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      <CountUp
        to={value}
        className="text-2xl font-semibold tabular-nums tracking-tight"
      />
    </div>
  );
}
