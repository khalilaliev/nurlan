import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/guard";
import { isCurrentUserAdmin } from "@/lib/supabase/admin-check";
import { SetupNotice } from "@/components/setup-notice";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ReactionBar } from "@/components/reaction-bar";
import { Comments } from "@/components/comments";
import { MediaGallery } from "@/components/media-gallery";
import { AdminStoryActions } from "@/components/admin-story-actions";
import { estimateReadingMinutes, formatRelativeTime } from "@/lib/utils";
import type {
  ReactionType,
  StoryFeedRow,
} from "@/lib/supabase/types";

type CommentNode = {
  id: string;
  body: string;
  author_id: string | null;
  author_username: string;
  is_anonymous: boolean;
  created_at: string;
  upvote_count: number;
  parent_id: string | null;
  children: CommentNode[];
};

function buildTree(
  flat: Array<Omit<CommentNode, "children">>,
): CommentNode[] {
  const byId = new Map<string, CommentNode>();
  const roots: CommentNode[] = [];
  for (const c of flat) byId.set(c.id, { ...c, children: [] });
  for (const node of byId.values()) {
    if (node.parent_id && byId.has(node.parent_id)) {
      byId.get(node.parent_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}

export default async function StoryPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  if (!isSupabaseConfigured()) {
    return (
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
        <SetupNotice />
      </div>
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isAdmin = await isCurrentUserAdmin();

  let story: StoryFeedRow | null = null;
  let storyStatus: "published" | "flagged" | "removed" | "draft" = "published";
  let isFeatured = false;

  const feedRes = await supabase
    .from("story_feed")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (feedRes.data) {
    story = feedRes.data as StoryFeedRow;
    storyStatus = story.status;
    isFeatured = story.is_featured;
  } else if (isAdmin || user) {
    const raw = await supabase
      .from("stories")
      .select(
        "id, title, body, category_slug, tags, is_anonymous, status, media_urls, ai_score, view_count, is_featured, language, created_at, author_id",
      )
      .eq("id", id)
      .maybeSingle();
    if (raw.data && (isAdmin || raw.data.author_id === user?.id)) {
      const [catRes, authorRes] = await Promise.all([
        supabase
          .from("categories")
          .select("name_en, name_ru, emoji")
          .eq("slug", raw.data.category_slug)
          .maybeSingle(),
        supabase
          .from("profiles")
          .select("username, avatar_url")
          .eq("id", raw.data.author_id)
          .maybeSingle(),
      ]);
      story = {
        ...raw.data,
        category_name_en: catRes.data?.name_en ?? "",
        category_name_ru: catRes.data?.name_ru ?? "",
        category_emoji: catRes.data?.emoji ?? null,
        author_username: raw.data.is_anonymous
          ? "Anonymous"
          : authorRes.data?.username ?? "user",
        author_avatar: raw.data.is_anonymous
          ? null
          : authorRes.data?.avatar_url ?? null,
        reaction_total: 0,
        comment_count: 0,
        reaction_breakdown: {},
      } as StoryFeedRow;
      storyStatus = raw.data.status;
      isFeatured = raw.data.is_featured;
    }
  }

  if (!story) notFound();
  const s = story;

  const { data: commentRows } = await supabase
    .from("comments")
    .select("id, body, parent_id, is_anonymous, created_at, upvote_count, author_id")
    .eq("story_id", id)
    .order("created_at", { ascending: true });

  const authorIds = Array.from(
    new Set((commentRows ?? []).map((c) => c.author_id).filter(Boolean)),
  );
  const usernameById = new Map<string, string>();
  if (authorIds.length > 0) {
    const { data: profs } = await supabase
      .from("profiles")
      .select("id, username")
      .in("id", authorIds);
    for (const p of profs ?? []) usernameById.set(p.id, p.username);
  }

  const commentTree = buildTree(
    (commentRows ?? []).map((c) => ({
      id: c.id,
      body: c.body,
      parent_id: c.parent_id,
      is_anonymous: c.is_anonymous,
      created_at: c.created_at,
      upvote_count: c.upvote_count ?? 0,
      author_id: c.author_id,
      author_username: c.is_anonymous
        ? "anonymous"
        : usernameById.get(c.author_id) ?? "user",
    })),
  );

  let userReactions: ReactionType[] = [];
  if (user) {
    const { data: mine } = await supabase
      .from("reactions")
      .select("type")
      .eq("story_id", id)
      .eq("user_id", user.id);
    userReactions = (mine ?? []).map((r) => r.type as ReactionType);
  }

  const minutes = estimateReadingMinutes(s.body);
  const categoryName =
    locale === "ru" ? s.category_name_ru : s.category_name_en;

  return (
    <article className="mx-auto max-w-6xl px-4 sm:px-6 py-10 grid gap-8 lg:grid-cols-[1fr_320px]">
      <div className="min-w-0">
        {storyStatus === "removed" && (
          <div className="mb-5 rounded-[var(--radius-lg)] border border-[var(--color-accent)]/30 bg-[var(--color-accent-soft)]/40 p-4 text-sm text-[var(--color-accent)]">
            ⚠ {t("admin.removedNotice")}
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2 mb-4 text-xs">
          <Badge>
            <span>{s.category_emoji}</span>
            <span>{categoryName}</span>
          </Badge>
          <span className="text-[var(--color-foreground-subtle)]">
            {formatRelativeTime(s.created_at, locale)}
          </span>
          <span className="text-[var(--color-foreground-subtle)]">
            · {minutes} {t("story.minRead")}
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight leading-tight mb-3 gradient-text">
          {s.title}
        </h1>
        <div className="mb-8 text-sm text-[var(--color-foreground-muted)]">
          {t("story.by")}{" "}
          <span className="text-[var(--color-foreground)] font-medium">
            {s.is_anonymous ? t("story.anonymous") : `@${s.author_username}`}
          </span>
        </div>

        {s.media_urls && s.media_urls.length > 0 && (
          <div className="mb-8">
            <MediaGallery urls={s.media_urls} />
          </div>
        )}

        <div className="prose-content text-[var(--color-foreground)] leading-[1.8] text-base whitespace-pre-wrap">
          {s.body}
        </div>

        {s.tags.length > 0 && (
          <div className="mt-8 flex flex-wrap gap-2">
            {s.tags.map((tag) => (
              <Badge key={tag}>#{tag}</Badge>
            ))}
          </div>
        )}

        <hr className="my-10 border-[var(--color-border)]" />

        <section>
          <h2 className="text-lg font-semibold mb-4">
            {t("story.commentsTitle")}
          </h2>
          <Comments
            storyId={s.id}
            comments={commentTree}
            isAuthed={Boolean(user)}
            currentUserId={user?.id ?? null}
            isAdmin={isAdmin}
          />
        </section>
      </div>

      <aside className="lg:sticky lg:top-20 lg:self-start space-y-4">
        {isAdmin && (
          <AdminStoryActions
            storyId={s.id}
            initialStatus={storyStatus}
            initialFeatured={isFeatured}
          />
        )}
        <Card className="p-5">
          <h3 className="text-sm font-semibold mb-3">
            {t("story.reactionsTitle")}
          </h3>
          <ReactionBar
            storyId={s.id}
            counts={s.reaction_breakdown}
            userReactions={userReactions}
            isAuthed={Boolean(user)}
          />
        </Card>

        {s.ai_score && (
          <Card className="p-5">
            <h3 className="text-sm font-semibold mb-3">{t("story.aiScore")}</h3>
            <dl className="space-y-2 text-xs text-[var(--color-foreground-muted)]">
              {typeof s.ai_score.emotion_score === "number" && (
                <div className="flex justify-between">
                  <dt>Emotion</dt>
                  <dd>{s.ai_score.emotion_score}</dd>
                </div>
              )}
              {typeof s.ai_score.drama_level === "number" && (
                <div className="flex justify-between">
                  <dt>Drama</dt>
                  <dd>{s.ai_score.drama_level}</dd>
                </div>
              )}
              {typeof s.ai_score.viral_potential === "number" && (
                <div className="flex justify-between">
                  <dt>Viral potential</dt>
                  <dd>{s.ai_score.viral_potential}</dd>
                </div>
              )}
              {s.ai_score.believability && (
                <div className="flex justify-between">
                  <dt>Believability</dt>
                  <dd>{s.ai_score.believability}</dd>
                </div>
              )}
            </dl>
          </Card>
        )}
      </aside>
    </article>
  );
}
