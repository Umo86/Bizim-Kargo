"use server";

/**
 * Server actions for Bizim Kargo — the only entry points the UI calls.
 *
 * Every action re-validates its input server-side (the browser is never
 * trusted) and throws readable, British-English error messages that a form
 * can surface directly. Persistence and the Supabase/demo split live in
 * src/lib/data.ts; pricing lives in src/lib/pricing.
 *
 * Note for the UI team: because this is a "use server" module, only async
 * functions are exported at runtime. Result types are exported type-only.
 */

import { DEMO_CARRIERS } from "./demo-data";
import {
  createLead,
  getCarrier,
  getCarrierByOwner,
  getLeadsForCarrier,
  getQuote,
  getServicesForLane,
  saveQuote,
  updateLeadStatus,
  type Lead,
  type StoredQuote,
} from "./data";
import { confirmationEmailToCustomer, leadEmailToCarrier, sendEmail } from "./email";
import { normaliseItems, quoteAll, resolveZone } from "./pricing";
import { isSupabaseConfigured } from "./supabase/config";
import { createClient } from "./supabase/server";
import {
  COUNTRIES,
  LEAD_STATUS_LABELS,
  SERVICE_TYPE_LABELS,
  type Address,
  type Carrier,
  type CountryCode,
  type LeadContact,
  type LeadStatus,
  type ServiceType,
  type ShipmentItem,
  type ShipmentRequest,
} from "./types";

// ---------------------------------------------------------------------------
// Result shapes (type-only exports — stripped at runtime)
// ---------------------------------------------------------------------------

export type CreateQuoteResult = { quoteId: string };

export type BookQuoteResult = {
  leadId: string;
  /** The chosen carrier's contact card for the confirmation screen. */
  carrier: { companyName: string; contactEmail: string; contactPhone: string };
};

export type CarrierLeadsResult = { carrier: Carrier; leads: Lead[] };

// ---------------------------------------------------------------------------
// Validation helpers (module-private; only async functions may be exported)
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

function optionalText(value: unknown, label: string, maxLength: number): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "string") {
    throw new Error(`Please provide ${label} as text.`);
  }
  const trimmed = value.trim();
  if (trimmed.length === 0) return undefined;
  if (trimmed.length > maxLength) {
    throw new Error(`${label[0]?.toUpperCase()}${label.slice(1)} is too long.`);
  }
  return trimmed;
}

function isCountryCode(value: unknown): value is CountryCode {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(COUNTRIES, value);
}

function isServiceType(value: unknown): value is ServiceType {
  return (
    typeof value === "string" &&
    Object.prototype.hasOwnProperty.call(SERVICE_TYPE_LABELS, value)
  );
}

function isLeadStatus(value: unknown): value is LeadStatus {
  return (
    typeof value === "string" &&
    Object.prototype.hasOwnProperty.call(LEAD_STATUS_LABELS, value)
  );
}

/** Validate one address and resolve its tariff zone. */
function sanitiseAddress(value: unknown, leg: "pickup" | "delivery"): Address {
  const raw = (value ?? {}) as Partial<Address>;
  if (!isCountryCode(raw.country)) {
    throw new Error(`Please choose a valid ${leg} country.`);
  }
  const postcodeOrCity = requireText(
    raw.postcodeOrCity,
    leg === "pickup"
      ? "a pickup postcode or city"
      : "a delivery postcode or city",
    120,
  );
  return {
    country: raw.country,
    postcodeOrCity,
    // Always resolved server-side — a client-supplied zone is never trusted.
    zone: resolveZone(raw.country, postcodeOrCity),
  };
}

/** Validate one shipment line: positive finite dimensions/weight, integer qty. */
function sanitiseItem(value: unknown, index: number): ShipmentItem {
  const raw = (value ?? {}) as Partial<ShipmentItem>;
  const line = `item ${index + 1}`;

  const quantity = Number(raw.quantity);
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 1000) {
    throw new Error(`Please enter a whole-number quantity of at least 1 for ${line}.`);
  }

  const dims: Array<[keyof ShipmentItem, string]> = [
    ["lengthCm", "length"],
    ["widthCm", "width"],
    ["heightCm", "height"],
    ["weightKg", "weight"],
  ];
  const numbers: Record<string, number> = {};
  for (const [key, label] of dims) {
    const n = Number(raw[key]);
    if (!Number.isFinite(n) || n <= 0) {
      throw new Error(`Please enter a ${label} greater than zero for ${line}.`);
    }
    numbers[key] = n;
  }

  return {
    quantity,
    lengthCm: numbers.lengthCm as number,
    widthCm: numbers.widthCm as number,
    heightCm: numbers.heightCm as number,
    weightKg: numbers.weightKg as number,
    description: optionalText(raw.description, "the item description", 300),
  };
}

/**
 * Full server-side validation of a quote request. Returns a freshly built
 * object (never the client's), with both zones resolved and every field
 * trimmed/coerced — ready for the pricing engine and for storage.
 */
function sanitiseRequest(input: ShipmentRequest): ShipmentRequest {
  if (!input || typeof input !== "object") {
    throw new Error("Please complete the quote form before requesting prices.");
  }

  if (!isServiceType(input.serviceType)) {
    throw new Error("Please choose what you are sending.");
  }
  const serviceType = input.serviceType;

  const pickup = sanitiseAddress(input.pickup, "pickup");
  const delivery = sanitiseAddress(input.delivery, "delivery");

  const rawItems = Array.isArray(input.items) ? input.items : [];
  if (serviceType !== "vehicle" && rawItems.length === 0) {
    throw new Error("Please add at least one item to your shipment.");
  }
  if (rawItems.length > 50) {
    throw new Error("A quote request may contain at most 50 item lines.");
  }
  const items = rawItems.map(sanitiseItem);
  // Belt-and-braces: the engine's own normalisation must accept these items.
  normaliseItems(items);

  const vehicleDescription = optionalText(
    input.vehicleDescription,
    "the vehicle description",
    500,
  );
  if (serviceType === "vehicle" && !vehicleDescription) {
    throw new Error(
      "Please describe the vehicle (make, model, and whether it starts and drives).",
    );
  }

  let declaredValueGbp: number | undefined;
  if (input.declaredValueGbp !== undefined && input.declaredValueGbp !== null) {
    const n = Number(input.declaredValueGbp);
    if (!Number.isFinite(n) || n < 0 || n > 1_000_000) {
      throw new Error("Please enter a declared value between £0 and £1,000,000.");
    }
    declaredValueGbp = n;
  }

  const wantsInsurance = Boolean(input.wantsInsurance);
  if (wantsInsurance && !declaredValueGbp) {
    throw new Error("Please enter a declared value so insurance can be priced.");
  }

  return {
    serviceType,
    pickup,
    delivery,
    items,
    declaredValueGbp,
    wantsInsurance,
    readyDate: optionalText(input.readyDate, "the collection date", 40),
    vehicleDescription,
  };
}

/** Validate a booking contact card, returning a freshly built object. */
function sanitiseContact(value: unknown): LeadContact {
  const raw = (value ?? {}) as Partial<LeadContact>;

  const name = requireText(raw.name, "your name", 120);
  const email = requireText(raw.email, "your email address", 254);
  // Deliberately loose: full RFC validation rejects real addresses. The
  // confirmation email simply will not arrive if the address is wrong.
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Please enter a valid email address.");
  }
  const phone = requireText(raw.phone, "your phone number", 30);

  const preferredContact = raw.preferredContact;
  if (
    preferredContact !== "phone" &&
    preferredContact !== "email" &&
    preferredContact !== "whatsapp"
  ) {
    throw new Error("Please choose how you would like to be contacted.");
  }

  return {
    name,
    email,
    phone,
    preferredContact,
    notes: optionalText(raw.notes, "your notes", 2000),
  };
}

/**
 * Resolve which carrier the current caller is acting as: the signed-in
 * user's carrier in Supabase mode, or the first demo carrier in demo mode
 * (the demo dashboard has no auth). Null = not signed in / no carrier yet.
 */
async function resolveSessionCarrier(): Promise<Carrier | null> {
  if (!isSupabaseConfigured()) {
    return DEMO_CARRIERS[0] ?? null;
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  return getCarrierByOwner(user.id);
}

// ---------------------------------------------------------------------------
// Quote flow
// ---------------------------------------------------------------------------

/**
 * Price a shipment request against every carrier on its lane and persist the
 * snapshot. Returns the quote id for the results page URL.
 */
export async function createQuoteAction(
  request: ShipmentRequest,
): Promise<CreateQuoteResult> {
  const sanitised = sanitiseRequest(request);

  const { services, carriersById } = await getServicesForLane(
    sanitised.pickup.country,
    sanitised.delivery.country,
  );
  const { results, rejections } = quoteAll(services, carriersById, sanitised);

  const quoteId = await saveQuote(sanitised, results, rejections);
  return { quoteId };
}

/** Load a stored quote snapshot; null when unknown, expired or malformed. */
export async function getQuoteAction(id: string): Promise<StoredQuote | null> {
  if (typeof id !== "string") return null;
  return getQuote(id);
}

/**
 * The booking handoff: freeze the chosen price into a lead, notify the
 * carrier, confirm to the customer, and return the carrier's contact card.
 */
export async function bookQuoteAction(input: {
  quoteId: string;
  serviceId: string;
  contact: LeadContact;
}): Promise<BookQuoteResult> {
  const quoteId = requireUuid(input?.quoteId, "quote");
  const serviceId = requireUuid(input?.serviceId, "service");
  const contact = sanitiseContact(input?.contact);

  const stored = await getQuote(quoteId);
  if (!stored) {
    throw new Error("This quote could not be found. Please request a new quote.");
  }

  const result = stored.results.find((r) => r.serviceId === serviceId);
  if (!result) {
    throw new Error(
      "The selected service is not part of this quote. Please choose one of the quoted options.",
    );
  }

  const carrier = await getCarrier(result.carrierId);
  if (!carrier) {
    throw new Error(
      "This carrier is no longer available. Please choose another option from your quote.",
    );
  }

  const leadId = await createLead({
    quoteId,
    serviceId,
    carrierId: carrier.id,
    contact,
    priceSnapshot: result,
  });

  // Both emails are best-effort: sendEmail never throws (it logs instead), so
  // a mail outage can never lose the lead that was just written.
  const carrierEmail = leadEmailToCarrier({
    carrier,
    contact,
    request: stored.request,
    result,
    leadId,
  });
  const customerEmail = confirmationEmailToCustomer({
    carrier,
    contact,
    request: stored.request,
    result,
    leadId,
  });
  await Promise.all([
    sendEmail({ to: carrier.contactEmail, ...carrierEmail }),
    sendEmail({ to: contact.email, ...customerEmail }),
  ]);

  return {
    leadId,
    carrier: {
      companyName: carrier.companyName,
      contactEmail: carrier.contactEmail,
      contactPhone: carrier.contactPhone,
    },
  };
}

// ---------------------------------------------------------------------------
// Carrier dashboard
// ---------------------------------------------------------------------------

/**
 * The signed-in carrier's profile and lead inbox (newest first). Returns null
 * when nobody is signed in, or the user has no carrier profile yet — the UI
 * should redirect to login/onboarding. In demo mode this serves the first
 * demo carrier with seeded leads so the dashboard renders without Supabase.
 */
export async function carrierLeadsAction(): Promise<CarrierLeadsResult | null> {
  const carrier = await resolveSessionCarrier();
  if (!carrier) return null;
  const leads = await getLeadsForCarrier(carrier.id);
  return { carrier, leads };
}

/**
 * Move a lead through its workflow (new → contacted → accepted…). Guarded by
 * the session: only the carrier the lead belongs to can update it (enforced
 * both here and by row level security in Supabase mode).
 */
export async function updateLeadStatusAction(input: {
  leadId: string;
  status: LeadStatus;
}): Promise<void> {
  const leadId = requireUuid(input?.leadId, "lead");
  if (!isLeadStatus(input?.status)) {
    throw new Error("Please choose a valid lead status.");
  }

  const carrier = await resolveSessionCarrier();
  if (!carrier) {
    throw new Error("You must be signed in as a carrier to update leads.");
  }

  await updateLeadStatus(leadId, carrier.id, input.status);
}
