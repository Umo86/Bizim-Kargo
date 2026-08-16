"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { Carrier } from "@/lib/types";

import { updateCarrierProfileAction } from "@/app/carrier/actions";
import { errorAlertClass, inputClass, labelClass, primaryButtonClass } from "./ui";

/**
 * Edit the carrier's public company profile. Read-only in demo mode (the
 * fields render disabled and the save button is hidden).
 */
export default function ProfileForm({
  carrier,
  demo,
}: {
  carrier: Carrier;
  demo: boolean;
}) {
  const router = useRouter();
  const [companyName, setCompanyName] = useState(carrier.companyName);
  const [blurb, setBlurb] = useState(carrier.blurb);
  const [contactEmail, setContactEmail] = useState(carrier.contactEmail);
  const [contactPhone, setContactPhone] = useState(carrier.contactPhone);
  const [years, setYears] = useState(
    carrier.yearsOperating === null ? "" : String(carrier.yearsOperating),
  );
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (demo) return;
    setError(null);
    setSaved(false);
    setSaving(true);
    try {
      await updateCarrierProfileAction({
        companyName,
        blurb,
        contactEmail,
        contactPhone,
        yearsOperating: years === "" ? null : Number(years),
      });
      setSaved(true);
      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not save your profile. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {error ? (
        <div role="alert" className={errorAlertClass}>
          {error}
        </div>
      ) : null}
      {saved ? (
        <div
          role="status"
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
        >
          Profile saved.
        </div>
      ) : null}

      <fieldset disabled={demo || saving} className="space-y-4">
        <div>
          <label htmlFor="pf-company" className={labelClass}>
            Company name
          </label>
          <input
            id="pf-company"
            type="text"
            required
            value={companyName}
            onChange={(event) => setCompanyName(event.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="pf-blurb" className={labelClass}>
            About your company
          </label>
          <textarea
            id="pf-blurb"
            required
            rows={4}
            value={blurb}
            onChange={(event) => setBlurb(event.target.value)}
            className={inputClass}
          />
          <p className="mt-1 text-xs text-brand-500">
            Shown to customers next to your quotes.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="pf-email" className={labelClass}>
              Contact email
            </label>
            <input
              id="pf-email"
              type="email"
              required
              value={contactEmail}
              onChange={(event) => setContactEmail(event.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="pf-phone" className={labelClass}>
              Contact phone
            </label>
            <input
              id="pf-phone"
              type="tel"
              required
              value={contactPhone}
              onChange={(event) => setContactPhone(event.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label htmlFor="pf-years" className={labelClass}>
            Years operating <span className="font-normal normal-case">(optional)</span>
          </label>
          <input
            id="pf-years"
            type="number"
            min={0}
            max={150}
            inputMode="numeric"
            value={years}
            onChange={(event) => setYears(event.target.value)}
            className={`${inputClass} no-spinner max-w-40`}
          />
        </div>

        {!demo ? (
          <button type="submit" disabled={saving} className={primaryButtonClass}>
            {saving ? "Saving…" : "Save changes"}
          </button>
        ) : null}
      </fieldset>
    </form>
  );
}
