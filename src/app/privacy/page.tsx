import type { Metadata } from "next";
import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "Privacy policy",
  description:
    "How Bizim Kargo handles personal data: what we collect when you request quotes or book, why, how long we keep it, who we share it with — only the carrier you choose and our email provider — and your rights under UK GDPR.",
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

export default function PrivacyPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="border-b border-brand-100 bg-brand-50">
          <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
            <p className="text-xs font-semibold uppercase tracking-wide text-accent-600">Legal</p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-brand-900 sm:text-4xl">
              Privacy policy
            </h1>
            <p className="mt-4 text-sm font-medium text-brand-600">Last updated: August 2026</p>
          </div>
        </section>

        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
          <p className="text-sm leading-relaxed text-brand-700 sm:text-base">
            Bizim Kargo is a quote comparison marketplace for cargo services
            between the United Kingdom and Turkey. This policy explains, in
            plain English, what personal data we collect, why, who we share it
            with and the rights you have over it under UK data protection law
            (UK GDPR and the Data Protection Act 2018). Bizim Kargo is the data
            controller for the processing described here.
          </p>

          <Section title="1. What we collect">
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <strong className="font-semibold text-brand-900">Quote details.</strong> When you
                request quotes: your route (postcode or city on each side), what
                you are sending, item dimensions and weights, and any declared
                value or collection date you enter. A quote request does not
                require your name or contact details.
              </li>
              <li>
                <strong className="font-semibold text-brand-900">Contact details when you book.</strong>{" "}
                If you choose a quote and ask to be introduced to a carrier:
                your name, email address, phone number, preferred contact method
                and any notes you add.
              </li>
              <li>
                <strong className="font-semibold text-brand-900">Carrier account details.</strong> If
                you list a cargo company: your login email, company details,
                contact information and the tariffs you publish (tariffs and
                company profiles are public by design — that is the marketplace).
              </li>
              <li>
                <strong className="font-semibold text-brand-900">Technical basics.</strong> Standard
                server logs (IP address, browser type, pages requested) used for
                security and keeping the service running. We do not run
                advertising trackers.
              </li>
            </ul>
          </Section>

          <Section title="2. Why we use it">
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <strong className="font-semibold text-brand-900">To provide the service</strong> —
                calculating quotes from your shipment details, and passing your
                contact details to the one carrier you choose so they can
                contact you (performance of a contract / steps taken at your
                request).
              </li>
              <li>
                <strong className="font-semibold text-brand-900">To send service emails</strong> —
                confirming your booking request to you and notifying the carrier
                of the lead (performance of a contract).
              </li>
              <li>
                <strong className="font-semibold text-brand-900">To run and protect the service</strong>{" "}
                — security, debugging and preventing misuse (legitimate
                interests).
              </li>
            </ul>
            <p>
              We do not sell personal data, and we do not use it for third-party
              marketing.
            </p>
          </Section>

          <Section title="3. Who we share it with">
            <p>Sharing is deliberately minimal:</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <strong className="font-semibold text-brand-900">The carrier you choose</strong> — and
                only that carrier — receives your contact details, shipment
                details and the price you selected, so they can contact you and
                arrange the job. From that point the carrier is a data
                controller in its own right for what you share with them;
                carriers based in Turkey receive your details there, which is a
                transfer you request by choosing that carrier.
              </li>
              <li>
                <strong className="font-semibold text-brand-900">Our email provider</strong> —
                processes the confirmation and lead-notification emails on our
                behalf, as a processor under contract.
              </li>
              <li>
                <strong className="font-semibold text-brand-900">Our hosting and database providers</strong>{" "}
                — store the service’s data on our behalf, as processors under
                contract.
              </li>
              <li>
                Authorities, if the law requires it — for example a valid legal
                demand.
              </li>
            </ul>
            <p>No one else. We never share your details with carriers you did not choose.</p>
          </Section>

          <Section title="4. How long we keep it">
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <strong className="font-semibold text-brand-900">Quote requests</strong> are kept long
                enough for you to return to your results link and book; we
                periodically delete old quote snapshots that never led to a
                booking.
              </li>
              <li>
                <strong className="font-semibold text-brand-900">Booking introductions (leads)</strong>{" "}
                are kept while they are commercially relevant to you and the
                carrier, and then deleted or anonymised. You can ask us to
                delete yours sooner at any time.
              </li>
              <li>
                <strong className="font-semibold text-brand-900">Carrier accounts</strong> are kept for
                as long as the account is active, then deleted on request or
                after prolonged inactivity.
              </li>
              <li>
                <strong className="font-semibold text-brand-900">Server logs</strong> are kept for a
                short rolling period for security purposes.
              </li>
            </ul>
          </Section>

          <Section title="5. Your rights">
            <p>Under UK GDPR you have the right to:</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>access a copy of the personal data we hold about you;</li>
              <li>have inaccurate data corrected;</li>
              <li>have your data erased (“right to be forgotten”);</li>
              <li>restrict or object to processing, including any based on legitimate interests;</li>
              <li>data portability, where processing is based on contract or consent;</li>
              <li>
                complain to the Information Commissioner’s Office (ICO) if you
                are unhappy with how we have handled your data — though we would
                welcome the chance to sort it out first.
              </li>
            </ul>
            <p>
              To exercise any of these rights, email us — we respond within one
              month. Note that once a carrier holds your details because you
              chose them, requests about the carrier’s own records should also
              go to the carrier.
            </p>
          </Section>

          <Section title="6. Cookies">
            <p>
              We use only the cookies the service needs to function — such as
              keeping a carrier signed in to their dashboard. We do not use
              advertising or cross-site tracking cookies, so there is no cookie
              banner to click.
            </p>
          </Section>

          <Section title="7. Changes to this policy">
            <p>
              If we change how we handle personal data, we will update this page
              and the date at the top. Significant changes affecting carriers
              with accounts will also be notified by email.
            </p>
          </Section>

          <Section title="8. Contact">
            <p>
              For anything privacy-related — questions, rights requests or
              concerns — email{" "}
              <a
                href="mailto:hello@bizimkargo.example"
                className="font-semibold text-brand-800 underline underline-offset-2"
              >
                hello@bizimkargo.example
              </a>
              . Our{" "}
              <Link href="/terms" className="font-semibold text-brand-800 underline underline-offset-2">
                terms of use
              </Link>{" "}
              explain how the service itself works.
            </p>
          </Section>

          <div className="mt-14 rounded-2xl border border-brand-100 bg-brand-50/60 p-6 text-center">
            <p className="text-sm font-semibold text-brand-900">
              Compare prices without handing over your details — quotes are
              anonymous.
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
