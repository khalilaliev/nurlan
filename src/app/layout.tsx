import type { Metadata, Viewport } from "next";
import { Montserrat, JetBrains_Mono } from "next/font/google";
import NextTopLoader from "nextjs-toploader";
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

export const metadata: Metadata = {
  title: { default: "Nurlan — Stories that hit", template: "%s · Nurlan" },
  description:
    "A storytelling social network for the most interesting human experiences online.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ),
};

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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const themeScript = `(function(){try{var t=localStorage.getItem('theme');if(!t){t=window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';}document.documentElement.dataset.theme=t;}catch(e){}})();`;

  return (
    <html
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
