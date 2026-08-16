/**
 * Shipment item normalisation: collapse a list of ShipmentItem lines into the
 * quantity-weighted totals the rest of the pricing engine works from.
 * Pure functions, no I/O.
 */

import type { ShipmentItem } from "../types";

/** Quantity-weighted totals across every piece in the shipment. */
export interface ItemTotals {
  /** Sum of quantity × weightKg over all lines. */
  totalActualKg: number;
  /** Sum of quantity × (L·W·H) in cubic metres over all lines. */
  totalVolumeM3: number;
  /** The single longest edge of any piece, in cm (0 for an empty shipment). */
  longestSideCm: number;
  /** Total piece count: sum of quantities. */
  pieces: number;
}

const CM3_PER_M3 = 1_000_000;

/**
 * Validate and sum shipment items.
 *
 * An empty items array is legal (vehicle requests carry no measurable items)
 * and yields all-zero totals. Any item with a non-positive or non-finite
 * dimension, weight or quantity throws with a message naming the offending
 * line, so form/server code can surface it directly.
 */
export function normaliseItems(items: ShipmentItem[]): ItemTotals {
  let totalActualKg = 0;
  let totalVolumeM3 = 0;
  let longestSideCm = 0;
  let pieces = 0;

  items.forEach((item, index) => {
    const line = `Item ${index + 1}`;
    assertPositive(item.quantity, `${line}: quantity`);
    if (!Number.isInteger(item.quantity)) {
      throw new Error(`${line}: quantity must be a whole number (got ${item.quantity}).`);
    }
    assertPositive(item.lengthCm, `${line}: length (cm)`);
    assertPositive(item.widthCm, `${line}: width (cm)`);
    assertPositive(item.heightCm, `${line}: height (cm)`);
    assertPositive(item.weightKg, `${line}: weight (kg)`);

    totalActualKg += item.quantity * item.weightKg;
    totalVolumeM3 +=
      (item.quantity * item.lengthCm * item.widthCm * item.heightCm) / CM3_PER_M3;
    longestSideCm = Math.max(longestSideCm, item.lengthCm, item.widthCm, item.heightCm);
    pieces += item.quantity;
  });

  return { totalActualKg, totalVolumeM3, longestSideCm, pieces };
}

function assertPositive(value: number, what: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${what} must be greater than zero (got ${value}).`);
  }
}
