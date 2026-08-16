import type { Metadata } from "next";
import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "Terms of use",
  description:
    "The terms of use for Bizim Kargo, the UK–Turkey cargo quote comparison marketplace: what our service is, how quotes and bookings work, and the responsibilities of customers and carriers.",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="text-xl font-bold tracking-tight text-brand-900">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-brand-700 sm:text-base">
        {children}
      </div>
    </section>
  );
}

export default function TermsPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="border-b border-brand-100 bg-brand-50">
          <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
            <p className="text-xs font-semibold uppercase tracking-wide text-accent-600">Legal</p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-brand-900 sm:text-4xl">
              Terms of use
            </h1>
            <p className="mt-4 text-sm font-medium text-brand-600">Last updated: August 2026</p>
          </div>
        </section>

        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
          <p className="text-sm leading-relaxed text-brand-700 sm:text-base">
            These terms govern your use of Bizim Kargo (“we”, “us”, “the
            service”), a quote comparison marketplace for cargo services between
            the United Kingdom and Turkey. By using the service you agree to
            these terms. Please read them — they are short and written to be
            understood.
          </p>

          <Section title="1. What Bizim Kargo is — and is not">
            <p>
              Bizim Kargo lets you describe a shipment, compare price estimates
              from independent cargo companies (“carriers”), and be introduced
              to the carrier you choose. That is the whole service.
            </p>
            <p>
              We are <strong className="font-semibold text-brand-900">not</strong> a cargo company,
              freight forwarder, broker of record or payment processor. We do
              not carry goods, we do not handle money, and we are not a party to
              any contract for carriage formed between you and a carrier.
            </p>
          </Section>

          <Section title="2. Quotes are estimates">
            <p>
              Prices shown on Bizim Kargo are calculated from tariffs published
              by each carrier and from the shipment details you enter. A quote
              is an estimate until the carrier confirms it directly with you. If
              your goods differ from what you entered — in size, weight,
              quantity or nature — the carrier may re-price the job, and the
              confirmed price is a matter between you and them.
            </p>
            <p>
              Quotes never include import duties, import VAT or other charges
              levied by customs authorities. Where such charges apply, they are
              payable by the receiver.
            </p>
          </Section>

          <Section title="3. Booking and your contract with the carrier">
            <p>
              When you choose a quote and submit your contact details, we pass
              those details, together with your shipment information and the
              quoted price, to the chosen carrier so they can contact you. Any
              booking that follows is made directly with the carrier, on the
              carrier’s own terms and conditions of carriage.
            </p>
            <p>
              Carriers are independent businesses. They are responsible for the
              shipment: collection, transport, customs handling, delivery,
              insurance they have agreed to provide, and everything else
              connected with performing the job. We encourage you to ask a
              carrier for their terms before booking.
            </p>
          </Section>

          <Section title="4. No payment through Bizim Kargo">
            <p>
              We never ask for or take payment from customers. You pay the
              carrier directly, on terms you agree with them. Anyone claiming to
              take payment on behalf of Bizim Kargo is not acting for us —
              please report it to us immediately.
            </p>
          </Section>

          <Section title="5. Your responsibilities">
            <p>When using the service you agree to:</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                describe your shipment accurately, including honest dimensions,
                weights and contents;
              </li>
              <li>
                not request carriage of anything listed on our{" "}
                <Link href="/prohibited-items" className="font-semibold text-brand-800 underline underline-offset-2">
                  prohibited items
                </Link>{" "}
                page or otherwise illegal to send;
              </li>
              <li>
                provide contact details that are your own and that you are happy
                for the chosen carrier to use;
              </li>
              <li>not misuse the service, scrape it, or submit false requests.</li>
            </ul>
          </Section>

          <Section title="6. Carrier listings and verification">
            <p>
              A “verified” badge means we have checked certain company details a
              carrier provided to us. It is not a guarantee, endorsement,
              recommendation or warranty of any carrier’s performance, solvency
              or insurance cover. Ratings and reviews reflect the experiences of
              others, not a promise about yours.
            </p>
            <p>
              Carriers are responsible for the accuracy of the tariffs, transit
              times and company information they publish on the service.
            </p>
          </Section>

          <Section title="7. Liability">
            <p>
              We provide the service with reasonable skill and care, but the
              service is provided “as is”: we cannot promise it will always be
              available or error-free, or that a carrier will quote for, accept
              or perform any particular job.
            </p>
            <p>
              To the fullest extent permitted by law, we are not liable for
              loss or damage arising from a contract of carriage between you and
              a carrier, from a carrier’s acts or omissions, or from customs
              decisions. Nothing in these terms excludes liability that cannot
              lawfully be excluded, including for death or personal injury
              caused by negligence, or fraud.
            </p>
          </Section>

          <Section title="8. Intellectual property">
            <p>
              The Bizim Kargo name, site design, text and software are ours or
              our licensors’. You may use the service for its intended purpose;
              you may not copy or reuse it for a competing service.
            </p>
          </Section>

          <Section title="9. Changes to the service and these terms">
            <p>
              We may update the service and these terms from time to time. The
              date at the top shows when the terms last changed; continued use
              of the service after a change means you accept the updated terms.
            </p>
          </Section>

          <Section title="10. Governing law">
            <p>
              These terms are governed by the laws of England and Wales, and the
              courts of England and Wales have jurisdiction — though nothing in
              this clause takes away protections you are entitled to under the
              law of the place where you live.
            </p>
          </Section>

          <Section title="11. Contact">
            <p>
              Questions about these terms, or something to report? Email us at{" "}
              <a
                href="mailto:hello@bizimkargo.example"
                className="font-semibold text-brand-800 underline underline-offset-2"
              >
                hello@bizimkargo.example
              </a>
              . For anything about a specific shipment, your chosen carrier is
              the right first contact. Our{" "}
              <Link href="/privacy" className="font-semibold text-brand-800 underline underline-offset-2">
                privacy policy
              </Link>{" "}
              explains how we handle your personal data.
            </p>
          </Section>

          <div className="mt-14 rounded-2xl border border-brand-100 bg-brand-50/60 p-6 text-center">
            <p className="text-sm font-semibold text-brand-900">
              Ready to compare prices for your shipment?
            </p>
            <Link
              href="/#quote"
              className="mt-4 inline-block rounded-full bg-cta px-6 py-3 text-sm font-semibold text-white transition hover:bg-cta-hover"
            >
              Get quotes
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
