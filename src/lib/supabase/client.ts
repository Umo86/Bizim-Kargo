/**
 * Browser-side Supabase client (Client Components only).
 *
 * `createBrowserClient` returns a singleton under the hood, so calling this
 * from multiple components is cheap and they all share one auth session.
 * Callers should gate on `isSupabaseConfigured()` (src/lib/supabase/config.ts)
 * before using this in demo mode.
 */

import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
