import Link from "next/link";
import { FAQ_ITEMS } from "./faq-data";

/** Styled details/summary accordion — works without JavaScript. */
export default function Faq() {
  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-bold tracking-tight text-brand-900 sm:text-3xl">
            Frequently asked questions
          </h2>
        </div>
        <div className="mx-auto mt-8 max-w-3xl space-y-3">
          {FAQ_ITEMS.map((item) => (
            <details
              key={item.question}
              className="group rounded-2xl border border-brand-100 bg-white shadow-card"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-sm font-semibold text-brand-900 [&::-webkit-details-marker]:hidden">
                {item.question}
                <Chevron />
              </summary>
              <div className="px-5 pb-5 text-sm leading-relaxed text-brand-600">
                {item.answer}
                {item.link ? (
                  <>
                    {" "}
                    <Link
                      href={item.link.href}
                      className="font-medium text-brand-700 underline underline-offset-2 hover:text-brand-900"
                    >
                      {item.link.label}
                    </Link>
                    .
                  </>
                ) : null}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function Chevron() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="h-4 w-4 shrink-0 text-brand-400 transition-transform group-open:rotate-180"
    >
      <path d="m5 7.5 5 5 5-5" />
    </svg>
  );
}
