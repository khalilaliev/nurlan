import createIntlMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "@/i18n/routing";
import { refreshSupabaseSession } from "@/lib/supabase/middleware";
import { apiLimiter, checkRateLimit, getClientIp } from "@/lib/rate-limit";

const intl = createIntlMiddleware(routing);

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // API routes: coarse per-IP rate limit, then short-circuit. We never
  // want intl middleware running on /api (it would try to add a locale
  // prefix to JSON endpoints) or Supabase session refresh (those routes
  // manage their own auth context).
  if (pathname.startsWith("/api/")) {
    const ip = getClientIp(request.headers);
    const rl = await checkRateLimit(apiLimiter, ip);
    if (!rl.success) {
      const retryAfter = Math.max(
        1,
        Math.ceil((rl.reset - Date.now()) / 1000),
      );
      return new NextResponse("Rate limit exceeded", {
        status: 429,
        headers: {
          "Retry-After": String(retryAfter),
          "X-RateLimit-Limit": String(rl.limit),
          "X-RateLimit-Remaining": String(rl.remaining),
          "X-RateLimit-Reset": String(rl.reset),
        },
      });
    }
    return NextResponse.next();
  }

  // Everything else: locale routing + Supabase session refresh.
  const response = intl(request);
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    await refreshSupabaseSession(request, response);
  }
  return response;
}

export const config = {
  // Run on every request except Next internals and static files. Note
  // the matcher now INCLUDES /api so the rate-limit dispatch above can
  // catch it; the function body decides which sub-middleware to apply.
  matcher: ["/((?!_next|.*\\..*).*)"],
};
