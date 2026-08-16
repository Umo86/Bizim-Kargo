import { describe, expect, it } from "vitest";
import type {
  Carrier,
  CarrierService,
  PriceLine,
  QuoteRejection,
  QuoteResult,
  ShipmentRequest,
} from "../../types";
import { isRejection, quoteAll, quoteService } from "../quote";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const carrier: Carrier = {
  id: "c1",
  slug: "anadolu-express",
  companyName: "Anadolu Express",
  blurb: "Weekly groupage between the UK and Turkey.",
  baseCountry: "GB",
  contactEmail: "ops@example.com",
  contactPhone: "+44 20 7946 0000",
  verified: true,
  rating: 4.6,
  reviewCount: 128,
  yearsOperating: 12,
  logoUrl: null,
};

/** GB→TR parcel service: £75 first 10 kg, £7/kg to 30 kg, £6.50/kg beyond. */
function makeService(overrides: Partial<CarrierService> = {}): CarrierService {
  return {
    id: "s1",
    carrierId: "c1",
    serviceType: "parcel",
    origin: "GB",
    destination: "TR",
    mode: "road",
    name: "Weekly road groupage",
    transitDaysMin: 5,
    transitDaysMax: 8,
    currency: "GBP",
    volumetricDivisor: 5000,
    minCharge: 0,
    fuelPct: 0,
    customsFee: 0,
    collectionFee: 0,
    deliveryFee: 0,
    residentialFee: 0,
    insurancePct: 0.02,
    insuranceMin: 15,
    maxWeightKg: null,
    maxDimCm: null,
    active: true,
    tiers: [
      { unit: "kg", fromQty: 0, toQty: 10, flatPrice: 75 },
      { unit: "kg", fromQty: 10, toQty: 30, pricePerUnit: 7 },
      { unit: "kg", fromQty: 30, toQty: null, pricePerUnit: 6.5 },
    ],
    zones: [
      { zone: "GB-MAINLAND", flat: 0, served: true },
      { zone: "GB-HIGHLANDS", flat: 15, served: true },
      { zone: "GB-NI", flat: 0, served: false },
      { zone: "TR-MARMARA", flat: 0, served: true },
      { zone: "TR-ANKARA", flat: 10, served: true },
      { zone: "TR-EAST", flat: 25, served: true },
    ],
    ...overrides,
  };
}

/** 40×30×30 cm box at 20 kg: volumetric 7.2 kg, so actual 20 kg wins → £145 base. */
function makeRequest(overrides: Partial<ShipmentRequest> = {}): ShipmentRequest {
  return {
    serviceType: "parcel",
    pickup: { country: "GB", postcodeOrCity: "M1 1AE", zone: "GB-MAINLAND" },
    delivery: { country: "TR", postcodeOrCity: "İstanbul / Kadıköy", zone: "TR-MARMARA" },
    items: [{ quantity: 1, lengthCm: 40, widthCm: 30, heightCm: 30, weightKg: 20 }],
    ...overrides,
  };
}

function expectResult(outcome: QuoteResult | QuoteRejection): QuoteResult {
  expect(isRejection(outcome), `expected a result, got rejection: ${JSON.stringify(outcome)}`).toBe(false);
  return outcome as QuoteResult;
}

function expectRejection(outcome: QuoteResult | QuoteRejection): QuoteRejection {
  expect(isRejection(outcome), "expected a rejection, got a result").toBe(true);
  return outcome as QuoteRejection;
}

function line(result: QuoteResult, code: PriceLine["code"]): PriceLine | undefined {
  return result.lines.find((l) => l.code === code);
}

// ---------------------------------------------------------------------------
// Happy path and the price build-up
// ---------------------------------------------------------------------------

describe("quoteService — build-up", () => {
  it("prices a plain shipment on the tariff alone", () => {
    const result = expectResult(quoteService(makeService(), carrier, makeRequest()));
    expect(result.total).toBe(145); // 75 + 10 × £7
    expect(result.lines).toHaveLength(1);
    expect(result.lines[0].code).toBe("base_freight");
    expect(result.lines[0].note).toContain("actual weight");
    expect(result.requiresManualQuote).toBe(false);
    expect(result.carrier.companyName).toBe("Anadolu Express");
    expect(result.basis.chargeableKg).toBe(20);
  });

  it("charges a light bulky box on volumetric weight and explains it", () => {
    const request = makeRequest({
      items: [{ quantity: 1, lengthCm: 60, widthCm: 40, heightCm: 40, weightKg: 8 }],
    });
    const result = expectResult(quoteService(makeService(), carrier, request));
    // Volumetric 19.2 kg wins over actual 8 kg → 75 + 9.2 × £7 = £139.40.
    expect(result.basis.volumetricKg).toBeCloseTo(19.2, 10);
    expect(result.basis.chargeableKg).toBeCloseTo(19.2, 10);
    expect(result.total).toBeCloseTo(139.4, 10);
    expect(line(result, "base_freight")!.note).toContain("volumetric weight (19.2 kg)");
  });

  it("applies the minimum charge floor and notes it", () => {
    const service = makeService({
      minCharge: 90,
      tiers: [{ unit: "kg", fromQty: 0, toQty: null, pricePerUnit: 3 }],
    });
    const request = makeRequest({
      items: [{ quantity: 1, lengthCm: 20, widthCm: 15, heightCm: 10, weightKg: 2 }],
    });
    const result = expectResult(quoteService(service, carrier, request));
    expect(line(result, "base_freight")!.amount).toBe(90); // not 2 × £3 = £6
    expect(line(result, "base_freight")!.note).toContain("Minimum charge");
    expect(result.total).toBe(90);
  });

  it("applies fuel to base freight only, never to fees", () => {
    const service = makeService({
      fuelPct: 0.12,
      collectionFee: 10,
      deliveryFee: 12,
      residentialFee: 8,
      customsFee: 45,
    });
    const result = expectResult(quoteService(service, carrier, makeRequest()));
    const fuel = line(result, "fuel_surcharge")!;
    expect(fuel.amount).toBeCloseTo(0.12 * 145, 10); // 17.40 — fees excluded
    expect(fuel.note).toBe("12% of base freight.");
    expect(line(result, "collection")!.amount).toBe(10);
    expect(line(result, "delivery")!.amount).toBe(12);
    expect(line(result, "residential")!.amount).toBe(8);
    expect(line(result, "customs_clearance")!.amount).toBe(45);
    expect(result.total).toBeCloseTo(145 + 10 + 12 + 8 + 45 + 17.4, 10);
    // Fuel is the last line of the build-up.
    expect(result.lines[result.lines.length - 1].code).toBe("fuel_surcharge");
  });

  it("combines pickup and delivery zone surcharges into one line", () => {
    const request = makeRequest({
      pickup: { country: "GB", postcodeOrCity: "IV2 3AA", zone: "GB-HIGHLANDS" },
      delivery: { country: "TR", postcodeOrCity: "Van", zone: "TR-EAST" },
    });
    const result = expectResult(quoteService(makeService(), carrier, request));
    const surcharge = line(result, "zone_surcharge")!;
    expect(surcharge.amount).toBe(40); // £15 Highlands pickup + £25 East delivery
    expect(surcharge.note).toContain("Scottish Highlands");
    expect(surcharge.note).toContain("Eastern & Southeastern Anatolia");
    expect(result.total).toBe(185);
  });

  it("treats 3 identical boxes the same as one line with quantity 3", () => {
    const oneLine = makeRequest({
      items: [{ quantity: 3, lengthCm: 40, widthCm: 30, heightCm: 30, weightKg: 20 }],
    });
    const threeLines = makeRequest({
      items: Array.from({ length: 3 }, () => ({
        quantity: 1,
        lengthCm: 40,
        widthCm: 30,
        heightCm: 30,
        weightKg: 20,
      })),
    });
    const a = expectResult(quoteService(makeService(), carrier, oneLine));
    const b = expectResult(quoteService(makeService(), carrier, threeLines));
    expect(a.total).toBe(b.total);
    expect(a.basis.chargeableKg).toBe(b.basis.chargeableKg);
  });
});

// ---------------------------------------------------------------------------
// Pricing units
// ---------------------------------------------------------------------------

describe("quoteService — pricing units", () => {
  it("charges cbm services on max(actual m³, kg / 333) — the W/M rule", () => {
    const service = makeService({
      serviceType: "volume",
      volumetricDivisor: 3000,
      tiers: [
        { unit: "cbm", fromQty: 0, toQty: 1, flatPrice: 40 },
        { unit: "cbm", fromQty: 1, toQty: null, pricePerUnit: 35 },
      ],
    });
    const request = makeRequest({
      serviceType: "volume",
      // 50 × 50 × 40 cm = 0.1 m³ at a dense 100 kg.
      items: [{ quantity: 1, lengthCm: 50, widthCm: 50, heightCm: 40, weightKg: 100 }],
    });
    const result = expectResult(quoteService(service, carrier, request));
    expect(result.basis.unit).toBe("cbm");
    expect(result.basis.chargeableM3).toBeCloseTo(100 / 333, 10);
    expect(result.basis.quantity).toBeCloseTo(100 / 333, 10);
    // 0.3003 m³ sits inside the 1 m³ minimum flat band.
    expect(result.total).toBe(40);
  });

  it("charges pallet services on the piece count", () => {
    const service = makeService({
      serviceType: "pallet",
      tiers: [
        { unit: "pallet", fromQty: 0, toQty: 1, flatPrice: 120 },
        { unit: "pallet", fromQty: 1, toQty: 2, flatPrice: 80 },
        { unit: "pallet", fromQty: 2, toQty: 3, flatPrice: 70 },
      ],
    });
    const request = makeRequest({
      serviceType: "pallet",
      items: [{ quantity: 3, lengthCm: 120, widthCm: 100, heightCm: 150, weightKg: 250 }],
    });
    const result = expectResult(quoteService(service, carrier, request));
    expect(result.basis.unit).toBe("pallet");
    expect(result.basis.quantity).toBe(3);
    expect(result.total).toBe(270); // 120 + 80 + 70 cumulative flats
  });
});

// ---------------------------------------------------------------------------
// Customs and insurance
// ---------------------------------------------------------------------------

describe("quoteService — customs and insurance", () => {
  it("adds customs on cross-border lanes only", () => {
    const crossBorder = expectResult(
      quoteService(makeService({ customsFee: 45 }), carrier, makeRequest())
    );
    expect(line(crossBorder, "customs_clearance")!.amount).toBe(45);

    // Same fee configured on a TR→TR domestic service: no customs line.
    const domesticService = makeService({
      origin: "TR",
      destination: "TR",
      customsFee: 45,
      zones: [
        { zone: "TR-MARMARA", flat: 0, served: true },
        { zone: "TR-ANKARA", flat: 0, served: true },
      ],
    });
    const domesticRequest = makeRequest({
      pickup: { country: "TR", postcodeOrCity: "İstanbul", zone: "TR-MARMARA" },
      delivery: { country: "TR", postcodeOrCity: "Ankara", zone: "TR-ANKARA" },
    });
    const domestic = expectResult(quoteService(domesticService, carrier, domesticRequest));
    expect(line(domestic, "customs_clearance")).toBeUndefined();
  });

  it("charges the minimum insurance premium when it beats the percentage", () => {
    const request = makeRequest({ wantsInsurance: true, declaredValueGbp: 200 });
    const result = expectResult(quoteService(makeService(), carrier, request));
    // 2% of £200 = £4, below the £15 minimum.
    expect(line(result, "insurance")!.amount).toBe(15);
    expect(line(result, "insurance")!.note).toContain("Minimum premium");
  });

  it("charges the percentage premium on higher declared values", () => {
    const request = makeRequest({ wantsInsurance: true, declaredValueGbp: 5000 });
    const result = expectResult(quoteService(makeService(), carrier, request));
    expect(line(result, "insurance")!.amount).toBe(100); // 2% of £5,000
    expect(line(result, "insurance")!.note).toContain("2%");
  });

  it("adds no insurance line without opt-in or declared value", () => {
    const noOptIn = expectResult(
      quoteService(makeService(), carrier, makeRequest({ declaredValueGbp: 5000 }))
    );
    expect(line(noOptIn, "insurance")).toBeUndefined();

    const noValue = expectResult(
      quoteService(makeService(), carrier, makeRequest({ wantsInsurance: true }))
    );
    expect(line(noValue, "insurance")).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Rejections
// ---------------------------------------------------------------------------

describe("quoteService — rejections", () => {
  it("rejects an inactive service", () => {
    const rejection = expectRejection(
      quoteService(makeService({ active: false }), carrier, makeRequest())
    );
    expect(rejection.reason).toBe("service_inactive");
  });

  it("rejects a lane mismatch", () => {
    const rejection = expectRejection(
      quoteService(makeService({ origin: "TR", destination: "GB" }), carrier, makeRequest())
    );
    expect(rejection.reason).toBe("lane_not_served");
    expect(rejection.detail).toContain("TR → GB");
  });

  it("rejects a service-type mismatch under strict equality", () => {
    const rejection = expectRejection(
      quoteService(makeService({ serviceType: "pallet" }), carrier, makeRequest())
    );
    expect(rejection.reason).toBe("lane_not_served");
    expect(rejection.detail).toContain("pallet");
    expect(rejection.detail).toContain("parcel");
  });

  it("rejects an explicitly unserved zone (served: false)", () => {
    const request = makeRequest({
      pickup: { country: "GB", postcodeOrCity: "BT7 1NN", zone: "GB-NI" },
    });
    const rejection = expectRejection(quoteService(makeService(), carrier, request));
    expect(rejection.reason).toBe("zone_not_served");
    expect(rejection.detail).toContain("Northern Ireland");
  });

  it("rejects a zone missing from the zones array entirely", () => {
    const request = makeRequest({
      delivery: { country: "TR", postcodeOrCity: "Antalya", zone: "TR-MED" },
    });
    const rejection = expectRejection(quoteService(makeService(), carrier, request));
    expect(rejection.reason).toBe("zone_not_served");
    expect(rejection.detail).toContain("Mediterranean");
  });

  it("rejects over max weight on ACTUAL kg", () => {
    const service = makeService({ maxWeightKg: 15 });
    const rejection = expectRejection(quoteService(service, carrier, makeRequest()));
    expect(rejection.reason).toBe("over_max_weight");
    expect(rejection.detail).toContain("20 kg");
  });

  it("rejects over max dimension on the longest side", () => {
    const service = makeService({ maxDimCm: 100 });
    const request = makeRequest({
      items: [{ quantity: 1, lengthCm: 120, widthCm: 30, heightCm: 30, weightKg: 10 }],
    });
    const rejection = expectRejection(quoteService(service, carrier, request));
    expect(rejection.reason).toBe("over_max_dimension");
    expect(rejection.detail).toContain("120 cm");
  });

  it("rejects when no tier covers the quantity", () => {
    const service = makeService({
      tiers: [{ unit: "kg", fromQty: 0, toQty: 10, flatPrice: 75 }],
    });
    const rejection = expectRejection(quoteService(service, carrier, makeRequest()));
    expect(rejection.reason).toBe("no_tier_for_quantity");
    expect(rejection.detail).toContain("20 kg");
  });

  it("rejects an empty tariff as no coverage", () => {
    const rejection = expectRejection(
      quoteService(makeService({ tiers: [] }), carrier, makeRequest())
    );
    expect(rejection.reason).toBe("no_tier_for_quantity");
  });

  it("throws when the request zones were never resolved", () => {
    const request = makeRequest({
      pickup: { country: "GB", postcodeOrCity: "M1 1AE" }, // zone missing
    });
    expect(() => quoteService(makeService(), carrier, request)).toThrow(/resolveZone/);
  });
});

// ---------------------------------------------------------------------------
// Vehicles
// ---------------------------------------------------------------------------

describe("quoteService — vehicle requests", () => {
  it("returns a manual-quote result without throwing on empty items", () => {
    const service = makeService({ serviceType: "vehicle", tiers: [] });
    const request = makeRequest({
      serviceType: "vehicle",
      items: [],
      vehicleDescription: "2016 Ford Transit, running",
    });
    const result = expectResult(quoteService(service, carrier, request));
    expect(result.requiresManualQuote).toBe(true);
    expect(result.total).toBe(0);
    expect(result.lines).toEqual([]);
    expect(result.basis.actualKg).toBe(0);
    expect(result.basis.quantity).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// quoteAll
// ---------------------------------------------------------------------------

describe("quoteAll", () => {
  const carrier2: Carrier = { ...carrier, id: "c2", slug: "bosphorus-line", companyName: "Bosphorus Line" };

  it("splits results from rejections and sorts by total ascending", () => {
    const services: CarrierService[] = [
      makeService(), // £145
      makeService({
        id: "s2",
        carrierId: "c2",
        tiers: [{ unit: "kg", fromQty: 0, toQty: null, pricePerUnit: 5 }], // £100
      }),
      makeService({ id: "s3", active: false }),
      makeService({ id: "s4", maxWeightKg: 5 }),
    ];
    const { results, rejections } = quoteAll(
      services,
      { c1: carrier, c2: carrier2 },
      makeRequest()
    );
    expect(results.map((r) => r.serviceId)).toEqual(["s2", "s1"]);
    expect(results[0].total).toBe(100);
    expect(results[1].total).toBe(145);
    expect(results[0].carrier.companyName).toBe("Bosphorus Line");
    expect(rejections.map((r) => r.reason).sort()).toEqual([
      "over_max_weight",
      "service_inactive",
    ]);
  });

  it("throws loudly when a service references an unknown carrier", () => {
    expect(() => quoteAll([makeService()], {}, makeRequest())).toThrow(/Unknown carrier/);
  });
});
