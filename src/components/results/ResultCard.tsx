"use client";

/**
 * One instant-price quote card: carrier identity, transit, the headline
 * total, the chargeable-weight basis (with an explainer), the full price
 * breakdown and the booking CTA.
 */

import Link from "next/link";
import { useState } from "react";
import { formatKg, formatMoney, transitLabel } from "@/lib/format";
import type { QuoteResult } from "@/lib/types";
import { ModePill, RatingStars, VerifiedBadge } from "./badges";

export default function ResultCard({
  result,
  quoteId,
  isBestPrice,
  isFastest,
}: {
  result: QuoteResult;
  quoteId: string;
  isBestPrice: boolean;
  isFastest: boolean;
}) {
  const [showBasis, setShowBasis] = useState(false);

  return (
    <article
      className={`relative rounded-2xl border bg-white shadow-card transition hover:shadow-card-hover ${
        isBestPrice ? "border-accent-300" : "border-brand-100"
      }`}
    >
      {isBestPrice && (
        <span className="absolute -top-3 left-5 rounded-full bg-accent-600 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white shadow-sm">
          Best price
        </span>
      )}
      {isFastest && (
        <span className="absolute -top-3 left-5 rounded-full bg-brand-700 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white shadow-sm">
          Fastest
        </span>
      )}

      <div className="flex flex-col gap-5 p-5 pt-6 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        {/* Carrier identity + service facts */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h3 className="text-base font-bold text-brand-900">
              {result.carrier.companyName}
            </h3>
            {result.carrier.verified && <VerifiedBadge />}
          </div>
          <div className="mt-1">
            <RatingStars
              rating={result.carrier.rating}
              reviewCount={result.carrier.reviewCount}
              yearsOperating={result.carrier.yearsOperating}
            />
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <ModePill mode={result.mode} />
            <span className="text-sm text-brand-700">
              {transitLabel(result.transitDaysMin, result.transitDaysMax)}{" "}
              <span className="text-brand-500">estimated transit</span>
            </span>
          </div>
          <p className="mt-1 text-xs text-brand-500">{result.serviceName}</p>
        </div>

        {/* Price + CTA */}
        <div className="shrink-0 sm:text-right">
          <p className="text-3xl font-bold tracking-tight text-brand-900">
            {formatMoney(result.total, result.currency)}
          </p>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-brand-600 sm:justify-end">
            <span>Chargeable weight: {formatKg(result.basis.chargeableKg)}</span>
            <button
              type="button"
              onClick={() => setShowBasis((v) => !v)}
              aria-expanded={showBasis}
              aria-label="How is chargeable weight worked out?"
              className="rounded-full text-brand-400 hover:text-brand-600"
            >
              <svg
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
                className="h-4 w-4"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm0-11.5A1.25 1.25 0 1 0 10 4a1.25 1.25 0 0 0 0 2.5ZM9 9v6h2V9H9Z"
                />
              </svg>
            </button>
          </div>
          <Link
            href={`/quote/${quoteId}/book/${result.serviceId}`}
            className="mt-4 inline-block w-full rounded-full bg-cta px-6 py-3 text-center text-sm font-semibold text-white transition hover:bg-cta-hover sm:w-auto"
          >
            Book this company →
          </Link>
        </div>
      </div>

      {showBasis && (
        <div className="px-5 pb-4 sm:px-6">
          <p className="rounded-lg bg-brand-50 px-3 py-2 text-xs leading-relaxed text-brand-700">
            {result.basis.explanation}
          </p>
        </div>
      )}

      {/* Full price breakdown */}
      <details className="group border-t border-brand-100">
        <summary className="flex cursor-pointer list-none items-center justify-between rounded-b-2xl px-5 py-3 text-sm font-semibold text-brand-800 hover:bg-brand-50/60 group-open:rounded-b-none sm:px-6 [&::-webkit-details-marker]:hidden">
          Full price breakdown
          <svg
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
            className="h-4 w-4 text-brand-400 transition-transform group-open:rotate-180"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.06l3.71-3.83a.75.75 0 1 1 1.08 1.04l-4.25 4.39a.75.75 0 0 1-1.08 0L5.21 8.27a.75.75 0 0 1 .02-1.06Z"
            />
          </svg>
        </summary>
        <div className="border-t border-brand-100 px-5 py-4 sm:px-6">
          <dl className="space-y-2.5">
            {result.lines.map((line) => (
              <div key={line.code} className="flex items-start justify-between gap-4">
                <dt className="min-w-0">
                  <span className="text-sm text-brand-800">{line.label}</span>
                  {line.note && (
                    <span className="mt-0.5 block text-xs leading-relaxed text-brand-500">
                      {line.note}
                    </span>
                  )}
                </dt>
                <dd className="whitespace-nowrap text-sm font-medium text-brand-900">
                  {formatMoney(line.amount, result.currency)}
                </dd>
              </div>
            ))}
          </dl>
          <div className="mt-3 flex items-center justify-between border-t border-brand-200 pt-3">
            <span className="text-sm font-bold text-brand-900">Total</span>
            <span className="text-sm font-bold text-brand-900">
              {formatMoney(result.total, result.currency)}
            </span>
          </div>
        </div>
      </details>
    </article>
  );
}
