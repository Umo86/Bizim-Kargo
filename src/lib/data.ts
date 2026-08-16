/**
 * Repository layer for Bizim Kargo — the single place that knows whether
 * Supabase is configured.
 *
 * Every function transparently serves one of two modes:
 *  - Supabase mode: rows are read/written via the per-request server client
 *    (RLS applies) and mapped snake_case → camelCase in the rowTo* helpers.
 *  - Demo mode: services come from src/lib/demo-data.ts and quotes/leads live
 *    in a globalThis-backed store so they survive Next.js dev-server HMR.
 *
 * SERVER ONLY: this module imports the server Supabase client (next/headers).
 * Call it from Server Components, server actions and route handlers only.
 */

import { DEMO_CARRIERS, DEMO_CARRIERS_BY_ID, DEMO_SERVICES } from "./demo-data";
import { isRejection, quoteService, resolveZone } from "./pricing";
import { isSupabaseConfigured } from "./supabase/config";
import { createClient } from "./supabase/server";
import type {
  Address,
  Carrier,
  CarrierService,
  CountryCode,
  Currency,
  LeadContact,
  LeadStatus,
  PricingUnit,
  QuoteRejection,
  QuoteResult,
  RateTier,
  ServiceType,
  ShipmentItem,
  ShipmentRequest,
  TransportMode,
  ZoneCode,
  ZoneSurcharge,
} from "./types";

// ---------------------------------------------------------------------------
// Public shapes owned by this layer (types.ts is frozen and has no Lead row)
// ---------------------------------------------------------------------------

/** A stored quote snapshot: the request plus everything the engine computed. */
export interface StoredQuote {
  request: ShipmentRequest;
  results: QuoteResult[];
  rejections: QuoteRejection[];
}

/** A lead as the carrier dashboard sees it. */
export interface Lead {
  id: string;
  quoteId: string | null;
  carrierId: string;
  serviceId: string | null;
  contact: LeadContact;
  /** The QuoteResult the customer accepted, frozen at submission. */
  priceSnapshot: QuoteResult | null;
  status: LeadStatus;
  /** ISO timestamps. */
  createdAt: string;
  updatedAt: string;
}

export interface CreateLeadInput {
  quoteId: string;
  serviceId: string;
  carrierId: string;
  contact: LeadContact;
  priceSnapshot: QuoteResult;
}

export interface NewCarrierInput {
  slug: string;
  companyName: string;
  blurb: string;
  baseCountry: CountryCode;
  contactEmail: string;
  contactPhone: string;
  yearsOperating?: number | null;
  logoUrl?: string | null;
}

/** Everything a CarrierService needs except the ids the database assigns. */
export type NewServiceInput = Omit<CarrierService, "id" | "carrierId" | "active"> & {
  /** Defaults to true — a freshly created service quotes immediately. */
  active?: boolean;
};

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

/**
 * Coerce a numeric column to number. PostgREST serialises Postgres `numeric`
 * as a JSON number by default, but coercing here keeps the mapping robust if
 * a value ever arrives as a string.
 */
function num(value: number | string): number {
  return typeof value === "number" ? value : Number(value);
}

function numOrNull(value: number | string | null): number | null {
  return value === null ? null : num(value);
}

// ---------------------------------------------------------------------------
// Row types + row ↔ domain conversions (ALL live here, nowhere else)
// ---------------------------------------------------------------------------

interface CarrierRow {
  id: string;
  slug: string;
  company_name: string;
  blurb: string;
  base_country: string;
  contact_email: string;
  contact_phone: string;
  verified: boolean;
  rating: number | string;
  review_count: number | string;
  years_operating: number | string | null;
  logo_url: string | null;
}

interface TierRow {
  id: string;
  unit: string;
  from_qty: number | string;
  to_qty: number | string | null;
  flat_price: number | string | null;
  price_per_unit: number | string | null;
  sort: number;
}

interface ZoneRow {
  zone: string;
  flat: number | string;
  served: boolean;
}

interface ServiceRow {
  id: string;
  carrier_id: string;
  service_type: string;
  origin: string;
  destination: string;
  mode: string;
  name: string;
  transit_days_min: number | string;
  transit_days_max: number | string;
  currency: string;
  volumetric_divisor: number | string;
  min_charge: number | string;
  fuel_pct: number | string;
  customs_fee: number | string;
  collection_fee: number | string;
  delivery_fee: number | string;
  residential_fee: number | string;
  insurance_pct: number | string;
  insurance_min: number | string;
  max_weight_kg: number | string | null;
  max_dim_cm: number | string | null;
  active: boolean;
  rate_tiers: TierRow[];
  zone_surcharges: ZoneRow[];
  /** Embedded many-to-one join; null only if the FK row vanished mid-query. */
  carriers: CarrierRow | null;
}

interface LeadRow {
  id: string;
  quote_id: string | null;
  carrier_id: string;
  service_id: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  preferred_contact: string;
  notes: string | null;
  price_snapshot: QuoteResult | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export function rowToCarrier(row: CarrierRow): Carrier {
  return {
    id: row.id,
    slug: row.slug,
    companyName: row.company_name,
    blurb: row.blurb,
    baseCountry: row.base_country as CountryCode,
    contactEmail: row.contact_email,
    contactPhone: row.contact_phone,
    verified: row.verified,
    rating: num(row.rating),
    reviewCount: num(row.review_count),
    yearsOperating: numOrNull(row.years_operating),
    logoUrl: row.logo_url,
  };
}

function rowToTier(row: TierRow): RateTier {
  return {
    id: row.id,
    unit: row.unit as PricingUnit,
    fromQty: num(row.from_qty),
    toQty: numOrNull(row.to_qty),
    flatPrice: numOrNull(row.flat_price),
    pricePerUnit: numOrNull(row.price_per_unit),
  };
}

function rowToZone(row: ZoneRow): ZoneSurcharge {
  return {
    zone: row.zone as ZoneCode,
    flat: num(row.flat),
    served: row.served,
  };
}

export function rowToService(row: ServiceRow): CarrierService {
  // Bands sorted by their configured sort order, then ascending quantity, so
  // the tariff arrives in the order the pricing engine (and edit UIs) expect.
  const tiers = [...row.rate_tiers]
    .sort((a, b) => a.sort - b.sort || num(a.from_qty) - num(b.from_qty))
    .map(rowToTier);

  return {
    id: row.id,
    carrierId: row.carrier_id,
    serviceType: row.service_type as ServiceType,
    origin: row.origin as CountryCode,
    destination: row.destination as CountryCode,
    mode: row.mode as TransportMode,
    name: row.name,
    transitDaysMin: num(row.transit_days_min),
    transitDaysMax: num(row.transit_days_max),
    currency: row.currency as Currency,
    volumetricDivisor: num(row.volumetric_divisor),
    minCharge: num(row.min_charge),
    fuelPct: num(row.fuel_pct),
    customsFee: num(row.customs_fee),
    collectionFee: num(row.collection_fee),
    deliveryFee: num(row.delivery_fee),
    residentialFee: num(row.residential_fee),
    insurancePct: num(row.insurance_pct),
    insuranceMin: num(row.insurance_min),
    maxWeightKg: numOrNull(row.max_weight_kg),
    maxDimCm: numOrNull(row.max_dim_cm),
    active: row.active,
    tiers,
    zones: row.zone_surcharges.map(rowToZone),
  };
}

function rowToLead(row: LeadRow): Lead {
  return {
    id: row.id,
    quoteId: row.quote_id,
    carrierId: row.carrier_id,
    serviceId: row.service_id,
    contact: {
      name: row.customer_name,
      email: row.customer_email,
      phone: row.customer_phone,
      preferredContact: row.preferred_contact as LeadContact["preferredContact"],
      notes: row.notes ?? undefined,
    },
    priceSnapshot: row.price_snapshot,
    status: row.status as LeadStatus,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * The quotes.results jsonb column stores BOTH halves of the engine output as
 * `{ results, rejections }`. Older/foreign rows might hold a bare array of
 * results, so unpacking accepts either shape.
 */
interface StoredResultsColumn {
  results?: QuoteResult[];
  rejections?: QuoteRejection[];
}

function unpackResultsColumn(column: unknown): {
  results: QuoteResult[];
  rejections: QuoteRejection[];
} {
  if (Array.isArray(column)) {
    return { results: column as QuoteResult[], rejections: [] };
  }
  if (column && typeof column === "object") {
    const wrapped = column as StoredResultsColumn;
    return {
      results: Array.isArray(wrapped.results) ? wrapped.results : [],
      rejections: Array.isArray(wrapped.rejections) ? wrapped.rejections : [],
    };
  }
  return { results: [], rejections: [] };
}

// ---------------------------------------------------------------------------
// Demo-mode store — survives HMR by hanging off globalThis
// ---------------------------------------------------------------------------

interface DemoStore {
  quotes: Map<string, StoredQuote>;
  leads: Map<string, Lead>;
  leadsSeeded: boolean;
}

type GlobalWithDemoStore = typeof globalThis & {
  __bizimKargoDemoStore?: DemoStore;
};

function demoStore(): DemoStore {
  const g = globalThis as GlobalWithDemoStore;
  g.__bizimKargoDemoStore ??= {
    quotes: new Map(),
    leads: new Map(),
    leadsSeeded: false,
  };
  return g.__bizimKargoDemoStore;
}

/** A plausible demo address on the given side, with its zone resolved. */
function demoAddress(country: CountryCode): Address {
  const postcodeOrCity = country === "GB" ? "N1 9GU" : "İstanbul / Kadıköy";
  return { country, postcodeOrCity, zone: resolveZone(country, postcodeOrCity) };
}

/** Items that will price cleanly on a typical tariff of each service type. */
function demoItemsFor(serviceType: ServiceType): ShipmentItem[] {
  switch (serviceType) {
    case "parcel":
      return [
        {
          quantity: 2,
          lengthCm: 45,
          widthCm: 35,
          heightCm: 30,
          weightKg: 9,
          description: "Clothing and gifts",
        },
      ];
    case "pallet":
      return [
        {
          quantity: 1,
          lengthCm: 120,
          widthCm: 100,
          heightCm: 140,
          weightKg: 260,
          description: "Palletised household goods",
        },
      ];
    case "volume":
      return [
        {
          quantity: 4,
          lengthCm: 80,
          widthCm: 60,
          heightCm: 50,
          weightKg: 22,
          description: "Furniture and boxed kitchenware",
        },
      ];
    case "vehicle":
      return [];
  }
}

/**
 * Seed three plausible leads for the FIRST demo carrier so the carrier
 * dashboard has something to render in demo mode. Price snapshots are real
 * engine output (quoteService against the carrier's own tariffs), so the
 * dashboard shows exactly what production data would look like.
 */
function seedDemoLeads(store: DemoStore): void {
  if (store.leadsSeeded) return;
  store.leadsSeeded = true;

  const carrier = DEMO_CARRIERS[0];
  if (!carrier) return;
  const services = DEMO_SERVICES.filter(
    (service) => service.carrierId === carrier.id && service.active,
  );
  if (services.length === 0) return;

  const seeds: Array<{
    contact: LeadContact;
    status: LeadStatus;
    hoursAgo: number;
  }> = [
    {
      contact: {
        name: "Ayşe Yılmaz",
        email: "ayse.yilmaz@example.com",
        phone: "+44 7700 900123",
        preferredContact: "whatsapp",
        notes: "Please collect after 5pm on weekdays.",
      },
      status: "new",
      hoursAgo: 3,
    },
    {
      contact: {
        name: "Daniel Carter",
        email: "daniel.carter@example.com",
        phone: "+44 7700 900456",
        preferredContact: "email",
      },
      status: "contacted",
      hoursAgo: 27,
    },
    {
      contact: {
        name: "Mehmet Demir",
        email: "mehmet.demir@example.com",
        phone: "+90 532 555 76 21",
        preferredContact: "phone",
        notes: "Flexible on collection date.",
      },
      status: "accepted",
      hoursAgo: 74,
    },
  ];

  seeds.forEach((seed, index) => {
    // Spread the seeds across the carrier's services for variety.
    const service = services[index % services.length];
    if (!service) return;

    const request: ShipmentRequest = {
      serviceType: service.serviceType,
      pickup: demoAddress(service.origin),
      delivery: demoAddress(service.destination),
      items: demoItemsFor(service.serviceType),
      wantsInsurance: false,
      ...(service.serviceType === "vehicle"
        ? { vehicleDescription: "2016 Ford Transit 350, starts and drives" }
        : {}),
    };

    const outcome = quoteService(service, carrier, request);
    const timestamp = new Date(Date.now() - seed.hoursAgo * 3_600_000).toISOString();

    const lead: Lead = {
      id: crypto.randomUUID(),
      quoteId: null,
      carrierId: carrier.id,
      serviceId: service.id,
      contact: seed.contact,
      priceSnapshot: isRejection(outcome) ? null : outcome,
      status: seed.status,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    store.leads.set(lead.id, lead);
  });
}

// ---------------------------------------------------------------------------
// Services + carriers for quoting
// ---------------------------------------------------------------------------

/**
 * Everything the quote engine needs for one lane: the active services and a
 * complete carrier lookup covering every returned service.
 */
export async function getServicesForLane(
  origin: CountryCode,
  destination: CountryCode,
): Promise<{ services: CarrierService[]; carriersById: Record<string, Carrier> }> {
  if (!isSupabaseConfigured()) {
    const services = DEMO_SERVICES.filter(
      (service) =>
        service.active && service.origin === origin && service.destination === destination,
    );
    return { services, carriersById: DEMO_CARRIERS_BY_ID };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("carrier_services")
    .select("*, carriers(*), rate_tiers(*), zone_surcharges(*)")
    .eq("origin", origin)
    .eq("destination", destination)
    .eq("active", true);

  if (error) {
    throw new Error(`Could not load carrier services: ${error.message}`);
  }

  const rows = (data ?? []) as ServiceRow[];
  const services: CarrierService[] = [];
  const carriersById: Record<string, Carrier> = {};

  for (const row of rows) {
    // A service without its carrier row cannot be quoted (quoteAll would
    // throw); skip defensively rather than failing the whole lane.
    if (!row.carriers) continue;
    carriersById[row.carriers.id] = rowToCarrier(row.carriers);
    services.push(rowToService(row));
  }

  return { services, carriersById };
}

// ---------------------------------------------------------------------------
// Quotes
// ---------------------------------------------------------------------------

/** Persist a quote snapshot; returns the new quote id (the retrieval secret). */
export async function saveQuote(
  request: ShipmentRequest,
  results: QuoteResult[],
  rejections: QuoteRejection[],
): Promise<string> {
  if (!isSupabaseConfigured()) {
    const id = crypto.randomUUID();
    demoStore().quotes.set(id, { request, results, rejections });
    return id;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("quotes")
    .insert({ request, results: { results, rejections } })
    .select("id")
    .single();

  if (error) {
    throw new Error(`Could not save the quote: ${error.message}`);
  }
  return (data as { id: string }).id;
}

/** Load a stored quote snapshot; null if unknown (or the id is malformed). */
export async function getQuote(id: string): Promise<StoredQuote | null> {
  if (!isUuid(id)) return null;

  if (!isSupabaseConfigured()) {
    return demoStore().quotes.get(id) ?? null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("quotes")
    .select("id, request, results")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`Could not load the quote: ${error.message}`);
  }
  if (!data) return null;

  const row = data as { request: ShipmentRequest; results: unknown };
  return { request: row.request, ...unpackResultsColumn(row.results) };
}

// ---------------------------------------------------------------------------
// Leads
// ---------------------------------------------------------------------------

/** Record a booking handoff to a carrier; returns the new lead id. */
export async function createLead(input: CreateLeadInput): Promise<string> {
  const { quoteId, serviceId, carrierId, contact, priceSnapshot } = input;

  if (!isSupabaseConfigured()) {
    const store = demoStore();
    const now = new Date().toISOString();
    const lead: Lead = {
      id: crypto.randomUUID(),
      quoteId,
      carrierId,
      serviceId,
      contact,
      priceSnapshot,
      status: "new",
      createdAt: now,
      updatedAt: now,
    };
    store.leads.set(lead.id, lead);
    return lead.id;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leads")
    .insert({
      quote_id: quoteId,
      carrier_id: carrierId,
      service_id: serviceId,
      customer_name: contact.name,
      customer_email: contact.email,
      customer_phone: contact.phone,
      preferred_contact: contact.preferredContact,
      notes: contact.notes ?? null,
      price_snapshot: priceSnapshot,
      status: "new",
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(`Could not submit your request to the carrier: ${error.message}`);
  }
  return (data as { id: string }).id;
}

/**
 * A carrier's lead inbox, newest first. In Supabase mode row level security
 * additionally guarantees only the owning carrier's session sees anything.
 */
export async function getLeadsForCarrier(carrierId: string): Promise<Lead[]> {
  if (!isSupabaseConfigured()) {
    const store = demoStore();
    seedDemoLeads(store);
    return [...store.leads.values()]
      .filter((lead) => lead.carrierId === carrierId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .eq("carrier_id", carrierId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Could not load your leads: ${error.message}`);
  }
  return ((data ?? []) as LeadRow[]).map(rowToLead);
}

/**
 * Update a lead's status on behalf of the given carrier. Throws when the lead
 * does not exist or does not belong to that carrier (in Supabase mode the RLS
 * update policy enforces the same thing independently).
 */
export async function updateLeadStatus(
  leadId: string,
  carrierId: string,
  status: LeadStatus,
): Promise<void> {
  if (!isSupabaseConfigured()) {
    const store = demoStore();
    seedDemoLeads(store);
    const lead = store.leads.get(leadId);
    if (!lead || lead.carrierId !== carrierId) {
      throw new Error("Lead not found, or it does not belong to your company.");
    }
    lead.status = status;
    lead.updatedAt = new Date().toISOString();
    return;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leads")
    .update({ status })
    .eq("id", leadId)
    .eq("carrier_id", carrierId)
    .select("id");

  if (error) {
    throw new Error(`Could not update the lead: ${error.message}`);
  }
  // With RLS, an unauthorised update silently matches zero rows — surface it.
  if (!data || data.length === 0) {
    throw new Error("Lead not found, or it does not belong to your company.");
  }
}

// ---------------------------------------------------------------------------
// Carriers
// ---------------------------------------------------------------------------

/** Look a carrier up by id; null if unknown (or the id is malformed). */
export async function getCarrier(id: string): Promise<Carrier | null> {
  if (!isUuid(id)) return null;

  if (!isSupabaseConfigured()) {
    return DEMO_CARRIERS_BY_ID[id] ?? null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("carriers")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`Could not load the carrier: ${error.message}`);
  }
  return data ? rowToCarrier(data as CarrierRow) : null;
}

/**
 * The carrier owned by an auth user (dashboard resolution after login).
 * Supabase only — demo mode has no auth, so this always returns null there.
 */
export async function getCarrierByOwner(userId: string): Promise<Carrier | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("carriers")
    .select("*")
    .eq("owner_id", userId)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Could not look up your carrier profile: ${error.message}`);
  }
  return data ? rowToCarrier(data as CarrierRow) : null;
}

/**
 * Carrier signup wizard: create the carrier plus its first service, tariff
 * bands and zone coverage in one call. Runs under the signed-in user's
 * session, so RLS enforces owner_id = auth.uid() on every insert.
 *
 * Not transactional (PostgREST offers no multi-statement transaction): if a
 * tier/zone insert fails the partially created service is deleted again; a
 * carrier row without services is harmless and can be completed later.
 */
export async function createCarrierWithService(
  ownerId: string,
  carrier: NewCarrierInput,
  service: NewServiceInput,
): Promise<{ carrierId: string; serviceId: string }> {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase must be configured for carrier accounts — demo mode does not support carrier signup.",
    );
  }

  const supabase = await createClient();

  // 1. The carrier row (owner-checked by RLS).
  const { data: carrierData, error: carrierError } = await supabase
    .from("carriers")
    .insert({
      owner_id: ownerId,
      slug: carrier.slug,
      company_name: carrier.companyName,
      blurb: carrier.blurb,
      base_country: carrier.baseCountry,
      contact_email: carrier.contactEmail,
      contact_phone: carrier.contactPhone,
      years_operating: carrier.yearsOperating ?? null,
      logo_url: carrier.logoUrl ?? null,
    })
    .select("id")
    .single();

  if (carrierError) {
    throw new Error(`Could not create your carrier profile: ${carrierError.message}`);
  }
  const carrierId = (carrierData as { id: string }).id;

  // 2. The service row.
  const { data: serviceData, error: serviceError } = await supabase
    .from("carrier_services")
    .insert({
      carrier_id: carrierId,
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
      active: service.active ?? true,
    })
    .select("id")
    .single();

  if (serviceError) {
    throw new Error(`Could not create your service: ${serviceError.message}`);
  }
  const serviceId = (serviceData as { id: string }).id;

  // Deletes the half-created service (tiers/zones cascade) so a failed wizard
  // run can simply be retried.
  const rollbackService = async (): Promise<void> => {
    await supabase.from("carrier_services").delete().eq("id", serviceId);
  };

  // 3. Tariff bands, preserving the order the wizard collected them in.
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
      await rollbackService();
      throw new Error(`Could not save your rate bands: ${tiersError.message}`);
    }
  }

  // 4. Zone coverage.
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
      await rollbackService();
      throw new Error(`Could not save your zone coverage: ${zonesError.message}`);
    }
  }

  return { carrierId, serviceId };
}
