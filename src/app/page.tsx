import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

// Placeholder homepage — replaced by the full conversion-optimised landing
// page (hero + quote box) in the UI build phase.
export default function Home() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
        <h1 className="text-4xl font-bold tracking-tight text-brand-900">
          Ship anything between the UK and Turkey
        </h1>
        <p className="mt-4 max-w-xl text-lg text-brand-800">
          Compare real prices from verified cargo companies in seconds.
        </p>
      </main>
      <SiteFooter />
    </>
  );
}
