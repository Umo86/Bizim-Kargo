"use server";

/**
 * Admin-only server actions.
 *
 * Every action re-verifies the caller's admin standing itself (the layout
 * guard alone is never trusted) before touching data with the service-role
 * client, which bypasses RLS. In demo mode all mutations refuse to run — the
 * admin area is read-only without Supabase.
 */

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminAccess } from "./guard";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function requireUuid(value: unknown, label: string): string {
  if (typeof value !== "string" || !UUID_RE.test(value)) {
    throw new Error(`Invalid ${label} reference.`);
  }
  return value;
}

/**
 * Throw unless the caller is a signed-in Supabase admin. Demo mode throws a
 * readable "Demo mode" error so the UI can surface it directly.
 */
async function requireSupabaseAdmin(): Promise<void> {
  const access = await getAdminAccess();
  if (!access) {
    throw new Error("You must be signed in as an administrator to do that.");
  }
  if (access.mode === "demo") {
    throw new Error("Demo mode — admin is read-only. Connect Supabase to make changes.");
  }
}

/** Grant or remove a carrier's verified badge. */
export async function setCarrierVerifiedAction(input: {
  carrierId: string;
  verified: boolean;
}): Promise<void> {
  const carrierId = requireUuid(input?.carrierId, "carrier");
  const verified = Boolean(input?.verified);

  await requireSupabaseAdmin();

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("carriers")
    .update({ verified })
    .eq("id", carrierId)
    .select("id");

  if (error) {
    throw new Error(`Could not update the carrier: ${error.message}`);
  }
  if (!data || data.length === 0) {
    throw new Error("Carrier not found.");
  }

  revalidatePath("/admin/carriers");
}

/**
 * Suspend or reactivate a carrier. The carriers table has no suspended flag,
 * so suspension deactivates every service the carrier has — it immediately
 * stops appearing in quotes. Reactivating re-enables all of its services.
 */
export async function setCarrierSuspendedAction(input: {
  carrierId: string;
  suspended: boolean;
}): Promise<void> {
  const carrierId = requireUuid(input?.carrierId, "carrier");
  const suspended = Boolean(input?.suspended);

  await requireSupabaseAdmin();

  const admin = createAdminClient();
  const { error } = await admin
    .from("carrier_services")
    .update({ active: !suspended })
    .eq("carrier_id", carrierId);

  if (error) {
    throw new Error(`Could not update the carrier's services: ${error.message}`);
  }

  revalidatePath("/admin/carriers");
}
