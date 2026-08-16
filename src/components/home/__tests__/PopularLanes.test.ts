import { describe, expect, it } from "vitest";
import { DEMO_CARRIERS_BY_ID, DEMO_SERVICES } from "@/lib/demo-data";
import { quoteAll, resolveZone } from "@/lib/pricing";
import type { ShipmentRequest } from "@/lib/types";
import { LANES } from "../PopularLanes";

/**
 * The homepage lane cards advertise "from" prices for a 10 kg parcel by road.
 * Each advertised price must never overstate what the engine can actually
 * quote: it has to be at or below the cheapest all-in demo-data total for the
 * lane's reference parcel. This guards the static marketing copy against
 * drifting when demo tariffs change.
 */

/** The caption's reference shipment: a 10 kg parcel. */
const REFERENCE_PARCEL = {
  quantity: 1,
  lengthCm: 40,
  widthCm: 30,
  heightCm: 20,
  weightKg: 10,
};

function cheapestEngineTotal(lane: (typeof LANES)[number]): number {
  const request: ShipmentRequest = {
    serviceType: "parcel",
    pickup: {
      country: lane.fromCountry,
      postcodeOrCity: lane.fromCity,
      zone: resolveZone(lane.fromCountry, lane.fromCity),
    },
    delivery: {
      country: lane.toCountry,
      postcodeOrCity: lane.toCity,
      zone: resolveZone(lane.toCountry, lane.toCity),
    },
    items: [REFERENCE_PARCEL],
  };
  const { results } = quoteAll(DEMO_SERVICES, DEMO_CARRIERS_BY_ID, request);
  const instant = results.filter((result) => !result.requiresManualQuote);
  expect(
    instant.length,
    `no instant quote for ${lane.fromCity} → ${lane.toCity}`,
  ).toBeGreaterThan(0);
  return Math.min(...instant.map((result) => result.total));
}

describe("PopularLanes guide prices", () => {
  it.each(LANES.map((lane) => [`${lane.fromCity} → ${lane.toCity}`, lane] as const))(
    "%s: advertised 'from' price does not exceed the cheapest real quote",
    (_label, lane) => {
      const advertised = Number(lane.fromPrice.replace(/[^\d.]/g, ""));
      expect(Number.isFinite(advertised)).toBe(true);
      expect(advertised).toBeLessThanOrEqual(cheapestEngineTotal(lane));
    },
  );
});
