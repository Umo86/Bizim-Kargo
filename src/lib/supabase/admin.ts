/**
 * Service-role Supabase client — SERVER ONLY.
 *
 * This client bypasses row level security entirely. Use it exclusively inside
 * server actions / route handlers for trusted operations RLS cannot express,
 * e.g. attaching computed results to an anonymous quote, or admin tooling.
 * Never pass this client (or anything derived from its queries, unfiltered)
 * to the browser.
 */

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import { supabaseSecretKey, supabaseUrl } from "@/lib/supabase/config";

export function createAdminClient() {
  // Belt-and-braces: the service-role key must never reach a browser bundle.
  // If this module is ever imported client-side, fail loudly at runtime.
  if (typeof window !== "undefined") {
    throw new Error(
      "createAdminClient() must only be called on the server — it uses the service-role key.",
    );
  }

  const url = supabaseUrl();
  const serviceRoleKey = supabaseSecretKey();

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Supabase admin client unavailable: set NEXT_PUBLIC_SUPABASE_URL plus SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SECRET_KEY for new-style sb_secret keys).",
    );
  }

  return createSupabaseClient(url, serviceRoleKey, {
    auth: {
      // Server-to-server usage: no session persistence or token refresh.
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
