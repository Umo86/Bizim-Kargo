import type { Metadata } from "next";
import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "Booking request sent",
  robots: { index: false },
};

type SearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  const v = Array.isArray(value) ? value[0] : value;
  return v && v.trim().length > 0 ? v.trim() : undefined;
}

export default async function BookedPage({
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const companyName = first(sp.name);
  const contactEmail = first(sp.email);
  const contactPhone = first(sp.phone);

  const steps = [
    "They will contact you within 1 working day on your preferred channel.",
    "Agree your collection date and payment directly with them.",
    "They collect and ship — you deal direct from here.",
  ];

  return (
    <>
      <SiteHeader />
      <main className="bg-brand-50/40">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
          <div className="rounded-2xl border border-brand-100 bg-white px-6 py-10 text-center shadow-card sm:px-12">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                className="h-8 w-8 text-emerald-600"
              >
                <path d="M4 12.5 9.5 18 20 6.5" />
              </svg>
            </span>
            <h1 className="mt-5 text-2xl font-bold tracking-tight text-brand-900 sm:text-3xl">
              {companyName
                ? `Booking request sent to ${companyName}`
                : "Booking request sent"}
            </h1>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-brand-700 sm:text-base">
              {companyName
                ? "Your details are on their way. Nothing is paid until you and the company have agreed everything."
                : "Your details are on their way to the company you chose. Nothing is paid until you have agreed everything with them."}
            </p>
          </div>

          {/* What happens next */}
          <div className="mt-6 rounded-2xl border border-brand-100 bg-white p-5 shadow-card sm:p-8">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-brand-500">
              What happens next
            </h2>
            <ol className="mt-4 space-y-4">
              {steps.map((step, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-900 text-xs font-bold text-white">
                    {index + 1}
                  </span>
                  <p className="pt-1 text-sm leading-relaxed text-brand-800">{step}</p>
                </li>
              ))}
            </ol>
          </div>

          {/* Carrier contact card */}
          {(contactPhone || contactEmail) && (
            <div className="mt-6 rounded-2xl border border-brand-100 bg-white p-5 shadow-card sm:p-8">
              <h2 className="text-base font-bold tracking-tight text-brand-900">
                Don&apos;t want to wait? Contact them now
              </h2>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                {contactPhone && (
                  <a
                    href={`tel:${contactPhone.replace(/[^\d+]/g, "")}`}
                    className="flex-1 rounded-xl border border-brand-200 px-4 py-3 text-center transition hover:bg-brand-50"
                  >
                    <span className="block text-xs font-semibold uppercase tracking-wide text-brand-500">
                      Phone
                    </span>
                    <span className="mt-0.5 block text-sm font-semibold text-brand-900">
                      {contactPhone}
                    </span>
                  </a>
                )}
                {contactEmail && (
                  <a
                    href={`mailto:${contactEmail}`}
                    className="flex-1 rounded-xl border border-brand-200 px-4 py-3 text-center transition hover:bg-brand-50"
                  >
                    <span className="block text-xs font-semibold uppercase tracking-wide text-brand-500">
                      Email
                    </span>
                    <span className="mt-0.5 block break-all text-sm font-semibold text-brand-900">
                      {contactEmail}
                    </span>
                  </a>
                )}
              </div>
            </div>
          )}

          <div className="mt-6 space-y-2 text-center">
            <p className="text-sm text-brand-700">
              We&apos;ve emailed you a copy of this request for your records.
            </p>
            <p className="text-xs text-brand-500">
              Bizim Kargo never takes payment — you pay{" "}
              {companyName ?? "the company"} directly once everything is agreed.
            </p>
          </div>

          <div className="mt-8 text-center">
            <Link
              href="/"
              className="inline-block rounded-full bg-cta px-6 py-3 text-sm font-semibold text-white transition hover:bg-cta-hover"
            >
              Get another quote
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
