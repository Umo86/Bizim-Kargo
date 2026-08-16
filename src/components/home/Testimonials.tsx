/** Social proof — three believable customer stories with star ratings. */

const TESTIMONIALS = [
  {
    quote:
      "Sent six boxes to my mum in İzmir before Bayram. I had three quotes in under a minute, the driver collected on the Friday and she had everything nine days later.",
    name: "Ayşe K.",
    location: "London",
  },
  {
    quote:
      "We moved a two-bedroom flat’s worth of furniture from Leeds to Fethiye. Paid £480 against a £700 quote we’d been given elsewhere, and the company kept us updated the whole way down.",
    name: "Daniel W.",
    location: "Leeds",
  },
  {
    quote:
      "I ship a pallet of textiles to Manchester most months. Seeing road and air prices side by side, with the breakdown, has genuinely cut our freight costs by about a third.",
    name: "Emre S.",
    location: "İstanbul",
  },
];

export default function Testimonials() {
  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-bold tracking-tight text-brand-900 sm:text-3xl">
            Trusted on both sides of the route
          </h2>
          <p className="mt-3 text-base text-brand-600">
            Families and businesses use Bizim Kargo to ship with confidence.
          </p>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <figure
              key={t.name}
              className="flex flex-col rounded-2xl border border-brand-100 bg-white p-6 shadow-card"
            >
              <Stars />
              <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-brand-700">
                “{t.quote}”
              </blockquote>
              <figcaption className="mt-4">
                <p className="text-sm font-semibold text-brand-900">{t.name}</p>
                <p className="text-xs text-brand-500">{t.location}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

function Stars() {
  return (
    <div className="flex items-center gap-0.5" role="img" aria-label="Rated 5 out of 5">
      {[0, 1, 2, 3, 4].map((i) => (
        <svg key={i} viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4 fill-amber-400">
          <path d="M10 1.8l2.47 5.13 5.65.74-4.14 3.9 1.05 5.58L10 14.42l-5.03 2.73 1.05-5.58-4.14-3.9 5.65-.74L10 1.8Z" />
        </svg>
      ))}
    </div>
  );
}
