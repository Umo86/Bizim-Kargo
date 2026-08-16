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

export function createAdminClient() {
  // Belt-and-braces: the service-role key must never reach a browser bundle.
  // If this module is ever imported client-side, fail loudly at runtime.
  if (typeof window !== "undefined") {
    throw new Error(
      "createAdminClient() must only be called on the server — it uses the service-role key.",
    );
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Supabase admin client unavailable: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must both be set.",
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
