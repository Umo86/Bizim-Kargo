/**
 * Homepage FAQ content — one source of truth for both the visible accordion
 * (Faq.tsx) and the FAQPage JSON-LD emitted from page.tsx.
 */

export interface FaqItem {
  question: string;
  answer: string;
  /** Optional follow-on link rendered after the answer in the accordion. */
  link?: { href: string; label: string };
}

export const FAQ_ITEMS: readonly FaqItem[] = [
  {
    question: "How are prices calculated?",
    answer:
      "Cargo companies charge on whichever is higher: your shipment’s actual weight or its volumetric weight — the space it takes up. Volumetric weight is length × width × height in centimetres divided by a divisor (typically 3,000 for road transport). A light but bulky sofa is therefore priced by size, while a small heavy box is priced by the scales. Every quote on Bizim Kargo shows the full price breakdown, so you can see exactly what you are paying for.",
  },
  {
    question: "Who pays customs duties and import VAT?",
    answer:
      "The receiver pays any customs duties and import VAT that fall due — they are never included in quoted prices. Used personal effects are often relieved from duty, but the rules depend on the direction of travel and your circumstances.",
    link: { href: "/customs-guide", label: "Read our customs and duties guide" },
  },
  {
    question: "What can’t I send?",
    answer:
      "Cash, alcohol and tobacco (in most cases), perishable food, aerosols, loose batteries, weapons and anything illegal in either country cannot be carried. Individual companies may apply further restrictions of their own.",
    link: { href: "/prohibited-items", label: "See the full prohibited items list" },
  },
  {
    question: "How long does delivery take?",
    answer:
      "Road groupage between the UK and Turkey typically takes 7–14 days door to door. Air freight cuts that to around 2–5 days at a higher price, and sea freight for very large loads takes 4–6 weeks. Every quote shows that company’s own estimated transit time for your route.",
  },
  {
    question: "Is my shipment insured?",
    answer:
      "Every company on Bizim Kargo offers insurance cover. Enter your goods’ declared value in the quote form and tick “Add insurance cover” — the premium, typically 1.5–3% of the value and underwritten by the carrier, appears as its own line in each quote so you can compare it fairly.",
  },
  {
    question: "Do I pay through Bizim Kargo?",
    answer:
      "No. Bizim Kargo is free to use and never takes payment from you. Once you choose a quote, we pass your details to that company only — you book and pay them direct, so there are no middleman fees on top of the price you saw.",
  },
];
