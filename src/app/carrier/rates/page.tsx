import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import DemoBanner from "@/components/carrier/DemoBanner";
import ServiceActiveToggle from "@/components/carrier/ServiceActiveToggle";
import { cardClass, chipClass, primaryButtonClass } from "@/components/carrier/ui";
import { formatMoney, transitLabel } from "@/lib/format";
import {
  COUNTRIES,
  SERVICE_TYPE_LABELS,
  type CarrierService,
  type PricingUnit,
} from "@/lib/types";

import { getPortalCarrier, getPortalServices, getSessionUser, isDemoMode } from "../portal";

export const metadata: Metadata = {
  title: "My rates",
};

export const dynamic = "force-dynamic";

const MODE_LABELS = { road: "Road", air: "Air", sea: "Sea" } as const;

const UNIT_NOUNS: Record<PricingUnit, string> = {
  kg: "kg",
  cbm: "m³",
  pallet: "pallets",
};

/** "Up to 10 kg for £72.00" from the first band, or a price-on-request note. */
function firstBandSummary(service: CarrierService): string {
  const first = service.tiers[0];
  if (!first) return "Price on request — customers ask you for a personal quote";
  const noun = UNIT_NOUNS[first.unit];
  if (first.flatPrice != null) {
    return `Up to ${first.toQty ?? "any"} ${noun} for ${formatMoney(first.flatPrice)}`;
  }
  return `${formatMoney(first.pricePerUnit ?? 0)} per ${noun} to ${first.toQty ?? "∞"}`;
}

export default async function MyRatesPage() {
  const carrier = await getPortalCarrier();
  if (!carrier) {
    redirect((await getSessionUser()) ? "/carrier/signup" : "/carrier/login");
  }
  const services = await getPortalServices(carrier.id);
  const demo = isDemoMode();

  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-6xl space-y-8 px-4 sm:px-6">
        {demo ? (
          <DemoBanner note="These are the demo carrier’s rate cards — read-only." />
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-brand-900 sm:text-3xl">
              My rates
            </h1>
            <p className="mt-1 text-sm text-brand-600">
              Every rate card quotes automatically on matching requests.
            </p>
          </div>
          <Link href="/carrier/rates/new" className={primaryButtonClass}>
            New rate card
          </Link>
        </div>

        {services.length === 0 ? (
          <div className={`${cardClass} px-6 py-14 text-center`}>
            <p className="text-sm font-semibold text-brand-900">No rate cards yet</p>
            <p className="mx-auto mt-1 max-w-md text-sm text-brand-600">
              Publish your first rate card and your prices will appear on
              matching customer quotes straight away.
            </p>
            <Link href="/carrier/rates/new" className={`${primaryButtonClass} mt-6`}>
              Create your first rate card
            </Link>
          </div>
        ) : (
          <ul className="grid gap-4 lg:grid-cols-2">
            {services.map((service) => (
              <li key={service.id} className={`${cardClass} p-5 sm:p-6`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm text-brand-500">
                      {COUNTRIES[service.origin].flag} {COUNTRIES[service.origin].name}{" "}
                      <span aria-hidden="true">→</span>{" "}
                      {COUNTRIES[service.destination].flag}{" "}
                      {COUNTRIES[service.destination].name}
                    </p>
                    <h2 className="mt-1 truncate text-base font-bold text-brand-900">
                      {service.name}
                    </h2>
                  </div>
                  <ServiceActiveToggle
                    serviceId={service.id}
                    active={service.active}
                    disabled={demo}
                  />
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <span className={`${chipClass} bg-brand-100 text-brand-800`}>
                    {SERVICE_TYPE_LABELS[service.serviceType]}
                  </span>
                  <span className={`${chipClass} bg-brand-50 text-brand-600`}>
                    {MODE_LABELS[service.mode]}
                  </span>
                  <span className={`${chipClass} bg-brand-50 text-brand-600`}>
                    {transitLabel(service.transitDaysMin, service.transitDaysMax)}
                  </span>
                </div>

                <dl className="mt-4 space-y-1 border-t border-brand-100 pt-4 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-brand-500">Minimum charge</dt>
                    <dd className="font-semibold text-brand-900">
                      {service.tiers.length > 0
                        ? formatMoney(service.minCharge, service.currency)
                        : "—"}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-brand-500">First band</dt>
                    <dd className="text-right text-brand-800">{firstBandSummary(service)}</dd>
                  </div>
                </dl>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
