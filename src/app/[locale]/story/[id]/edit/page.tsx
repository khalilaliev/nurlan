import { notFound, redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/guard";
import { EditStoryForm } from "./edit-form";

export default async function EditStoryPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("submit");

  if (!isSupabaseConfigured()) notFound();

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login`);

  const { data: story } = await supabase
    .from("stories")
    .select(
      "id, author_id, title, body, category_slug, tags, is_anonymous, media_urls",
    )
    .eq("id", id)
    .maybeSingle();
  if (!story) notFound();

  // Author-only. Admins get nothing here; they have their own moderation path.
  if (story.author_id !== user.id) redirect(`/${locale}/story/${id}`);

  const { data: categories } = await supabase
    .from("categories")
    .select("slug, name_en, name_ru, emoji")
    .order("display_order", { ascending: true });

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-10">
      <header className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight gradient-text mb-2">
          {t("editTitle")}
        </h1>
        <p className="text-sm text-[var(--color-foreground-muted)]">
          {t("editSubtitle")}
        </p>
      </header>

      <EditStoryForm
        storyId={story.id}
        userId={user.id}
        categories={(categories ?? []).map((c) => ({
          slug: c.slug,
          name: locale === "ru" ? c.name_ru : c.name_en,
          emoji: c.emoji ?? "",
        }))}
        initial={{
          title: story.title,
          body: story.body,
          category_slug: story.category_slug,
          tags: (story.tags ?? []).join(", "),
          is_anonymous: story.is_anonymous,
          media_urls: story.media_urls ?? [],
        }}
      />
    </div>
  );
}
