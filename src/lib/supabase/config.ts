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
 *
 * Key naming: projects created before 2025 issue JWT "anon"/"service_role"
 * keys; newer projects issue "publishable" (sb_publishable_...) and "secret"
 * (sb_secret_...) API keys. Both work identically with supabase-js, so we
 * accept either environment variable name. Each candidate must be spelled out
 * as a static process.env member expression so Next.js can inline the
 * NEXT_PUBLIC_* values into client bundles at build time.
 */

export function supabaseUrl(): string | undefined {
  return process.env.NEXT_PUBLIC_SUPABASE_URL;
}

/** Public API key: classic anon JWT or new publishable key. */
export function supabasePublicKey(): string | undefined {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  );
}

/** Server-only privileged key: classic service_role JWT or new secret key. */
export function supabaseSecretKey(): string | undefined {
  return process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;
}

/**
 * True when both public Supabase environment variables are present and
 * non-empty. The privileged key is deliberately NOT required here, but note
 * that in Supabase mode the quote flow and admin actions use the admin client
 * (src/lib/supabase/admin.ts), which performs its own check and needs
 * SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SECRET_KEY) set.
 */
export function isSupabaseConfigured(): boolean {
  const url = supabaseUrl();
  const key = supabasePublicKey();
  const configured =
    typeof url === "string" &&
    url.trim().length > 0 &&
    typeof key === "string" &&
    key.trim().length > 0;
  if (configured) warnIfSecretKeyMissing();
  return configured;
}

let warnedSecretKeyMissing = false;

/**
 * Half-configured Supabase (public keys set, secret key absent) breaks the
 * customer quote flow with a production-masked server-action error, which is
 * miserable to debug. Shout about it once in the server logs instead.
 */
function warnIfSecretKeyMissing(): void {
  if (warnedSecretKeyMissing || typeof window !== "undefined") return;
  if (!supabaseSecretKey()) {
    warnedSecretKeyMissing = true;
    console.warn(
      "[bizim-kargo] Supabase public keys are set but SUPABASE_SECRET_KEY / " +
        "SUPABASE_SERVICE_ROLE_KEY is missing. The customer quote flow and " +
        "admin actions will fail until it is added (Project Settings → API Keys).",
    );
  }
}
