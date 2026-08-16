import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import ResultsList from "@/components/results/ResultsList";
import { getQuoteAction } from "@/lib/actions";
import { getCarrier } from "@/lib/data";
import { formatKg } from "@/lib/format";
import { COUNTRIES, SERVICE_TYPE_LABELS, type Address } from "@/lib/types";
import { ZONE_LABELS } from "@/lib/zones";

export const metadata: Metadata = {
  title: "Your cargo quotes",
  robots: { index: false },
};

export default async function QuoteResultsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const stored = await getQuoteAction(id);
  if (!stored) notFound();

  const { request, results, rejections } = stored;

  // Resolve carrier names for the rejection explainer server-side —
  // rejections carry only carrier ids and src/lib/data.ts is server-only.
  const rejectedCarrierIds = Array.from(new Set(rejections.map((r) => r.carrierId)));
  const rejectedCarriers = await Promise.all(rejectedCarrierIds.map((cid) => getCarrier(cid)));
  const rejectionCarrierNames: Record<string, string> = {};
  rejectedCarrierIds.forEach((cid, i) => {
    const carrier = rejectedCarriers[i];
    if (carrier) rejectionCarrierNames[cid] = carrier.companyName;
  });

  const itemCount = request.items.reduce((sum, item) => sum + item.quantity, 0);
  const totalActualKg = request.items.reduce(
    (sum, item) => sum + item.quantity * item.weightKg,
    0,
  );

  return (
    <>
      <SiteHeader />
      <main className="bg-brand-50/40">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
          <h1 className="text-2xl font-bold tracking-tight text-brand-900 sm:text-3xl">
            Your cargo quotes
          </h1>
          <p className="mt-2 text-sm text-brand-700 sm:text-base">
            Compare prices, transit times and companies — then book direct.
          </p>

          {/* Route summary bar */}
          <div className="mt-6 rounded-2xl border border-brand-100 bg-white p-4 shadow-card sm:p-5">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
              <div className="flex min-w-0 items-center gap-3">
                <RouteLeg address={request.pickup} />
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
                <RouteLeg address={request.delivery} />
              </div>
              <div className="hidden h-9 w-px bg-brand-100 sm:block" aria-hidden="true" />
              <div className="min-w-0 text-sm text-brand-700">
                {itemCount > 0 ? (
                  <span>
                    {itemCount} item{itemCount === 1 ? "" : "s"} ·{" "}
                    {formatKg(totalActualKg)} ·{" "}
                    {SERVICE_TYPE_LABELS[request.serviceType]}
                  </span>
                ) : (
                  <span className="block truncate">
                    {SERVICE_TYPE_LABELS[request.serviceType]}
                    {request.vehicleDescription
                      ? ` · ${request.vehicleDescription}`
                      : ""}
                  </span>
                )}
              </div>
              <Link
                href="/"
                className="ml-auto rounded-full border border-brand-200 px-4 py-1.5 text-xs font-semibold text-brand-800 transition hover:bg-brand-50"
              >
                Edit
              </Link>
            </div>
          </div>

          <div className="mt-8">
            <ResultsList
              quoteId={id}
              results={results}
              rejections={rejections}
              request={request}
              rejectionCarrierNames={rejectionCarrierNames}
            />
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

function RouteLeg({ address }: { address: Address }) {
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
