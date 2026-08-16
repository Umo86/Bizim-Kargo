import type { Metadata } from "next";
import { redirect } from "next/navigation";

import SignupForm from "@/components/carrier/SignupForm";
import { cardClass } from "@/components/carrier/ui";

import { getPortalCarrier, getSessionUser, isDemoMode } from "../portal";

export const metadata: Metadata = {
  title: "Carrier sign up",
  description:
    "Join Bizim Kargo free, publish your own UK–Turkey rates and receive booking leads directly.",
};

export const dynamic = "force-dynamic";

const PITCH_POINTS: Array<{ title: string; body: string }> = [
  {
    title: "Free to join",
    body: "No listing fees and no subscription — creating your account and publishing rates costs nothing.",
  },
  {
    title: "You keep 100% of the booking",
    body: "Customers book direct with you. We never take commission from your price.",
  },
  {
    title: "Leads emailed instantly",
    body: "The moment a customer chooses your quote, their contact details land in your inbox and dashboard.",
  },
  {
    title: "You set your own rates",
    body: "Your tariff, your bands, your surcharges — update them whenever you like.",
  },
];

export default async function CarrierSignupPage() {
  const demo = isDemoMode();
  let mode: "signup" | "complete" | "demo" = demo ? "demo" : "signup";

  if (!demo) {
    const user = await getSessionUser();
    if (user) {
      if (await getPortalCarrier()) redirect("/carrier/dashboard");
      mode = "complete";
    }
  }

  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-16">
          {/* Left: sales pitch */}
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-accent-600">
              For cargo companies
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-brand-900 sm:text-3xl">
              Put your prices in front of customers already looking to ship
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-brand-600 sm:text-base">
              Bizim Kargo sends UK ⇆ Turkey shipping customers straight to the
              carriers who can move their goods. List your services once and
              every matching request quotes you automatically.
            </p>
            <ul className="mt-8 space-y-5">
              {PITCH_POINTS.map((point) => (
                <li key={point.title} className="flex gap-3">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
                      <path
                        d="m2.5 6.5 2.5 2.5 4.5-5.5"
                        fill="none"
                        stroke="#047857"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-brand-900">{point.title}</p>
                    <p className="mt-0.5 text-sm leading-relaxed text-brand-600">
                      {point.body}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Right: the signup form */}
          <div className={`${cardClass} p-6 sm:p-8`}>
            <h2 className="text-lg font-bold tracking-tight text-brand-900">
              {mode === "complete" ? "Complete your company profile" : "Create your carrier account"}
            </h2>
            <p className="mt-1 text-sm text-brand-600">
              Takes about two minutes. Verification follows by email.
            </p>
            <div className="mt-6">
              <SignupForm mode={mode} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
