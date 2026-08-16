import { describe, expect, it } from "vitest";
import { DEMO_SERVICES } from "../../demo-data";
import { priceForQuantity } from "../tiers";

/**
 * The engine prices rate bands cumulatively, so consecutive flat bands in the
 * demo data must hold per-band INCREMENTS, not all-in totals. These tests pin
 * the intended all-in pallet schedule for Thames & Bosphorus — the tariffs
 * that were once (wrongly) authored as all-in figures and overcharged
 * multi-pallet shipments by up to 2.2×.
 */

function tiersOf(idSuffix: string) {
  const service = DEMO_SERVICES.find((s) => s.id.endsWith(idSuffix));
  expect(service, `demo service …${idSuffix} exists`).toBeDefined();
  return service!.tiers;
}

describe("Thames & Bosphorus demo pallet tariffs", () => {
  it("UK → Turkey (svc 204) prices all-in £240 / £400 / £545, then £165/pallet", () => {
    const tiers = tiersOf("204");
    expect(priceForQuantity(tiers, 1)).toBe(240);
    expect(priceForQuantity(tiers, 2)).toBe(400);
    expect(priceForQuantity(tiers, 3)).toBe(545);
    expect(priceForQuantity(tiers, 4)).toBe(710);
  });

  it("Turkey → UK (svc 205) prices all-in £230 / £385 / £525, then £160/pallet", () => {
    const tiers = tiersOf("205");
    expect(priceForQuantity(tiers, 1)).toBe(230);
    expect(priceForQuantity(tiers, 2)).toBe(385);
    expect(priceForQuantity(tiers, 3)).toBe(525);
    expect(priceForQuantity(tiers, 4)).toBe(685);
  });

  it("an extra pallet never costs more than the first (sanity on all pallet tariffs)", () => {
    for (const service of DEMO_SERVICES) {
      if (service.serviceType !== "pallet" || service.tiers.length === 0) continue;
      const first = priceForQuantity(service.tiers, 1)!;
      for (let q = 2; q <= 5; q++) {
        const total = priceForQuantity(service.tiers, q);
        if (total === null) break;
        const marginal = total - priceForQuantity(service.tiers, q - 1)!;
        expect(
          marginal,
          `${service.name}: pallet ${q}'s marginal cost should not exceed the first pallet's`,
        ).toBeLessThanOrEqual(first);
      }
    }
  });
});
