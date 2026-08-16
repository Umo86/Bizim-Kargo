import type { Metadata } from "next";
import { getLeadsForCarrier } from "@/lib/data";
import { DEMO_CARRIERS, DEMO_CARRIERS_BY_ID } from "@/lib/demo-data";
import { formatMoney } from "@/lib/format";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { LEAD_STATUS_LABELS, type LeadStatus, type QuoteResult } from "@/lib/types";

export const metadata: Metadata = { title: "Leads" };

/** One row of the admin leads table, mode-independent. */
interface AdminLeadRow {
  id: string;
  createdAt: string;
  customerName: string;
  customerEmail: string;
  carrierName: string;
  serviceName: string | null;
  /** Preformatted total, or null when there is no priced snapshot. */
  total: string | null;
  status: LeadStatus;
}

/** Raw shape of the Supabase select below. */
interface LeadDbRow {
  id: string;
  created_at: string;
  customer_name: string;
  customer_email: string;
  status: string;
  price_snapshot: QuoteResult | null;
  carriers: { company_name: string } | null;
}

function snapshotTotal(snapshot: QuoteResult | null): string | null {
  if (!snapshot) return null;
  if (snapshot.requiresManualQuote) return "Manual quote";
  return formatMoney(snapshot.total, snapshot.currency);
}

async function loadLeads(): Promise<AdminLeadRow[]> {
  if (!isSupabaseConfigured()) {
    // Demo mode: gather the seeded leads across every demo carrier.
    const perCarrier = await Promise.all(
      DEMO_CARRIERS.map((carrier) => getLeadsForCarrier(carrier.id)),
    );
    return perCarrier
      .flat()
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((lead) => ({
        id: lead.id,
        createdAt: lead.createdAt,
        customerName: lead.contact.name,
        customerEmail: lead.contact.email,
        carrierName:
          DEMO_CARRIERS_BY_ID[lead.carrierId]?.companyName ?? "Unknown carrier",
        serviceName: lead.priceSnapshot?.serviceName ?? null,
        total: snapshotTotal(lead.priceSnapshot),
        status: lead.status,
      }));
  }

  // Supabase mode: the layout guard has established the caller is an admin,
  // whose session passes the leads_admin_all RLS policy — no service key
  // needed for this read.
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leads")
    .select("id, created_at, customer_name, customer_email, status, price_snapshot, carriers(company_name)")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    throw new Error(`Could not load leads: ${error.message}`);
  }

  return ((data ?? []) as unknown as LeadDbRow[]).map((row) => ({
    id: row.id,
    createdAt: row.created_at,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    carrierName: row.carriers?.company_name ?? "Unknown carrier",
    serviceName: row.price_snapshot?.serviceName ?? null,
    total: snapshotTotal(row.price_snapshot),
    status: row.status as LeadStatus,
  }));
}

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const STATUS_CHIP_CLASSES: Record<LeadStatus, string> = {
  new: "bg-brand-100 text-brand-800",
  contacted: "bg-amber-100 text-amber-800",
  accepted: "bg-emerald-100 text-emerald-800",
  declined: "bg-accent-100 text-accent-800",
  completed: "bg-brand-900 text-white",
};

export default async function AdminLeadsPage() {
  const leads = await loadLeads();

  return (
    <>
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-brand-900 sm:text-3xl">Leads</h1>
        <p className="mt-1 text-sm text-brand-600">
          The most recent booking introductions across all carriers — read-only;
          carriers work their own leads from their dashboards.
        </p>
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-brand-100 bg-white shadow-card">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead>
            <tr className="border-b border-brand-100 bg-brand-50 text-xs font-semibold uppercase tracking-wide text-brand-700">
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Carrier</th>
              <th className="px-4 py-3">Service</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead.id} className="border-b border-brand-100 align-top last:border-b-0">
                <td className="px-4 py-3 whitespace-nowrap text-brand-700">
                  {dateFormatter.format(new Date(lead.createdAt))}
                </td>
                <td className="px-4 py-3">
                  <p className="font-semibold text-brand-900">{lead.customerName}</p>
                  <p className="mt-0.5 text-xs text-brand-500">{lead.customerEmail}</p>
                </td>
                <td className="px-4 py-3 text-brand-800">{lead.carrierName}</td>
                <td className="px-4 py-3 text-brand-700">{lead.serviceName ?? "—"}</td>
                <td className="px-4 py-3 whitespace-nowrap font-semibold text-brand-900">
                  {lead.total ?? "—"}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_CHIP_CLASSES[lead.status]}`}
                  >
                    {LEAD_STATUS_LABELS[lead.status]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {leads.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-brand-500">
            No leads yet — they appear here as soon as customers book quotes.
          </p>
        ) : null}
      </div>
    </>
  );
}
