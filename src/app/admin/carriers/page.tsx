import type { Metadata } from "next";
import { DEMO_CARRIERS, DEMO_SERVICES } from "@/lib/demo-data";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { COUNTRIES, type Carrier, type CountryCode } from "@/lib/types";
import CarrierActions from "./CarrierActions";

export const metadata: Metadata = { title: "Carriers" };

/** One row of the admin carriers table, mode-independent. */
interface AdminCarrierRow {
  carrier: Carrier;
  createdAt: string | null;
  serviceCount: number;
  activeServiceCount: number;
}

/** Raw shape of the Supabase select below (snake_case + embedded services). */
interface CarrierDbRow {
  id: string;
  slug: string;
  company_name: string;
  blurb: string;
  base_country: string;
  contact_email: string;
  contact_phone: string;
  verified: boolean;
  rating: number | string;
  review_count: number | string;
  years_operating: number | string | null;
  logo_url: string | null;
  created_at: string;
  carrier_services: Array<{ id: string; active: boolean }>;
}

async function loadCarriers(): Promise<AdminCarrierRow[]> {
  if (!isSupabaseConfigured()) {
    return DEMO_CARRIERS.map((carrier) => {
      const services = DEMO_SERVICES.filter((s) => s.carrierId === carrier.id);
      return {
        carrier,
        createdAt: null,
        serviceCount: services.length,
        activeServiceCount: services.filter((s) => s.active).length,
      };
    });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("carriers")
    .select("*, carrier_services(id, active)")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Could not load carriers: ${error.message}`);
  }

  return ((data ?? []) as CarrierDbRow[]).map((row) => ({
    carrier: {
      id: row.id,
      slug: row.slug,
      companyName: row.company_name,
      blurb: row.blurb,
      baseCountry: row.base_country as CountryCode,
      contactEmail: row.contact_email,
      contactPhone: row.contact_phone,
      verified: row.verified,
      rating: Number(row.rating),
      reviewCount: Number(row.review_count),
      yearsOperating: row.years_operating === null ? null : Number(row.years_operating),
      logoUrl: row.logo_url,
    },
    createdAt: row.created_at,
    serviceCount: row.carrier_services.length,
    activeServiceCount: row.carrier_services.filter((s) => s.active).length,
  }));
}

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export default async function AdminCarriersPage() {
  const demo = !isSupabaseConfigured();
  const rows = await loadCarriers();

  // Pending-verification carriers first, then newest first, then by name.
  const sorted = [...rows].sort((a, b) => {
    if (a.carrier.verified !== b.carrier.verified) {
      return a.carrier.verified ? 1 : -1;
    }
    const created = (b.createdAt ?? "").localeCompare(a.createdAt ?? "");
    if (created !== 0) return created;
    return a.carrier.companyName.localeCompare(b.carrier.companyName);
  });

  const pendingCount = rows.filter((row) => !row.carrier.verified).length;

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-brand-900 sm:text-3xl">
            Carriers
          </h1>
          <p className="mt-1 text-sm text-brand-600">
            {rows.length} listed
            {pendingCount > 0
              ? ` · ${pendingCount} awaiting verification (highlighted)`
              : " · all verified"}
          </p>
        </div>
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-brand-100 bg-white shadow-card">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead>
            <tr className="border-b border-brand-100 bg-brand-50 text-xs font-semibold uppercase tracking-wide text-brand-700">
              <th className="px-4 py-3">Company</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Base</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Rating</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(({ carrier, createdAt, serviceCount, activeServiceCount }) => {
              const suspended = serviceCount > 0 && activeServiceCount === 0;
              return (
                <tr
                  key={carrier.id}
                  className={`border-b border-brand-100 align-top last:border-b-0 ${
                    carrier.verified ? "" : "bg-amber-50/60"
                  }`}
                >
                  <td className="px-4 py-3">
                    <p className="font-semibold text-brand-900">{carrier.companyName}</p>
                    {carrier.verified ? (
                      <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                        Verified
                      </span>
                    ) : (
                      <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                        Pending verification
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-brand-600">{carrier.slug}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-brand-700">
                    <span aria-hidden="true">{COUNTRIES[carrier.baseCountry].flag}</span>{" "}
                    {carrier.baseCountry}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-brand-800">{carrier.contactEmail}</p>
                    <p className="mt-0.5 text-xs text-brand-500">{carrier.contactPhone}</p>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-brand-700">
                    {carrier.reviewCount > 0
                      ? `${carrier.rating.toFixed(1)} (${carrier.reviewCount})`
                      : "—"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-brand-700">
                    {createdAt ? dateFormatter.format(new Date(createdAt)) : "—"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {serviceCount === 0 ? (
                      <span className="rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-semibold text-brand-700">
                        No services
                      </span>
                    ) : suspended ? (
                      <span className="rounded-full bg-accent-100 px-2.5 py-0.5 text-xs font-semibold text-accent-800">
                        Suspended
                      </span>
                    ) : (
                      <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                        Live · {activeServiceCount}/{serviceCount} services
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <CarrierActions
                      carrierId={carrier.id}
                      verified={carrier.verified}
                      suspended={suspended}
                      hasServices={serviceCount > 0}
                      demo={demo}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {sorted.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-brand-500">
            No carriers yet — they appear here as soon as companies sign up.
          </p>
        ) : null}
      </div>

      <p className="mt-4 text-xs leading-relaxed text-brand-500">
        Suspending a carrier deactivates all of its services, removing it from
        quotes immediately; activating re-enables them all. Verification grants
        the badge shown to customers on every quote.
      </p>
    </>
  );
}
