"use server";

/**
 * Carrier-portal server actions: profile creation after Supabase signup, the
 * rate-wizard publish, the rate-card active toggle and profile edits.
 *
 * Every action re-validates its input server-side and throws readable,
 * British-English error messages the forms surface directly. Demo mode is
 * read-only: mutating actions throw a friendly explanation (the UI disables
 * them anyway).
 *
 * "use server" module — only async functions are exported at runtime; input
 * shapes are exported type-only.
 */

import { revalidatePath } from "next/cache";

import {
  createCarrierWithService,
  getCarrierByOwner,
  type NewCarrierInput,
  type NewServiceInput,
} from "@/lib/data";
import { priceForQuantity } from "@/lib/pricing";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import {
  COUNTRIES,
  SERVICE_TYPE_LABELS,
  type CountryCode,
  type PricingUnit,
  type RateTier,
  type ServiceType,
  type TransportMode,
  type ZoneCode,
  type ZoneSurcharge,
} from "@/lib/types";
import { TR_ZONES, UK_ZONES } from "@/lib/zones";

// ---------------------------------------------------------------------------
// Input shapes (type-only exports — stripped at runtime)
// ---------------------------------------------------------------------------

export type CarrierProfileInput = {
  companyName: string;
  blurb: string;
  baseCountry: CountryCode;
  contactEmail: string;
  contactPhone: string;
  yearsOperating?: number | null;
};

export type UpdateCarrierProfileInput = {
  companyName: string;
  blurb: string;
  contactEmail: string;
  contactPhone: string;
  yearsOperating?: number | null;
};

export type SaveServicePayload = {
  serviceType: ServiceType;
  origin: CountryCode;
  destination: CountryCode;
  mode: TransportMode;
  name: string;
  transitDaysMin: number;
  transitDaysMax: number;
  volumetricDivisor: number;
  minCharge: number;
  /** Fractions, e.g. 0.12 = 12%. */
  fuelPct: number;
  customsFee: number;
  collectionFee: number;
  deliveryFee: number;
  residentialFee: number;
  insurancePct: number;
  insuranceMin: number;
  maxWeightKg: number | null;
  maxDimCm: number | null;
  /** Empty for vehicle services (priced on request). */
  tiers: RateTier[];
  zones: ZoneSurcharge[];
};

// ---------------------------------------------------------------------------
// Module-private validation helpers
// ---------------------------------------------------------------------------

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function requireUuid(value: unknown, label: string): string {
  if (typeof value !== "string" || !UUID_RE.test(value)) {
    throw new Error(`Invalid ${label} reference.`);
  }
  return value;
}

function requireText(value: unknown, label: string, maxLength: number): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`Please provide ${label}.`);
  }
  const trimmed = value.trim();
  if (trimmed.length > maxLength) {
    throw new Error(`${label[0]?.toUpperCase()}${label.slice(1)} is too long.`);
  }
  return trimmed;
}

function requireNumber(
  value: unknown,
  label: string,
  min: number,
  max: number,
): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n < min || n > max) {
    throw new Error(`Please enter ${label} between ${min} and ${max}.`);
  }
  return n;
}

function optionalYears(value: unknown): number | null {
  if (value === undefined || value === null || value === "") return null;
  const n = Number(value);
  if (!Number.isInteger(n) || n < 0 || n > 150) {
    throw new Error("Please enter years operating as a whole number (0–150).");
  }
  return n;
}

function requireEmail(value: unknown, label: string): string {
  const email = requireText(value, label, 254);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Please enter a valid email address.");
  }
  return email;
}

function isCountryCode(value: unknown): value is CountryCode {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(COUNTRIES, value);
}

function requireCountry(value: unknown, label: string): CountryCode {
  if (!isCountryCode(value)) {
    throw new Error(`Please choose a valid ${label}.`);
  }
  return value;
}

/** ASCII slug from a company name, Turkish characters folded sensibly. */
function slugify(name: string): string {
  const slug = name
    .replace(/İ/g, "i")
    .replace(/I/g, "i")
    .toLowerCase()
    .replace(/ı/g, "i")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "");
  return slug.length > 0 ? slug : "carrier";
}

function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 6);
}

// ---------------------------------------------------------------------------
// Session helpers
// ---------------------------------------------------------------------------

function assertSupabase(what: string): void {
  if (!isSupabaseConfigured()) {
    throw new Error(`Demo mode — connect Supabase to ${what}.`);
  }
}

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Please sign in to your carrier account first.");
  }
  return { supabase, user };
}

// ---------------------------------------------------------------------------
// Carrier profile creation (called right after Supabase signup)
// ---------------------------------------------------------------------------

/**
 * Create the signed-in user's carrier profile (unverified by default).
 * Idempotent: if the user already owns a carrier, its id is returned.
 */
export async function createCarrierProfileAction(
  input: CarrierProfileInput,
): Promise<{ carrierId: string }> {
  assertSupabase("create real carrier accounts");

  const companyName = requireText(input?.companyName, "your company name", 120);
  const blurb = requireText(input?.blurb, "a short company description", 1000);
  const baseCountry = requireCountry(input?.baseCountry, "base country");
  const contactEmail = requireEmail(input?.contactEmail, "a contact email address");
  const contactPhone = requireText(input?.contactPhone, "a contact phone number", 30);
  const yearsOperating = optionalYears(input?.yearsOperating);

  const { supabase, user } = await requireUser();

  const existing = await getCarrierByOwner(user.id);
  if (existing) return { carrierId: existing.id };

  const baseSlug = slugify(companyName);
  // First try the natural slug; on a unique-key collision retry once with a
  // short random suffix so two "ABC Kargo"s can both join.
  for (const slug of [baseSlug, `${baseSlug}-${randomSuffix()}`]) {
    const { data, error } = await supabase
      .from("carriers")
      .insert({
        owner_id: user.id,
        slug,
        company_name: companyName,
        blurb,
        base_country: baseCountry,
        contact_email: contactEmail,
        contact_phone: contactPhone,
        years_operating: yearsOperating,
        logo_url: null,
      })
      .select("id")
      .single();

    if (!error) {
      return { carrierId: (data as { id: string }).id };
    }
    if (error.code !== "23505") {
      throw new Error(`Could not create your carrier profile: ${error.message}`);
    }
  }
  throw new Error(
    "Could not create your carrier profile: a company with a very similar name already exists. Please try again.",
  );
}

// ---------------------------------------------------------------------------
// Rate wizard publish
// ---------------------------------------------------------------------------

function validTiers(payload: SaveServicePayload, unitHint: PricingUnit): RateTier[] {
  const raw = Array.isArray(payload.tiers) ? payload.tiers : [];

  if (payload.serviceType === "vehicle") {
    // Vehicle transport is always priced by hand — no tariff bands.
    return [];
  }
  if (raw.length === 0) {
    throw new Error("Please add at least one price band.");
  }
  if (raw.length > 4) {
    throw new Error("A tariff may have at most four price bands.");
  }

  const tiers: RateTier[] = raw.map((tier, index) => {
    const name = `Band ${index + 1}`;
    const unit = tier?.unit;
    if (unit !== unitHint) {
      throw new Error(`${name}: every band must be priced per ${unitHint}.`);
    }
    const fromQty = requireNumber(tier.fromQty, `${name}'s lower limit`, 0, 1_000_000);
    const toQty =
      tier.toQty === null ? null : requireNumber(tier.toQty, `${name}'s upper limit`, 0, 1_000_000);
    const flatPrice =
      tier.flatPrice === null || tier.flatPrice === undefined
        ? null
        : requireNumber(tier.flatPrice, `${name}'s price`, 0.01, 1_000_000);
    const pricePerUnit =
      tier.pricePerUnit === null || tier.pricePerUnit === undefined
        ? null
        : requireNumber(tier.pricePerUnit, `${name}'s rate`, 0.01, 1_000_000);
    if ((flatPrice === null) === (pricePerUnit === null)) {
      throw new Error(`${name}: set either a flat price or a per-unit rate.`);
    }
    return { unit, fromQty, toQty, flatPrice, pricePerUnit };
  });

  if (tiers[0].fromQty !== 0) {
    throw new Error("The first price band must start at zero.");
  }
  for (let i = 1; i < tiers.length; i += 1) {
    if (tiers[i - 1].toQty === null) {
      throw new Error("Only the last price band may be open-ended.");
    }
    if (tiers[i].fromQty !== tiers[i - 1].toQty) {
      throw new Error("Price bands must be contiguous — each band starts where the previous one ends.");
    }
  }

  // Belt-and-braces: the pricing engine's own validation must accept them.
  try {
    priceForQuantity(tiers, 1);
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "The price bands are not valid.",
    );
  }
  return tiers;
}

function validZones(payload: SaveServicePayload): ZoneSurcharge[] {
  const laneCountries = new Set<CountryCode>([payload.origin, payload.destination]);
  const allowed = new Set<ZoneCode>();
  if (laneCountries.has("GB")) UK_ZONES.forEach((zone) => allowed.add(zone));
  if (laneCountries.has("TR")) TR_ZONES.forEach((zone) => allowed.add(zone));

  const raw = Array.isArray(payload.zones) ? payload.zones : [];
  const byZone = new Map<ZoneCode, ZoneSurcharge>();
  for (const entry of raw) {
    const zone = entry?.zone;
    if (!allowed.has(zone)) {
      throw new Error("The coverage list contains a zone outside this lane.");
    }
    byZone.set(zone, {
      zone,
      served: Boolean(entry.served),
      flat: requireNumber(entry.flat, "a zone surcharge", 0, 100_000),
    });
  }

  // Every zone of the lane must be listed, so coverage is fully explicit.
  const zones: ZoneSurcharge[] = [];
  for (const zone of allowed) {
    zones.push(byZone.get(zone) ?? { zone, served: true, flat: 0 });
  }

  for (const country of laneCountries) {
    const countryZones = country === "GB" ? UK_ZONES : TR_ZONES;
    if (!countryZones.some((zone) => byZone.get(zone)?.served ?? true)) {
      throw new Error(
        `Please serve at least one zone in ${COUNTRIES[country].name}.`,
      );
    }
  }
  return zones;
}

function sanitiseServicePayload(payload: SaveServicePayload): NewServiceInput {
  if (!payload || typeof payload !== "object") {
    throw new Error("Please complete the rate wizard before publishing.");
  }
  const serviceType = payload.serviceType;
  if (!Object.prototype.hasOwnProperty.call(SERVICE_TYPE_LABELS, serviceType)) {
    throw new Error("Please choose a valid service type.");
  }
  const origin = requireCountry(payload.origin, "origin country");
  const destination = requireCountry(payload.destination, "destination country");
  const mode = payload.mode;
  if (mode !== "road" && mode !== "air" && mode !== "sea") {
    throw new Error("Please choose a valid transport mode.");
  }

  const name = requireText(payload.name, "a service name", 120);
  const transitDaysMin = requireNumber(payload.transitDaysMin, "a minimum transit time", 1, 120);
  const transitDaysMax = requireNumber(payload.transitDaysMax, "a maximum transit time", 1, 120);
  if (!Number.isInteger(transitDaysMin) || !Number.isInteger(transitDaysMax)) {
    throw new Error("Transit times must be whole days.");
  }
  if (transitDaysMax < transitDaysMin) {
    throw new Error("The maximum transit time cannot be less than the minimum.");
  }

  const volumetricDivisor = requireNumber(payload.volumetricDivisor, "a volumetric divisor", 500, 10_000);

  const unitHint: PricingUnit =
    serviceType === "volume"
      ? (payload.tiers?.[0]?.unit === "kg" ? "kg" : "cbm")
      : serviceType === "pallet"
        ? "pallet"
        : "kg";

  const crossBorder = origin !== destination;

  return {
    serviceType,
    origin,
    destination,
    mode,
    name,
    transitDaysMin,
    transitDaysMax,
    currency: "GBP",
    volumetricDivisor,
    minCharge: requireNumber(payload.minCharge, "a minimum charge", 0, 100_000),
    fuelPct: requireNumber(payload.fuelPct, "a fuel surcharge fraction", 0, 1),
    customsFee: crossBorder
      ? requireNumber(payload.customsFee, "a customs clearance fee", 0, 100_000)
      : 0,
    collectionFee: requireNumber(payload.collectionFee, "a collection fee", 0, 100_000),
    deliveryFee: requireNumber(payload.deliveryFee, "a delivery fee", 0, 100_000),
    residentialFee: requireNumber(payload.residentialFee, "a residential fee", 0, 100_000),
    insurancePct: requireNumber(payload.insurancePct, "an insurance fraction", 0, 1),
    insuranceMin: requireNumber(payload.insuranceMin, "a minimum insurance premium", 0, 100_000),
    maxWeightKg:
      payload.maxWeightKg === null || payload.maxWeightKg === undefined
        ? null
        : requireNumber(payload.maxWeightKg, "a maximum weight", 1, 1_000_000),
    maxDimCm:
      payload.maxDimCm === null || payload.maxDimCm === undefined
        ? null
        : requireNumber(payload.maxDimCm, "a maximum dimension", 1, 10_000),
    active: true,
    tiers: validTiers(payload, unitHint),
    zones: validZones(payload),
  };
}

/**
 * Publish the wizard's rate card. Creates the carrier profile on the fly
 * (from signup metadata) if the signed-in user somehow has none yet.
 */
export async function saveServiceAction(
  payload: SaveServicePayload,
): Promise<{ serviceId: string }> {
  assertSupabase("publish real rates");

  const service = sanitiseServicePayload(payload);
  const { supabase, user } = await requireUser();

  const carrier = await getCarrierByOwner(user.id);

  if (!carrier) {
    // No profile yet (e.g. email confirmation interrupted signup): build a
    // minimal one from the signup metadata and create both in one go.
    const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
    const metaText = (key: string): string | null =>
      typeof meta[key] === "string" && (meta[key] as string).trim().length > 0
        ? (meta[key] as string).trim()
        : null;

    const companyName =
      metaText("company_name") ?? user.email?.split("@")[0] ?? "New carrier";
    const carrierInput: NewCarrierInput = {
      slug: `${slugify(companyName)}-${randomSuffix()}`,
      companyName,
      blurb:
        metaText("blurb") ??
        "New carrier on Bizim Kargo — company description coming soon.",
      baseCountry: isCountryCode(meta.base_country) ? meta.base_country : service.origin,
      contactEmail: metaText("contact_email") ?? user.email ?? "",
      contactPhone: metaText("phone") ?? "",
      yearsOperating: optionalYears(meta.years_operating),
    };
    const created = await createCarrierWithService(user.id, carrierInput, service);
    revalidatePath("/carrier/rates");
    return { serviceId: created.serviceId };
  }

  // Existing carrier: insert the service, its bands and its coverage directly
  // (data.ts has no standalone service-insert helper). Mirrors the column
  // names and rollback behaviour of createCarrierWithService.
  const { data: serviceData, error: serviceError } = await supabase
    .from("carrier_services")
    .insert({
      carrier_id: carrier.id,
      service_type: service.serviceType,
      origin: service.origin,
      destination: service.destination,
      mode: service.mode,
      name: service.name,
      transit_days_min: service.transitDaysMin,
      transit_days_max: service.transitDaysMax,
      currency: service.currency,
      volumetric_divisor: service.volumetricDivisor,
      min_charge: service.minCharge,
      fuel_pct: service.fuelPct,
      customs_fee: service.customsFee,
      collection_fee: service.collectionFee,
      delivery_fee: service.deliveryFee,
      residential_fee: service.residentialFee,
      insurance_pct: service.insurancePct,
      insurance_min: service.insuranceMin,
      max_weight_kg: service.maxWeightKg,
      max_dim_cm: service.maxDimCm,
      active: true,
    })
    .select("id")
    .single();

  if (serviceError) {
    throw new Error(`Could not create your service: ${serviceError.message}`);
  }
  const serviceId = (serviceData as { id: string }).id;

  const rollback = async (): Promise<void> => {
    await supabase.from("carrier_services").delete().eq("id", serviceId);
  };

  if (service.tiers.length > 0) {
    const { error: tiersError } = await supabase.from("rate_tiers").insert(
      service.tiers.map((tier, index) => ({
        service_id: serviceId,
        unit: tier.unit,
        from_qty: tier.fromQty,
        to_qty: tier.toQty,
        flat_price: tier.flatPrice ?? null,
        price_per_unit: tier.pricePerUnit ?? null,
        sort: index,
      })),
    );
    if (tiersError) {
      await rollback();
      throw new Error(`Could not save your rate bands: ${tiersError.message}`);
    }
  }

  if (service.zones.length > 0) {
    const { error: zonesError } = await supabase.from("zone_surcharges").insert(
      service.zones.map((zone) => ({
        service_id: serviceId,
        zone: zone.zone,
        flat: zone.flat,
        served: zone.served,
      })),
    );
    if (zonesError) {
      await rollback();
      throw new Error(`Could not save your zone coverage: ${zonesError.message}`);
    }
  }

  revalidatePath("/carrier/rates");
  return { serviceId };
}

// ---------------------------------------------------------------------------
// Rate-card active toggle
// ---------------------------------------------------------------------------

export async function toggleServiceActiveAction(input: {
  serviceId: string;
  active: boolean;
}): Promise<void> {
  assertSupabase("manage rate cards");

  const serviceId = requireUuid(input?.serviceId, "service");
  const active = Boolean(input?.active);

  const { supabase, user } = await requireUser();
  const carrier = await getCarrierByOwner(user.id);
  if (!carrier) {
    throw new Error("You must complete your carrier profile first.");
  }

  const { data, error } = await supabase
    .from("carrier_services")
    .update({ active })
    .eq("id", serviceId)
    .eq("carrier_id", carrier.id)
    .select("id");

  if (error) {
    throw new Error(`Could not update the rate card: ${error.message}`);
  }
  if (!data || data.length === 0) {
    throw new Error("Rate card not found, or it does not belong to your company.");
  }
  revalidatePath("/carrier/rates");
}

// ---------------------------------------------------------------------------
// Profile edits
// ---------------------------------------------------------------------------

export async function updateCarrierProfileAction(
  input: UpdateCarrierProfileInput,
): Promise<void> {
  assertSupabase("edit your company profile");

  const companyName = requireText(input?.companyName, "your company name", 120);
  const blurb = requireText(input?.blurb, "a short company description", 1000);
  const contactEmail = requireEmail(input?.contactEmail, "a contact email address");
  const contactPhone = requireText(input?.contactPhone, "a contact phone number", 30);
  const yearsOperating = optionalYears(input?.yearsOperating);

  const { supabase, user } = await requireUser();
  const carrier = await getCarrierByOwner(user.id);
  if (!carrier) {
    throw new Error("You must complete your carrier profile first.");
  }

  const { data, error } = await supabase
    .from("carriers")
    .update({
      company_name: companyName,
      blurb,
      contact_email: contactEmail,
      contact_phone: contactPhone,
      years_operating: yearsOperating,
    })
    .eq("id", carrier.id)
    .select("id");

  if (error) {
    throw new Error(`Could not save your profile: ${error.message}`);
  }
  if (!data || data.length === 0) {
    throw new Error("Your carrier profile could not be updated.");
  }
  revalidatePath("/carrier/profile");
}
