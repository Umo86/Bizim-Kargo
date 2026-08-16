"use client";

import { useState } from "react";
import type { QuoteFormState } from "./draft";
import { inputClass, labelClass } from "./ui";

interface StepDetailsProps {
  state: QuoteFormState;
  errors: Record<string, string>;
  onPatch: (patch: Partial<QuoteFormState>) => void;
}

function localToday(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

/** Step 3 — optional extras, then the big CTA (rendered by the parent). */
export default function StepDetails({ state, errors, onPatch }: StepDetailsProps) {
  // Computed once on mount; this step only ever renders client-side.
  const [today] = useState(localToday);

  const declared = Number(state.declaredValue.trim());
  const insurable = state.declaredValue.trim() !== "" && Number.isFinite(declared) && declared > 0;

  return (
    <div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="ready-date" className={labelClass}>
            Collection-ready date{" "}
            <span className="font-normal normal-case tracking-normal text-brand-500">
              (optional)
            </span>
          </label>
          <input
            id="ready-date"
            type="date"
            min={today}
            value={state.readyDate}
            onChange={(event) => onPatch({ readyDate: event.target.value })}
            className={`${inputClass} mt-1.5`}
          />
          <p className="mt-1 text-xs text-brand-500">Not sure yet? Leave it blank.</p>
        </div>
        <div>
          <label htmlFor="declared-value" className={labelClass}>
            Declared value{" "}
            <span className="font-normal normal-case tracking-normal text-brand-500">
              (optional)
            </span>
          </label>
          <div className="relative mt-1.5">
            <span
              className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-brand-400"
              aria-hidden="true"
            >
              £
            </span>
            <input
              id="declared-value"
              type="number"
              min={0}
              step="any"
              inputMode="decimal"
              placeholder="e.g. 500"
              value={state.declaredValue}
              onChange={(event) => {
                const value = event.target.value;
                const parsed = Number(value.trim());
                const stillInsurable =
                  value.trim() !== "" && Number.isFinite(parsed) && parsed > 0;
                onPatch({
                  declaredValue: value,
                  ...(stillInsurable ? {} : { wantsInsurance: false }),
                });
              }}
              aria-invalid={errors.declaredValue ? true : undefined}
              aria-describedby={errors.declaredValue ? "declared-value-error" : undefined}
              className={`${inputClass} no-spinner pl-7 ${
                errors.declaredValue ? "border-red-300" : ""
              }`}
            />
          </div>
          {errors.declaredValue ? (
            <p id="declared-value-error" className="mt-1 text-xs text-red-600">
              {errors.declaredValue}
            </p>
          ) : (
            <p className="mt-1 text-xs text-brand-500">
              The value of your goods, used to price insurance cover.
            </p>
          )}
        </div>
      </div>

      {/* The disabled dimming stays off the "Enter a declared value…" line —
          instructional text must keep AA contrast even in the disabled state. */}
      <div className="mt-5 rounded-lg border border-brand-100 bg-brand-50/60 p-4 transition">
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            disabled={!insurable}
            checked={state.wantsInsurance}
            onChange={(event) => onPatch({ wantsInsurance: event.target.checked })}
            className={`mt-0.5 h-4 w-4 shrink-0 rounded border-brand-300 accent-brand-700 ${
              insurable ? "" : "opacity-60"
            }`}
          />
          <span>
            <span className={insurable ? "" : "opacity-60"}>
              <span className="block text-sm font-semibold text-brand-900">
                Add insurance cover
              </span>
              <span className="mt-0.5 block text-xs text-brand-500">
                Underwritten by the carrier, typically 1.5–3% of value.
              </span>
            </span>
            {!insurable ? (
              <span className="mt-0.5 block text-xs text-brand-500">
                Enter a declared value above to enable cover.
              </span>
            ) : null}
          </span>
        </label>
      </div>
    </div>
  );
}
