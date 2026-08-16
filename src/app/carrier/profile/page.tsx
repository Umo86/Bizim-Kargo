import type { Metadata } from "next";
import { redirect } from "next/navigation";

import DemoBanner from "@/components/carrier/DemoBanner";
import ProfileForm from "@/components/carrier/ProfileForm";
import SignOutButton from "@/components/carrier/SignOutButton";
import VerifiedChip from "@/components/carrier/VerifiedChip";
import { cardClass, secondaryButtonClass } from "@/components/carrier/ui";

import { getPortalCarrier, getSessionUser, isDemoMode } from "../portal";

export const metadata: Metadata = {
  title: "Company profile",
};

export const dynamic = "force-dynamic";

export default async function CarrierProfilePage() {
  const carrier = await getPortalCarrier();
  if (!carrier) {
    redirect((await getSessionUser()) ? "/carrier/signup" : "/carrier/login");
  }
  const demo = isDemoMode();

  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-3xl space-y-6 px-4 sm:px-6">
        {demo ? (
          <DemoBanner note="The demo profile is read-only." />
        ) : null}

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-brand-900 sm:text-3xl">
            Company profile
          </h1>
          <VerifiedChip verified={carrier.verified} />
        </div>
        <p className="text-sm text-brand-600">
          This is how your company appears on customer quotes. Reference:{" "}
          <span className="rounded bg-brand-50 px-1.5 py-0.5 font-mono text-xs text-brand-800">
            {carrier.slug}
          </span>
        </p>

        <div className={`${cardClass} p-6 sm:p-8`}>
          <ProfileForm carrier={carrier} demo={demo} />
        </div>

        {!demo ? (
          <div className="flex items-center justify-between rounded-2xl border border-brand-100 bg-white px-6 py-4">
            <p className="text-sm text-brand-600">Finished for today?</p>
            <SignOutButton className={`${secondaryButtonClass} px-5 py-2`} />
          </div>
        ) : null}
      </div>
    </section>
  );
}
