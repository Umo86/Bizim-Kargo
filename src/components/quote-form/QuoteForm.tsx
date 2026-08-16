"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition, type FormEvent } from "react";
import { createQuoteAction } from "@/lib/actions";
import type { ShipmentRequest } from "@/lib/types";
import {
  clearDraft,
  emptyRow,
  loadDraft,
  makeRowId,
  PREFILL_EVENT,
  saveDraft,
  type DraftItem,
  type ItemRow,
  type QuoteDraft,
  type QuoteFormState,
} from "./draft";
import type { ItemPreset } from "./presets";
import StepDetails from "./StepDetails";
import StepItems from "./StepItems";
import StepRoute from "./StepRoute";

const STEP_LABELS = ["Route", "Items", "Details"] as const;

function initialState(): QuoteFormState {
  return {
    step: 0,
    serviceType: "parcel",
    pickupCountry: "GB",
    pickupLocation: "",
    deliveryCountry: "TR",
    deliveryLocation: "",
    items: [emptyRow()],
    vehicleDescription: "",
    readyDate: "",
    declaredValue: "",
    wantsInsurance: false,
  };
}

/** Apply a validated stored draft over the current state, re-keying rows. */
function stateFromDraft(base: QuoteFormState, draft: Partial<QuoteDraft>): QuoteFormState {
  const items: ItemRow[] =
    draft.items && draft.items.length > 0
      ? draft.items.map((item) => ({ ...item, id: makeRowId() }))
      : base.items;
  return { ...base, ...draft, items };
}

// ---------------------------------------------------------------------------
// Per-step validation (mirrors the server's rules so errors surface early)
// ---------------------------------------------------------------------------

function validateRoute(state: QuoteFormState): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!state.pickupLocation.trim()) {
    errors.pickupLocation =
      state.pickupCountry === "GB"
        ? "Please enter a pickup postcode or town."
        : "Please enter a pickup city or district.";
  }
  if (!state.deliveryLocation.trim()) {
    errors.deliveryLocation =
      state.deliveryCountry === "GB"
        ? "Please enter a delivery postcode or town."
        : "Please enter a delivery city or district.";
  }
  return errors;
}

function validateItems(state: QuoteFormState): Record<string, string> {
  const errors: Record<string, string> = {};
  if (state.serviceType === "vehicle") {
    if (!state.vehicleDescription.trim()) {
      errors.vehicleDescription =
        "Please describe the vehicle — make, model, and whether it runs and drives.";
    }
    return errors;
  }
  if (state.items.length === 0) {
    errors.items = "Please add at least one item.";
    return errors;
  }
  for (const row of state.items) {
    const quantity = Number(row.quantity.trim());
    const dims = [row.lengthCm, row.widthCm, row.heightCm, row.weightKg].map((v) => {
      const trimmed = v.trim();
      return trimmed === "" ? NaN : Number(trimmed);
    });
    const quantityOk =
      row.quantity.trim() !== "" && Number.isInteger(quantity) && quantity >= 1;
    const dimsOk = dims.every((n) => Number.isFinite(n) && n > 0);
    if (!quantityOk || !dimsOk) {
      errors[`item-${row.id}`] =
        "Please enter a whole-number quantity of at least 1, and dimensions and weight greater than zero.";
    }
  }
  return errors;
}

function validateDetails(state: QuoteFormState): Record<string, string> {
  const errors: Record<string, string> = {};
  if (state.declaredValue.trim() !== "") {
    const value = Number(state.declaredValue.trim());
    if (!Number.isFinite(value) || value < 0 || value > 1_000_000) {
      errors.declaredValue = "Please enter a value between £0 and £1,000,000.";
    }
  }
  return errors;
}

/** Assemble the exact ShipmentRequest shape the server action expects. */
function buildRequest(state: QuoteFormState): ShipmentRequest {
  const declared = Number(state.declaredValue.trim());
  const hasValue =
    state.declaredValue.trim() !== "" && Number.isFinite(declared) && declared > 0;
  return {
    serviceType: state.serviceType,
    pickup: {
      country: state.pickupCountry,
      postcodeOrCity: state.pickupLocation.trim(),
    },
    delivery: {
      country: state.deliveryCountry,
      postcodeOrCity: state.deliveryLocation.trim(),
    },
    items:
      state.serviceType === "vehicle"
        ? []
        : state.items.map((row) => ({
            quantity: Number(row.quantity.trim()),
            lengthCm: Number(row.lengthCm.trim()),
            widthCm: Number(row.widthCm.trim()),
            heightCm: Number(row.heightCm.trim()),
            weightKg: Number(row.weightKg.trim()),
          })),
    declaredValueGbp: hasValue ? declared : undefined,
    wantsInsurance: hasValue && state.wantsInsurance ? true : undefined,
    readyDate: state.readyDate || undefined,
    vehicleDescription:
      state.serviceType === "vehicle" ? state.vehicleDescription.trim() : undefined,
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function QuoteForm() {
  const router = useRouter();
  const [state, setState] = useState<QuoteFormState>(initialState);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Restore any saved draft once, after hydration (SSR markup is step 1).
  useEffect(() => {
    const draft = loadDraft();
    if (draft) setState((current) => stateFromDraft(current, draft));
    setHydrated(true);
  }, []);

  // Autosave every change — but never before the restore has run, so an
  // untouched mount cannot clobber a stored draft with the empty defaults.
  useEffect(() => {
    if (!hydrated) return;
    saveDraft(state);
  }, [state, hydrated]);

  // Popular-lane cards prefill the route by rewriting the stored draft and
  // dispatching this event; re-read it and jump back to step 1.
  useEffect(() => {
    const onPrefill = () => {
      const draft = loadDraft();
      if (draft) {
        setState((current) => stateFromDraft(current, draft));
        setErrors({});
        setSubmitError(null);
      }
    };
    window.addEventListener(PREFILL_EVENT, onPrefill);
    return () => window.removeEventListener(PREFILL_EVENT, onPrefill);
  }, []);

  /** Merge a patch into the state, clearing any errors on the patched keys. */
  const patch = (partial: Partial<QuoteFormState>) => {
    setState((current) => ({ ...current, ...partial }));
    setErrors((current) => {
      let changed = false;
      const next = { ...current };
      for (const key of Object.keys(partial)) {
        if (key in next) {
          delete next[key];
          changed = true;
        }
      }
      return changed ? next : current;
    });
  };

  const swapDirection = () => {
    setState((current) => ({
      ...current,
      pickupCountry: current.deliveryCountry,
      deliveryCountry: current.pickupCountry,
      pickupLocation: current.deliveryLocation,
      deliveryLocation: current.pickupLocation,
    }));
    setErrors({});
  };

  const updateItem = (id: string, field: keyof DraftItem, value: string) => {
    setState((current) => ({
      ...current,
      items: current.items.map((row) => (row.id === id ? { ...row, [field]: value } : row)),
    }));
    setErrors((current) => {
      if (!(`item-${id}` in current)) return current;
      const next = { ...current };
      delete next[`item-${id}`];
      return next;
    });
  };

  const addItem = () => {
    setState((current) => ({ ...current, items: [...current.items, emptyRow()] }));
    setErrors((current) => {
      if (!("items" in current)) return current;
      const next = { ...current };
      delete next.items;
      return next;
    });
  };

  const removeItem = (id: string) => {
    setState((current) => {
      const items = current.items.filter((row) => row.id !== id);
      return { ...current, items: items.length > 0 ? items : [emptyRow()] };
    });
    setErrors((current) => {
      if (!(`item-${id}` in current)) return current;
      const next = { ...current };
      delete next[`item-${id}`];
      return next;
    });
  };

  /** Presets fill the last row if it is still blank, otherwise append. */
  const applyPreset = (preset: ItemPreset) => {
    const last = state.items[state.items.length - 1];
    const lastBlank =
      !!last && !last.lengthCm && !last.widthCm && !last.heightCm && !last.weightKg;
    const filled: ItemRow = {
      id: lastBlank ? last.id : makeRowId(),
      quantity: "1",
      lengthCm: String(preset.lengthCm),
      widthCm: String(preset.widthCm),
      heightCm: String(preset.heightCm),
      weightKg: String(preset.weightKg),
    };
    const items = lastBlank
      ? [...state.items.slice(0, -1), filled]
      : [...state.items, filled];
    setState({ ...state, items });
    setErrors((current) => {
      const next = { ...current };
      delete next.items;
      delete next[`item-${filled.id}`];
      return next;
    });
  };

  const goToStep = (step: number) => {
    setState((current) => ({ ...current, step }));
    setErrors({});
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isPending) return;

    if (state.step === 0) {
      const stepErrors = validateRoute(state);
      setErrors(stepErrors);
      if (Object.keys(stepErrors).length === 0) goToStep(1);
      return;
    }
    if (state.step === 1) {
      const stepErrors = validateItems(state);
      setErrors(stepErrors);
      if (Object.keys(stepErrors).length === 0) goToStep(2);
      return;
    }

    const stepErrors = validateDetails(state);
    setErrors(stepErrors);
    if (Object.keys(stepErrors).length > 0) return;

    setSubmitError(null);
    const request = buildRequest(state);
    startTransition(async () => {
      try {
        const { quoteId } = await createQuoteAction(request);
        clearDraft();
        router.push(`/quote/${quoteId}`);
      } catch (error) {
        setSubmitError(
          error instanceof Error && error.message
            ? error.message
            : "Sorry — something went wrong. Please try again.",
        );
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <StepIndicator step={state.step} onStepSelect={goToStep} />

      <div className="mt-6">
        {state.step === 0 ? (
          <StepRoute state={state} errors={errors} onPatch={patch} onSwap={swapDirection} />
        ) : null}
        {state.step === 1 ? (
          <StepItems
            state={state}
            errors={errors}
            onPatch={patch}
            onUpdateItem={updateItem}
            onAddItem={addItem}
            onRemoveItem={removeItem}
            onPreset={applyPreset}
          />
        ) : null}
        {state.step === 2 ? (
          <StepDetails state={state} errors={errors} onPatch={patch} />
        ) : null}
      </div>

      {submitError && state.step === 2 ? (
        <div
          role="alert"
          className="mt-6 rounded-lg border border-accent-200 bg-accent-50 px-4 py-3 text-sm font-medium text-accent-800"
        >
          {submitError}
        </div>
      ) : null}

      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center">
        {state.step > 0 ? (
          <button
            type="button"
            onClick={() => goToStep(state.step - 1)}
            className="rounded-full border border-brand-200 px-6 py-3 text-sm font-semibold text-brand-800 transition hover:bg-brand-50"
          >
            Back
          </button>
        ) : null}
        {state.step < 2 ? (
          <button
            type="submit"
            className="rounded-full bg-cta px-6 py-3 text-sm font-semibold text-white transition hover:bg-cta-hover sm:ml-auto"
          >
            Continue
          </button>
        ) : (
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-cta px-6 py-3.5 text-base font-semibold text-white transition hover:bg-cta-hover disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isPending ? (
              <>
                <Spinner />
                Finding prices…
              </>
            ) : (
              <>Get my free quotes →</>
            )}
          </button>
        )}
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Bits
// ---------------------------------------------------------------------------

function StepIndicator({
  step,
  onStepSelect,
}: {
  step: number;
  onStepSelect: (step: number) => void;
}) {
  return (
    <ol className="flex items-center gap-1.5 sm:gap-2" aria-label="Quote progress">
      {STEP_LABELS.map((label, index) => {
        const done = index < step;
        const current = index === step;
        return (
          <li key={label} className="flex items-center gap-1.5 sm:gap-2">
            {index > 0 ? <span className="h-px w-4 bg-brand-200 sm:w-6" aria-hidden="true" /> : null}
            <button
              type="button"
              disabled={!done}
              onClick={() => onStepSelect(index)}
              aria-current={current ? "step" : undefined}
              className={`flex items-center gap-1.5 ${done ? "cursor-pointer" : "cursor-default"}`}
            >
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                  done
                    ? "bg-emerald-500 text-white"
                    : current
                      ? "bg-brand-900 text-white"
                      : "bg-brand-100 text-brand-500"
                }`}
              >
                {done ? <TickIcon /> : index + 1}
              </span>
              <span
                className={`text-xs font-semibold ${
                  done || current ? "text-brand-900" : "text-brand-400"
                }`}
              >
                {label}
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

function TickIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="h-3 w-3"
    >
      <path d="m3.5 8.5 3 3 6-6.5" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-4 w-4 animate-spin">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25" />
      <path
        d="M22 12a10 10 0 0 0-10-10"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}
