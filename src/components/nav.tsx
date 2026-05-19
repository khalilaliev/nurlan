import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { signOut } from "@/app/actions/auth";

async function getCurrentUser() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return null;
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  } catch {
    return null;
  }
}

export async function Nav() {
  const t = await getTranslations("nav");
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-40 glass border-b border-[var(--color-border)]">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 group">
          <span className="text-lg font-semibold gradient-text tracking-tight">
            nurlan
          </span>
          <span className="hidden sm:inline text-xs text-[var(--color-foreground-subtle)] transition-opacity group-hover:opacity-70">
            stories
          </span>
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/">{t("feed")}</Link>
          </Button>
          <Button asChild variant="accent" size="sm" className="hidden sm:inline-flex">
            <Link href="/submit">{t("submit")}</Link>
          </Button>
          <LocaleSwitcher />
          {user ? (
            <form action={signOut}>
              <Button type="submit" variant="ghost" size="sm">
                {t("logout")}
              </Button>
            </form>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">{t("login")}</Link>
              </Button>
              <Button asChild variant="subtle" size="sm" className="hidden sm:inline-flex">
                <Link href="/signup">{t("signup")}</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
