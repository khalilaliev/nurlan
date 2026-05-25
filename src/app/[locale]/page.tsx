import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/guard";
import { StoryCard } from "@/components/story-card";
import { SetupNotice } from "@/components/setup-notice";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { FeedFilters, type FeedSort } from "@/components/feed-filters";
import { Stagger, FadeIn } from "@/components/animated";
import { AnimatedHeadline } from "@/components/animated-headline";
import type { StoryFeedRow } from "@/lib/supabase/types";
import {
  DEFAULT_LOCALE,
  buildAlternates,
  isLocale,
  ogLocale,
  type Locale,
} from "@/lib/seo";

export const dynamic = "force-dynamic";

// Home is the one page that should NOT have the "%s · Nurlan" template
// applied — its title IS the brand line. We use `title.absolute` to opt
// out. Description is short and keyword-rich; the body of the page is
// the real ranking signal.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale: Locale = isLocale(raw) ? raw : DEFAULT_LOCALE;
  const t = await getTranslations({ locale, namespace: "seo" });
  const title = t("homeTitle");
  const description = t("homeDescription");
  return {
    title: { absolute: title },
    description,
    alternates: buildAlternates(locale, ""),
    openGraph: {
      title,
      description,
      type: "website",
      locale: ogLocale(locale),
      url: buildAlternates(locale, "").canonical as string,
    },
    twitter: { title, description },
  };
}

function parseSort(value: string | undefined): FeedSort {
  if (value === "best" || value === "top" || value === "trending") return value;
  return "new";
}

async function fetchFeed(sort: FeedSort): Promise<StoryFeedRow[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const supabase = await createSupabaseServerClient();
    let query = supabase.from("story_feed").select("*").limit(30);

    switch (sort) {
      case "new":
        query = query.order("created_at", { ascending: false });
        break;
      case "best":
        query = query
          .order("reaction_total", { ascending: false })
          .order("created_at", { ascending: false });
        break;
      case "top":
        query = query
          .order("view_count", { ascending: false })
          .order("created_at", { ascending: false });
        break;
      case "trending": {
        const weekAgo = new Date(
          Date.now() - 7 * 24 * 60 * 60 * 1000,
        ).toISOString();
        query = query
          .gte("created_at", weekAgo)
          .order("reaction_total", { ascending: false })
          .order("created_at", { ascending: false });
        break;
      }
    }

    const { data, error } = await query;
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
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ sort?: string }>;
}) {
  const { locale } = await params;
  const { sort: sortParam } = await searchParams;
  const sort = parseSort(sortParam);
  setRequestLocale(locale);
  const t = await getTranslations();
  const stories = await fetchFeed(sort);

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
      <section className="mb-10">
        <AnimatedHeadline
          text={t("brand.tagline")}
          className="text-5xl sm:text-6xl font-semibold tracking-tight mb-4 leading-[1.05]"
        />
        <FadeIn delay={0.5}>
          <p className="text-base text-[var(--color-foreground-muted)] max-w-xl">
            {t("feed.title")}.
          </p>
          <div className="mt-5">
            <Button asChild variant="accent" size="lg">
              <Link href="/submit">✨ {t("nav.submit")}</Link>
            </Button>
          </div>
        </FadeIn>
      </section>

      {!isSupabaseConfigured() && <SetupNotice />}

      <div className="mb-6">
        <FeedFilters active={sort} />
      </div>

      {isSupabaseConfigured() && stories.length === 0 && (
        <p className="text-sm text-[var(--color-foreground-muted)] py-8">
          {t("feed.empty")}
        </p>
      )}

      <Stagger as="ul" className="space-y-4">
        {stories.map((story) => (
          <li key={`${sort}-${story.id}`}>
            <StoryCard story={story} />
          </li>
        ))}
      </Stagger>
    </div>
  );
}
