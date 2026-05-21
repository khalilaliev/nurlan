import type { Metadata } from "next";
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
