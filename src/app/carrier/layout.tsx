import type { Metadata } from "next";

import CarrierNav from "@/components/carrier/CarrierNav";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = {
  title: "Carrier portal",
};

/**
 * Shared chrome for every /carrier page: the global header, the carrier
 * sub-navigation (which hides itself on the login and signup pages) and the
 * global footer.
 */
export default function CarrierLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <CarrierNav demo={!isSupabaseConfigured()} />
      <main className="min-h-[60vh] bg-brand-50/40">{children}</main>
      <SiteFooter />
    </>
  );
}
