import type { Metadata } from "next";
import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "How it works",
  description:
    "How Bizim Kargo works: describe your shipment, compare real prices from verified UK–Turkey cargo companies, and book direct. Plus a plain-English guide to chargeable weight and what is in every price.",
};

export default function HowItWorksPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <Steps />
        <PricingTransparency />
        <PayDirect />
        <ClosingCta />
      </main>
      <SiteFooter />
    </>
  );
}

/* ------------------------------------------------------------------ hero */

function Hero() {
  return (
    <section className="border-b border-brand-100 bg-brand-50">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <p className="text-xs font-semibold uppercase tracking-wide text-accent-600">
          For customers
        </p>
        <h1 className="mt-3 max-w-2xl text-3xl font-bold tracking-tight text-brand-900 sm:text-4xl">
          How Bizim Kargo works
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-brand-700">
          One form, real prices from independent cargo companies shipping between
          the United Kingdom and Turkey, and a direct introduction to the company
          you choose. Free for customers, no account needed.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/#quote"
            className="rounded-full bg-cta px-6 py-3 text-sm font-semibold text-white transition hover:bg-cta-hover"
          >
            Get quotes now
          </Link>
          <a
            href="#pricing"
            className="rounded-full border border-brand-200 px-6 py-3 text-sm font-semibold text-brand-800 transition hover:bg-white"
          >
            How pricing works
          </a>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------- the three steps */

const STEPS: Array<{ title: string; body: string; points: string[] }> = [
  {
    title: "Tell us what you’re sending",
    body: "Pick your route — a UK postcode on one side, a Turkish il/ilçe on the other — and describe your shipment: parcels and boxes, pallets, a van load of furniture, or a vehicle. For each item you enter the dimensions in centimetres, the weight in kilograms and how many identical pieces there are.",
    points: [
      "Under a minute to complete, and no account or card details are ever asked for.",
      "Measure honestly — every company prices from exactly what you enter, so accurate sizes mean accurate prices on collection day.",
      "Optionally add a declared value if you would like insurance cover priced into your quotes.",
    ],
  },
  {
    title: "Compare real prices and transit times",
    body: "We price your shipment against the published tariff of every cargo company serving your route — instantly, with no callbacks and no “from” prices. Each quote shows the total, an estimated door-to-door transit time, and a line-by-line breakdown of what makes up the price.",
    points: [
      "Quotes are like-for-like: the same shipment, priced on each company’s own rates.",
      "Verified badges show companies whose details we have checked; ratings and years operating help you compare beyond price.",
      "Vehicles and unusually large loads are flagged for a manual callback price rather than guessed at.",
    ],
  },
  {
    title: "Book direct with the company",
    body: "Choose the quote you like and leave your contact details. We pass them — together with your full shipment details and the exact price you saw — straight to that company, and only that company. They contact you to confirm the price, arrange collection and take payment.",
    points: [
      "You deal with the cargo company directly from that moment on — Bizim Kargo never handles your money.",
      "Your quoted price is frozen onto the introduction, so both sides see the same figures.",
      "A quote is an estimate until the company confirms it — if your items differ from what was entered, the company will re-price before collecting.",
    ],
  },
];

function Steps() {
  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-bold tracking-tight text-brand-900 sm:text-3xl">
            Three steps from quote to collection
          </h2>
          <p className="mt-3 text-base text-brand-600">
            The whole journey, in a little more detail.
          </p>
        </div>
        <ol className="mt-10 space-y-6">
          {STEPS.map((step, index) => (
            <li
              key={step.title}
              className="rounded-2xl border border-brand-100 bg-white p-6 shadow-card sm:p-8"
            >
              <div className="flex flex-col gap-5 sm:flex-row sm:gap-8">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-900 text-lg font-bold text-white">
                  {index + 1}
                </span>
                <div>
                  <h3 className="text-lg font-semibold text-brand-900">{step.title}</h3>
                  <p className="mt-2 max-w-3xl text-sm leading-relaxed text-brand-600">
                    {step.body}
                  </p>
                  <ul className="mt-4 space-y-2">
                    {step.points.map((point) => (
                      <li key={point} className="flex items-start gap-2.5">
                        <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                        <span className="text-sm leading-relaxed text-brand-700">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* --------------------------------------------------- pricing transparency */

function PricingTransparency() {
  return (
    <section id="pricing" className="border-y border-brand-100 bg-brand-50/60 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-bold tracking-tight text-brand-900 sm:text-3xl">
            Pricing transparency
          </h2>
          <p className="mt-3 text-base text-brand-600">
            International cargo is priced on space as well as scales. Here is
            exactly how the numbers on your quote are worked out.
          </p>
        </div>

        {/* Chargeable weight explainer + worked example */}
        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-brand-100 bg-white p-6 shadow-card sm:p-8">
            <h3 className="text-lg font-semibold text-brand-900">
              Chargeable weight: the greater of two numbers
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-brand-600">
              A van fills up long before it reaches its weight limit, so cargo
              companies charge on whichever is higher: your shipment’s{" "}
              <strong className="font-semibold text-brand-800">actual weight</strong> on the
              scales, or its{" "}
              <strong className="font-semibold text-brand-800">volumetric weight</strong> — the
              space it takes up, converted into kilograms.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-brand-600">
              Volumetric weight is length × width × height in centimetres,
              divided by a <em>volumetric divisor</em>. The divisor depends on how
              your goods travel: road groupage typically uses 3,000, express and
              air services 5,000. Every quote on Bizim Kargo states which basis
              was used, so there are no surprises at the depot.
            </p>
            <div className="mt-5 rounded-xl bg-brand-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
                Worked example — one box on an air service (divisor 5,000)
              </p>
              <dl className="mt-3 space-y-2 text-sm text-brand-700">
                <div className="flex items-baseline justify-between gap-4">
                  <dt>Volume: 60 × 40 × 40 cm</dt>
                  <dd className="font-semibold text-brand-900">96,000 cm³</dd>
                </div>
                <div className="flex items-baseline justify-between gap-4">
                  <dt>Volumetric weight: 96,000 ÷ 5,000</dt>
                  <dd className="font-semibold text-brand-900">19.2 kg</dd>
                </div>
                <div className="flex items-baseline justify-between gap-4">
                  <dt>Actual weight on the scales</dt>
                  <dd className="font-semibold text-brand-900">8 kg</dd>
                </div>
                <div className="flex items-baseline justify-between gap-4 border-t border-brand-100 pt-2">
                  <dt className="font-semibold text-brand-900">Chargeable weight (the greater)</dt>
                  <dd className="font-bold text-accent-600">19.2 kg</dd>
                </div>
              </dl>
              <p className="mt-3 text-xs leading-relaxed text-brand-500">
                The same box priced on a road tariff (divisor 3,000) would be
                chargeable at 32 kg — bulky-but-light items are exactly where
                comparing companies pays off.
              </p>
            </div>
          </div>
          <div className="flex items-center justify-center rounded-2xl border border-brand-100 bg-white p-6 shadow-card sm:p-8">
            <BoxDiagram />
          </div>
        </div>

        {/* What's in a price / what never is */}
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-brand-100 bg-white p-6 shadow-card sm:p-8">
            <h3 className="text-lg font-semibold text-brand-900">What’s in a price</h3>
            <p className="mt-2 text-sm leading-relaxed text-brand-600">
              Every quote is broken into named lines, so you can compare
              companies fairly rather than guessing what a headline figure hides.
            </p>
            <ul className="mt-4 space-y-3">
              {[
                ["Base freight", "The tariff price for your chargeable weight or volume on that company’s rates."],
                ["Fuel surcharge", "A percentage of base freight, shown separately — never buried."],
                ["Customs clearance", "The company’s fixed fee for handling export and import paperwork on cross-border routes."],
                ["Insurance (optional)", "A premium based on your declared value, if you asked for cover."],
                ["Collection, delivery and zone fees", "Any charges for your specific pickup and delivery areas — remote zones cost more and it says so."],
              ].map(([label, body]) => (
                <li key={label} className="flex items-start gap-2.5">
                  <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <span className="text-sm leading-relaxed text-brand-700">
                    <strong className="font-semibold text-brand-900">{label}.</strong> {body}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-brand-100 bg-white p-6 shadow-card sm:p-8">
            <h3 className="text-lg font-semibold text-brand-900">What never is</h3>
            <p className="mt-2 text-sm leading-relaxed text-brand-600">
              Some costs are levied by governments, not by cargo companies. No
              honest quote can include them, and ours never pretend to.
            </p>
            <ul className="mt-4 space-y-3">
              {[
                ["Import duties", "Charged by the destination country’s customs authority on some goods, and payable by the receiver."],
                ["Import VAT", "Likewise charged at the border where applicable — the receiver settles it before or on delivery."],
              ].map(([label, body]) => (
                <li key={label} className="flex items-start gap-2.5">
                  <CrossIcon className="mt-0.5 h-4 w-4 shrink-0 text-accent-600" />
                  <span className="text-sm leading-relaxed text-brand-700">
                    <strong className="font-semibold text-brand-900">{label}.</strong> {body}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-900">
              Whether duty or VAT is due depends on what you send and its value —
              personal effects are often treated differently from commercial
              goods. Our{" "}
              <Link href="/customs-guide" className="font-semibold underline underline-offset-2">
                customs &amp; duties guide
              </Link>{" "}
              explains the basics.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Inline diagram: the worked-example box with dimension arrows. */
function BoxDiagram() {
  return (
    <svg
      viewBox="0 0 300 230"
      role="img"
      aria-label="A box measuring 60 by 40 by 40 centimetres with dimension arrows on each edge"
      className="h-auto w-full max-w-sm"
    >
      {/* faces */}
      <polygon points="60,90 200,90 200,180 60,180" fill="#eef4fb" stroke="#1a3f79" strokeWidth="2" strokeLinejoin="round" />
      <polygon points="60,90 104,56 244,56 200,90" fill="#d9e6f5" stroke="#1a3f79" strokeWidth="2" strokeLinejoin="round" />
      <polygon points="200,90 244,56 244,146 200,180" fill="#b3cdeb" stroke="#1a3f79" strokeWidth="2" strokeLinejoin="round" />
      {/* parcel tape along the top face */}
      <polygon points="122,90 166,56 182,56 138,90" fill="#e54848" opacity="0.25" />
      <line x1="130" y1="90" x2="174" y2="56" stroke="#e54848" strokeWidth="2" opacity="0.6" />
      {/* weight note on the front face */}
      <text x="130" y="130" textAnchor="middle" fontSize="13" fontWeight="700" fill="#1a3f79">
        8 kg
      </text>
      <text x="130" y="147" textAnchor="middle" fontSize="10" fill="#2a63b4">
        actual weight
      </text>

      {/* length arrow — bottom front edge */}
      <line x1="66" y1="198" x2="194" y2="198" stroke="#e54848" strokeWidth="1.6" />
      <polygon points="60,198 68,194 68,202" fill="#e54848" />
      <polygon points="200,198 192,194 192,202" fill="#e54848" />
      <text x="130" y="216" textAnchor="middle" fontSize="12" fontWeight="600" fill="#152b4e">
        60 cm
      </text>

      {/* height arrow — left front edge */}
      <line x1="42" y1="96" x2="42" y2="174" stroke="#e54848" strokeWidth="1.6" />
      <polygon points="42,90 38,98 46,98" fill="#e54848" />
      <polygon points="42,180 38,172 46,172" fill="#e54848" />
      <text x="34" y="139" textAnchor="end" fontSize="12" fontWeight="600" fill="#152b4e">
        40 cm
      </text>

      {/* depth arrow — bottom right receding edge */}
      <line x1="212" y1="185" x2="248" y2="157" stroke="#e54848" strokeWidth="1.6" />
      <polygon points="207,189 216,188 211,181" fill="#e54848" />
      <polygon points="253,153 244,154 249,161" fill="#e54848" />
      <text x="242" y="182" fontSize="12" fontWeight="600" fill="#152b4e">
        40 cm
      </text>
    </svg>
  );
}

/* ------------------------------------------------- you pay the carrier */

function PayDirect() {
  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="rounded-2xl border border-brand-100 bg-white p-6 shadow-card sm:p-10">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-brand-900 sm:text-3xl">
                You pay the carrier direct
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-brand-600 sm:text-base">
                Bizim Kargo is a comparison and introduction service, not a
                freight company. We never take your payment, add a booking fee or
                sit between you and the company moving your goods. Once you
                choose a quote, the contract for the shipment is between you and
                that cargo company: they confirm the price, agree the collection
                date, carry your goods and invoice you on their own terms.
              </p>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-brand-600 sm:text-base">
                That keeps prices honest — what you see on your quote is the
                company’s own price, with no marketplace margin stacked on top —
                and it means any question about your shipment has one clear
                answer: ask your carrier.
              </p>
            </div>
            <ul className="space-y-3 lg:w-72">
              {[
                "No payment or card details taken by Bizim Kargo",
                "No commission added on top of quotes",
                "One company, directly accountable to you",
              ].map((point) => (
                <li key={point} className="flex items-start gap-2.5">
                  <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <span className="text-sm font-medium leading-relaxed text-brand-800">
                    {point}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------- CTA band */

function ClosingCta() {
  return (
    <section className="pb-16 sm:pb-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="rounded-2xl bg-brand-950 px-6 py-12 text-center sm:px-12 sm:py-16">
          <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Ready to see real prices?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-brand-200 sm:text-base">
            Describe your shipment once and compare quotes from cargo companies
            on your route — it takes under a minute.
          </p>
          <Link
            href="/#quote"
            className="mt-8 inline-block rounded-full bg-cta px-8 py-3 text-sm font-semibold text-white transition hover:bg-cta-hover"
          >
            Get your quotes
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ----------------------------------------------------------------- icons */

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="m2.5 8.5 3.5 3.5 7.5-8" />
    </svg>
  );
}

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
