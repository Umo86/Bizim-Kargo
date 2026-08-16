"use client";

import { COUNTRIES, type CountryCode } from "@/lib/types";
import type { QuoteFormState } from "./draft";
import { inputClass, labelClass } from "./ui";

interface StepRouteProps {
  state: QuoteFormState;
  errors: Record<string, string>;
  onPatch: (patch: Partial<QuoteFormState>) => void;
  onSwap: () => void;
}

/** Step 1 — where from, where to. */
export default function StepRoute({ state, errors, onPatch, onSwap }: StepRouteProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:gap-4">
      <LegFields
        leg="pickup"
        country={state.pickupCountry}
        location={state.pickupLocation}
        error={errors.pickupLocation}
        onCountry={(country) => onPatch({ pickupCountry: country })}
        onLocation={(value) => onPatch({ pickupLocation: value })}
      />
      <div className="flex items-center justify-center sm:pt-8">
        <button
          type="button"
          onClick={onSwap}
          aria-label="Swap pickup and delivery"
          title="Swap direction"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-brand-200 bg-white text-brand-600 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-800"
        >
          <SwapIcon />
        </button>
      </div>
      <LegFields
        leg="delivery"
        country={state.deliveryCountry}
        location={state.deliveryLocation}
        error={errors.deliveryLocation}
        onCountry={(country) => onPatch({ deliveryCountry: country })}
        onLocation={(value) => onPatch({ deliveryLocation: value })}
      />
    </div>
  );
}

interface LegFieldsProps {
  leg: "pickup" | "delivery";
  country: CountryCode;
  location: string;
  error?: string;
  onCountry: (country: CountryCode) => void;
  onLocation: (value: string) => void;
}

function LegFields({ leg, country, location, error, onCountry, onLocation }: LegFieldsProps) {
  const isGb = country === "GB";
  const legLabel = leg === "pickup" ? "Pickup" : "Delivery";
  const selectId = `${leg}-country`;
  const inputId = `${leg}-location`;
  const errorId = `${leg}-location-error`;

  return (
    <div className="space-y-3">
      <div>
        <label htmlFor={selectId} className={labelClass}>
          {legLabel} country
        </label>
        <select
          id={selectId}
          value={country}
          onChange={(event) => onCountry(event.target.value as CountryCode)}
          className={`${inputClass} mt-1.5`}
        >
          {(Object.keys(COUNTRIES) as CountryCode[]).map((code) => (
            <option key={code} value={code}>
              {COUNTRIES[code].flag} {COUNTRIES[code].name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor={inputId} className={labelClass}>
          {isGb ? `${legLabel} postcode or town` : `${legLabel} city / district`}
        </label>
        <input
          id={inputId}
          type="text"
          value={location}
          onChange={(event) => onLocation(event.target.value)}
          placeholder={isGb ? "e.g. SW1A 1AA" : "e.g. İstanbul / Kadıköy"}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={`${inputClass} mt-1.5 ${error ? "border-red-300" : ""}`}
        />
        {error ? (
          <p id={errorId} className="mt-1 text-xs text-red-600">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function SwapIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="h-4 w-4 rotate-90 sm:rotate-0"
    >
      <path d="M4 7h13" />
      <path d="m14 3 4 4-4 4" />
      <path d="M20 17H7" />
      <path d="m10 21-4-4 4-4" />
    </svg>
  );
}
