import type { Metadata } from "next";
import { redirect } from "next/navigation";

import DemoBanner from "@/components/carrier/DemoBanner";
import LeadsList from "@/components/carrier/LeadsList";
import VerifiedChip from "@/components/carrier/VerifiedChip";
import { cardClass } from "@/components/carrier/ui";
import { carrierLeadsAction } from "@/lib/actions";

import { getSessionUser, isDemoMode } from "../portal";

export const metadata: Metadata = {
  title: "Carrier dashboard",
};

export const dynamic = "force-dynamic";

export default async function CarrierDashboardPage() {
  const data = await carrierLeadsAction();
  if (!data) {
    // Signed in but no profile yet → finish signup; otherwise → login.
    redirect((await getSessionUser()) ? "/carrier/signup" : "/carrier/login");
  }
  const { carrier, leads } = data;
  const demo = isDemoMode();

  const count = (...statuses: string[]): number =>
    leads.filter((lead) => statuses.includes(lead.status)).length;

  const stats: Array<{ label: string; value: number; hint: string }> = [
    { label: "New leads", value: count("new"), hint: "Waiting for first contact" },
    { label: "In conversation", value: count("contacted"), hint: "You have been in touch" },
    { label: "Won", value: count("accepted", "completed"), hint: "Accepted or completed" },
    { label: "All-time leads", value: leads.length, hint: "Everything ever received" },
  ];

  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-6xl space-y-8 px-4 sm:px-6">
        {demo ? <DemoBanner note="You are viewing the demo carrier’s dashboard." /> : null}

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-brand-900 sm:text-3xl">
            {carrier.companyName}
          </h1>
          <VerifiedChip verified={carrier.verified} />
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className={`${cardClass} p-5`}>
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-500">
                {stat.label}
              </p>
              <p className="mt-2 text-3xl font-bold tracking-tight text-brand-900">
                {stat.value}
              </p>
              <p className="mt-1 text-xs text-brand-500">{stat.hint}</p>
            </div>
          ))}
        </div>

        {/* Lead inbox */}
        <div>
          <h2 className="text-lg font-bold tracking-tight text-brand-900">Your leads</h2>
          <p className="mt-1 text-sm text-brand-600">
            Newest first. Update each lead’s status as you speak to the customer.
          </p>
          <div className="mt-4">
            <LeadsList leads={leads} />
          </div>
        </div>
      </div>
    </section>
  );
}
