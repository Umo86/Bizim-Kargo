/**
 * Domain types for Bizim Kargo.
 *
 * This file is the single source of truth for the shapes shared between the
 * pricing engine, the database layer, server actions and the UI. Keep it free
 * of runtime dependencies — types and small constants only.
 */

// ---------------------------------------------------------------------------
// Geography
// ---------------------------------------------------------------------------

/** ISO-3166 alpha-2 for supported countries. Adding a country = extend this. */
export type CountryCode = "GB" | "TR";

export const COUNTRIES: Record<CountryCode, { name: string; flag: string }> = {
  GB: { name: "United Kingdom", flag: "🇬🇧" },
  TR: { name: "Turkey", flag: "🇹🇷" },
};

/** A lane is an origin/destination country pair, e.g. GB→TR or TR→TR. */
export interface Lane {
  origin: CountryCode;
  destination: CountryCode;
}

export function isCrossBorder(lane: Lane): boolean {
  return lane.origin !== lane.destination;
}

/** Zone codes — see src/lib/zones.ts for postcode/city → zone resolution. */
export type ZoneCode =
  // United Kingdom
  | "GB-MAINLAND"
  | "GB-HIGHLANDS"
  | "GB-NI"
  | "GB-ISLANDS"
  // Turkey
  | "TR-MARMARA"
  | "TR-ANKARA"
  | "TR-AEGEAN"
  | "TR-MED"
  | "TR-CENTRAL"
  | "TR-BLACKSEA"
  | "TR-EAST";

// ---------------------------------------------------------------------------
// Shipment request (what the customer enters)
// ---------------------------------------------------------------------------

export type ServiceType = "parcel" | "pallet" | "volume" | "vehicle";

export const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  parcel: "Parcels & boxes",
  pallet: "Pallets",
  volume: "Van load / furniture",
  vehicle: "Vehicle",
};

/** One line of the shipment: qty identical pieces of L×W×H cm at kg each. */
export interface ShipmentItem {
  quantity: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  weightKg: number;
  description?: string;
}

export interface Address {
  country: CountryCode;
  /** UK postcode ("SW1A 1AA") or Turkish il/ilçe text ("İstanbul / Kadıköy"). */
  postcodeOrCity: string;
  /** Resolved zone; filled by the server from postcodeOrCity. */
  zone?: ZoneCode;
}

/** The full quote request captured by the homepage form. */
export interface ShipmentRequest {
  serviceType: ServiceType;
  pickup: Address;
  delivery: Address;
  items: ShipmentItem[];
  /** Declared value in GBP for insurance purposes; optional. */
  declaredValueGbp?: number;
  wantsInsurance?: boolean;
  /** ISO date the customer would like collection; informational in v1. */
  readyDate?: string;
  /** Vehicle requests: free-text description (make/model/running or not). */
  vehicleDescription?: string;
}

// ---------------------------------------------------------------------------
// Carrier + rates (what the carrier configures)
// ---------------------------------------------------------------------------

export type TransportMode = "road" | "air" | "sea";

/**
 * Standard volumetric divisors by mode. cm³ / divisor = volumetric kg.
 * Express courier/air parcel networks use 5000, IATA air freight 6000,
 * road groupage typically 3000 (≈ 333 kg per m³).
 */
export const DEFAULT_DIVISORS: Record<TransportMode, number> = {
  road: 3000,
  air: 5000,
  sea: 1000,
};

/** kg per m³ used for W/M ("weight or measure") volume pricing. */
export const KG_PER_M3_WM = 333;

export type Currency = "GBP" | "EUR" | "USD";

export type PricingUnit = "kg" | "cbm" | "pallet";

/**
 * One priced band of a service's tariff.
 * Either flatPrice (a fixed price for any quantity in the band) or
 * pricePerUnit (band is charged per unit across the whole quantity) is set.
 * Bands are half-open: fromQty < q ≤ toQty. toQty null = open-ended.
 */
export interface RateTier {
  id?: string;
  unit: PricingUnit;
  fromQty: number;
  toQty: number | null;
  flatPrice?: number | null;
  pricePerUnit?: number | null;
}

export interface ZoneSurcharge {
  zone: ZoneCode;
  /** Flat surcharge added when pickup or delivery falls in this zone. */
  flat: number;
  served: boolean;
}

/** A carrier's offering on one lane for one service type. */
export interface CarrierService {
  id: string;
  carrierId: string;
  serviceType: ServiceType;
  origin: CountryCode;
  destination: CountryCode;
  mode: TransportMode;
  name: string;
  transitDaysMin: number;
  transitDaysMax: number;
  currency: Currency;
  /** cm³ per kg — see DEFAULT_DIVISORS. */
  volumetricDivisor: number;
  /** Absolute floor for base freight. */
  minCharge: number;
  /** Fuel surcharge as a fraction of base freight, e.g. 0.12 = 12%. */
  fuelPct: number;
  /** Flat customs clearance fee, charged on cross-border lanes only. */
  customsFee: number;
  collectionFee: number;
  deliveryFee: number;
  residentialFee: number;
  /** Insurance premium as fraction of declared value + minimum premium. */
  insurancePct: number;
  insuranceMin: number;
  /** Hard limits; exceeding either disqualifies this service. */
  maxWeightKg: number | null;
  maxDimCm: number | null;
  active: boolean;
  tiers: RateTier[];
  zones: ZoneSurcharge[];
}

export interface Carrier {
  id: string;
  slug: string;
  companyName: string;
  blurb: string;
  baseCountry: CountryCode;
  contactEmail: string;
  contactPhone: string;
  verified: boolean;
  /** 0–5, one decimal. Seeded/admin-set in v1. */
  rating: number;
  reviewCount: number;
  yearsOperating: number | null;
  logoUrl?: string | null;
}

// ---------------------------------------------------------------------------
// Quote results (what the engine returns)
// ---------------------------------------------------------------------------

/** One named line of the price build-up, in display order. */
export interface PriceLine {
  code:
    | "base_freight"
    | "collection"
    | "delivery"
    | "residential"
    | "zone_surcharge"
    | "customs_clearance"
    | "insurance"
    | "fuel_surcharge";
  label: string;
  amount: number;
  /** Optional plain-English note, e.g. "12% of base freight". */
  note?: string;
}

/** Why the shipment was priced on the quantity it was. */
export interface ChargeableBasis {
  unit: PricingUnit;
  actualKg: number;
  volumetricKg: number;
  chargeableKg: number;
  volumeM3: number;
  chargeableM3: number;
  /** The quantity the tariff was applied to (kg, m³ or pallet count). */
  quantity: number;
  explanation: string;
}

export interface QuoteResult {
  serviceId: string;
  carrierId: string;
  carrier: Pick<
    Carrier,
    "slug" | "companyName" | "verified" | "rating" | "reviewCount" | "yearsOperating"
  >;
  serviceName: string;
  mode: TransportMode;
  transitDaysMin: number;
  transitDaysMax: number;
  currency: Currency;
  basis: ChargeableBasis;
  lines: PriceLine[];
  total: number;
  /** True for vehicle/bulky requests that need a manual callback price. */
  requiresManualQuote: boolean;
}

/** A service that could not quote, with the reason (for debugging/UX). */
export interface QuoteRejection {
  serviceId: string;
  carrierId: string;
  reason:
    | "over_max_weight"
    | "over_max_dimension"
    | "zone_not_served"
    | "no_tier_for_quantity"
    | "lane_not_served"
    | "service_inactive";
  detail: string;
}

// ---------------------------------------------------------------------------
// Leads (the booking handoff)
// ---------------------------------------------------------------------------

export type LeadStatus = "new" | "contacted" | "accepted" | "declined" | "completed";

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: "New",
  contacted: "Contacted",
  accepted: "Accepted",
  declined: "Declined",
  completed: "Completed",
};

export interface LeadContact {
  name: string;
  email: string;
  phone: string;
  preferredContact: "phone" | "email" | "whatsapp";
  notes?: string;
}
