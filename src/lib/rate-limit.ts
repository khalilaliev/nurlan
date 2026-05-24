// Rate-limiting infrastructure.
//
// Backed by Upstash Redis (free tier is enough for this app's traffic
// shape — auth + form submits + a handful of server actions). Uses
// @upstash/ratelimit's sliding-window algorithm, which gives strictly
// better burst behaviour than fixed windows without paying for a token-
// bucket counter per key.
//
// ENV CONTRACT
//   UPSTASH_REDIS_REST_URL    e.g. https://xxxx.upstash.io
//   UPSTASH_REDIS_REST_TOKEN  e.g. AYxxxxAA…
//
// In production, both vars are REQUIRED. The module throws on import
// if either is missing — that's intentional: silently disabling rate
// limiting in production is the worst of both worlds. Vercel will fail
// the deploy preflight loudly, which is the desired feedback loop.
//
// In development, missing vars cause a one-time console warning and the
// module returns null limiters. `checkRateLimit` then no-ops with
// success=true, so local dev doesn't require an Upstash account to
// run the app.

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

if (!url || !token) {
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "[rate-limit] UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN " +
      "are required in production. Set them on the Vercel project.",
    );
  }
  // Dev: log once at module load, then silently bypass.
  console.warn(
    "[rate-limit] Upstash credentials not set — rate limiting is " +
    "disabled in this environment. Add UPSTASH_REDIS_REST_URL and " +
    "UPSTASH_REDIS_REST_TOKEN to .env.local to enable.",
  );
}

// Singleton Redis client. Reused across all limiters and across hot
// reloads during dev. The Upstash REST client is connection-less, so
// "singleton" here just means we don't waste fetch-config setup per
// request.
const redis = url && token ? new Redis({ url, token }) : null;

function makeLimiter(name: string, window: Parameters<typeof Ratelimit.slidingWindow>[1], max: number) {
  if (!redis) return null;
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(max, window),
    prefix: `nurlan:rl:${name}`,
    analytics: true, // surfaces request counts on the Upstash dashboard
  });
}

// ─── Named limiters ──────────────────────────────────────────────────────
// Window strings follow Upstash's parser: "10 s", "1 m", "1 h" etc.

export const authLimiter = makeLimiter("auth", "1 m", 10);
export const contactLimiter = makeLimiter("contact", "1 m", 3);
export const newsletterLimiter = makeLimiter("newsletter", "1 m", 3);
export const commentLimiter = makeLimiter("comment", "1 m", 5);
export const storyLimiter = makeLimiter("story", "1 h", 10);
export const searchLimiter = makeLimiter("search", "1 m", 30);
// Coarse middleware fallback. Covers any /api/** request as a defense-
// in-depth layer on top of per-action limits.
export const apiLimiter = makeLimiter("api", "1 m", 60);

// ─── Helpers ─────────────────────────────────────────────────────────────

/**
 * Extract the caller's IP from request headers. Vercel + most reverse
 * proxies populate `x-forwarded-for`. We take the FIRST value (the
 * client) rather than the last (which would be the proxy). Falls back
 * to `x-real-ip`, then to a stable "unknown" sentinel so rate-limit
 * keys are still deterministic when we can't identify the caller.
 *
 * NB: "unknown" means every uniden­tified request shares the same
 * bucket. Acceptable trade-off — we'd rather have a coarse bucket
 * than skip limiting entirely.
 */
export function getClientIp(headers: Headers): string {
  const xff = headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}

export type RateLimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
};

/**
 * Apply a rate-limit check. Always returns a `RateLimitResult` — never
 * throws — so callers can use a simple `if (!result.success)` guard.
 *
 * When the limiter is null (dev without env vars), this no-ops with
 * `success: true` and zero counters. Callers can treat null limiters
 * and successful checks identically.
 */
export async function checkRateLimit(
  limiter: Ratelimit | null,
  identifier: string,
): Promise<RateLimitResult> {
  if (!limiter) {
    return { success: true, limit: 0, remaining: 0, reset: 0 };
  }
  try {
    const { success, limit, remaining, reset } = await limiter.limit(identifier);
    return { success, limit, remaining, reset };
  } catch (err) {
    // Network blip / Upstash outage / etc. — fail OPEN so a transient
    // Redis issue doesn't take down auth and posting. The trade-off is
    // a brief abuse window during an outage; the alternative (fail
    // closed) would lock real users out of the app whenever Upstash is
    // having a bad day. We log to the server console so it's still
    // observable.
    console.error("[rate-limit] check failed, allowing request:", err);
    return { success: true, limit: 0, remaining: 0, reset: 0 };
  }
}
