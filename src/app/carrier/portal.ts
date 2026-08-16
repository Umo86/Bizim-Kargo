/**
 * Server-only helpers shared by the carrier portal pages and actions.
 *
 * Everything here mirrors the Supabase/demo split from src/lib/data.ts:
 * demo mode serves the first demo carrier with its seeded services so every
 * portal page renders without any environment variables.
 *
 * NOT a "use server" module — these are plain server-side functions imported
 * by Server Components and by src/app/carrier/actions.ts. Never import from
 * client components.
 */

import type { User } from "@supabase/supabase-js";

import { getCarrierByOwner, rowToService } from "@/lib/data";
import { DEMO_CARRIERS, DEMO_SERVICES } from "@/lib/demo-data";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import type { Carrier, CarrierService } from "@/lib/types";

/** True when the app runs without Supabase (the in-memory demo dataset). */
export function isDemoMode(): boolean {
  return !isSupabaseConfigured();
}

/** The signed-in Supabase user, or null (always null in demo mode). */
export async function getSessionUser(): Promise<User | null> {
  if (isDemoMode()) return null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 * The carrier the current request acts as: the signed-in user's carrier
 * profile in Supabase mode, the first demo carrier in demo mode. Null means
 * nobody is signed in, or the signed-in user has no carrier profile yet.
 */
export async function getPortalCarrier(): Promise<Carrier | null> {
  if (isDemoMode()) return DEMO_CARRIERS[0] ?? null;
  const user = await getSessionUser();
  if (!user) return null;
  return getCarrierByOwner(user.id);
}

/**
 * All of a carrier's services (active and inactive), tiers and zones included,
 * sorted by name for a stable listing.
 */
export async function getPortalServices(carrierId: string): Promise<CarrierService[]> {
  if (isDemoMode()) {
    return DEMO_SERVICES.filter((service) => service.carrierId === carrierId).sort(
      (a, b) => a.name.localeCompare(b.name),
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("carrier_services")
    .select("*, carriers(*), rate_tiers(*), zone_surcharges(*)")
    .eq("carrier_id", carrierId)
    .order("name");

  if (error) {
    throw new Error(`Could not load your rate cards: ${error.message}`);
  }

  type ServiceRow = Parameters<typeof rowToService>[0];
  return ((data ?? []) as ServiceRow[]).map(rowToService);
}
