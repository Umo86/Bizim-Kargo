import { describe, expect, it } from "vitest";
import type { RateTier } from "../../types";
import { priceForQuantity } from "../tiers";

/** "£75 covers the first 10 kg, then £7/kg to 30 kg, then £6.50/kg forever." */
const kgTariff: RateTier[] = [
  { unit: "kg", fromQty: 0, toQty: 10, flatPrice: 75 },
  { unit: "kg", fromQty: 10, toQty: 30, pricePerUnit: 7 },
  { unit: "kg", fromQty: 30, toQty: null, pricePerUnit: 6.5 },
];

/** Capped version: no coverage above 30 kg. */
const cappedTariff: RateTier[] = [
  { unit: "kg", fromQty: 0, toQty: 10, flatPrice: 75 },
  { unit: "kg", fromQty: 10, toQty: 30, pricePerUnit: 7 },
];

describe("priceForQuantity — cumulative bands", () => {
  it("prices the canonical example: 25 kg = 75 + 15×7 = £180", () => {
    expect(priceForQuantity(cappedTariff, 25)).toBeCloseTo(180, 10);
  });

  it("prices exactly 10 kg inside the flat band", () => {
    expect(priceForQuantity(cappedTariff, 10)).toBeCloseTo(75, 10);
  });

  it("enters the per-kg band at 10.001 kg", () => {
    expect(priceForQuantity(cappedTariff, 10.001)).toBeCloseTo(75 + 0.001 * 7, 10);
  });

  it("prices exactly 30 kg at the band edge", () => {
    expect(priceForQuantity(cappedTariff, 30)).toBeCloseTo(75 + 20 * 7, 10);
  });

  it("returns null just past the last band's ceiling", () => {
    expect(priceForQuantity(cappedTariff, 30.001)).toBeNull();
    expect(priceForQuantity(cappedTariff, 100)).toBeNull();
  });

  it("returns null for an empty tariff", () => {
    expect(priceForQuantity([], 5)).toBeNull();
  });

  it("covers any quantity when the last band is open-ended", () => {
    expect(priceForQuantity(kgTariff, 50)).toBeCloseTo(75 + 140 + 20 * 6.5, 10);
  });

  it("sorts bands internally, so input order does not matter", () => {
    const shuffled = [kgTariff[2], kgTariff[0], kgTariff[1]];
    expect(priceForQuantity(shuffled, 25)).toBeCloseTo(180, 10);
  });

  it("is monotonic non-decreasing across a realistic tariff (q = 1..100)", () => {
    let previous = -Infinity;
    for (let q = 1; q <= 100; q += 0.5) {
      const price = priceForQuantity(kgTariff, q);
      expect(price).not.toBeNull();
      expect(price!).toBeGreaterThanOrEqual(previous - 1e-9);
      previous = price!;
    }
  });

  it("prices consecutive flat pallet bands cumulatively", () => {
    // 1 pallet £120, 2 pallets £200 all-in, 3 pallets £270 all-in.
    const palletTariff: RateTier[] = [
      { unit: "pallet", fromQty: 0, toQty: 1, flatPrice: 120 },
      { unit: "pallet", fromQty: 1, toQty: 2, flatPrice: 80 },
      { unit: "pallet", fromQty: 2, toQty: 3, flatPrice: 70 },
    ];
    expect(priceForQuantity(palletTariff, 1)).toBe(120);
    expect(priceForQuantity(palletTariff, 2)).toBe(200);
    expect(priceForQuantity(palletTariff, 3)).toBe(270);
    expect(priceForQuantity(palletTariff, 4)).toBeNull();
  });

  it("supports the m³ shape: flat 1 m³ minimum then per-m³", () => {
    const cbmTariff: RateTier[] = [
      { unit: "cbm", fromQty: 0, toQty: 1, flatPrice: 40 },
      { unit: "cbm", fromQty: 1, toQty: null, pricePerUnit: 35 },
    ];
    expect(priceForQuantity(cbmTariff, 0.3)).toBe(40);
    expect(priceForQuantity(cbmTariff, 1)).toBe(40);
    expect(priceForQuantity(cbmTariff, 2.5)).toBeCloseTo(40 + 1.5 * 35, 10);
  });

  it("treats the next band's fromQty as authoritative across gaps", () => {
    const gappy: RateTier[] = [
      { unit: "kg", fromQty: 0, toQty: 10, flatPrice: 75 },
      { unit: "kg", fromQty: 20, toQty: null, pricePerUnit: 5 },
    ];
    // Inside the gap: only the flat band contributes.
    expect(priceForQuantity(gappy, 15)).toBe(75);
    // Past the gap: the per-unit band charges from ITS OWN fromQty (20).
    expect(priceForQuantity(gappy, 25)).toBeCloseTo(75 + 5 * 5, 10);
  });

  it("throws on overlapping bands", () => {
    const overlapping: RateTier[] = [
      { unit: "kg", fromQty: 0, toQty: 10, flatPrice: 75 },
      { unit: "kg", fromQty: 5, toQty: 20, pricePerUnit: 7 },
    ];
    expect(() => priceForQuantity(overlapping, 8)).toThrow(/overlap/i);

    const afterOpenEnded: RateTier[] = [
      { unit: "kg", fromQty: 0, toQty: null, pricePerUnit: 7 },
      { unit: "kg", fromQty: 50, toQty: 100, pricePerUnit: 6 },
    ];
    expect(() => priceForQuantity(afterOpenEnded, 8)).toThrow(/overlap/i);
  });

  it("throws on malformed bands", () => {
    expect(() =>
      priceForQuantity([{ unit: "kg", fromQty: 0, toQty: 10 }], 5)
    ).toThrow(/exactly one/i);
    expect(() =>
      priceForQuantity(
        [{ unit: "kg", fromQty: 0, toQty: 10, flatPrice: 75, pricePerUnit: 7 }],
        5
      )
    ).toThrow(/exactly one/i);
    expect(() =>
      priceForQuantity([{ unit: "kg", fromQty: 10, toQty: 5, flatPrice: 75 }], 5)
    ).toThrow(/toQty/);
  });

  it("rejects negative quantities", () => {
    expect(() => priceForQuantity(kgTariff, -1)).toThrow(/non-negative/i);
  });
});
