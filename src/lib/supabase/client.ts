/**
 * Browser-side Supabase client (Client Components only).
 *
 * `createBrowserClient` returns a singleton under the hood, so calling this
 * from multiple components is cheap and they all share one auth session.
 * Callers should gate on `isSupabaseConfigured()` (src/lib/supabase/config.ts)
 * before using this in demo mode.
 */

import { createBrowserClient } from "@supabase/ssr";

import { supabasePublicKey, supabaseUrl } from "@/lib/supabase/config";

export function createClient() {
  return createBrowserClient(supabaseUrl()!, supabasePublicKey()!);
}
