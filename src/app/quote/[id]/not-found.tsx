import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";

/**
 * Shown when a quote id is unknown, malformed or has expired — covers the
 * results page and everything beneath it (booking + confirmation).
 */
export default function QuoteNotFound() {
  return (
    <>
      <SiteHeader />
      <main className="bg-brand-50/40">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="rounded-2xl border border-brand-100 bg-white px-6 py-12 text-center shadow-card sm:px-12">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className="mx-auto h-12 w-12 text-brand-300"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 3" />
            </svg>
            <h1 className="mt-4 text-2xl font-bold tracking-tight text-brand-900 sm:text-3xl">
              This quote link has expired
            </h1>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-brand-700 sm:text-base">
              Quotes are only held for a short while so the prices you compare
              are always current. Getting a fresh one takes under a minute.
            </p>
            <Link
              href="/"
              className="mt-6 inline-block rounded-full bg-cta px-6 py-3 text-sm font-semibold text-white transition hover:bg-cta-hover"
            >
              Get a fresh quote
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
