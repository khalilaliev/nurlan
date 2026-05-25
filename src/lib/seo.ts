// SEO helpers shared across every page-level `generateMetadata`.
//
// Single source of truth for site-wide constants (URL, name, social
// handle) and for the URL math that builds canonical + hreflang
// alternates. Pages should never hard-code site origin or duplicate
// hreflang shapes — always come through here.
//
// Why centralise:
//   - Changing the site URL once (e.g. domain move) shouldn't touch
//     20+ metadata blocks
//   - hreflang errors are penalised by Google but easy to typo per-page;
//     one helper means one place to get right
//   - We need locale-correct OpenGraph `locale` codes (ru_RU vs en_US)
//     and those mappings live here

import type { Metadata } from "next";

export const SITE_NAME = "Nurlan";

/**
 * Public site origin, e.g. `https://nurlan.io`. Falls back to localhost
 * for dev. Set NEXT_PUBLIC_SITE_URL in Vercel for both Preview and
 * Production environments — generators (sitemap, canonical URLs) all
 * depend on it being correct.
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const LOCALES = ["en", "ru"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

/**
 * Maps our 2-letter locale to the BCP-47-ish region code OpenGraph
 * wants. Facebook, LinkedIn, and previewers expect `ru_RU` / `en_US`,
 * not bare `ru` / `en`.
 */
export function ogLocale(locale: Locale): string {
  return locale === "ru" ? "ru_RU" : "en_US";
}

/**
 * Build an absolute URL for a given locale + path. The path is the
 * segment AFTER the locale prefix and may be empty for the locale root.
 *
 * Examples:
 *   absoluteUrl("en")                  → https://nurlan.io/en
 *   absoluteUrl("ru", "/story/abc")    → https://nurlan.io/ru/story/abc
 *   absoluteUrl("en", "about")         → https://nurlan.io/en/about
 */
export function absoluteUrl(locale: Locale, path = ""): string {
  const clean = path.replace(/^\/+/, "");
  return `${SITE_URL}/${locale}${clean ? `/${clean}` : ""}`;
}

/**
 * Build the canonical + hreflang alternates block for a page that
 * exists in both locales at the *same* sub-path. The canonical is
 * always the current locale's URL — search engines treat hreflang
 * alternates as equally valid, not as duplicates of the canonical.
 *
 * `x-default` points at the English variant because that's the
 * larger target audience for indexing; Yandex still picks up ru
 * via the `ru` alternate.
 */
export function buildAlternates(
  locale: Locale,
  path = "",
): NonNullable<Metadata["alternates"]> {
  return {
    canonical: absoluteUrl(locale, path),
    languages: {
      en: absoluteUrl("en", path),
      ru: absoluteUrl("ru", path),
      "x-default": absoluteUrl("en", path),
    },
  };
}

/**
 * Build a full metadata block for a "static" page (one whose content
 * doesn't change per request — /about, /contact, /privacy, etc.).
 *
 * Title is left as a plain string so the root layout's
 * `template: "%s · Nurlan"` runs and appends the brand. Pages whose
 * title IS the brand (the home page) should use `title.absolute`
 * directly and bypass this helper.
 */
export function staticPageMetadata({
  locale,
  title,
  description,
  path,
}: {
  locale: Locale;
  title: string;
  description: string;
  path: string;
}): Metadata {
  const alternates = buildAlternates(locale, path);
  return {
    title,
    description,
    alternates,
    openGraph: {
      title,
      description,
      type: "website",
      locale: ogLocale(locale),
      url: alternates.canonical as string,
    },
    twitter: { title, description },
  };
}

/**
 * Truncate plain text for use as a meta description. Google currently
 * shows up to ~155 chars in desktop SERPs; longer values are not
 * penalised but get cut off mid-sentence, which looks bad. We trim
 * on word boundary and add an ellipsis only when actually truncated.
 *
 * Input is expected to be plain text (no HTML). If you have markdown
 * or HTML, strip it before passing in.
 */
export function metaDescription(input: string, max = 155): string {
  const compact = input.replace(/\s+/g, " ").trim();
  if (compact.length <= max) return compact;
  const slice = compact.slice(0, max);
  const lastSpace = slice.lastIndexOf(" ");
  const cut = lastSpace > 0 ? slice.slice(0, lastSpace) : slice;
  return `${cut.trim()}…`;
}
