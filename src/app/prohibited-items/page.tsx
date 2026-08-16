import type { Metadata } from "next";
import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "Prohibited & restricted items",
  description:
    "What you can’t send with cargo companies on Bizim Kargo — always-prohibited goods like flammables, weapons and perishables, and restricted items such as batteries, medicines and alcohol that need your carrier’s approval first.",
};

const PROHIBITED: Array<{ title: string; body: string }> = [
  {
    title: "Dangerous goods, flammables & aerosols",
    body: "Fuel, gas canisters, lighters, fireworks, paints, solvents, aerosols and anything else classed as hazardous for transport.",
  },
  {
    title: "Weapons",
    body: "Firearms, ammunition, blades and imitation weapons — including parts and accessories.",
  },
  {
    title: "Illegal drugs",
    body: "Controlled substances of any kind, and paraphernalia. Carriers cooperate fully with customs and the police.",
  },
  {
    title: "Counterfeit goods",
    body: "Fake branded clothing, accessories and electronics. Customs seize them and the sender carries the liability.",
  },
  {
    title: "Perishable food",
    body: "Fresh, chilled or frozen food cannot survive a multi-day border crossing and is refused at the depot.",
  },
  {
    title: "Live animals",
    body: "No animals of any kind, ever. Pet relocation is a specialist, licensed service that groupage carriers cannot provide.",
  },
  {
    title: "Cash & bullion",
    body: "Banknotes, coins, gold, precious metals and bearer documents. Uninsurable and illegal to move undeclared across borders.",
  },
];

const RESTRICTED: Array<{ title: string; body: string }> = [
  {
    title: "Alcohol & tobacco",
    body: "Heavily taxed and tightly limited at both borders. Some carriers refuse them outright; others accept small, declared quantities.",
  },
  {
    title: "Medicines",
    body: "Prescription and over-the-counter medicines face import controls. Personal quantities with a prescription may be possible — ask first.",
  },
  {
    title: "Batteries & electronics with lithium cells",
    body: "Laptops, phones and power tools with lithium batteries are restricted for transport safety. Carriers will tell you how to pack them, or whether they will carry them at all.",
  },
  {
    title: "Plants & seeds",
    body: "Live plants, seeds, bulbs and soil face plant-health rules and may need certificates on both sides.",
  },
  {
    title: "High-value jewellery",
    body: "Some carriers exclude jewellery and watches from cover above a threshold, or refuse them entirely. Declare the value honestly and confirm insurance before sending.",
  },
];

export default function ProhibitedItemsPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="border-b border-brand-100 bg-brand-50">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
            <p className="text-xs font-semibold uppercase tracking-wide text-accent-600">
              Before you pack
            </p>
            <h1 className="mt-3 max-w-2xl text-3xl font-bold tracking-tight text-brand-900 sm:text-4xl">
              Prohibited &amp; restricted items
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-brand-700">
              Cross-border cargo travels through customs, ports and shared
              trailers, so some items can never be sent and others need your
              carrier’s approval first. Check this list before you request
              quotes — it saves everyone a wasted collection.
            </p>
          </div>
        </section>

        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Always prohibited */}
              <div className="rounded-2xl border border-brand-100 bg-white p-6 shadow-card sm:p-8">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-100 text-accent-700">
                    <CrossIcon className="h-5 w-5" />
                  </span>
                  <div>
                    <h2 className="text-lg font-bold tracking-tight text-brand-900">
                      Always prohibited
                    </h2>
                    <p className="text-xs font-semibold uppercase tracking-wide text-accent-600">
                      No carrier will take these
                    </p>
                  </div>
                </div>
                <ul className="mt-6 space-y-4">
                  {PROHIBITED.map((item) => (
                    <li key={item.title} className="flex items-start gap-3">
                      <CrossIcon className="mt-1 h-4 w-4 shrink-0 text-accent-600" />
                      <div>
                        <p className="text-sm font-semibold text-brand-900">{item.title}</p>
                        <p className="mt-0.5 text-sm leading-relaxed text-brand-600">
                          {item.body}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Restricted */}
              <div className="rounded-2xl border border-brand-100 bg-white p-6 shadow-card sm:p-8">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                    <BangIcon className="h-5 w-5" />
                  </span>
                  <div>
                    <h2 className="text-lg font-bold tracking-tight text-brand-900">
                      Restricted — ask your carrier first
                    </h2>
                    <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                      Possible with approval and the right packing
                    </p>
                  </div>
                </div>
                <ul className="mt-6 space-y-4">
                  {RESTRICTED.map((item) => (
                    <li key={item.title} className="flex items-start gap-3">
                      <BangIcon className="mt-1 h-4 w-4 shrink-0 text-amber-600" />
                      <div>
                        <p className="text-sm font-semibold text-brand-900">{item.title}</p>
                        <p className="mt-0.5 text-sm leading-relaxed text-brand-600">
                          {item.body}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <p className="mx-auto mt-8 max-w-3xl rounded-2xl border border-brand-100 bg-brand-50/60 p-5 text-sm leading-relaxed text-brand-700">
              <strong className="font-semibold text-brand-900">
                Individual carriers may refuse more.
              </strong>{" "}
              Every cargo company sets its own acceptance rules on top of the
              law — insurance terms, vehicle type and route all play a part. If
              anything in your shipment is unusual, mention it in your booking
              notes and confirm with your chosen carrier before collection day.
              The final decision on what travels always rests with the company
              carrying your goods.
            </p>

            <div className="mt-12 rounded-2xl bg-brand-950 px-6 py-12 text-center sm:px-12 sm:py-14">
              <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                All clear? Get your prices
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-brand-200 sm:text-base">
                Describe your shipment once and compare real quotes from cargo
                companies on your route.
              </p>
              <Link
                href="/#quote"
                className="mt-8 inline-block rounded-full bg-cta px-8 py-3 text-sm font-semibold text-white transition hover:bg-cta-hover"
              >
                Get quotes
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

/* ----------------------------------------------------------------- icons */

function CrossIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M3.5 3.5l9 9M12.5 3.5l-9 9" />
    </svg>
  );
}

function BangIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M8 2.5v7" />
      <circle cx="8" cy="13" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}
