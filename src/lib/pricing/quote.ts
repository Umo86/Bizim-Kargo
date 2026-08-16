/**
 * The deterministic quoting pipeline: eligibility checks, chargeable basis,
 * cumulative tariff pricing and the itemised price build-up for one carrier
 * service — plus quoteAll to fan a request out across every service.
 * Pure functions, no I/O.
 */

import { isCrossBorder } from "../types";
import type {
  Carrier,
  CarrierService,
  PriceLine,
  PricingUnit,
  QuoteRejection,
  QuoteResult,
  ShipmentRequest,
  ZoneCode,
  ZoneSurcharge,
} from "../types";
import { ZONE_LABELS } from "../zones";
import { computeChargeableBasis } from "./chargeable";
import { normaliseItems } from "./normalise";
import { priceForQuantity } from "./tiers";

/** Round a currency amount to 2 decimal places (pence). */
export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/** Narrow a quoteService result: rejections carry a reason, results do not. */
export function isRejection(
  outcome: QuoteResult | QuoteRejection
): outcome is QuoteRejection {
  return "reason" in outcome;
}

const UNIT_NOUNS: Record<PricingUnit, string> = {
  kg: "kg",
  cbm: "m³",
  pallet: "pallet(s)",
};

/** Format a GBP amount for use inside notes/details. All prices are GBP in v1. */
function gbp(n: number): string {
  return `£${n.toFixed(2)}`;
}

/** Format a fraction as a percentage for prose: 0.12 → "12", 0.025 → "2.5". */
function pct(fraction: number): string {
  return (fraction * 100).toFixed(2).replace(/\.00$/, "").replace(/(\.\d)0$/, "$1");
}

/** Format a quantity for prose: at most 2 decimal places, no trailing zeros. */
function qty(n: number): string {
  return n.toFixed(2).replace(/\.00$/, "").replace(/(\.\d)0$/, "$1");
}

/**
 * Quote one carrier service for a shipment request, or explain why it cannot.
 *
 * The request's pickup/delivery zones must already be resolved (see
 * resolveZone in src/lib/zones.ts) — an unresolved zone is caller error and
 * throws rather than producing a misleading rejection.
 */
export function quoteService(
  service: CarrierService,
  carrier: Carrier,
  request: ShipmentRequest
): QuoteResult | QuoteRejection {
  const reject = (reason: QuoteRejection["reason"], detail: string): QuoteRejection => ({
    serviceId: service.id,
    carrierId: service.carrierId,
    reason,
    detail,
  });

  // -- Eligibility gates, cheapest checks first ----------------------------

  if (!service.active) {
    return reject("service_inactive", "This service is currently inactive.");
  }

  if (
    service.origin !== request.pickup.country ||
    service.destination !== request.delivery.country
  ) {
    return reject(
      "lane_not_served",
      `This service runs ${service.origin} → ${service.destination}, not ` +
        `${request.pickup.country} → ${request.delivery.country}.`
    );
  }

  // Strict service-type equality. The rejection enum has no dedicated code
  // for a type mismatch, so it is reported as the lane not being served for
  // this kind of shipment — the detail carries the real story.
  if (service.serviceType !== request.serviceType) {
    return reject(
      "lane_not_served",
      `This service handles ${service.serviceType} shipments, not ${request.serviceType} requests.`
    );
  }

  const pickupZone = requireZone(request.pickup.zone, "pickup");
  const deliveryZone = requireZone(request.delivery.zone, "delivery");

  const pickupEntry = findZone(service.zones, pickupZone);
  const deliveryEntry = findZone(service.zones, deliveryZone);
  // A zone missing from the service's list is unserved, exactly like an
  // explicit served=false entry.
  const unserved: string[] = [];
  if (!pickupEntry?.served) unserved.push(`pickup zone ${ZONE_LABELS[pickupZone]}`);
  if (!deliveryEntry?.served) unserved.push(`delivery zone ${ZONE_LABELS[deliveryZone]}`);
  if (unserved.length > 0) {
    return reject(
      "zone_not_served",
      `This service does not cover the ${unserved.join(" or the ")}.`
    );
  }

  // -- Physical limits (actual weight and longest edge) --------------------

  const totals = normaliseItems(request.items);

  if (service.maxWeightKg !== null && totals.totalActualKg > service.maxWeightKg) {
    return reject(
      "over_max_weight",
      `Total actual weight ${qty(totals.totalActualKg)} kg exceeds this service's ` +
        `${qty(service.maxWeightKg)} kg limit.`
    );
  }

  if (service.maxDimCm !== null && totals.longestSideCm > service.maxDimCm) {
    return reject(
      "over_max_dimension",
      `Longest side ${qty(totals.longestSideCm)} cm exceeds this service's ` +
        `${qty(service.maxDimCm)} cm limit.`
    );
  }

  // -- Chargeable basis ----------------------------------------------------

  // The tariff's pricing unit decides which quantity the bands apply to.
  // Tariffs are configured per service, so mixed units are a data error.
  const unit: PricingUnit = service.tiers[0]?.unit ?? "kg";
  if (service.tiers.some((tier) => tier.unit !== unit)) {
    throw new Error(
      `Service ${service.id} has rate bands with mixed pricing units — a tariff must use one unit throughout.`
    );
  }

  const basis = computeChargeableBasis(request.items, service.volumetricDivisor, unit);

  const baseResult = (lines: PriceLine[], requiresManualQuote: boolean): QuoteResult => ({
    serviceId: service.id,
    carrierId: service.carrierId,
    carrier: {
      slug: carrier.slug,
      companyName: carrier.companyName,
      verified: carrier.verified,
      rating: carrier.rating,
      reviewCount: carrier.reviewCount,
      yearsOperating: carrier.yearsOperating,
    },
    serviceName: service.name,
    mode: service.mode,
    transitDaysMin: service.transitDaysMin,
    transitDaysMax: service.transitDaysMax,
    currency: service.currency,
    basis,
    lines,
    total: round2(lines.reduce((sum, line) => sum + line.amount, 0)),
    requiresManualQuote,
  });

  // Vehicle transport is always priced by hand: return a manual-quote result
  // with the (possibly zero) basis attached and no price lines.
  if (service.serviceType === "vehicle") {
    return baseResult([], true);
  }

  // -- Base freight from the cumulative tariff -----------------------------

  const rawFreight = priceForQuantity(service.tiers, basis.quantity);
  if (rawFreight === null) {
    return reject(
      "no_tier_for_quantity",
      `No rate band on this tariff covers ${qty(basis.quantity)} ${UNIT_NOUNS[unit]}.`
    );
  }

  const minChargeApplies = service.minCharge > rawFreight;
  const baseFreight = round2(Math.max(service.minCharge, rawFreight));

  const lines: PriceLine[] = [];
  lines.push({
    code: "base_freight",
    label: "Base freight",
    amount: baseFreight,
    note: minChargeApplies
      ? `${basis.explanation} Minimum charge of ${gbp(service.minCharge)} applied.`
      : basis.explanation,
  });

  // -- Fixed fees ----------------------------------------------------------

  if (service.collectionFee > 0) {
    lines.push({
      code: "collection",
      label: "Collection",
      amount: round2(service.collectionFee),
      note: "Collection from your pickup address.",
    });
  }

  if (service.deliveryFee > 0) {
    lines.push({
      code: "delivery",
      label: "Delivery",
      amount: round2(service.deliveryFee),
      note: "Delivery to the destination address.",
    });
  }

  // v1: every booking is door-to-door, so a configured residential fee
  // always applies.
  if (service.residentialFee > 0) {
    lines.push({
      code: "residential",
      label: "Residential delivery",
      amount: round2(service.residentialFee),
      note: "Applies to door-to-door residential addresses.",
    });
  }

  // -- Zone surcharges (one combined line for both legs) -------------------

  const zoneParts: string[] = [];
  let zoneTotal = 0;
  if (pickupEntry && pickupEntry.flat > 0) {
    zoneTotal += pickupEntry.flat;
    zoneParts.push(`${ZONE_LABELS[pickupZone]} pickup ${gbp(pickupEntry.flat)}`);
  }
  if (deliveryEntry && deliveryEntry.flat > 0) {
    zoneTotal += deliveryEntry.flat;
    zoneParts.push(`${ZONE_LABELS[deliveryZone]} delivery ${gbp(deliveryEntry.flat)}`);
  }
  if (zoneTotal > 0) {
    lines.push({
      code: "zone_surcharge",
      label: "Zone surcharge",
      amount: round2(zoneTotal),
      note: zoneParts.join("; "),
    });
  }

  // -- Customs (cross-border lanes only) -----------------------------------

  const lane = { origin: service.origin, destination: service.destination };
  if (isCrossBorder(lane) && service.customsFee > 0) {
    lines.push({
      code: "customs_clearance",
      label: "Customs clearance",
      amount: round2(service.customsFee),
      note: "Export and import clearance between the UK and Turkey.",
    });
  }

  // -- Insurance (opt-in, needs a declared value) --------------------------

  const declaredValue = request.declaredValueGbp ?? 0;
  if (request.wantsInsurance && declaredValue > 0) {
    const percentagePremium = declaredValue * service.insurancePct;
    const premium = round2(Math.max(service.insuranceMin, percentagePremium));
    lines.push({
      code: "insurance",
      label: "Insurance",
      amount: premium,
      note:
        service.insuranceMin > percentagePremium
          ? `Minimum premium of ${gbp(service.insuranceMin)} (more than ` +
            `${pct(service.insurancePct)}% of your ${gbp(declaredValue)} declared value).`
          : `${pct(service.insurancePct)}% of your ${gbp(declaredValue)} declared value.`,
    });
  }

  // -- Fuel surcharge: a percentage of base freight ONLY, never of fees ----

  if (service.fuelPct > 0 && baseFreight > 0) {
    lines.push({
      code: "fuel_surcharge",
      label: "Fuel surcharge",
      amount: round2(baseFreight * service.fuelPct),
      note: `${pct(service.fuelPct)}% of base freight.`,
    });
  }

  return baseResult(lines, false);
}

/**
 * Quote a request against every service, splitting quotable results from
 * rejections. Results are sorted cheapest first (ties broken by transit time,
 * then service id, for a stable order).
 */
export function quoteAll(
  services: CarrierService[],
  carriersById: Record<string, Carrier>,
  request: ShipmentRequest
): { results: QuoteResult[]; rejections: QuoteRejection[] } {
  const results: QuoteResult[] = [];
  const rejections: QuoteRejection[] = [];

  for (const service of services) {
    const carrier = carriersById[service.carrierId];
    if (!carrier) {
      throw new Error(
        `Unknown carrier "${service.carrierId}" for service "${service.id}" — carriersById is incomplete.`
      );
    }
    const outcome = quoteService(service, carrier, request);
    if (isRejection(outcome)) {
      rejections.push(outcome);
    } else {
      results.push(outcome);
    }
  }

  results.sort(
    (a, b) =>
      a.total - b.total ||
      a.transitDaysMin - b.transitDaysMin ||
      a.serviceId.localeCompare(b.serviceId)
  );

  return { results, rejections };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function requireZone(zone: ZoneCode | undefined, leg: "pickup" | "delivery"): ZoneCode {
  if (!zone) {
    throw new Error(
      `The ${leg} zone has not been resolved — call resolveZone on the address before quoting.`
    );
  }
  return zone;
}

function findZone(zones: ZoneSurcharge[], zone: ZoneCode): ZoneSurcharge | undefined {
  return zones.find((entry) => entry.zone === zone);
}
