import createIntlMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";
import { routing } from "@/i18n/routing";
import { refreshSupabaseSession } from "@/lib/supabase/middleware";

const intl = createIntlMiddleware(routing);

export async function middleware(request: NextRequest) {
  const response = intl(request);
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    await refreshSupabaseSession(request, response);
  }
  return response;
}

export const config = {
  // Run on every path except Next internals, API routes, and static files.
  matcher: ["/((?!_next|api|.*\\..*).*)"],
};
