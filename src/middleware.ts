/**
 * Session-refresh middleware.
 *
 * Supabase auth tokens are short-lived; this middleware refreshes the session
 * cookie on every request to an authenticated area so Server Components always
 * see a valid session. In demo mode (no Supabase env vars) it is a pure
 * pass-through.
 *
 * Route protection itself (redirecting signed-out users) is handled in the
 * /carrier and /admin layouts — the middleware's only job is cookie refresh.
 */

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { isSupabaseConfigured } from "@/lib/supabase/config";

/** The batch shape @supabase/ssr passes to the setAll cookie callback. */
type CookieToSet = { name: string; value: string; options: CookieOptions };

export async function middleware(request: NextRequest) {
  // Demo mode: nothing to refresh — let the request straight through.
  if (!isSupabaseConfigured()) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          // Write refreshed tokens onto the incoming request (so downstream
          // server code sees them) and rebuild the response carrying them
          // back to the browser.
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // getUser() validates the JWT with Supabase and triggers the token refresh
  // that setAll above persists. The result is intentionally unused here.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  // Only authenticated areas need session refresh; public pages (homepage,
  // quote flow, directory) work anonymously and skip the round-trip.
  matcher: ["/carrier/:path*", "/admin/:path*"],
};
