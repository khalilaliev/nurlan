import { getTranslations, setRequestLocale } from "next-intl/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/guard";
import { StoryCard } from "@/components/story-card";
import { SetupNotice } from "@/components/setup-notice";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import type { StoryFeedRow } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

async function fetchFeed(): Promise<StoryFeedRow[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("story_feed")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(30);
    if (error) {
      console.error("[feed] supabase error:", error.message);
      return [];
    }
    return (data ?? []) as StoryFeedRow[];
  } catch (e) {
    console.error("[feed] fetch failed:", e);
    return [];
  }
}

export default async function FeedPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const stories = await fetchFeed();

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
      <section className="mb-10">
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight gradient-text mb-3">
          {t("brand.tagline")}
        </h1>
        <p className="text-base text-[var(--color-foreground-muted)] max-w-xl">
          {t("feed.title")}.
        </p>
        <div className="mt-5">
          <Button asChild variant="accent" size="lg">
            <Link href="/submit">✨ {t("nav.submit")}</Link>
          </Button>
        </div>
      </section>

      {!isSupabaseConfigured() && <SetupNotice />}

      {isSupabaseConfigured() && stories.length === 0 && (
        <p className="text-sm text-[var(--color-foreground-muted)] py-8">
          {t("feed.empty")}
        </p>
      )}

      <ul className="space-y-4 mt-6">
        {stories.map((story) => (
          <li key={story.id}>
            <StoryCard story={story} />
          </li>
        ))}
      </ul>
    </div>
  );
}
