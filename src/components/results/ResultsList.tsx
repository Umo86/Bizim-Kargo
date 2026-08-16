"use client";

/**
 * The results list: sort control, instant-price cards, callback cards for
 * manual quotes, the duties note, the rejection explainer and the empty
 * state. All sorting is client-side over the stored quote snapshot.
 */

import Link from "next/link";
import { useMemo, useState } from "react";
import type { QuoteRejection, QuoteResult, ShipmentRequest } from "@/lib/types";
import CallbackCard from "./CallbackCard";
import ResultCard from "./ResultCard";

type SortKey = "cheapest" | "fastest" | "rated";

const SORT_OPTIONS: Array<{ key: SortKey; label: string }> = [
  { key: "cheapest", label: "Cheapest" },
  { key: "fastest", label: "Fastest" },
  { key: "rated", label: "Best rated" },
];

const REJECTION_LABELS: Record<QuoteRejection["reason"], string> = {
  over_max_weight: "Weight limit exceeded",
  over_max_dimension: "Size limit exceeded",
  zone_not_served: "Area not covered",
  no_tier_for_quantity: "No rate for this quantity",
  lane_not_served: "Route not served",
  service_inactive: "Service paused",
};

function byCheapest(a: QuoteResult, b: QuoteResult): number {
  return (
    a.total - b.total ||
    a.transitDaysMin - b.transitDaysMin ||
    a.serviceId.localeCompare(b.serviceId)
  );
}

function byFastest(a: QuoteResult, b: QuoteResult): number {
  return (
    a.transitDaysMin - b.transitDaysMin ||
    a.transitDaysMax - b.transitDaysMax ||
    a.total - b.total ||
    a.serviceId.localeCompare(b.serviceId)
  );
}

/** Best rated first; carriers without reviews sort last. */
function byRating(a: QuoteResult, b: QuoteResult): number {
  const aRated = a.carrier.rating > 0 && a.carrier.reviewCount > 0 ? 1 : 0;
  const bRated = b.carrier.rating > 0 && b.carrier.reviewCount > 0 ? 1 : 0;
  return (
    bRated - aRated ||
    b.carrier.rating - a.carrier.rating ||
    b.carrier.reviewCount - a.carrier.reviewCount ||
    a.total - b.total ||
    a.serviceId.localeCompare(b.serviceId)
  );
}

export default function ResultsList({
  quoteId,
  results,
  rejections,
  request,
  rejectionCarrierNames,
}: {
  quoteId: string;
  results: QuoteResult[];
  rejections: QuoteRejection[];
  request: ShipmentRequest;
  /** carrierId → companyName, resolved server-side for the rejection list. */
  rejectionCarrierNames: Record<string, string>;
}) {
  const [sort, setSort] = useState<SortKey>("cheapest");

  // Results are per-service; the heading counts distinct companies.
  const companyCount = useMemo(
    () => new Set(results.map((r) => r.carrierId)).size,
    [results],
  );

  // Show at most one rejection per carrier, and none for carriers that are
  // already quoting via another service — "could not quote" must never name a
  // company whose price card is right above.
  const visibleRejections = useMemo(() => {
    const quotingCarrierIds = new Set(results.map((r) => r.carrierId));
    const seen = new Set<string>();
    return rejections.filter((rejection) => {
      if (quotingCarrierIds.has(rejection.carrierId) || seen.has(rejection.carrierId)) {
        return false;
      }
      seen.add(rejection.carrierId);
      return true;
    });
  }, [results, rejections]);

  const instant = useMemo(
    () => results.filter((r) => !r.requiresManualQuote),
    [results],
  );
  const manual = useMemo(
    () => [...results.filter((r) => r.requiresManualQuote)].sort(byRating),
    [results],
  );

  const sortedInstant = useMemo(() => {
    const comparator =
      sort === "fastest" ? byFastest : sort === "rated" ? byRating : byCheapest;
    return [...instant].sort(comparator);
  }, [instant, sort]);

  // Badges are computed from the instant results regardless of current sort:
  // the cheapest card is always "Best price", and the fastest gets its chip
  // only when it is a different card.
  const bestPriceId = useMemo(
    () => (instant.length > 0 ? [...instant].sort(byCheapest)[0].serviceId : null),
    [instant],
  );
  const fastestId = useMemo(() => {
    if (instant.length < 2) return null;
    const first = [...instant].sort(byFastest)[0].serviceId;
    return first === bestPriceId ? null : first;
  }, [instant, bestPriceId]);

  const hasResults = results.length > 0;

  return (
    <section className="space-y-6">
      {hasResults ? (
        <>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-bold tracking-tight text-brand-900 sm:text-2xl">
              {companyCount === 1
                ? "1 company can take this shipment"
                : `${companyCount} companies can take this shipment`}
            </h2>
            {results.length > 1 && instant.length > 0 && (
              <div
                role="group"
                aria-label="Sort results"
                className="inline-flex self-start rounded-full border border-brand-200 bg-white p-1 shadow-sm"
              >
                {SORT_OPTIONS.map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    aria-pressed={sort === option.key}
                    onClick={() => setSort(option.key)}
                    className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition sm:px-4 sm:text-sm ${
                      sort === option.key
                        ? "bg-brand-900 text-white"
                        : "text-brand-700 hover:bg-brand-50"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-5">
            {sortedInstant.map((result) => (
              <ResultCard
                key={result.serviceId}
                result={result}
                quoteId={quoteId}
                isBestPrice={result.serviceId === bestPriceId}
                isFastest={result.serviceId === fastestId}
              />
            ))}
            {manual.map((result) => (
              <CallbackCard
                key={result.serviceId}
                result={result}
                quoteId={quoteId}
                serviceType={request.serviceType}
              />
            ))}
          </div>

          <p className="text-center text-xs text-brand-500">
            Prices include the fees shown in each breakdown. You pay the company
            directly — Bizim Kargo is free.
          </p>
        </>
      ) : (
        <EmptyState />
      )}

      {/* Duties note — always visible. */}
      <div className="rounded-2xl border border-amber-300 bg-amber-50 px-5 py-4">
        <p className="text-sm leading-relaxed text-amber-900">
          Import duties and taxes, where applicable, are payable by the receiver
          and are not included in these prices.{" "}
          <Link
            href="/customs-guide"
            className="font-semibold underline underline-offset-2 hover:text-amber-950"
          >
            Read our customs guide
          </Link>
        </p>
      </div>

      {visibleRejections.length > 0 && (
        <details className="group rounded-2xl border border-brand-100 bg-brand-50/60">
          <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 text-sm font-semibold text-brand-700 [&::-webkit-details-marker]:hidden">
            Why don&apos;t I see more companies?
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
          <div className="border-t border-brand-100 px-5 py-4">
            <p className="text-xs text-brand-500">
              We only show a price when a company can genuinely take your exact
              shipment. These companies could not quote this one:
            </p>
            <ul className="mt-3 space-y-2.5">
              {visibleRejections.map((rejection) => (
                <li key={rejection.serviceId} className="text-sm text-brand-600">
                  <span className="font-semibold text-brand-800">
                    {rejectionCarrierNames[rejection.carrierId] ??
                      "A company on this route"}
                  </span>{" "}
                  <span className="text-xs text-brand-500">
                    ({REJECTION_LABELS[rejection.reason]})
                  </span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-brand-500">
                    {rejection.detail}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </details>
      )}
    </section>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-brand-100 bg-brand-50 px-6 py-10 text-center sm:px-10">
      <h2 className="text-xl font-bold tracking-tight text-brand-900 sm:text-2xl">
        No instant prices for this exact shipment
      </h2>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-brand-700">
        None of our companies could price this automatically. That usually means
        one of these:
      </p>
      <ul className="mx-auto mt-4 max-w-md space-y-2 text-left text-sm text-brand-700">
        <li className="flex gap-2">
          <span aria-hidden="true" className="text-brand-400">
            •
          </span>
          It is heavier or larger than their automatic limits, so it needs a
          hand-priced quote.
        </li>
        <li className="flex gap-2">
          <span aria-hidden="true" className="text-brand-400">
            •
          </span>
          Part of your route is outside the areas they currently cover.
        </li>
        <li className="flex gap-2">
          <span aria-hidden="true" className="text-brand-400">
            •
          </span>
          No published rate covers this size of shipment yet — new companies
          join every month.
        </li>
      </ul>
      <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Link
          href="/"
          className="rounded-full bg-cta px-6 py-3 text-sm font-semibold text-white transition hover:bg-cta-hover"
        >
          Adjust my quote
        </Link>
        <Link
          href="/customs-guide"
          className="rounded-full border border-brand-200 px-6 py-3 text-sm font-semibold text-brand-800 transition hover:bg-brand-50"
        >
          Browse the customs guide
        </Link>
      </div>
    </div>
  );
}
