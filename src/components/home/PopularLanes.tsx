"use client";

import { prefillRoute } from "@/components/quote-form/draft";
import { transitLabel } from "@/lib/format";
import { COUNTRIES, type CountryCode } from "@/lib/types";

interface LaneCard {
  fromCity: string;
  fromCountry: CountryCode;
  toCity: string;
  toCountry: CountryCode;
  /** Marketing guide price for a 10 kg parcel by road. */
  fromPrice: string;
}

/**
 * Each fromPrice mirrors the engine's cheapest all-in demo-data total for a
 * 10 kg parcel (40×30×20 cm) on that lane, rounded DOWN to whole pounds so
 * "from" never overstates the minimum. Re-check when demo tariffs change —
 * src/components/home/__tests__/PopularLanes.test.ts guards against drift.
 */
export const LANES: readonly LaneCard[] = [
  { fromCity: "London", fromCountry: "GB", toCity: "İstanbul", toCountry: "TR", fromPrice: "£97" },
  { fromCity: "Manchester", fromCountry: "GB", toCity: "Ankara", toCountry: "TR", fromPrice: "£97" },
  { fromCity: "Birmingham", fromCountry: "GB", toCity: "İzmir", toCountry: "TR", fromPrice: "£97" },
  { fromCity: "İstanbul", fromCountry: "TR", toCity: "London", toCountry: "GB", fromPrice: "£115" },
  { fromCity: "Ankara", fromCountry: "TR", toCity: "Manchester", toCountry: "GB", fromPrice: "£115" },
  { fromCity: "İzmir", fromCountry: "TR", toCity: "Birmingham", toCountry: "GB", fromPrice: "£120" },
];

export default function PopularLanes() {
  const choose = (lane: LaneCard) => {
    prefillRoute({
      pickupCountry: lane.fromCountry,
      pickupLocation: lane.fromCity,
      deliveryCountry: lane.toCountry,
      deliveryLocation: lane.toCity,
    });
    document.getElementById("quote")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section className="bg-brand-50 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-bold tracking-tight text-brand-900 sm:text-3xl">
            Popular routes
          </h2>
          <p className="mt-3 text-base text-brand-600">
            Tap a route to start your quote with it already filled in.
          </p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {LANES.map((lane) => (
            <button
              key={`${lane.fromCity}-${lane.toCity}`}
              type="button"
              onClick={() => choose(lane)}
              className="flex items-center justify-between gap-3 rounded-2xl border border-brand-100 bg-white p-5 text-left shadow-card transition hover:shadow-card-hover"
            >
              <span>
                <span className="block text-sm font-semibold text-brand-900">
                  {COUNTRIES[lane.fromCountry].flag} {lane.fromCity}{" "}
                  <span aria-hidden="true" className="text-brand-400">
                    →
                  </span>
                  <span className="sr-only">to</span> {COUNTRIES[lane.toCountry].flag}{" "}
                  {lane.toCity}
                </span>
                <span className="mt-1 block text-xs text-brand-500">
                  {transitLabel(7, 14)} by road
                </span>
              </span>
              <span className="shrink-0 text-right">
                <span className="block text-[11px] font-semibold uppercase tracking-wide text-brand-500">
                  from
                </span>
                <span className="block text-lg font-bold text-brand-900">{lane.fromPrice}</span>
              </span>
            </button>
          ))}
        </div>
        <p className="mt-5 text-xs text-brand-500">
          Guide prices for a 10 kg parcel by road. Your exact price depends on
          size, weight and destination — get a quote for a real comparison.
        </p>
      </div>
    </section>
  );
}
