import type { Metadata } from "next";
import { redirect } from "next/navigation";

import DemoBanner from "@/components/carrier/DemoBanner";
import RateWizard from "@/components/carrier/RateWizard";

import { getSessionUser, isDemoMode } from "../../portal";

export const metadata: Metadata = {
  title: "New rate card",
};

export const dynamic = "force-dynamic";

export default async function NewRateCardPage({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string }>;
}) {
  const { welcome } = await searchParams;
  const demo = isDemoMode();

  if (!demo) {
    const user = await getSessionUser();
    if (!user) redirect("/carrier/login");
    // A profile-less user can still build rates: saveServiceAction creates a
    // minimal profile from their signup metadata on publish.
  }

  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-4xl space-y-6 px-4 sm:px-6">
        {welcome === "1" ? (
          <div
            role="status"
            className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
          >
            <span className="font-semibold">Your account is created</span> — now
            publish your first rates so customers can find you.
          </div>
        ) : null}
        {demo ? (
          <DemoBanner note="Try the whole wizard — the live preview prices with the real engine. Publishing needs a real account." />
        ) : null}

        <div>
          <h1 className="text-2xl font-bold tracking-tight text-brand-900 sm:text-3xl">
            New rate card
          </h1>
          <p className="mt-2 text-sm text-brand-600">
            Five quick steps. Customers see your prices the moment you publish.
          </p>
        </div>

        <RateWizard demo={demo} />
      </div>
    </section>
  );
}
