import { NextIntlClientProvider, hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Nav } from "@/components/nav";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return (
    <NextIntlClientProvider>
      <Nav />
      <main className="flex-1 w-full">{children}</main>
      <footer className="border-t border-[var(--color-border)] py-8 text-center text-xs text-[var(--color-foreground-subtle)]">
        Nurlan © {new Date().getFullYear()}
      </footer>
    </NextIntlClientProvider>
  );
}
