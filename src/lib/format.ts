/**
 * Display formatting helpers for Bizim Kargo.
 *
 * All formatting is en-GB (British English) — the marketplace's v1 audience.
 * Pure functions, safe on both server and client.
 */

import type { Currency } from "./types";

// Intl.NumberFormat construction is relatively expensive, so instances are
// cached per configuration and reused across calls.
const moneyFormatters = new Map<Currency, Intl.NumberFormat>();

function moneyFormatter(currency: Currency): Intl.NumberFormat {
  let formatter = moneyFormatters.get(currency);
  if (!formatter) {
    formatter = new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    moneyFormatters.set(currency, formatter);
  }
  return formatter;
}

/** Format a monetary amount, e.g. 1234.5 → "£1,234.50". GBP throughout v1. */
export function formatMoney(n: number, currency: Currency = "GBP"): string {
  return moneyFormatter(currency).format(n);
}

const kgFormatter = new Intl.NumberFormat("en-GB", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
});

/** Format a weight, e.g. 12 → "12 kg", 42.666 → "42.7 kg". */
export function formatKg(n: number): string {
  return `${kgFormatter.format(n)} kg`;
}

const m3Formatter = new Intl.NumberFormat("en-GB", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const m3SmallFormatter = new Intl.NumberFormat("en-GB", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 3,
});

/**
 * Format a volume, e.g. 1.2 → "1.2 m³", 0.4567 → "0.46 m³".
 * Very small (but non-zero) volumes get a third decimal place so a single
 * shoebox does not display as "0 m³".
 */
export function formatM3(n: number): string {
  const formatter = n > 0 && n < 0.01 ? m3SmallFormatter : m3Formatter;
  return `${formatter.format(n)} m³`;
}

/**
 * Human label for a transit window, e.g. (7, 10) → "7–10 days".
 * A degenerate window collapses: (3, 3) → "3 days", (1, 1) → "1 day".
 */
export function transitLabel(min: number, max: number): string {
  if (min === max) {
    return `${min} day${min === 1 ? "" : "s"}`;
  }
  return `${min}–${max} days`;
}
