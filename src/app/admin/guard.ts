/**
 * Admin access resolution — SERVER ONLY.
 *
 * The admin area runs in two modes:
 *  - Supabase mode: the caller must be signed in AND their profiles.role must
 *    be 'admin'. Anyone else gets null (the layout redirects, actions throw).
 *  - Demo mode (no Supabase env vars): the area is open but strictly
 *    read-only — every mutating action refuses to run.
 *
 * Used by the /admin layout for the page guard and re-invoked inside every
 * admin server action, so a mutation can never rely on the layout alone.
 */

import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export type AdminAccess =
  | { mode: "demo" }
  | { mode: "supabase"; userId: string };

/** Resolve the caller's admin standing. Null = not an admin (or signed out). */
export async function getAdminAccess(): Promise<AdminAccess | null> {
  if (!isSupabaseConfigured()) {
    return { mode: "demo" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // profiles is readable by its owner under RLS, so the anon-key server
  // client can check the caller's own role.
  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !data || (data as { role: string }).role !== "admin") {
    return null;
  }
  return { mode: "supabase", userId: user.id };
}
