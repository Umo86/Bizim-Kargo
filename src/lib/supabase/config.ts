/**
 * Supabase configuration detection.
 *
 * Bizim Kargo runs in two modes:
 *  - configured: quotes/leads persist to Supabase and carrier auth works;
 *  - demo:       no Supabase env vars — the app serves the in-memory dataset
 *                from src/lib/demo-data.ts and skips persistence entirely.
 *
 * Keep this module dependency-free: it is imported by the middleware (edge
 * runtime) and by both server and browser code.
 */

/**
 * True when both public Supabase environment variables are present and
 * non-empty. The service-role key is deliberately NOT required here, but note
 * that in Supabase mode the quote flow and admin actions use the admin client
 * (src/lib/supabase/admin.ts), which performs its own check and needs
 * SUPABASE_SERVICE_ROLE_KEY set.
 */
export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return (
    typeof url === "string" &&
    url.trim().length > 0 &&
    typeof anonKey === "string" &&
    anonKey.trim().length > 0
  );
}
