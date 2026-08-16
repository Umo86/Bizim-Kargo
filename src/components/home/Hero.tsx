import QuoteForm from "@/components/quote-form/QuoteForm";
import HeroIllustration from "./HeroIllustration";

/**
 * The conversion hero: headline, subhead and the quote box itself — the
 * single most important element on the site — over a navy gradient with a
 * subtle route illustration behind.
 */
export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-brand-950 to-brand-800 pb-14 pt-12 sm:pb-20 sm:pt-16">
      <HeroIllustration />
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Ship <span className="text-accent-400">anything</span> between the UK and Turkey
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-brand-100 sm:text-lg">
            Compare real prices from verified cargo companies in 30 seconds — parcels,
            pallets, furniture and vehicles. Free, no account needed.
          </p>
        </div>

        <div id="quote" className="mt-8 scroll-mt-24 sm:mt-10">
          <div className="mx-auto max-w-3xl rounded-2xl border border-brand-100 bg-white p-4 shadow-card-hover sm:p-8">
            <QuoteForm />
          </div>
        </div>

        <p className="mx-auto mt-5 flex max-w-3xl flex-wrap items-center justify-center gap-x-5 gap-y-1.5 text-sm text-brand-100">
          <span className="inline-flex items-center gap-1.5">
            <Tick /> Free
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Tick /> No obligation
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Tick /> Your details stay private until you choose a company
          </span>
        </p>
      </div>
    </section>
  );
}

function Tick() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="h-4 w-4 shrink-0 text-emerald-400"
    >
      <path d="m4.5 10.5 3.5 3.5 7.5-8" />
    </svg>
  );
}
