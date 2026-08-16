import type { Metadata } from "next";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import CarrierStrip from "@/components/home/CarrierStrip";
import Faq from "@/components/home/Faq";
import { FAQ_ITEMS } from "@/components/home/faq-data";
import Hero from "@/components/home/Hero";
import HowItWorks from "@/components/home/HowItWorks";
import PopularLanes from "@/components/home/PopularLanes";
import StickyCta from "@/components/home/StickyCta";
import Testimonials from "@/components/home/Testimonials";
import TrustRow from "@/components/home/TrustRow";

export const metadata: Metadata = {
  title: "Compare UK ⇄ Turkey cargo prices in seconds",
  description:
    "Get instant quotes from verified cargo companies shipping between the UK and Turkey. Parcels, pallets, furniture and vehicles — compare real prices and book direct, free.",
};

/** FAQPage structured data, built from the same content the accordion shows. */
const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ_ITEMS.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.link ? `${item.answer} ${item.link.label}.` : item.answer,
    },
  })),
};

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        {/* Zero-height marker: the sticky mobile CTA appears once this has scrolled past. */}
        <div id="hero-sentinel" aria-hidden="true" />
        <TrustRow />
        <HowItWorks />
        <PopularLanes />
        <Testimonials />
        <Faq />
        <CarrierStrip />
      </main>
      <SiteFooter />
      <StickyCta />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
    </>
  );
}
