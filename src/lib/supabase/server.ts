/**
 * Server-side Supabase client for Server Components, Server Actions and Route
 * Handlers. Async because Next 15's `cookies()` is async.
 *
 * Create a fresh client per request — never cache it in a module-level
 * variable, or one user's session could leak into another's request.
 */

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

import { supabasePublicKey, supabaseUrl } from "@/lib/supabase/config";

/** The batch shape @supabase/ssr passes to the setAll cookie callback. */
type CookieToSet = { name: string; value: string; options: CookieOptions };

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl()!, supabasePublicKey()!, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // setAll is called from a Server Component, where Next.js forbids
            // writing cookies. Safe to ignore: src/middleware.ts refreshes the
            // session cookie on matched routes.
          }
        },
      },
    },
  );
}
