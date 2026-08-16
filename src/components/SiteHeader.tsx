import Link from "next/link";

/**
 * Global site header. Kept deliberately light: logo, two nav links and one
 * CTA. The homepage quote box is the primary conversion path, so the header
 * never competes with it.
 */
export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-brand-100 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2" aria-label="Bizim Kargo home">
          <BrandMark />
          <span className="text-lg font-bold tracking-tight text-brand-900">
            Bizim<span className="text-accent-600">Kargo</span>
          </span>
        </Link>
        <nav className="flex items-center gap-2 sm:gap-6">
          <Link
            href="/how-it-works"
            className="hidden text-sm font-medium text-brand-800 hover:text-brand-600 sm:block"
          >
            How it works
          </Link>
          <Link
            href="/for-carriers"
            className="hidden text-sm font-medium text-brand-800 hover:text-brand-600 sm:block"
          >
            For cargo companies
          </Link>
          <Link
            href="/carrier/login"
            className="text-sm font-medium text-brand-800 hover:text-brand-600"
          >
            Carrier login
          </Link>
          <Link
            href="/#quote"
            className="rounded-full bg-cta px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-cta-hover"
          >
            Get quotes
          </Link>
        </nav>
      </div>
    </header>
  );
}

function BrandMark() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" aria-hidden="true">
      <rect x="1" y="7" width="30" height="18" rx="4" fill="#1a3f79" />
      <path d="M6 21h12v-8H6v8Zm13 0h7l-2.5-5H19v5Z" fill="#fff" opacity=".92" />
      <circle cx="10" cy="23" r="2.6" fill="#e54848" />
      <circle cx="23" cy="23" r="2.6" fill="#e54848" />
    </svg>
  );
}
