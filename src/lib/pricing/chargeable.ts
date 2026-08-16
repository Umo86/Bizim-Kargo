/**
 * Chargeable-quantity calculation: volumetric weight, the weight/measure
 * (W/M) volume rule, and the ChargeableBasis record that explains to the
 * customer which measure their price was based on. Pure functions, no I/O.
 */

import type { ChargeableBasis, PricingUnit, ShipmentItem } from "../types";
import { normaliseItems } from "./normalise";

/**
 * Volumetric ("dimensional") weight in kg: Σ qty · (L·W·H cm³) / divisor.
 * The divisor comes from the carrier service (see DEFAULT_DIVISORS).
 */
export function volumetricKg(items: ShipmentItem[], divisor: number): number {
  if (!Number.isFinite(divisor) || divisor <= 0) {
    throw new Error(`Volumetric divisor must be greater than zero (got ${divisor}).`);
  }
  return items.reduce(
    (sum, item) =>
      sum + (item.quantity * item.lengthCm * item.widthCm * item.heightCm) / divisor,
    0
  );
}

/**
 * Compute the full ChargeableBasis for a shipment against one service.
 *
 * - chargeableKg = max(actual kg, volumetric kg) — courier convention.
 * - chargeableM3 = max(actual m³, actual kg × divisor / 1e6) — the freight
 *   "weight or measure" rule, so dense cargo pays its weight-equivalent volume.
 *   The equivalence density comes from the service's own volumetric divisor
 *   (cm³/kg): sea's divisor 1000 gives the classic 1 t = 1 m³ rule, road's
 *   3000 gives ≈333 kg per m³.
 * - quantity is whichever of those the tariff's pricing unit calls for
 *   (kg → chargeableKg, cbm → chargeableM3, pallet → piece count).
 *
 * The explanation is a single customer-facing sentence saying which measure
 * won and why. Validation of item values happens inside normaliseItems.
 */
export function computeChargeableBasis(
  items: ShipmentItem[],
  divisor: number,
  unit: PricingUnit
): ChargeableBasis {
  const totals = normaliseItems(items);
  const volKg = volumetricKg(items, divisor);

  const actualKg = totals.totalActualKg;
  const volumeM3 = totals.totalVolumeM3;
  const chargeableKg = Math.max(actualKg, volKg);
  // kg × (cm³/kg) ÷ 1e6 = m³ — the W/M equivalence at the service's density.
  const wmEquivalentM3 = (actualKg * divisor) / 1_000_000;
  const chargeableM3 = Math.max(volumeM3, wmEquivalentM3);

  let quantity: number;
  switch (unit) {
    case "kg":
      quantity = chargeableKg;
      break;
    case "cbm":
      quantity = chargeableM3;
      break;
    case "pallet":
      quantity = totals.pieces;
      break;
  }

  return {
    unit,
    actualKg,
    volumetricKg: volKg,
    chargeableKg,
    volumeM3,
    chargeableM3,
    quantity,
    explanation: buildExplanation(unit, {
      actualKg,
      volKg,
      chargeableKg,
      volumeM3,
      wmEquivalentM3,
      chargeableM3,
      pieces: totals.pieces,
    }),
  };
}

interface ExplanationInputs {
  actualKg: number;
  volKg: number;
  chargeableKg: number;
  volumeM3: number;
  wmEquivalentM3: number;
  chargeableM3: number;
  pieces: number;
}

function buildExplanation(unit: PricingUnit, v: ExplanationInputs): string {
  if (v.pieces === 0) {
    // Only vehicle requests arrive without items; nothing measurable to price.
    return "No item dimensions were provided, so no chargeable weight was calculated.";
  }

  switch (unit) {
    case "kg":
      // Strictly greater: on a tie the actual weight is the natural story.
      return v.volKg > v.actualKg
        ? `Charged on volumetric weight (${fmt(v.volKg)} kg) because your items are light for their size (actual ${fmt(v.actualKg)} kg).`
        : `Charged on actual weight (${fmt(v.actualKg)} kg), which is more than the volumetric weight (${fmt(v.volKg)} kg) of your items.`;
    case "cbm":
      return v.wmEquivalentM3 > v.volumeM3
        ? `Charged on ${fmt(v.chargeableM3)} m³ because your goods are heavy for their size: under the weight-or-measure rule ${fmt(v.actualKg)} kg counts as ${fmt(v.wmEquivalentM3)} m³, more than the actual ${fmt(v.volumeM3)} m³.`
        : `Charged on your actual volume of ${fmt(v.volumeM3)} m³, which is more than the weight-or-measure equivalent (${fmt(v.wmEquivalentM3)} m³) of ${fmt(v.actualKg)} kg.`;
    case "pallet":
      return `Charged per pallet on the ${v.pieces} ${v.pieces === 1 ? "piece" : "pieces"} in your shipment.`;
  }
}

/** Format a quantity for prose: at most 2 decimal places, no trailing zeros. */
function fmt(n: number): string {
  return n.toFixed(2).replace(/\.00$/, "").replace(/(\.\d)0$/, "$1");
}
