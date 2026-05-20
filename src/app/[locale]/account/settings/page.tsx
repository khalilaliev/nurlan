import { setRequestLocale } from "next-intl/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SettingsForms } from "./settings-forms";

export const dynamic = "force-dynamic";

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, display_name, bio, avatar_url, is_profile_public")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) return null;

  return (
    <SettingsForms
      profile={profile}
      currentEmail={user.email ?? ""}
      userId={user.id}
    />
  );
}
