import Link from "next/link";

const STEPS = [
  {
    title: "Tell us what you’re sending",
    body: "Choose your route and describe your items — boxes, pallets, furniture or a vehicle. It takes under a minute and you don’t need an account.",
  },
  {
    title: "Compare real prices & transit times",
    body: "See like-for-like quotes from verified cargo companies, each with a full price breakdown and an estimated door-to-door transit time.",
  },
  {
    title: "Book direct with the company",
    body: "Pick the quote you like and we introduce you directly. You arrange collection and pay the company — no middleman fees on top.",
  },
];

export default function HowItWorks() {
  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-bold tracking-tight text-brand-900 sm:text-3xl">
            How it works
          </h2>
          <p className="mt-3 text-base text-brand-600">
            Three steps from quote to collection — no account, no upfront payment.
          </p>
        </div>
        <ol className="mt-10 grid gap-5 sm:grid-cols-3">
          {STEPS.map((step, index) => (
            <li
              key={step.title}
              className="rounded-2xl border border-brand-100 bg-white p-6 shadow-card"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-900 text-base font-bold text-white">
                {index + 1}
              </span>
              <h3 className="mt-4 text-base font-semibold text-brand-900">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-brand-600">{step.body}</p>
            </li>
          ))}
        </ol>
        <div className="mt-10 text-center">
          <Link
            href="/#quote"
            className="inline-block rounded-full bg-cta px-6 py-3 text-sm font-semibold text-white transition hover:bg-cta-hover"
          >
            Get quotes
          </Link>
        </div>
      </div>
    </section>
  );
}
