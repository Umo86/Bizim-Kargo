import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import DemoBanner from "@/components/carrier/DemoBanner";
import LoginForm from "@/components/carrier/LoginForm";
import { cardClass, primaryButtonClass } from "@/components/carrier/ui";

import { getPortalCarrier, getSessionUser, isDemoMode } from "../portal";

export const metadata: Metadata = {
  title: "Carrier login",
  description: "Sign in to your Bizim Kargo carrier account.",
};

export const dynamic = "force-dynamic";

export default async function CarrierLoginPage() {
  const demo = isDemoMode();

  if (!demo) {
    const user = await getSessionUser();
    if (user) {
      // Already signed in: straight to the dashboard, or to profile
      // completion if signup was interrupted before the profile was created.
      redirect((await getPortalCarrier()) ? "/carrier/dashboard" : "/carrier/signup");
    }
  }

  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-md">
          <h1 className="text-center text-2xl font-bold tracking-tight text-brand-900 sm:text-3xl">
            Carrier login
          </h1>
          <p className="mt-2 text-center text-sm text-brand-600">
            Manage your leads, rates and company profile.
          </p>

          <div className={`${cardClass} mt-8 p-6 sm:p-8`}>
            {demo ? (
              <div className="space-y-5">
                <DemoBanner note="The demo dashboard is fully viewable without an account." />
                <Link href="/carrier/dashboard" className={`${primaryButtonClass} w-full`}>
                  View demo dashboard →
                </Link>
                <p className="text-center text-sm text-brand-600">
                  Curious how joining works?{" "}
                  <Link
                    href="/carrier/signup"
                    className="font-semibold text-brand-800 hover:text-brand-600"
                  >
                    See the carrier signup page
                  </Link>
                </p>
              </div>
            ) : (
              <LoginForm />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
