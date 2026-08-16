"use client";

import { useState } from "react";

import { updateLeadStatusAction } from "@/lib/actions";
import type { Lead } from "@/lib/data";
import { formatMoney } from "@/lib/format";
import { LEAD_STATUS_LABELS, type LeadStatus } from "@/lib/types";

import { cardClass, chipClass, errorAlertClass, selectClass } from "./ui";

const STATUS_ORDER: readonly LeadStatus[] = [
  "new",
  "contacted",
  "accepted",
  "declined",
  "completed",
];

const STATUS_CHIP_STYLES: Record<LeadStatus, string> = {
  new: "bg-brand-100 text-brand-800",
  contacted: "bg-amber-100 text-amber-900",
  accepted: "bg-emerald-100 text-emerald-800",
  declined: "bg-brand-50 text-brand-500",
  completed: "bg-emerald-600 text-white",
};

const CHANNEL_LABELS: Record<Lead["contact"]["preferredContact"], string> = {
  phone: "Prefers phone",
  email: "Prefers email",
  whatsapp: "Prefers WhatsApp",
};

// Fixed locale + timezone so the server and client render identical text.
const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/London",
});

type Filter = LeadStatus | "all";

/**
 * The carrier's lead inbox: filter chips by status, one card per lead, and an
 * optimistic status select that reverts (with a readable error) on failure.
 */
export default function LeadsList({ leads: initialLeads }: { leads: Lead[] }) {
  const [leads, setLeads] = useState(initialLeads);
  const [filter, setFilter] = useState<Filter>("all");
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const visible = filter === "all" ? leads : leads.filter((l) => l.status === filter);

  const countFor = (f: Filter): number =>
    f === "all" ? leads.length : leads.filter((l) => l.status === f).length;

  async function changeStatus(lead: Lead, status: LeadStatus) {
    if (status === lead.status) return;
    const previous = lead.status;
    setError(null);
    setSavingId(lead.id);
    // Optimistic: paint the new status immediately…
    setLeads((current) =>
      current.map((l) => (l.id === lead.id ? { ...l, status } : l)),
    );
    try {
      await updateLeadStatusAction({ leadId: lead.id, status });
    } catch (caught) {
      // …and revert if the server rejects it.
      setLeads((current) =>
        current.map((l) => (l.id === lead.id ? { ...l, status: previous } : l)),
      );
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not update the lead. Please try again.",
      );
    } finally {
      setSavingId(null);
    }
  }

  if (leads.length === 0) {
    return (
      <div className={`${cardClass} px-6 py-12 text-center`}>
        <p className="text-sm font-semibold text-brand-900">No leads yet</p>
        <p className="mt-1 text-sm text-brand-600">
          Your rates are live, bookings will land here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter chips */}
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter leads by status">
        {(["all", ...STATUS_ORDER] as Filter[]).map((f) => {
          const active = filter === f;
          return (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              aria-pressed={active}
              className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
                active
                  ? "border-brand-800 bg-brand-800 text-white"
                  : "border-brand-200 bg-white text-brand-700 hover:bg-brand-50"
              }`}
            >
              {f === "all" ? "All" : LEAD_STATUS_LABELS[f]}
              <span className={active ? "ml-1.5 opacity-70" : "ml-1.5 text-brand-400"}>
                {countFor(f)}
              </span>
            </button>
          );
        })}
      </div>

      {error ? (
        <div role="alert" className={errorAlertClass}>
          {error}
        </div>
      ) : null}

      {visible.length === 0 ? (
        <div className={`${cardClass} px-6 py-10 text-center`}>
          <p className="text-sm text-brand-600">
            No {filter === "all" ? "" : `${LEAD_STATUS_LABELS[filter as LeadStatus].toLowerCase()} `}
            leads to show.
          </p>
        </div>
      ) : (
        <ul className="space-y-4">
          {visible.map((lead) => (
            <li key={lead.id} className={`${cardClass} p-5 sm:p-6`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-base font-bold text-brand-900">{lead.contact.name}</p>
                    <span className={`${chipClass} ${STATUS_CHIP_STYLES[lead.status]}`}>
                      {LEAD_STATUS_LABELS[lead.status]}
                    </span>
                    <span className={`${chipClass} bg-brand-50 text-brand-600`}>
                      {CHANNEL_LABELS[lead.contact.preferredContact]}
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm text-brand-700">
                    {lead.priceSnapshot && !lead.priceSnapshot.requiresManualQuote ? (
                      <>
                        {lead.priceSnapshot.serviceName} ·{" "}
                        <span className="font-semibold text-brand-900">
                          {formatMoney(lead.priceSnapshot.total, lead.priceSnapshot.currency)}
                        </span>
                      </>
                    ) : lead.priceSnapshot ? (
                      <>{lead.priceSnapshot.serviceName} · Manual quote request</>
                    ) : (
                      "Manual quote request"
                    )}
                  </p>
                </div>
                <p className="shrink-0 text-xs text-brand-500">
                  {dateFormatter.format(new Date(lead.createdAt))}
                </p>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm">
                <a
                  href={`tel:${lead.contact.phone.replace(/\s+/g, "")}`}
                  className="font-medium text-brand-800 underline decoration-brand-200 underline-offset-2 hover:text-brand-600"
                >
                  {lead.contact.phone}
                </a>
                <a
                  href={`mailto:${lead.contact.email}`}
                  className="break-all font-medium text-brand-800 underline decoration-brand-200 underline-offset-2 hover:text-brand-600"
                >
                  {lead.contact.email}
                </a>
              </div>

              {lead.contact.notes ? (
                <p className="mt-3 rounded-xl bg-brand-50 px-4 py-2.5 text-sm text-brand-700">
                  <span className="font-semibold text-brand-800">Customer note:</span>{" "}
                  {lead.contact.notes}
                </p>
              ) : null}

              <div className="mt-4 flex items-center gap-3 border-t border-brand-100 pt-4">
                <label
                  htmlFor={`lead-status-${lead.id}`}
                  className="text-xs font-semibold uppercase tracking-wide text-brand-700"
                >
                  Status
                </label>
                <select
                  id={`lead-status-${lead.id}`}
                  value={lead.status}
                  disabled={savingId === lead.id}
                  onChange={(event) => changeStatus(lead, event.target.value as LeadStatus)}
                  className={`${selectClass} mt-0 w-auto`}
                >
                  {STATUS_ORDER.map((status) => (
                    <option key={status} value={status}>
                      {LEAD_STATUS_LABELS[status]}
                    </option>
                  ))}
                </select>
                {savingId === lead.id ? (
                  <span className="text-xs text-brand-500">Saving…</span>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
