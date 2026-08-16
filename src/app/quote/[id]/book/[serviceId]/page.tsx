import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import BookingForm from "@/components/results/BookingForm";
import { ModePill, RatingStars, VerifiedBadge } from "@/components/results/badges";
import { getQuoteAction } from "@/lib/actions";
import { formatKg, formatMoney, transitLabel } from "@/lib/format";
import { COUNTRIES, type Address, type QuoteResult, type ShipmentRequest } from "@/lib/types";
import { ZONE_LABELS } from "@/lib/zones";

export const metadata: Metadata = {
  title: "Book your shipment",
  robots: { index: false },
};

export default async function BookQuotePage({
  params,
}: {
  params: Promise<{ id: string; serviceId: string }>;
}) {
  const { id, serviceId } = await params;
  const stored = await getQuoteAction(id);
  if (!stored) notFound();

  const result = stored.results.find((r) => r.serviceId === serviceId);
  if (!result) notFound();

  const manual = result.requiresManualQuote;

  return (
    <>
      <SiteHeader />
      <main className="bg-brand-50/40">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
          <Link
            href={`/quote/${id}`}
            className="text-sm font-medium text-brand-700 hover:text-brand-900"
          >
            ← Back to your quotes
          </Link>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-brand-900 sm:text-3xl">
            {manual
              ? `Request a price from ${result.carrier.companyName}`
              : `Book with ${result.carrier.companyName}`}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-brand-700 sm:text-base">
            {manual
              ? "Send your details and they will come back to you with a tailored price. No payment is taken now."
              : "Send your details and they will confirm collection directly with you. No payment is taken now."}
          </p>

          <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start">
            <OrderSummary result={result} request={stored.request} />

            <div className="rounded-2xl border border-brand-100 bg-white p-5 shadow-card sm:p-8">
              <h2 className="text-lg font-bold tracking-tight text-brand-900">
                Your contact details
              </h2>
              <p className="mt-1 text-sm text-brand-600">
                {result.carrier.companyName} will use these to get in touch.
              </p>
              <div className="mt-6">
                <BookingForm
                  quoteId={id}
                  serviceId={serviceId}
                  carrierName={result.carrier.companyName}
                  requiresManualQuote={manual}
                />
              </div>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

function OrderSummary({
  result,
  request,
}: {
  result: QuoteResult;
  request: ShipmentRequest;
}) {
  const manual = result.requiresManualQuote;
  return (
    <aside className="rounded-2xl border border-brand-100 bg-white shadow-card lg:sticky lg:top-24">
      <div className="border-b border-brand-100 p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-500">
          Order summary
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
          <p className="text-base font-bold text-brand-900">
            {result.carrier.companyName}
          </p>
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

      {/* Route */}
      <div className="border-b border-brand-100 p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <SummaryLeg address={request.pickup} />
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="h-4 w-4 shrink-0 text-brand-400"
          >
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
          <SummaryLeg address={request.delivery} />
        </div>
      </div>

      {/* Items */}
      <div className="border-b border-brand-100 p-5 sm:p-6">
        {request.items.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-brand-500">
                  <th className="pb-2 pr-3 font-semibold">Qty</th>
                  <th className="pb-2 pr-3 font-semibold">Size (cm)</th>
                  <th className="pb-2 text-right font-semibold">Weight</th>
                </tr>
              </thead>
              <tbody>
                {request.items.map((item, index) => (
                  <tr key={index} className="border-t border-brand-50 text-brand-800">
                    <td className="py-2 pr-3">{item.quantity}×</td>
                    <td className="py-2 pr-3">
                      {item.lengthCm} × {item.widthCm} × {item.heightCm}
                      {item.description && (
                        <span className="block text-xs text-brand-500">
                          {item.description}
                        </span>
                      )}
                    </td>
                    <td className="py-2 text-right whitespace-nowrap">
                      {formatKg(item.weightKg)} each
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm leading-relaxed text-brand-800">
            {request.vehicleDescription ?? "Details as described in your quote."}
          </p>
        )}
        {!manual && (
          <p className="mt-3 text-xs text-brand-500">
            Chargeable weight: {formatKg(result.basis.chargeableKg)}
          </p>
        )}
      </div>

      {/* Price */}
      <div className="p-5 sm:p-6">
        {manual ? (
          <>
            <p className="text-lg font-bold text-brand-900">Price on request</p>
            <p className="mt-1 text-xs leading-relaxed text-brand-500">
              {result.carrier.companyName} will contact you with an individual
              price for this shipment before anything is agreed.
            </p>
          </>
        ) : (
          <>
            <dl className="space-y-2">
              {result.lines.map((line) => (
                <div key={line.code} className="flex items-start justify-between gap-4">
                  <dt className="text-sm text-brand-700">{line.label}</dt>
                  <dd className="whitespace-nowrap text-sm font-medium text-brand-900">
                    {formatMoney(line.amount, result.currency)}
                  </dd>
                </div>
              ))}
            </dl>
            <div className="mt-3 flex items-center justify-between border-t border-brand-200 pt-3">
              <span className="text-sm font-bold text-brand-900">Total</span>
              <span className="text-lg font-bold text-brand-900">
                {formatMoney(result.total, result.currency)}
              </span>
            </div>
          </>
        )}
      </div>
    </aside>
  );
}

function SummaryLeg({ address }: { address: Address }) {
  return (
    <div className="min-w-0">
      <p className="flex items-center gap-1.5 text-sm font-semibold text-brand-900">
        <span aria-hidden="true">{COUNTRIES[address.country].flag}</span>
        <span className="truncate">{address.postcodeOrCity}</span>
      </p>
      <p className="text-xs text-brand-500">
        {address.zone ? ZONE_LABELS[address.zone] : COUNTRIES[address.country].name}
      </p>
    </div>
  );
}
