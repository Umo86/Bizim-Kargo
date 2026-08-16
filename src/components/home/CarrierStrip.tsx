import Link from "next/link";

/** Recruitment band for cargo companies — deliberately secondary. */
export default function CarrierStrip() {
  return (
    <section className="bg-brand-50">
      <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-4 py-12 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-brand-900 sm:text-2xl">
            Run a cargo or man-and-van business on this route?
          </h2>
          <p className="mt-2 max-w-xl text-sm text-brand-600 sm:text-base">
            Join free and receive booking leads from customers who are ready to ship.
          </p>
        </div>
        <Link
          href="/for-carriers"
          className="shrink-0 rounded-full border border-brand-200 bg-white px-6 py-3 text-sm font-semibold text-brand-800 transition hover:bg-brand-100"
        >
          Learn about joining
        </Link>
      </div>
    </section>
  );
}
