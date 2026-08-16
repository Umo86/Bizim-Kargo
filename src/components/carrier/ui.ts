/**
 * Shared class strings for the carrier portal, so every form and card in
 * src/components/carrier renders identically. Pure constants, no runtime.
 */

export const labelClass =
  "block text-xs font-semibold uppercase tracking-wide text-brand-700";

export const inputClass =
  "mt-1.5 w-full rounded-lg border border-brand-200 bg-white px-3 py-2.5 text-sm " +
  "text-brand-950 placeholder:text-brand-500 focus:border-brand-500 " +
  "disabled:cursor-not-allowed disabled:border-brand-100 disabled:bg-brand-50 " +
  "disabled:text-brand-400";

export const selectClass = inputClass;

export const primaryButtonClass =
  "inline-flex items-center justify-center rounded-full bg-cta px-6 py-3 text-sm " +
  "font-semibold text-white shadow-sm transition hover:bg-cta-hover " +
  "disabled:cursor-not-allowed disabled:opacity-50";

export const secondaryButtonClass =
  "inline-flex items-center justify-center rounded-full border border-brand-200 " +
  "px-6 py-3 text-sm font-semibold text-brand-800 transition hover:bg-brand-50 " +
  "disabled:cursor-not-allowed disabled:opacity-50";

export const cardClass =
  "rounded-2xl border border-brand-100 bg-white shadow-card";

export const errorAlertClass =
  "rounded-xl border border-accent-200 bg-accent-50 px-4 py-3 text-sm text-accent-800";

export const chipClass =
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold";
