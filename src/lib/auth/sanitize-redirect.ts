// Validates the `next` query parameter on the OAuth / password-recovery
// callback before redirecting to it. Returns "/" for anything suspicious.
//
// The threat: an attacker crafts a phishing link of the form
//   https://nurlan.app/api/auth/callback?code=...&next=//evil.com
// The victim clicks expecting our site, the callback exchanges the code
// for a recovery session (harmless), then redirects to "(empty)//evil.com"
// which most browsers and Next.js's URL parsing collapse to
// "https://evil.com" — landing the victim on the attacker's clone.
//
// What we accept: relative paths beginning with a single forward slash
// (e.g. "/", "/dashboard", "/story/123?ref=email"). Anything else falls
// through to "/" silently.
//
// Cases this function must reject (manual review list until a test
// runner is added):
//   - null / undefined / ""                  -> "/"
//   - "/dashboard"                           -> "/dashboard"  (passes through)
//   - "//evil.com"                           -> "/"           (protocol-relative)
//   - "/\\evil.com"                          -> "/"           (Windows-style path)
//   - "/path\\with\\backslash"               -> "/"           (any backslash)
//   - "https://evil.com"                     -> "/"           (absolute URL)
//   - "http://evil.com"                      -> "/"
//   - "javascript:alert(1)"                  -> "/"           (no leading slash)
//   - "/path\nwith-newline"                  -> "/"           (CRLF / header inj.)
//   - "/path\rwith-cr"                       -> "/"
//   - "/path\twith-tab"                      -> "/"           (other control chars)
//   - "  /dashboard"                         -> "/"           (leading whitespace)
//   - "ftp:///foo"                           -> "/"
//   - very long input (over MAX_LEN)         -> "/"

const MAX_LEN = 1024;

// Unicode "Control" general category. Covers ASCII C0 (U+0000-U+001F),
// DEL (U+007F), and the C1 range (U+0080-U+009F). Source stays pure
// ASCII because the regex is written with the property-escape syntax;
// no literal control bytes embedded in this file.
const CONTROL_CHARS = /\p{Cc}/u;

export function sanitizeRedirectPath(
  next: string | null | undefined,
): string {
  if (typeof next !== "string") return "/";
  if (next.length === 0 || next.length > MAX_LEN) return "/";

  // No leading whitespace — sanitisers and proxies sometimes strip it,
  // but malicious clients can't rely on that, so reject upfront.
  if (next !== next.trimStart()) return "/";

  // Must be a strictly relative URL anchored at root.
  if (!next.startsWith("/")) return "/";

  // "//evil.com" is protocol-relative: browsers resolve it against the
  // current scheme and treat it as an absolute URL.
  if (next.startsWith("//")) return "/";

  // "/\evil.com" — some URL parsers normalise backslashes to forward
  // slashes, which would re-introduce the protocol-relative attack.
  // Easier to ban all backslashes than enumerate the safe ones.
  if (next.includes("\\")) return "/";

  // Newlines and other control characters can poison logs and, in some
  // older user agents, manipulate how the redirect header is interpreted.
  if (CONTROL_CHARS.test(next)) return "/";

  return next;
}
