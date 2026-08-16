/**
 * Cumulative rate-band pricing.
 *
 * A tariff is a list of half-open bands (fromQty < q ≤ toQty). Each band
 * contributes independently and the price is the sum of contributions, which
 * makes the total monotonic in quantity by construction:
 *
 *   - flatPrice bands add their whole flat amount as soon as q > fromQty
 *     ("£75 covers the first 10 kg");
 *   - pricePerUnit bands add (min(q, toQty) − fromQty) × pricePerUnit
 *     ("then £7/kg up to 30 kg").
 *
 * Pure functions, no I/O.
 */

import type { RateTier } from "../types";

/**
 * Price a quantity against a cumulative band tariff.
 *
 * Returns null when the tariff cannot cover the quantity: the tiers array is
 * empty, or q exceeds the last band's toQty. Gaps between bands are tolerated
 * (each band's own fromQty is authoritative for where its charging starts);
 * overlapping bands are a configuration error and throw.
 *
 * The result is unrounded — the quote pipeline rounds to pence.
 */
export function priceForQuantity(tiers: RateTier[], q: number): number | null {
  if (!Number.isFinite(q) || q < 0) {
    throw new Error(`Quantity must be a non-negative number (got ${q}).`);
  }
  if (tiers.length === 0) return null;

  const sorted = [...tiers].sort((a, b) => a.fromQty - b.fromQty);

  // Validate each band and check consecutive bands do not overlap.
  sorted.forEach((band, i) => {
    validateBand(band, i);
    if (i === 0) return;
    const prev = sorted[i - 1];
    // A previous open-ended band swallows everything above its fromQty, so any
    // later band necessarily overlaps it.
    if (prev.toQty === null || band.fromQty < prev.toQty) {
      throw new Error(
        `Rate bands overlap: band starting at ${band.fromQty} begins before the previous band (${prev.fromQty}–${prev.toQty ?? "∞"}) ends.`
      );
    }
  });

  // No coverage above the final band's ceiling.
  const last = sorted[sorted.length - 1];
  if (last.toQty !== null && q > last.toQty) return null;

  let total = 0;
  for (const band of sorted) {
    if (q <= band.fromQty) break; // bands are sorted; nothing further applies
    if (band.flatPrice != null) {
      total += band.flatPrice;
    } else {
      const upper = band.toQty ?? Infinity;
      total += (Math.min(q, upper) - band.fromQty) * band.pricePerUnit!;
    }
  }
  return total;
}

function validateBand(band: RateTier, index: number): void {
  const name = `Rate band ${index + 1} (${band.fromQty}–${band.toQty ?? "∞"})`;
  if (!Number.isFinite(band.fromQty) || band.fromQty < 0) {
    throw new Error(`${name}: fromQty must be zero or more.`);
  }
  if (band.toQty !== null && (!Number.isFinite(band.toQty) || band.toQty <= band.fromQty)) {
    throw new Error(`${name}: toQty must be greater than fromQty (or null for open-ended).`);
  }
  const hasFlat = band.flatPrice != null;
  const hasPerUnit = band.pricePerUnit != null;
  if (hasFlat === hasPerUnit) {
    throw new Error(
      `${name}: exactly one of flatPrice or pricePerUnit must be set.`
    );
  }
}
