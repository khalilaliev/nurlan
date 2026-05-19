import { getTranslations, setRequestLocale } from "next-intl/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { StoryRow } from "./story-row";

export const dynamic = "force-dynamic";

export default async function MyStoriesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("account.stories");

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: stories } = await supabase
    .from("story_feed")
    .select(
      "id, title, created_at, view_count, reaction_total, comment_count, category_emoji, category_name_en, category_name_ru",
    )
    .eq("author_id", user.id)
    .order("created_at", { ascending: false });

  const list = stories ?? [];

  if (list.length === 0) {
    return (
      <Card className="p-10 text-center">
        <p className="text-sm text-[var(--color-foreground-muted)] mb-5">
          {t("empty")}
        </p>
        <Button asChild variant="accent">
          <Link href="/submit">✨ {t("writeOne")}</Link>
        </Button>
      </Card>
    );
  }

  return (
    <ul className="space-y-3">
      {list.map((s) => (
        <StoryRow key={s.id} story={s} />
      ))}
    </ul>
  );
}
