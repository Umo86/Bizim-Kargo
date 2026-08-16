import { describe, expect, it } from "vitest";
import { KG_PER_M3_WM } from "../../types";
import type { ShipmentItem } from "../../types";
import { computeChargeableBasis, volumetricKg } from "../chargeable";
import { normaliseItems } from "../normalise";

const box = (overrides: Partial<ShipmentItem> = {}): ShipmentItem => ({
  quantity: 1,
  lengthCm: 60,
  widthCm: 40,
  heightCm: 40,
  weightKg: 8,
  ...overrides,
});

describe("normaliseItems", () => {
  it("sums quantity-weighted totals", () => {
    const totals = normaliseItems([
      box({ quantity: 2, weightKg: 10 }), // 2 × 96,000 cm³, 20 kg
      box({ quantity: 1, lengthCm: 100, widthCm: 20, heightCm: 20, weightKg: 5 }),
    ]);
    expect(totals.totalActualKg).toBe(25);
    expect(totals.totalVolumeM3).toBeCloseTo(0.192 + 0.04, 10);
    expect(totals.longestSideCm).toBe(100);
    expect(totals.pieces).toBe(3);
  });

  it("returns zeros for an empty shipment (vehicle requests)", () => {
    expect(normaliseItems([])).toEqual({
      totalActualKg: 0,
      totalVolumeM3: 0,
      longestSideCm: 0,
      pieces: 0,
    });
  });

  it("rejects non-positive values with a clear message", () => {
    expect(() => normaliseItems([box({ weightKg: 0 })])).toThrow(/weight/i);
    expect(() => normaliseItems([box({ lengthCm: -5 })])).toThrow(/length/i);
    expect(() => normaliseItems([box({ quantity: 0 })])).toThrow(/quantity/i);
    expect(() => normaliseItems([box({ heightCm: NaN })])).toThrow(/height/i);
    expect(() => normaliseItems([box(), box({ widthCm: 0 })])).toThrow(/Item 2/);
  });

  it("rejects fractional quantities", () => {
    expect(() => normaliseItems([box({ quantity: 1.5 })])).toThrow(/whole number/i);
  });
});

describe("volumetricKg", () => {
  it("changes correctly with the divisor (5000 vs 3000)", () => {
    // 60 × 40 × 40 = 96,000 cm³
    expect(volumetricKg([box()], 5000)).toBeCloseTo(19.2, 10);
    expect(volumetricKg([box()], 3000)).toBeCloseTo(32, 10);
  });

  it("is quantity-weighted", () => {
    expect(volumetricKg([box({ quantity: 3 })], 5000)).toBeCloseTo(57.6, 10);
  });

  it("rejects a non-positive divisor", () => {
    expect(() => volumetricKg([box()], 0)).toThrow(/divisor/i);
  });
});

describe("computeChargeableBasis", () => {
  it("charges a light bulky box on volumetric weight and says so", () => {
    // 60×40×40 cm at 8 kg with divisor 5000 → volumetric 19.2 kg wins.
    const basis = computeChargeableBasis([box()], 5000, "kg");
    expect(basis.actualKg).toBe(8);
    expect(basis.volumetricKg).toBeCloseTo(19.2, 10);
    expect(basis.chargeableKg).toBeCloseTo(19.2, 10);
    expect(basis.quantity).toBeCloseTo(19.2, 10);
    expect(basis.unit).toBe("kg");
    expect(basis.explanation).toContain("volumetric");
    expect(basis.explanation).toContain("19.2");
    expect(basis.explanation).toContain("8");
  });

  it("charges a dense box on actual weight and says so", () => {
    const basis = computeChargeableBasis([box({ weightKg: 40 })], 5000, "kg");
    expect(basis.chargeableKg).toBe(40);
    expect(basis.quantity).toBe(40);
    expect(basis.explanation).toContain("actual weight");
  });

  it("applies the W/M rule for cbm pricing: dense 100 kg in 0.1 m³", () => {
    // 50 × 50 × 40 cm = 100,000 cm³ = 0.1 m³ at 100 kg.
    const dense = box({ lengthCm: 50, widthCm: 50, heightCm: 40, weightKg: 100 });
    const basis = computeChargeableBasis([dense], 3000, "cbm");
    expect(basis.volumeM3).toBeCloseTo(0.1, 10);
    expect(basis.chargeableM3).toBeCloseTo(100 / KG_PER_M3_WM, 10);
    expect(basis.quantity).toBeCloseTo(100 / KG_PER_M3_WM, 10);
    expect(basis.explanation).toContain("weight-or-measure");
  });

  it("charges genuinely voluminous cbm loads on their actual volume", () => {
    // 1 m³ at 50 kg: W/M equivalent is only 0.15 m³.
    const bulky = box({ lengthCm: 100, widthCm: 100, heightCm: 100, weightKg: 50 });
    const basis = computeChargeableBasis([bulky], 3000, "cbm");
    expect(basis.chargeableM3).toBeCloseTo(1, 10);
    expect(basis.quantity).toBeCloseTo(1, 10);
    expect(basis.explanation).toContain("actual volume");
  });

  it("uses the piece count for pallet pricing", () => {
    const pallets = box({
      quantity: 3,
      lengthCm: 120,
      widthCm: 100,
      heightCm: 150,
      weightKg: 250,
    });
    const basis = computeChargeableBasis([pallets], 3000, "pallet");
    expect(basis.unit).toBe("pallet");
    expect(basis.quantity).toBe(3);
    expect(basis.explanation).toContain("3 pieces");
  });

  it("treats 3 identical boxes the same as one line with quantity 3", () => {
    const asOneLine = computeChargeableBasis([box({ quantity: 3 })], 5000, "kg");
    const asThreeLines = computeChargeableBasis([box(), box(), box()], 5000, "kg");
    expect(asThreeLines.actualKg).toBe(asOneLine.actualKg);
    expect(asThreeLines.volumetricKg).toBeCloseTo(asOneLine.volumetricKg, 10);
    expect(asThreeLines.chargeableKg).toBeCloseTo(asOneLine.chargeableKg, 10);
    expect(asThreeLines.volumeM3).toBeCloseTo(asOneLine.volumeM3, 10);
    expect(asThreeLines.quantity).toBeCloseTo(asOneLine.quantity, 10);
  });

  it("produces an all-zero basis for empty items without throwing", () => {
    const basis = computeChargeableBasis([], 3000, "kg");
    expect(basis.actualKg).toBe(0);
    expect(basis.chargeableKg).toBe(0);
    expect(basis.quantity).toBe(0);
    expect(basis.explanation).toMatch(/no item dimensions/i);
  });
});
