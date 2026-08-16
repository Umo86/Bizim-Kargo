import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="border-t border-brand-100 bg-brand-950 text-brand-100">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        <div>
          <p className="text-lg font-bold text-white">
            Bizim<span className="text-accent-400">Kargo</span>
          </p>
          <p className="mt-3 text-sm leading-relaxed text-brand-200">
            Compare real prices from trusted cargo companies shipping between
            the United Kingdom and Turkey. Free for customers — you book direct
            with the carrier.
          </p>
        </div>
        <FooterCol
          title="Customers"
          links={[
            ["Get a quote", "/#quote"],
            ["How it works", "/how-it-works"],
            ["Customs & duties guide", "/customs-guide"],
            ["Prohibited items", "/prohibited-items"],
          ]}
        />
        <FooterCol
          title="Cargo companies"
          links={[
            ["Why join", "/for-carriers"],
            ["Carrier sign up", "/carrier/signup"],
            ["Carrier login", "/carrier/login"],
          ]}
        />
        <FooterCol
          title="Legal"
          links={[
            ["Terms of use", "/terms"],
            ["Privacy policy", "/privacy"],
          ]}
        />
      </div>
      <div className="border-t border-brand-800">
        <p className="mx-auto max-w-6xl px-4 py-5 text-xs text-brand-300 sm:px-6">
          © {new Date().getFullYear()} Bizim Kargo. Prices are provided by
          independent cargo companies. Import duties and taxes, where
          applicable, are payable by the receiver and are not included in
          quoted prices.
        </p>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <p className="text-sm font-semibold uppercase tracking-wide text-brand-300">{title}</p>
      <ul className="mt-3 space-y-2">
        {links.map(([label, href]) => (
          <li key={href}>
            <Link href={href} className="text-sm text-brand-100 hover:text-white">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
