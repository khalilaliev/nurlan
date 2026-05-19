import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isCurrentUserAdmin } from "@/lib/supabase/admin-check";
import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/search-bar";
import { AccountMenu } from "@/components/account-menu";
import { NavMount } from "@/components/nav-mount";

async function getCurrentProfile() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return null;
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;
    const { data: profile } = await supabase
      .from("profiles")
      .select("username, avatar_url")
      .eq("id", user.id)
      .maybeSingle();
    return {
      id: user.id,
      email: user.email ?? "",
      username: profile?.username ?? user.email?.split("@")[0] ?? "user",
      avatar_url: profile?.avatar_url ?? null,
    };
  } catch {
    return null;
  }
}

export async function Nav() {
  const t = await getTranslations("nav");
  const profile = await getCurrentProfile();
  const isAdmin = profile ? await isCurrentUserAdmin() : false;

  return (
    <NavMount>
      <header className="sticky top-0 z-40 glass border-b border-[var(--color-border)]">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 sm:gap-6 px-4 sm:px-6">
          <Link
            href="/"
            className="flex items-center gap-2 group shrink-0"
          >
            <span className="text-xl font-semibold gradient-text tracking-tight">
              nurlan
            </span>
            <span className="hidden md:inline text-xs text-[var(--color-foreground-subtle)] transition-opacity group-hover:opacity-70">
              stories
            </span>
          </Link>

          <div className="flex-1 flex justify-center min-w-0">
            <SearchBar />
          </div>

          <nav className="flex items-center gap-2 shrink-0">
            <Button
              asChild
              variant="accent"
              size="sm"
              className="hidden sm:inline-flex"
            >
              <Link href="/submit">✨ {t("submit")}</Link>
            </Button>
            {profile ? (
              <AccountMenu
                username={profile.username}
                email={profile.email}
                avatarUrl={profile.avatar_url}
                isAdmin={isAdmin}
              />
            ) : (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/login">{t("login")}</Link>
                </Button>
                <Button
                  asChild
                  variant="subtle"
                  size="sm"
                  className="hidden sm:inline-flex"
                >
                  <Link href="/signup">{t("signup")}</Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      </header>
    </NavMount>
  );
}
