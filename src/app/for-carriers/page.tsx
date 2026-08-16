import type { Metadata } from "next";
import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "For cargo companies — turn empty van space into revenue",
  description:
    "Join Bizim Kargo free and receive qualified UK–Turkey shipping leads with full shipment detail. You set the rates, you keep 100% — no commission in v1. For forwarders, couriers and man-and-van operators.",
};

export default function ForCarriersPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <Benefits />
        <WhoItsFor />
        <HowLeadsWork />
        <Faq />
        <ClosingCta />
      </main>
      <SiteFooter />
    </>
  );
}

/* ------------------------------------------------------------------ hero */

function Hero() {
  return (
    <section className="border-b border-brand-100 bg-brand-950">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <p className="text-xs font-semibold uppercase tracking-wide text-accent-400">
          For cargo companies &amp; man-and-van operators
        </p>
        <h1 className="mt-3 max-w-2xl text-3xl font-bold tracking-tight text-white sm:text-5xl">
          Turn empty van space into revenue
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-brand-200 sm:text-lg">
          Customers shipping between the UK and Turkey are comparing prices on
          Bizim Kargo right now. Publish your rates once and every matching
          request is priced against them automatically — when a customer picks
          you, their full shipment details land in your dashboard and inbox.
        </p>
        <div className="mt-9 flex flex-wrap gap-3">
          <Link
            href="/carrier/signup"
            className="rounded-full bg-cta px-8 py-3 text-sm font-semibold text-white transition hover:bg-cta-hover"
          >
            List your company free
          </Link>
          <a
            href="#how-leads-work"
            className="rounded-full border border-brand-700 px-6 py-3 text-sm font-semibold text-brand-100 transition hover:bg-brand-900"
          >
            How leads work
          </a>
        </div>
        <p className="mt-5 text-xs text-brand-300">
          Free to join · No commission in v1 · Cancel any time
        </p>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------- benefits */

const BENEFITS: Array<{ icon: React.ReactNode; title: string; body: string }> = [
  {
    icon: <TagIcon />,
    title: "Free to join",
    body: "No listing fee, no subscription, no card details. Create your profile, publish your rates and you are live on the marketplace.",
  },
  {
    icon: <ClipboardIcon />,
    title: "Qualified leads, full detail",
    body: "Every lead includes the route, item dimensions and weights, the service requested and the customer’s contact details — no vague “how much to Turkey?” enquiries.",
  },
  {
    icon: <SlidersIcon />,
    title: "You set the rates",
    body: "Your tariff, your bands, your surcharges. Quotes shown to customers are calculated from the prices you publish — we never undercut you or discount your rates.",
  },
  {
    icon: <PercentIcon />,
    title: "No commission in v1",
    body: "You keep 100% of every job. Customers pay you directly; Bizim Kargo takes nothing from the transaction while we grow the marketplace.",
  },
  {
    icon: <ShieldIcon />,
    title: "Verified badge builds trust",
    body: "Once we have checked your company details, your listing carries a verified badge — verified companies stand out in every comparison.",
  },
  {
    icon: <ClockIcon />,
    title: "5-minute rate setup",
    body: "A guided form captures your lanes, weight bands, transit times and zone surcharges. Most companies are quoting within minutes of signing up.",
  },
];

function Benefits() {
  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-bold tracking-tight text-brand-900 sm:text-3xl">
            Why companies list on Bizim Kargo
          </h2>
          <p className="mt-3 text-base text-brand-600">
            Built with cargo operators, for cargo operators — the economics stay
            on your side.
          </p>
        </div>
        <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {BENEFITS.map((benefit) => (
            <li
              key={benefit.title}
              className="rounded-2xl border border-brand-100 bg-white p-6 shadow-card"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand-700">
                {benefit.icon}
              </span>
              <h3 className="mt-4 text-base font-semibold text-brand-900">{benefit.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-brand-600">{benefit.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------ who it's for */

const AUDIENCES: Array<{ title: string; body: string }> = [
  {
    title: "International forwarders",
    body: "Fill weekly UK–Turkey trailers with parcels, pallets and part loads. Publish separate tariffs per lane and per service type, each with its own transit time and zone coverage.",
  },
  {
    title: "Domestic couriers",
    body: "Run UK-only or Turkey-only routes? List your domestic services too — customers use Bizim Kargo for local pallet and parcel work on both sides.",
  },
  {
    title: "Man-and-van operators",
    body: "Turn a half-empty return leg into paid work. Flexible part-load removals, student moves and furniture runs suit owner-drivers perfectly — you choose which zones you serve.",
  },
];

function WhoItsFor() {
  return (
    <section className="border-y border-brand-100 bg-brand-50/60 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-bold tracking-tight text-brand-900 sm:text-3xl">
            Who it’s for
          </h2>
          <p className="mt-3 text-base text-brand-600">
            From eighteen-wheelers to a single Transit — if you move goods on
            these routes, there is work for you here.
          </p>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-3">
          {AUDIENCES.map((audience) => (
            <div
              key={audience.title}
              className="rounded-2xl border border-brand-100 bg-white p-6 shadow-card"
            >
              <h3 className="text-base font-semibold text-brand-900">{audience.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-brand-600">{audience.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* --------------------------------------------------------- how leads work */

const LEAD_STEPS: Array<{ title: string; body: string }> = [
  {
    title: "A customer requests quotes",
    body: "They describe their shipment once — route, items, dimensions, weights — and our engine prices it against your published tariff instantly.",
  },
  {
    title: "They pick your quote",
    body: "Your price, transit time and profile appear alongside other companies on the route. The customer chooses you and leaves their contact details.",
  },
  {
    title: "Full details land with you",
    body: "The lead — shipment detail, frozen price breakdown and the customer’s name, phone and email — appears in your dashboard and is emailed to you at the same moment.",
  },
  {
    title: "You contact and book them direct",
    body: "Call, email or WhatsApp the customer, confirm the details, and book the job on your own terms. Payment goes straight to you.",
  },
];

function HowLeadsWork() {
  return (
    <section id="how-leads-work" className="py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-bold tracking-tight text-brand-900 sm:text-3xl">
            How leads work
          </h2>
          <p className="mt-3 text-base text-brand-600">
            From a stranger’s quote request to a booked job in four steps.
          </p>
        </div>
        <ol className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {LEAD_STEPS.map((step, index) => (
            <li
              key={step.title}
              className="relative rounded-2xl border border-brand-100 bg-white p-6 shadow-card"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-900 text-sm font-bold text-white">
                {index + 1}
              </span>
              <h3 className="mt-4 text-sm font-semibold text-brand-900">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-brand-600">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------- FAQ */

const FAQS: Array<{ question: string; answer: string }> = [
  {
    question: "Is it really free?",
    answer:
      "Yes. In v1 there is no listing fee, no subscription and no commission — you keep 100% of every job you win. If that ever changes, existing carriers will be told well in advance and nothing will change without your agreement. We are building liquidity first; the business model comes later, openly.",
  },
  {
    question: "What leads will I get?",
    answer:
      "Only requests that match a service you have published: your lanes, your service types, your weight limits and the zones you have marked as served. Every lead is a customer who saw your actual price and chose it — so expect fewer, warmer enquiries rather than a flood of tyre-kickers. Lead volume depends on your routes and how competitive your rates are.",
  },
  {
    question: "How do I get verified?",
    answer:
      "Sign up and publish your first service, then we take it from there: we check your company details and contact you within 2 working days. Once checked, the verified badge appears on your listing and in every quote comparison. Unverified companies can still receive leads in the meantime.",
  },
];

function Faq() {
  return (
    <section className="border-y border-brand-100 bg-brand-50/60 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-bold tracking-tight text-brand-900 sm:text-3xl">
            Honest answers
          </h2>
          <p className="mt-3 text-base text-brand-600">
            The questions every operator asks before listing.
          </p>
        </div>
        <div className="mt-10 space-y-5">
          {FAQS.map((faq) => (
            <div
              key={faq.question}
              className="rounded-2xl border border-brand-100 bg-white p-6 shadow-card sm:p-8"
            >
              <h3 className="text-base font-semibold text-brand-900">{faq.question}</h3>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-brand-600">
                {faq.answer}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------- CTA band */

function ClosingCta() {
  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="rounded-2xl bg-brand-950 px-6 py-12 text-center sm:px-12 sm:py-16">
          <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Your rates could be quoting by this afternoon
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-brand-200 sm:text-base">
            Five minutes to set up, free to list, and every lead is yours to
            keep. Join the companies already winning UK–Turkey work on Bizim
            Kargo.
          </p>
          <Link
            href="/carrier/signup"
            className="mt-8 inline-block rounded-full bg-cta px-8 py-3 text-sm font-semibold text-white transition hover:bg-cta-hover"
          >
            List your company free
          </Link>
          <p className="mt-4 text-xs text-brand-300">
            Already listed?{" "}
            <Link href="/carrier/login" className="font-semibold text-brand-100 underline underline-offset-2 hover:text-white">
              Sign in to your dashboard
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}

/* ----------------------------------------------------------------- icons */

const iconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
  className: "h-5 w-5",
} as const;

function TagIcon() {
  return (
    <svg {...iconProps}>
      <path d="M12.6 3.5H20.5v7.9l-8.6 8.6a2 2 0 0 1-2.8 0l-5.1-5.1a2 2 0 0 1 0-2.8l8.6-8.6Z" />
      <circle cx="16" cy="8" r="1.3" fill="currentColor" stroke="none" />
    </svg>
  );
}

function ClipboardIcon() {
  return (
    <svg {...iconProps}>
      <rect x="5" y="4.5" width="14" height="16.5" rx="2" />
      <path d="M9 4.5V3h6v1.5" />
      <path d="M8.5 10h7M8.5 13.5h7M8.5 17h4.5" />
    </svg>
  );
}

function SlidersIcon() {
  return (
    <svg {...iconProps}>
      <path d="M4 7.5h16M4 12h16M4 16.5h16" />
      <circle cx="9" cy="7.5" r="1.8" fill="#fff" />
      <circle cx="15" cy="12" r="1.8" fill="#fff" />
      <circle cx="7" cy="16.5" r="1.8" fill="#fff" />
    </svg>
  );
}

function PercentIcon() {
  return (
    <svg {...iconProps}>
      <path d="m5.5 18.5 13-13" />
      <circle cx="7.5" cy="7.5" r="2.5" />
      <circle cx="16.5" cy="16.5" r="2.5" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg {...iconProps}>
      <path d="M12 3.5 5 6v5.2c0 4.2 2.9 7.6 7 8.8 4.1-1.2 7-4.6 7-8.8V6l-7-2.5Z" />
      <path d="m9 12 2.2 2.2L15.5 9.7" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  );
}
