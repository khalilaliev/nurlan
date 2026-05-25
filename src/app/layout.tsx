import type { Metadata, Viewport } from "next";
import { Montserrat, JetBrains_Mono } from "next/font/google";
import { getLocale, getTranslations } from "next-intl/server";
import NextTopLoader from "nextjs-toploader";
import {
  DEFAULT_LOCALE,
  SITE_NAME,
  SITE_URL,
  isLocale,
  ogLocale,
  type Locale,
} from "@/lib/seo";
import "./globals.css";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

const mono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

// Resolve the current locale safely. `getLocale()` works for any route
// passed through next-intl middleware. For routes outside that scope
// (theoretically none in this app — middleware matches everything but
// _next and static files) we fall back to the default.
async function resolveLocale(): Promise<Locale> {
  const raw = await getLocale();
  return isLocale(raw) ? raw : DEFAULT_LOCALE;
}

// Site-wide metadata. Per-page metadata in sub-routes overrides
// title/description; the OpenGraph and Twitter defaults below cascade
// down unless explicitly replaced.
//
// Verification meta tags only render when their env vars are set,
// which is how Next.js's `verification` field works — passing
// undefined is a no-op.
export async function generateMetadata(): Promise<Metadata> {
  const locale = await resolveLocale();
  const t = await getTranslations({ locale, namespace: "seo" });

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: t("defaultTitle"),
      template: `%s · ${SITE_NAME}`,
    },
    description: t("defaultDescription"),
    applicationName: SITE_NAME,
    openGraph: {
      siteName: SITE_NAME,
      locale: ogLocale(locale),
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
    },
    verification: {
      google: process.env.GOOGLE_SITE_VERIFICATION,
      yandex: process.env.YANDEX_VERIFICATION,
    },
  };
}

// Tints the iOS Safari status bar + bottom toolbar (and Android Chrome
// address bar) to match the page background. Without this, those areas
// fall back to white in both light and dark themes, producing the
// "white strip above the dark page" effect.
//
// The two colors come from globals.css:
//   --color-background: #faf9f7   (light)
//   --color-background: #07070a   (dark)
//
// Caveat: prefers-color-scheme follows the OS, not localStorage. If a
// user OS-light but manually toggled the app to dark via the in-app
// theme switch, the chrome will still be light until they reload (or
// we add a tiny client-side updater). Good-enough fix for the
// majority case.
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf9f7" },
    { media: "(prefers-color-scheme: dark)", color: "#07070a" },
  ],
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await resolveLocale();
  const themeScript = `(function(){try{var t=localStorage.getItem('theme');if(!t){t=window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';}document.documentElement.dataset.theme=t;}catch(e){}})();`;

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${montserrat.variable} ${mono.variable} h-full`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full flex flex-col antialiased">
        {/* GitHub-style top progress bar shown during route navigation.
            Rendered before children so it stacks above everything in the
            normal flow (it portals to body internally as well). */}
        <NextTopLoader
          color="#e11d48"
          height={3}
          showSpinner={false}
          shadow="0 0 12px #e11d48, 0 0 6px #e11d48"
          speed={250}
          easing="cubic-bezier(0.22, 1, 0.36, 1)"
          crawlSpeed={180}
          initialPosition={0.12}
          zIndex={2147483647}
        />
        {children}
      </body>
    </html>
  );
}
