import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "Bizim Kargo — Compare UK ⇄ Turkey cargo prices in seconds",
    template: "%s | Bizim Kargo",
  },
  description:
    "Get instant quotes from trusted cargo companies for shipping between the UK and Turkey. Parcels, pallets, furniture and vehicles — compare prices, transit times and book direct.",
  keywords: [
    "UK to Turkey cargo",
    "Turkey to UK shipping",
    "kargo",
    "international shipping quotes",
    "pallet delivery",
    "man and van Turkey",
  ],
  openGraph: {
    title: "Bizim Kargo — Compare UK ⇄ Turkey cargo prices in seconds",
    description:
      "Enter your route and items, get real prices from verified cargo companies, and book direct. Free to use.",
    type: "website",
    siteName: "Bizim Kargo",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen font-sans">{children}</body>
    </html>
  );
}
