import type { Metadata } from "next";
import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { COUNTRIES } from "@/lib/types";

export const metadata: Metadata = {
  title: "Customs & duties guide — UK ⇄ Turkey",
  description:
    "A practical, plain-English guide to customs when shipping between the UK and Turkey: who handles the paperwork, what your quote’s customs clearance fee covers, and who pays import duties and VAT.",
};

export default function CustomsGuidePage() {
  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <DisclaimerPanel />
          <div className="mt-12 space-y-12">
            <Basics />
            <PersonalEffects />
            <CommercialGoods />
            <ClearanceFee />
            <WorkedExample />
            <WhoToAsk />
          </div>
          <ClosingCta />
        </div>
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
          Guide
        </p>
        <h1 className="mt-3 max-w-2xl text-3xl font-bold tracking-tight text-brand-900 sm:text-4xl">
          Customs &amp; duties between the UK and Turkey
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-brand-700">
          Every shipment between the {COUNTRIES.GB.flag} United Kingdom and{" "}
          {COUNTRIES.TR.flag} Turkey crosses a customs border. Here is what that
          means in practice: who does the paperwork, what your quote covers, and
          which costs — if any — the receiver should expect.
        </p>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------ disclaimer */

function DisclaimerPanel() {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:p-6">
      <svg
        viewBox="0 0 16 16"
        aria-hidden="true"
        className="mt-0.5 h-5 w-5 shrink-0 text-amber-700"
      >
        <path
          d="M8 1.5 15 14H1L8 1.5Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path d="M8 6v3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="8" cy="11.75" r=".9" fill="currentColor" />
      </svg>
      <p className="text-sm leading-relaxed text-amber-900">
        <strong className="font-semibold">Guidance only — not legal or tax advice.</strong>{" "}
        Customs rules, duty rates and allowances change, and how they apply
        depends on exactly what you send, its value and who is receiving it.
        Always confirm the current position with your chosen carrier before you
        ship, or with HMRC and Turkish customs for anything unusual.
      </p>
    </div>
  );
}

/* ------------------------------------------------------ section scaffold */

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="text-2xl font-bold tracking-tight text-brand-900 sm:text-3xl">{title}</h2>
      <div className="mt-4 max-w-3xl space-y-4 text-sm leading-relaxed text-brand-700 sm:text-base">
        {children}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------- sections */

function Basics() {
  return (
    <Section id="basics" title="The basics, post-Brexit">
      <p>
        Since the UK left the EU, goods moving between the UK and Turkey clear
        customs in both directions — there is no way around it, whether you are
        sending three boxes to family in İzmir or a pallet of stock to a
        distributor in Leeds.
      </p>
      <p>
        The good news: <strong className="font-semibold text-brand-900">your carrier handles the
        paperwork</strong>. Cargo companies on UK–Turkey routes make these crossings
        every week and file the export and import declarations as part of the
        job — that is what the customs clearance line in your quote pays for.
        You will be asked for a simple description of the goods, their value,
        and sometimes the receiver’s ID details (in Turkey typically a T.C.
        kimlik number or, for foreigners, a passport number).
      </p>
      <p>
        The receiver, not the sender, is normally responsible for any{" "}
        <strong className="font-semibold text-brand-900">import duties and import VAT</strong> the
        destination country charges. Many personal shipments attract nothing at
        all; some attract a charge that must be paid before the goods are
        released. No quote on Bizim Kargo includes these amounts, because no
        carrier controls them — they are set and collected by the customs
        authority.
      </p>
    </Section>
  );
}

function PersonalEffects() {
  return (
    <Section id="personal-effects" title="Sending personal effects & gifts">
      <p>
        Used personal belongings — clothes, books, household items you already
        own — are generally treated more gently than new goods. Both the UK and
        Turkey operate allowances and reliefs for genuine personal effects and
        for people relocating, and modest gifts between private individuals
        often fall under a gift allowance below which no duty or VAT is
        charged.
      </p>
      <p>
        The nuances matter, though. “Used” must be genuinely used — a boxed,
        unopened television is a new import wherever it has been sitting.
        Quantities matter too: one kettle looks like a personal effect, ten
        kettles look like stock. And relocation reliefs usually come with
        residency conditions and time limits around your move.
      </p>
      <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-900">
        Allowance thresholds and relief conditions change — do not rely on
        figures you read online, including here. Tell your carrier honestly what
        you are sending and confirm with them what allowances currently apply to
        your shipment.
      </p>
    </Section>
  );
}

function CommercialGoods() {
  return (
    <Section id="commercial-goods" title="Commercial goods">
      <p>
        Anything sold, bought or shipped for business purposes is a commercial
        import. Two pieces of paperwork do most of the work:
      </p>
      <ul className="list-disc space-y-2 pl-5">
        <li>
          <strong className="font-semibold text-brand-900">A commercial invoice.</strong> It states
          what the goods are, their value and currency, who is selling and who
          is buying. Customs on both sides work from this document — it travels
          with the shipment.
        </li>
        <li>
          <strong className="font-semibold text-brand-900">Commodity codes.</strong> Every product
          type has an internationally agreed classification code (often called
          an HS or tariff code) that determines the duty rate it attracts. Your
          carrier or their customs broker can help you classify goods correctly
          — misclassification is the most common cause of delays and unexpected
          charges.
        </li>
      </ul>
      <p>
        The UK–Turkey trading relationship includes preferential arrangements
        for many categories of goods, so the duty on your products may be lower
        than the headline rate — sometimes zero — if the origin paperwork is
        right. A regular commercial shipper should ask their carrier about
        preference and origin declarations up front.
      </p>
    </Section>
  );
}

function ClearanceFee() {
  return (
    <Section id="clearance-fee" title="What your quote’s “customs clearance” fee covers">
      <p>
        When a Bizim Kargo quote shows a customs clearance line, that is the
        carrier’s own fixed fee for getting your shipment through both borders:
      </p>
      <ul className="list-disc space-y-2 pl-5">
        <li>Preparing and filing the export declaration on the sending side.</li>
        <li>Preparing and filing the import declaration on the receiving side.</li>
        <li>Brokerage — the carrier’s or their agent’s time dealing with customs, including routine queries and inspections.</li>
      </ul>
      <p>
        It is a paperwork and handling fee, and it is{" "}
        <strong className="font-semibold text-brand-900">not a payment towards duties or
        VAT</strong>. If customs assess a charge on your goods, that amount is
        separate, belongs to the customs authority, and is payable by the
        receiver before delivery. Carriers sometimes pay it on the receiver’s
        behalf and collect it back — ask yours how they handle it.
      </p>
    </Section>
  );
}

const EXAMPLE_ROWS: Array<{
  charge: string;
  setBy: string;
  inQuote: boolean;
  note: string;
}> = [
  {
    charge: "Base freight",
    setBy: "Carrier",
    inQuote: true,
    note: "The carrier’s tariff price for 45 kg chargeable weight.",
  },
  {
    charge: "Fuel surcharge",
    setBy: "Carrier",
    inQuote: true,
    note: "A stated percentage of base freight.",
  },
  {
    charge: "Customs clearance (paperwork & brokerage)",
    setBy: "Carrier",
    inQuote: true,
    note: "Export and import declarations filed by the carrier.",
  },
  {
    charge: "Import duty — if assessed",
    setBy: "Turkish customs",
    inQuote: false,
    note: "Often nil for genuinely used personal effects within allowances.",
  },
  {
    charge: "Import VAT — if assessed",
    setBy: "Turkish customs",
    inQuote: false,
    note: "Payable by the receiver before release, where charged.",
  },
  {
    charge: "Storage or inspection fees — if the shipment is held",
    setBy: "Customs / terminal",
    inQuote: false,
    note: "Rare with accurate paperwork; charged at cost if it happens.",
  },
];

function WorkedExample() {
  return (
    <Section id="worked-example" title="A worked example">
      <p>
        Say you send three boxes of used household belongings, 45 kg in total,
        from London to your family in İzmir. Here is who charges what:
      </p>
      <div className="overflow-x-auto rounded-2xl border border-brand-100 bg-white shadow-card">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-brand-100 bg-brand-50 text-xs font-semibold uppercase tracking-wide text-brand-700">
              <th className="px-4 py-3">Charge</th>
              <th className="px-4 py-3">Set &amp; collected by</th>
              <th className="px-4 py-3">In your Bizim Kargo quote?</th>
              <th className="px-4 py-3">Notes</th>
            </tr>
          </thead>
          <tbody>
            {EXAMPLE_ROWS.map((row) => (
              <tr key={row.charge} className="border-b border-brand-100 last:border-b-0">
                <td className="px-4 py-3 font-medium text-brand-900">{row.charge}</td>
                <td className="px-4 py-3 text-brand-700">{row.setBy}</td>
                <td className="px-4 py-3">
                  {row.inQuote ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                      Included
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                      Not included — receiver pays if due
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-brand-600">{row.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-sm text-brand-600">
        In this example — used personal effects, honestly declared — many
        shipments clear with nothing extra to pay. But that is customs’ call,
        not the carrier’s, which is why the two kinds of cost are kept firmly
        apart.
      </p>
    </Section>
  );
}

function WhoToAsk() {
  return (
    <Section id="who-to-ask" title="Who to ask">
      <p>
        Your chosen carrier. They cross this border every week, they know how
        today’s rules are being applied at the ports they use, and once you book
        they are the single company accountable for your shipment. When you
        compare quotes on Bizim Kargo and pick one, you get that company’s
        direct phone and email — ask them anything customs-related before your
        goods are collected.
      </p>
      <p>
        For formal sources: HMRC publishes UK import and export rules, and the
        Turkish Ministry of Trade publishes Turkey’s. For anything high-value,
        unusual or commercial at scale, consider a customs broker’s advice.
      </p>
    </Section>
  );
}

/* -------------------------------------------------------------- CTA band */

function ClosingCta() {
  return (
    <div className="mt-16 rounded-2xl bg-brand-950 px-6 py-12 text-center sm:px-12 sm:py-14">
      <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
        Paperwork handled. Prices upfront.
      </h2>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-brand-200 sm:text-base">
        Every quote you compare on Bizim Kargo shows the customs clearance fee
        as its own line — get yours in under a minute.
      </p>
      <Link
        href="/#quote"
        className="mt-8 inline-block rounded-full bg-cta px-8 py-3 text-sm font-semibold text-white transition hover:bg-cta-hover"
      >
        Get quotes
      </Link>
    </div>
  );
}
