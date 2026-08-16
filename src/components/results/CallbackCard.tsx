"use client";

/**
 * Card for services that cannot price instantly (vehicles and other bulky
 * requests): same carrier identity as ResultCard, but "Price on request"
 * instead of a total, and a callback CTA into the same booking flow.
 */

import Link from "next/link";
import { transitLabel } from "@/lib/format";
import type { QuoteResult, ServiceType } from "@/lib/types";
import { ModePill, RatingStars, VerifiedBadge } from "./badges";

/** Plural noun for each service type, used in the "quotes X individually" line. */
export const SERVICE_NOUNS: Record<ServiceType, string> = {
  parcel: "parcel shipments",
  pallet: "pallet shipments",
  volume: "van loads",
  vehicle: "vehicles",
};

export default function CallbackCard({
  result,
  quoteId,
  serviceType,
}: {
  result: QuoteResult;
  quoteId: string;
  serviceType: ServiceType;
}) {
  return (
    <article className="rounded-2xl border border-brand-100 bg-white shadow-card transition hover:shadow-card-hover">
      <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
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

        <div className="shrink-0 sm:max-w-[14rem] sm:text-right">
          <p className="text-xl font-bold tracking-tight text-brand-900">
            Price on request
          </p>
          <p className="mt-1 text-xs leading-relaxed text-brand-600">
            This company quotes {SERVICE_NOUNS[serviceType]} individually.
          </p>
          <Link
            href={`/quote/${quoteId}/book/${result.serviceId}`}
            className="mt-4 inline-block w-full rounded-full bg-cta px-6 py-3 text-center text-sm font-semibold text-white transition hover:bg-cta-hover sm:w-auto"
          >
            Request a price →
          </Link>
        </div>
      </div>
    </article>
  );
}
