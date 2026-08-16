"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { formatKg, formatM3, formatMoney } from "@/lib/format";
import { isRejection, quoteService, resolveZone } from "@/lib/pricing";
import {
  COUNTRIES,
  DEFAULT_DIVISORS,
  SERVICE_TYPE_LABELS,
  type Carrier,
  type CarrierService,
  type CountryCode,
  type PricingUnit,
  type RateTier,
  type ServiceType,
  type ShipmentItem,
  type ShipmentRequest,
  type TransportMode,
  type ZoneCode,
  type ZoneSurcharge,
} from "@/lib/types";
import { TR_ZONES, UK_ZONES, ZONE_LABELS } from "@/lib/zones";

import { saveServiceAction, type SaveServicePayload } from "@/app/carrier/actions";
import DemoBanner from "./DemoBanner";
import {
  cardClass,
  errorAlertClass,
  inputClass,
  labelClass,
  primaryButtonClass,
  secondaryButtonClass,
  selectClass,
} from "./ui";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

type StepKey = "lane" | "charge" | "prices" | "extras" | "coverage";

const STEP_TITLES: Record<StepKey, string> = {
  lane: "Lane & service",
  charge: "How you charge",
  prices: "Prices",
  extras: "Extras",
  coverage: "Coverage & publish",
};

const SERVICE_TYPES = Object.keys(SERVICE_TYPE_LABELS) as ServiceType[];

const MODES: Array<{ value: TransportMode; label: string }> = [
  { value: "road", label: "Road" },
  { value: "air", label: "Air" },
  { value: "sea", label: "Sea" },
];

const MODE_LABELS: Record<TransportMode, string> = {
  road: "Road",
  air: "Air",
  sea: "Sea",
};

const DIVISOR_OPTIONS: Array<{ value: number; label: string }> = [
  { value: 3000, label: "3000 — road groupage (1 m³ counts as 333 kg)" },
  { value: 5000, label: "5000 — express courier / air parcels (1 m³ counts as 200 kg)" },
  { value: 6000, label: "6000 — IATA air freight (1 m³ counts as 167 kg)" },
  { value: 1000, label: "1000 — sea freight (1 m³ counts as 1,000 kg)" },
];

/** Short country names for service-name suggestions. */
const SHORT_NAMES: Record<CountryCode, string> = { GB: "UK", TR: "Turkey" };

const TYPE_NOUNS: Record<ServiceType, string> = {
  parcel: "parcel",
  pallet: "pallet",
  volume: "van load",
  vehicle: "vehicle transport",
};

/** Plural-ish noun for band phrasing ("up to 10 kg / m³ / pallets"). */
const UNIT_NOUNS: Record<PricingUnit, string> = {
  kg: "kg",
  cbm: "m³",
  pallet: "pallets",
};

/** Singular noun for rate phrasing ("£4.20 per kg / m³ / pallet"). */
const UNIT_SINGULAR: Record<PricingUnit, string> = {
  kg: "kg",
  cbm: "m³",
  pallet: "pallet",
};

function allowedUnits(serviceType: ServiceType): PricingUnit[] {
  switch (serviceType) {
    case "parcel":
      return ["kg"];
    case "volume":
      return ["cbm", "kg"];
    case "pallet":
      return ["pallet"];
    case "vehicle":
      return [];
  }
}

const UNIT_RADIO_LABELS: Record<PricingUnit, string> = {
  kg: "Per kg",
  cbm: "Per m³",
  pallet: "Per pallet",
};

// ---------------------------------------------------------------------------
// Wizard state
// ---------------------------------------------------------------------------

interface BandRow {
  rate: string;
  to: string;
}

interface ZoneRowState {
  served: boolean;
  flat: string;
}

interface WizardState {
  origin: CountryCode;
  destination: CountryCode;
  serviceType: ServiceType;
  mode: TransportMode;
  transitMin: string;
  transitMax: string;
  name: string;
  nameEdited: boolean;
  unit: PricingUnit;
  divisor: string;
  divisorEdited: boolean;
  minCharge: string;
  firstTo: string;
  firstPrice: string;
  bands: BandRow[];
  lastOpenEnded: boolean;
  fuelPct: string;
  customsFee: string;
  collectionFee: string;
  deliveryFee: string;
  residentialFee: string;
  insurancePct: string;
  insuranceMin: string;
  maxWeightKg: string;
  maxDimCm: string;
  /** Sparse per-zone overrides; unlisted lane zones default to served, £0. */
  zones: Partial<Record<ZoneCode, ZoneRowState>>;
}

function suggestedName(s: Pick<WizardState, "mode" | "serviceType" | "origin" | "destination">): string {
  return `${MODE_LABELS[s.mode]} ${TYPE_NOUNS[s.serviceType]} service ${SHORT_NAMES[s.origin]} → ${SHORT_NAMES[s.destination]}`;
}

const INITIAL_STATE: WizardState = {
  origin: "GB",
  destination: "TR",
  serviceType: "parcel",
  mode: "road",
  transitMin: "7",
  transitMax: "12",
  name: suggestedName({ mode: "road", serviceType: "parcel", origin: "GB", destination: "TR" }),
  nameEdited: false,
  unit: "kg",
  divisor: String(DEFAULT_DIVISORS.road),
  divisorEdited: false,
  minCharge: "",
  firstTo: "",
  firstPrice: "",
  bands: [],
  lastOpenEnded: true,
  fuelPct: "12",
  customsFee: "35",
  collectionFee: "0",
  deliveryFee: "0",
  residentialFee: "0",
  insurancePct: "2",
  insuranceMin: "10",
  maxWeightKg: "",
  maxDimCm: "",
  zones: {},
};

// ---------------------------------------------------------------------------
// Parsing + tariff building
// ---------------------------------------------------------------------------

/** Parse a text input to a finite number; null when empty or not numeric. */
function num(value: string): number | null {
  if (value.trim() === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function zonesForCountry(country: CountryCode): readonly ZoneCode[] {
  return country === "GB" ? UK_ZONES : TR_ZONES;
}

/** The lane's countries in display order (origin first, deduped). */
function laneCountries(s: WizardState): CountryCode[] {
  return s.origin === s.destination ? [s.origin] : [s.origin, s.destination];
}

function zoneState(s: WizardState, zone: ZoneCode): ZoneRowState {
  return s.zones[zone] ?? { served: true, flat: "0" };
}

/** Build the cumulative RateTier[] from the band inputs, or friendly errors. */
function buildTiers(s: WizardState): { tiers: RateTier[]; errors: string[] } {
  if (s.serviceType === "vehicle") return { tiers: [], errors: [] };

  const errors: string[] = [];
  const noun = UNIT_NOUNS[s.unit];
  const singular = UNIT_SINGULAR[s.unit];

  const firstTo = num(s.firstTo);
  const firstPrice = num(s.firstPrice);
  if (firstTo === null || firstTo <= 0) {
    errors.push(`Band 1: enter how many ${noun} the flat price covers.`);
  }
  if (firstPrice === null || firstPrice <= 0) {
    errors.push("Band 1: enter a price greater than £0.");
  }

  const tiers: RateTier[] = [
    {
      unit: s.unit,
      fromQty: 0,
      toQty: firstTo ?? 1,
      flatPrice: firstPrice ?? 1,
      pricePerUnit: null,
    },
  ];

  let previousCeiling = firstTo ?? 1;
  s.bands.forEach((band, index) => {
    const bandNo = index + 2;
    const rate = num(band.rate);
    if (rate === null || rate <= 0) {
      errors.push(`Band ${bandNo}: enter a per-${singular} rate greater than £0.`);
    }
    const isLast = index === s.bands.length - 1;
    let ceiling: number | null;
    if (isLast && s.lastOpenEnded) {
      ceiling = null;
    } else {
      const to = num(band.to);
      if (to === null || to <= previousCeiling) {
        errors.push(
          `Band ${bandNo}: the upper limit must be greater than ${previousCeiling} ${noun}.`,
        );
        ceiling = previousCeiling + 1;
      } else {
        ceiling = to;
      }
    }
    tiers.push({
      unit: s.unit,
      fromQty: previousCeiling,
      toQty: ceiling,
      flatPrice: null,
      pricePerUnit: rate ?? 1,
    });
    previousCeiling = ceiling ?? previousCeiling + 1;
  });

  return { tiers, errors };
}

function buildZonePayload(s: WizardState): ZoneSurcharge[] {
  const zones: ZoneSurcharge[] = [];
  for (const country of laneCountries(s)) {
    for (const zone of zonesForCountry(country)) {
      const row = zoneState(s, zone);
      zones.push({ zone, served: row.served, flat: num(row.flat) ?? 0 });
    }
  }
  return zones;
}

// ---------------------------------------------------------------------------
// Live preview via the real pricing engine
// ---------------------------------------------------------------------------

const PREVIEW_CARRIER: Carrier = {
  id: "preview-carrier",
  slug: "preview",
  companyName: "Preview",
  blurb: "",
  baseCountry: "GB",
  contactEmail: "",
  contactPhone: "",
  verified: false,
  rating: 0,
  reviewCount: 0,
  yearsOperating: null,
};

const PREVIEW_SAMPLES: Array<{ label: string; detail: string; item: ShipmentItem }> = [
  {
    label: "Small box, 5 kg",
    detail: "40 × 30 × 20 cm",
    item: { quantity: 1, lengthCm: 40, widthCm: 30, heightCm: 20, weightKg: 5 },
  },
  {
    label: "Suitcase, 25 kg",
    detail: "75 × 50 × 30 cm",
    item: { quantity: 1, lengthCm: 75, widthCm: 50, heightCm: 30, weightKg: 25 },
  },
  {
    label: "2 m³ load, 120 kg",
    detail: "200 × 100 × 100 cm",
    item: { quantity: 1, lengthCm: 200, widthCm: 100, heightCm: 100, weightKg: 120 },
  },
];

type PreviewOutcome =
  | { kind: "price"; total: number; basisNote: string }
  | { kind: "rejected"; detail: string };

interface Preview {
  errors: string[];
  outcomes: Array<{ label: string; detail: string; outcome: PreviewOutcome }>;
}

function previewAddress(country: CountryCode) {
  const postcodeOrCity = country === "GB" ? "N1 9GU" : "İstanbul";
  return { country, postcodeOrCity, zone: resolveZone(country, postcodeOrCity) };
}

function buildPreview(s: WizardState): Preview {
  const { tiers, errors } = buildTiers(s);
  const minCharge = num(s.minCharge);
  if (s.minCharge.trim() !== "" && (minCharge === null || minCharge < 0)) {
    errors.push("Enter a minimum charge of £0 or more.");
  }
  if (errors.length > 0) return { errors, outcomes: [] };

  const crossBorder = s.origin !== s.destination;
  const service: CarrierService = {
    id: "preview-service",
    carrierId: PREVIEW_CARRIER.id,
    serviceType: s.serviceType,
    origin: s.origin,
    destination: s.destination,
    mode: s.mode,
    name: s.name || "Preview service",
    transitDaysMin: num(s.transitMin) ?? 1,
    transitDaysMax: num(s.transitMax) ?? 1,
    currency: "GBP",
    volumetricDivisor: num(s.divisor) ?? DEFAULT_DIVISORS[s.mode],
    minCharge: minCharge ?? 0,
    fuelPct: (num(s.fuelPct) ?? 0) / 100,
    customsFee: crossBorder ? (num(s.customsFee) ?? 0) : 0,
    collectionFee: num(s.collectionFee) ?? 0,
    deliveryFee: num(s.deliveryFee) ?? 0,
    residentialFee: num(s.residentialFee) ?? 0,
    insurancePct: (num(s.insurancePct) ?? 0) / 100,
    insuranceMin: num(s.insuranceMin) ?? 0,
    maxWeightKg: num(s.maxWeightKg),
    maxDimCm: num(s.maxDimCm),
    active: true,
    tiers,
    zones: buildZonePayload(s),
  };

  const outcomes = PREVIEW_SAMPLES.map((sample) => {
    const request: ShipmentRequest = {
      serviceType: s.serviceType,
      pickup: previewAddress(s.origin),
      delivery: previewAddress(s.destination),
      items: [sample.item],
      wantsInsurance: false,
    };
    try {
      const outcome = quoteService(service, PREVIEW_CARRIER, request);
      if (isRejection(outcome)) {
        return { ...sample, outcome: { kind: "rejected", detail: outcome.detail } as PreviewOutcome };
      }
      let basisNote: string;
      switch (outcome.basis.unit) {
        case "kg":
          basisNote = `priced on ${formatKg(outcome.basis.quantity)}`;
          break;
        case "cbm":
          basisNote = `priced on ${formatM3(outcome.basis.quantity)}`;
          break;
        case "pallet":
          basisNote = `priced on ${outcome.basis.quantity} pallet${outcome.basis.quantity === 1 ? "" : "s"}`;
          break;
      }
      return {
        ...sample,
        outcome: { kind: "price", total: outcome.total, basisNote } as PreviewOutcome,
      };
    } catch (caught) {
      return {
        ...sample,
        outcome: {
          kind: "rejected",
          detail: caught instanceof Error ? caught.message : "Could not price this sample.",
        } as PreviewOutcome,
      };
    }
  });

  return { errors: [], outcomes };
}

// ---------------------------------------------------------------------------
// The wizard component
// ---------------------------------------------------------------------------

export default function RateWizard({ demo }: { demo: boolean }) {
  const router = useRouter();
  const [state, setState] = useState<WizardState>(INITIAL_STATE);
  const [stepIndex, setStepIndex] = useState(0);
  const [stepErrors, setStepErrors] = useState<string[]>([]);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);

  const stepKeys: StepKey[] =
    state.serviceType === "vehicle"
      ? ["lane", "extras", "coverage"]
      : ["lane", "charge", "prices", "extras", "coverage"];
  const stepKey = stepKeys[Math.min(stepIndex, stepKeys.length - 1)];
  const crossBorder = state.origin !== state.destination;

  const preview = useMemo(
    () => (state.serviceType === "vehicle" ? null : buildPreview(state)),
    [state],
  );

  function update(patch: Partial<WizardState>) {
    setState((current) => {
      const next = { ...current, ...patch };
      // Keep the suggested name and divisor in step with lane/mode choices
      // until the carrier edits them by hand.
      if (!next.nameEdited) next.name = suggestedName(next);
      if (!next.divisorEdited) next.divisor = String(DEFAULT_DIVISORS[next.mode]);
      // Service type locks the pricing unit to its sensible options.
      const units = allowedUnits(next.serviceType);
      if (units.length > 0 && !units.includes(next.unit)) next.unit = units[0];
      return next;
    });
  }

  function updateZone(zone: ZoneCode, patch: Partial<ZoneRowState>) {
    setState((current) => ({
      ...current,
      zones: {
        ...current.zones,
        [zone]: { ...zoneState(current, zone), ...patch },
      },
    }));
  }

  // -- Per-step validation ---------------------------------------------------

  function validateStep(key: StepKey): string[] {
    const errors: string[] = [];
    if (key === "lane") {
      const min = num(state.transitMin);
      const max = num(state.transitMax);
      if (min === null || !Number.isInteger(min) || min < 1) {
        errors.push("Enter a minimum transit time of at least 1 whole day.");
      }
      if (max === null || !Number.isInteger(max) || max < 1) {
        errors.push("Enter a maximum transit time of at least 1 whole day.");
      }
      if (min !== null && max !== null && max < min) {
        errors.push("The maximum transit time cannot be less than the minimum.");
      }
      if (state.name.trim().length === 0) {
        errors.push("Give your service a display name.");
      }
    }
    if (key === "prices") {
      const minCharge = num(state.minCharge);
      if (minCharge === null || minCharge < 0) {
        errors.push("Enter a minimum charge of £0 or more.");
      }
      errors.push(...buildTiers(state).errors);
    }
    if (key === "extras") {
      const checks: Array<[string, string, boolean]> = [
        [state.fuelPct, "fuel surcharge", true],
        [state.customsFee, "customs clearance fee", false],
        [state.collectionFee, "collection fee", false],
        [state.deliveryFee, "delivery fee", false],
        [state.residentialFee, "residential fee", false],
        [state.insurancePct, "insurance percentage", true],
        [state.insuranceMin, "minimum insurance premium", false],
      ];
      for (const [value, label, isPercent] of checks) {
        if (state.serviceType === "vehicle") break;
        const n = num(value);
        if (n === null || n < 0 || (isPercent && n > 100)) {
          errors.push(
            isPercent
              ? `Enter a ${label} between 0 and 100%.`
              : `Enter a ${label} of £0 or more.`,
          );
        }
      }
      for (const [value, label] of [
        [state.maxWeightKg, "maximum weight"],
        [state.maxDimCm, "maximum single dimension"],
      ] as Array<[string, string]>) {
        if (value.trim() !== "") {
          const n = num(value);
          if (n === null || n <= 0) {
            errors.push(`The ${label} must be a number greater than zero (or left blank).`);
          }
        }
      }
    }
    if (key === "coverage") {
      for (const country of laneCountries(state)) {
        if (!zonesForCountry(country).some((zone) => zoneState(state, zone).served)) {
          errors.push(`Serve at least one zone in ${COUNTRIES[country].name}.`);
        }
        for (const zone of zonesForCountry(country)) {
          const row = zoneState(state, zone);
          if (row.served && (num(row.flat) === null || (num(row.flat) as number) < 0)) {
            errors.push(`Enter a surcharge of £0 or more for ${ZONE_LABELS[zone]}.`);
          }
        }
      }
    }
    return errors;
  }

  function goNext() {
    const errors = validateStep(stepKey);
    setStepErrors(errors);
    if (errors.length === 0) setStepIndex((i) => Math.min(i + 1, stepKeys.length - 1));
  }

  function goBack() {
    setStepErrors([]);
    setPublishError(null);
    setStepIndex((i) => Math.max(i - 1, 0));
  }

  // -- Publish ---------------------------------------------------------------

  async function publish() {
    const errors = stepKeys.flatMap((key) => validateStep(key));
    setStepErrors(errors);
    if (errors.length > 0) return;

    const { tiers } = buildTiers(state);
    const payload: SaveServicePayload = {
      serviceType: state.serviceType,
      origin: state.origin,
      destination: state.destination,
      mode: state.mode,
      name: state.name.trim(),
      transitDaysMin: num(state.transitMin) ?? 1,
      transitDaysMax: num(state.transitMax) ?? 1,
      volumetricDivisor: num(state.divisor) ?? DEFAULT_DIVISORS[state.mode],
      minCharge: state.serviceType === "vehicle" ? 0 : (num(state.minCharge) ?? 0),
      fuelPct: (num(state.fuelPct) ?? 0) / 100,
      customsFee: crossBorder ? (num(state.customsFee) ?? 0) : 0,
      collectionFee: num(state.collectionFee) ?? 0,
      deliveryFee: num(state.deliveryFee) ?? 0,
      residentialFee: num(state.residentialFee) ?? 0,
      insurancePct: (num(state.insurancePct) ?? 0) / 100,
      insuranceMin: num(state.insuranceMin) ?? 0,
      maxWeightKg: num(state.maxWeightKg),
      maxDimCm: num(state.maxDimCm),
      tiers,
      zones: buildZonePayload(state),
    };

    setPublishing(true);
    setPublishError(null);
    try {
      await saveServiceAction(payload);
      router.push("/carrier/rates");
      router.refresh();
    } catch (caught) {
      setPublishError(
        caught instanceof Error
          ? caught.message
          : "Could not publish your rates. Please try again.",
      );
      setPublishing(false);
    }
  }

  // -- Render ----------------------------------------------------------------

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div>
        <ol className="flex items-center gap-2 sm:gap-3">
          {stepKeys.map((key, index) => {
            const done = index < stepIndex;
            const current = index === stepIndex;
            return (
              <li key={key} className="flex min-w-0 items-center gap-2">
                <span
                  aria-hidden="true"
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    done
                      ? "bg-emerald-100 text-emerald-700"
                      : current
                        ? "bg-brand-800 text-white"
                        : "bg-brand-100 text-brand-500"
                  }`}
                >
                  {done ? (
                    <svg width="12" height="12" viewBox="0 0 12 12">
                      <path
                        d="m2.5 6.5 2.5 2.5 4.5-5.5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </span>
                <span
                  className={`hidden truncate text-xs font-medium sm:block ${
                    current ? "text-brand-900" : "text-brand-500"
                  }`}
                >
                  {STEP_TITLES[key]}
                </span>
              </li>
            );
          })}
        </ol>
        <p className="mt-2 text-xs font-medium text-brand-600 sm:hidden">
          Step {stepIndex + 1} of {stepKeys.length}: {STEP_TITLES[stepKey]}
        </p>
        <div className="mt-3 h-1 overflow-hidden rounded-full bg-brand-100">
          <div
            className="h-full rounded-full bg-accent-500 transition-all"
            style={{ width: `${((stepIndex + 1) / stepKeys.length) * 100}%` }}
          />
        </div>
      </div>

      {stepErrors.length > 0 ? (
        <div role="alert" className={errorAlertClass}>
          <p className="font-semibold">Please fix the following:</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-5">
            {stepErrors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className={`${cardClass} p-6 sm:p-8`}>
        {stepKey === "lane" ? <StepLane state={state} update={update} /> : null}
        {stepKey === "charge" ? <StepCharge state={state} update={update} /> : null}
        {stepKey === "prices" ? (
          <StepPrices state={state} update={update} preview={preview} />
        ) : null}
        {stepKey === "extras" ? (
          <StepExtras state={state} update={update} crossBorder={crossBorder} />
        ) : null}
        {stepKey === "coverage" ? (
          <StepCoverage
            state={state}
            updateZone={updateZone}
            preview={preview}
            demo={demo}
            publishing={publishing}
            publishError={publishError}
            onPublish={publish}
          />
        ) : null}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        {stepIndex > 0 ? (
          <button type="button" onClick={goBack} className={secondaryButtonClass}>
            ← Back
          </button>
        ) : (
          <Link href="/carrier/rates" className={secondaryButtonClass}>
            Cancel
          </Link>
        )}
        {stepKey !== "coverage" ? (
          <button type="button" onClick={goNext} className={primaryButtonClass}>
            Continue →
          </button>
        ) : null}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 1 — Lane & service
// ---------------------------------------------------------------------------

interface StepProps {
  state: WizardState;
  update: (patch: Partial<WizardState>) => void;
}

function StepLane({ state, update }: StepProps) {
  return (
    <div className="space-y-6">
      <StepHeading
        title="Where does this service run?"
        sub="One rate card covers one lane and one kind of shipment."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="rw-origin" className={labelClass}>
            Origin country
          </label>
          <select
            id="rw-origin"
            value={state.origin}
            onChange={(event) => update({ origin: event.target.value as CountryCode })}
            className={selectClass}
          >
            {(Object.keys(COUNTRIES) as CountryCode[]).map((code) => (
              <option key={code} value={code}>
                {COUNTRIES[code].flag} {COUNTRIES[code].name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="rw-destination" className={labelClass}>
            Destination country
          </label>
          <select
            id="rw-destination"
            value={state.destination}
            onChange={(event) => update({ destination: event.target.value as CountryCode })}
            className={selectClass}
          >
            {(Object.keys(COUNTRIES) as CountryCode[]).map((code) => (
              <option key={code} value={code}>
                {COUNTRIES[code].flag} {COUNTRIES[code].name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <span className={labelClass}>What do you carry on it?</span>
        <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Service type">
          {SERVICE_TYPES.map((type) => {
            const active = state.serviceType === type;
            return (
              <button
                key={type}
                type="button"
                onClick={() => update({ serviceType: type })}
                aria-pressed={active}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                  active
                    ? "border-brand-800 bg-brand-800 text-white"
                    : "border-brand-200 bg-white text-brand-700 hover:bg-brand-50"
                }`}
              >
                {SERVICE_TYPE_LABELS[type]}
              </button>
            );
          })}
        </div>
        {state.serviceType === "vehicle" ? (
          <p className="mt-2 text-xs text-brand-500">
            Vehicle transport is priced on request — customers send you the
            details and you reply with a personal quote, so the pricing steps
            are skipped.
          </p>
        ) : null}
      </div>

      <div>
        <span className={labelClass}>Transport mode</span>
        <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Transport mode">
          {MODES.map(({ value, label }) => {
            const active = state.mode === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => update({ mode: value })}
                aria-pressed={active}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                  active
                    ? "border-brand-800 bg-brand-800 text-white"
                    : "border-brand-200 bg-white text-brand-700 hover:bg-brand-50"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="rw-transit-min" className={labelClass}>
            Transit time, from (days)
          </label>
          <input
            id="rw-transit-min"
            type="number"
            min={1}
            inputMode="numeric"
            value={state.transitMin}
            onChange={(event) => update({ transitMin: event.target.value })}
            className={`${inputClass} no-spinner`}
            placeholder="e.g. 7"
          />
        </div>
        <div>
          <label htmlFor="rw-transit-max" className={labelClass}>
            Transit time, to (days)
          </label>
          <input
            id="rw-transit-max"
            type="number"
            min={1}
            inputMode="numeric"
            value={state.transitMax}
            onChange={(event) => update({ transitMax: event.target.value })}
            className={`${inputClass} no-spinner`}
            placeholder="e.g. 12"
          />
        </div>
      </div>

      <div>
        <label htmlFor="rw-name" className={labelClass}>
          Service display name
        </label>
        <input
          id="rw-name"
          type="text"
          value={state.name}
          onChange={(event) => update({ name: event.target.value, nameEdited: true })}
          className={inputClass}
          maxLength={120}
        />
        <p className="mt-1 text-xs text-brand-500">
          Shown to customers on their quote results. We keep it updated with
          your choices until you edit it.
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 2 — How you charge
// ---------------------------------------------------------------------------

function StepCharge({ state, update }: StepProps) {
  const units = allowedUnits(state.serviceType);

  return (
    <div className="space-y-6">
      <StepHeading
        title="How do you charge?"
        sub="This decides what your price bands apply to."
      />

      <div>
        <span className={labelClass}>Pricing unit</span>
        <div className="mt-2 space-y-2" role="radiogroup" aria-label="Pricing unit">
          {(["kg", "cbm", "pallet"] as PricingUnit[]).map((unit) => {
            const allowed = units.includes(unit);
            const active = state.unit === unit;
            return (
              <label
                key={unit}
                className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm ${
                  active
                    ? "border-brand-500 bg-brand-50"
                    : allowed
                      ? "border-brand-200 bg-white hover:bg-brand-50"
                      : "cursor-not-allowed border-brand-100 bg-brand-50/50 text-brand-300"
                }`}
              >
                <input
                  type="radio"
                  name="pricing-unit"
                  value={unit}
                  checked={active}
                  disabled={!allowed}
                  onChange={() => update({ unit })}
                  className="accent-brand-700"
                />
                <span className={active ? "font-semibold text-brand-900" : allowed ? "text-brand-800" : ""}>
                  {UNIT_RADIO_LABELS[unit]}
                </span>
                {!allowed ? (
                  <span className="ml-auto text-xs">
                    Not used for {SERVICE_TYPE_LABELS[state.serviceType].toLowerCase()}
                  </span>
                ) : null}
              </label>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-brand-500">
          {state.serviceType === "parcel"
            ? "Parcels are charged by weight, so the unit is locked to kg."
            : state.serviceType === "pallet"
              ? "Pallet services charge per pallet position, so the unit is locked."
              : "Van loads are usually charged by volume; switch to kg if you weigh instead."}
        </p>
      </div>

      {state.unit === "kg" ? (
        <div>
          <label htmlFor="rw-divisor" className={labelClass}>
            Volumetric divisor
          </label>
          <select
            id="rw-divisor"
            value={state.divisor}
            onChange={(event) => update({ divisor: event.target.value, divisorEdited: true })}
            className={selectClass}
          >
            {DIVISOR_OPTIONS.map((option) => (
              <option key={option.value} value={String(option.value)}>
                {option.label}
              </option>
            ))}
          </select>
          <p className="mt-1.5 text-xs leading-relaxed text-brand-500">
            Couriers charge bulky-but-light items by size, not weight. Divisor
            3000 (road) means 1 m³ counts as 333 kg — whichever of actual and
            volumetric weight is higher is what gets priced. We preset it from
            your transport mode.
          </p>
        </div>
      ) : state.unit === "cbm" ? (
        <p className="rounded-xl bg-brand-50 px-4 py-3 text-sm leading-relaxed text-brand-700">
          Volume pricing charges on cubic metres. Heavy-but-small loads are
          protected by the weight-or-measure rule: every 333 kg counts as at
          least 1 m³.
        </p>
      ) : (
        <p className="rounded-xl bg-brand-50 px-4 py-3 text-sm leading-relaxed text-brand-700">
          Pallet pricing charges per pallet position, regardless of the exact
          weight on each pallet (up to your limits).
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 3 — Prices (band builder + live preview)
// ---------------------------------------------------------------------------

function StepPrices({
  state,
  update,
  preview,
}: StepProps & { preview: Preview | null }) {
  const noun = UNIT_NOUNS[state.unit];
  const singular = UNIT_SINGULAR[state.unit];

  function updateBand(index: number, patch: Partial<BandRow>) {
    update({
      bands: state.bands.map((band, i) => (i === index ? { ...band, ...patch } : band)),
    });
  }

  return (
    <div className="space-y-6">
      <StepHeading
        title="Your prices"
        sub={`Build your tariff in bands — the price of a shipment is the sum of every band it passes through.`}
      />

      <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-5">
          <div>
            <label htmlFor="rw-min-charge" className={labelClass}>
              Minimum charge (£)
            </label>
            <input
              id="rw-min-charge"
              type="number"
              min={0}
              step="0.01"
              inputMode="decimal"
              value={state.minCharge}
              onChange={(event) => update({ minCharge: event.target.value })}
              className={`${inputClass} no-spinner max-w-40`}
              placeholder="e.g. 45"
            />
            <p className="mt-1 text-xs text-brand-500">
              No shipment is ever priced below this, whatever the bands say.
            </p>
          </div>

          {/* Band 1 — flat */}
          <div className="rounded-xl border border-brand-200 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-500">
              Band 1 · flat price
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-brand-800">
              <span>Up to</span>
              <input
                type="number"
                min={0}
                step="0.01"
                inputMode="decimal"
                aria-label={`Band 1 upper limit in ${noun}`}
                value={state.firstTo}
                onChange={(event) => update({ firstTo: event.target.value })}
                className={`${inputClass} no-spinner mt-0 w-24`}
                placeholder="10"
              />
              <span>{noun} costs £</span>
              <input
                type="number"
                min={0}
                step="0.01"
                inputMode="decimal"
                aria-label="Band 1 flat price in pounds"
                value={state.firstPrice}
                onChange={(event) => update({ firstPrice: event.target.value })}
                className={`${inputClass} no-spinner mt-0 w-24`}
                placeholder="72"
              />
            </div>
          </div>

          {/* Bands 2+ — per unit */}
          {state.bands.map((band, index) => {
            const isLast = index === state.bands.length - 1;
            const openEnded = isLast && state.lastOpenEnded;
            return (
              <div key={index} className="rounded-xl border border-brand-200 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wide text-brand-500">
                    Band {index + 2} · per {singular}
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      update({ bands: state.bands.filter((_, i) => i !== index) })
                    }
                    className="text-xs font-semibold text-accent-600 hover:text-accent-700"
                  >
                    Remove
                  </button>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-brand-800">
                  <span>then £</span>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    inputMode="decimal"
                    aria-label={`Band ${index + 2} rate per ${singular}`}
                    value={band.rate}
                    onChange={(event) => updateBand(index, { rate: event.target.value })}
                    className={`${inputClass} no-spinner mt-0 w-24`}
                    placeholder="5.60"
                  />
                  <span>per {singular} up to</span>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    inputMode="decimal"
                    aria-label={`Band ${index + 2} upper limit in ${noun}`}
                    value={openEnded ? "" : band.to}
                    disabled={openEnded}
                    onChange={(event) => updateBand(index, { to: event.target.value })}
                    className={`${inputClass} no-spinner mt-0 w-24`}
                    placeholder={openEnded ? "∞" : "30"}
                  />
                  <span>{noun}</span>
                </div>
                {isLast ? (
                  <label className="mt-3 flex items-center gap-2 text-sm text-brand-700">
                    <input
                      type="checkbox"
                      checked={state.lastOpenEnded}
                      onChange={(event) => update({ lastOpenEnded: event.target.checked })}
                      className="accent-brand-700"
                    />
                    No upper limit — this band covers everything above{" "}
                    {index === 0 ? state.firstTo || "…" : state.bands[index - 1]?.to || "…"} {noun}
                  </label>
                ) : null}
              </div>
            );
          })}

          {state.bands.length < 3 ? (
            <button
              type="button"
              onClick={() => update({ bands: [...state.bands, { rate: "", to: "" }] })}
              className={`${secondaryButtonClass} px-4 py-2`}
            >
              + Add another band
            </button>
          ) : (
            <p className="text-xs text-brand-500">A tariff can have up to four bands.</p>
          )}
        </div>

        {/* Live preview */}
        <PreviewPanel preview={preview} />
      </div>
    </div>
  );
}

function PreviewPanel({ preview }: { preview: Preview | null }) {
  if (!preview) return null;
  return (
    <aside
      aria-label="Live price preview"
      className="h-fit rounded-2xl border border-brand-100 bg-brand-50/60 p-5 lg:sticky lg:top-24"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
        Live preview
      </p>
      <p className="mt-1 text-xs leading-relaxed text-brand-500">
        What three typical shipments would pay on this tariff, priced by the
        same engine customers see.
      </p>
      {preview.errors.length > 0 ? (
        <p className="mt-4 rounded-lg border border-dashed border-brand-200 bg-white px-3 py-4 text-center text-xs text-brand-500">
          Finish your bands to see live prices.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {preview.outcomes.map((sample) => (
            <li key={sample.label} className="rounded-xl bg-white p-3.5 shadow-sm">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-sm font-semibold text-brand-900">{sample.label}</p>
                {sample.outcome.kind === "price" ? (
                  <p className="text-sm font-bold text-brand-900">
                    {formatMoney(sample.outcome.total)}
                  </p>
                ) : null}
              </div>
              <p className="text-xs text-brand-500">{sample.detail}</p>
              {sample.outcome.kind === "price" ? (
                <p className="mt-1 text-xs text-brand-500">{sample.outcome.basisNote}</p>
              ) : (
                <p className="mt-1 text-xs font-medium text-amber-700">
                  Would not quote: {sample.outcome.detail}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}

// ---------------------------------------------------------------------------
// Step 4 — Extras
// ---------------------------------------------------------------------------

function StepExtras({
  state,
  update,
  crossBorder,
}: StepProps & { crossBorder: boolean }) {
  const vehicle = state.serviceType === "vehicle";

  return (
    <div className="space-y-6">
      <StepHeading
        title="Surcharges & limits"
        sub={
          vehicle
            ? "Vehicle transport is priced by hand, so only your physical limits apply here."
            : "Everything beyond base freight. Sensible defaults are filled in — adjust to taste."
        }
      />

      {!vehicle ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <ExtraField
            id="rw-fuel"
            label="Fuel surcharge (%)"
            value={state.fuelPct}
            onChange={(value) => update({ fuelPct: value })}
            hint="Charged on base freight only, never on fees."
          />
          {crossBorder ? (
            <ExtraField
              id="rw-customs"
              label="Customs clearance (£)"
              value={state.customsFee}
              onChange={(value) => update({ customsFee: value })}
              hint="Flat fee for export and import clearance."
            />
          ) : null}
          <ExtraField
            id="rw-collection"
            label="Collection fee (£)"
            value={state.collectionFee}
            onChange={(value) => update({ collectionFee: value })}
            hint="£0 if collection is included in your rates."
          />
          <ExtraField
            id="rw-delivery"
            label="Delivery fee (£)"
            value={state.deliveryFee}
            onChange={(value) => update({ deliveryFee: value })}
            hint="£0 if delivery is included in your rates."
          />
          <ExtraField
            id="rw-residential"
            label="Residential surcharge (£)"
            value={state.residentialFee}
            onChange={(value) => update({ residentialFee: value })}
            hint="Added for door-to-door residential addresses."
          />
          <ExtraField
            id="rw-insurance-pct"
            label="Insurance (% of declared value)"
            value={state.insurancePct}
            onChange={(value) => update({ insurancePct: value })}
            hint="Only charged when the customer opts in."
          />
          <ExtraField
            id="rw-insurance-min"
            label="Minimum insurance premium (£)"
            value={state.insuranceMin}
            onChange={(value) => update({ insuranceMin: value })}
            hint="The premium never falls below this."
          />
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <ExtraField
          id="rw-max-weight"
          label="Maximum weight (kg)"
          value={state.maxWeightKg}
          onChange={(value) => update({ maxWeightKg: value })}
          hint="Leave blank for no limit. Heavier requests are not quoted."
          placeholder="No limit"
        />
        <ExtraField
          id="rw-max-dim"
          label="Maximum single dimension (cm)"
          value={state.maxDimCm}
          onChange={(value) => update({ maxDimCm: value })}
          hint="Leave blank for no limit. Longer items are not quoted."
          placeholder="No limit"
        />
      </div>
    </div>
  );
}

function ExtraField({
  id,
  label,
  value,
  onChange,
  hint,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <input
        id={id}
        type="number"
        min={0}
        step="0.01"
        inputMode="decimal"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`${inputClass} no-spinner`}
        placeholder={placeholder}
      />
      <p className="mt-1 text-xs text-brand-500">{hint}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 5 — Coverage, review & publish
// ---------------------------------------------------------------------------

function StepCoverage({
  state,
  updateZone,
  preview,
  demo,
  publishing,
  publishError,
  onPublish,
}: {
  state: WizardState;
  updateZone: (zone: ZoneCode, patch: Partial<ZoneRowState>) => void;
  preview: Preview | null;
  demo: boolean;
  publishing: boolean;
  publishError: string | null;
  onPublish: () => void;
}) {
  const { tiers } = buildTiers(state);
  const noun = UNIT_NOUNS[state.unit];
  const singular = UNIT_SINGULAR[state.unit];

  return (
    <div className="space-y-8">
      <StepHeading
        title="Where do you deliver?"
        sub="Every zone starts as served with no surcharge — switch off the ones you skip, and add surcharges for the awkward ones."
      />

      <div className="space-y-6">
        {laneCountries(state).map((country) => (
          <div key={country}>
            <p className="text-sm font-bold text-brand-900">
              {COUNTRIES[country].flag} {COUNTRIES[country].name}
            </p>
            <ul className="mt-2 divide-y divide-brand-100 rounded-xl border border-brand-100">
              {zonesForCountry(country).map((zone) => {
                const row = zoneState(state, zone);
                return (
                  <li
                    key={zone}
                    className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3"
                  >
                    <button
                      type="button"
                      role="switch"
                      aria-checked={row.served}
                      aria-label={`Serve ${ZONE_LABELS[zone]}`}
                      onClick={() => updateZone(zone, { served: !row.served })}
                      className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                        row.served ? "bg-emerald-500" : "bg-brand-200"
                      }`}
                    >
                      <span
                        className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                          row.served ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                    <span
                      className={`min-w-0 flex-1 text-sm ${
                        row.served ? "font-medium text-brand-900" : "text-brand-400 line-through"
                      }`}
                    >
                      {ZONE_LABELS[zone]}
                    </span>
                    <span className="flex items-center gap-1.5 text-sm text-brand-600">
                      <span className="text-xs">Surcharge £</span>
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        inputMode="decimal"
                        aria-label={`Surcharge for ${ZONE_LABELS[zone]} in pounds`}
                        value={row.flat}
                        disabled={!row.served}
                        onChange={(event) => updateZone(zone, { flat: event.target.value })}
                        className={`${inputClass} no-spinner mt-0 w-20 px-2 py-1.5`}
                      />
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      {/* Review summary */}
      <div className="rounded-2xl border border-brand-100 bg-brand-50/60 p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
          Review
        </p>
        <dl className="mt-3 grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
          <ReviewRow label="Service">{state.name || "—"}</ReviewRow>
          <ReviewRow label="Lane">
            {COUNTRIES[state.origin].flag} {SHORT_NAMES[state.origin]} →{" "}
            {COUNTRIES[state.destination].flag} {SHORT_NAMES[state.destination]}
          </ReviewRow>
          <ReviewRow label="Type & mode">
            {SERVICE_TYPE_LABELS[state.serviceType]} · {MODE_LABELS[state.mode]} ·{" "}
            {state.transitMin || "?"}–{state.transitMax || "?"} days
          </ReviewRow>
          {state.serviceType === "vehicle" ? (
            <ReviewRow label="Pricing">Price on request (manual quotes)</ReviewRow>
          ) : (
            <>
              <ReviewRow label="Minimum charge">
                {formatMoney(num(state.minCharge) ?? 0)}
              </ReviewRow>
              <ReviewRow label="Tariff">
                {tiers.length > 0 ? (
                  <>
                    Up to {state.firstTo || "?"} {noun} for{" "}
                    {formatMoney(num(state.firstPrice) ?? 0)}
                    {state.bands.length > 0
                      ? `, then ${state.bands.length} per-${singular} band${state.bands.length === 1 ? "" : "s"}`
                      : ""}
                  </>
                ) : (
                  "—"
                )}
              </ReviewRow>
              <ReviewRow label="Fuel & customs">
                {state.fuelPct || "0"}% fuel
                {state.origin !== state.destination
                  ? ` · ${formatMoney(num(state.customsFee) ?? 0)} customs`
                  : ""}
              </ReviewRow>
            </>
          )}
          <ReviewRow label="Coverage">
            {laneCountries(state)
              .map((country) => {
                const served = zonesForCountry(country).filter(
                  (zone) => zoneState(state, zone).served,
                ).length;
                return `${served}/${zonesForCountry(country).length} ${SHORT_NAMES[country]} zones`;
              })
              .join(" · ")}
          </ReviewRow>
        </dl>

        {preview && preview.errors.length === 0 && preview.outcomes.length > 0 ? (
          <div className="mt-4 border-t border-brand-100 pt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
              Sample prices
            </p>
            <ul className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm text-brand-800">
              {preview.outcomes.map((sample) => (
                <li key={sample.label}>
                  {sample.label}:{" "}
                  {sample.outcome.kind === "price" ? (
                    <span className="font-semibold">{formatMoney(sample.outcome.total)}</span>
                  ) : (
                    <span className="text-amber-700">not quoted</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      {publishError ? (
        <div role="alert" className={errorAlertClass}>
          {publishError}
        </div>
      ) : null}

      {demo ? (
        <DemoBanner note="Publishing is disabled, but everything above — including the live preview — works exactly as it would for a real account." />
      ) : null}

      <button
        type="button"
        onClick={onPublish}
        disabled={demo || publishing}
        className={`${primaryButtonClass} w-full sm:w-auto`}
      >
        {publishing ? "Publishing…" : "Publish rates"}
      </button>
    </div>
  );
}

function ReviewRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col">
      <dt className="text-xs font-semibold uppercase tracking-wide text-brand-500">
        {label}
      </dt>
      <dd className="mt-0.5 text-brand-900">{children}</dd>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared bits
// ---------------------------------------------------------------------------

function StepHeading({ title, sub }: { title: string; sub: string }) {
  return (
    <div>
      <h2 className="text-lg font-bold tracking-tight text-brand-900">{title}</h2>
      <p className="mt-1 text-sm leading-relaxed text-brand-600">{sub}</p>
    </div>
  );
}
