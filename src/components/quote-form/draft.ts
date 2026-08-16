/**
 * Quote-form draft persistence + cross-component prefill.
 *
 * The form autosaves to localStorage under DRAFT_STORAGE_KEY so a visitor who
 * navigates away (or reloads) never loses their half-filled quote. Other
 * components (e.g. the Popular Lanes cards) prefill the route by writing the
 * draft and dispatching PREFILL_EVENT, which the mounted form listens for.
 *
 * Everything read back from storage is treated as untrusted: fields are
 * validated individually and anything malformed is simply dropped.
 */

import {
  COUNTRIES,
  SERVICE_TYPE_LABELS,
  type CountryCode,
  type ServiceType,
} from "@/lib/types";

export const DRAFT_STORAGE_KEY = "bk-quote-draft";
export const PREFILL_EVENT = "bk-prefill";

/** One item row as persisted — raw input strings, exactly as typed. */
export interface DraftItem {
  quantity: string;
  lengthCm: string;
  widthCm: string;
  heightCm: string;
  weightKg: string;
}

/** The full persisted draft (also the wire shape of the in-memory state). */
export interface QuoteDraft {
  step: number;
  serviceType: ServiceType;
  pickupCountry: CountryCode;
  pickupLocation: string;
  deliveryCountry: CountryCode;
  deliveryLocation: string;
  items: DraftItem[];
  vehicleDescription: string;
  readyDate: string;
  declaredValue: string;
  wantsInsurance: boolean;
}

/** In-memory item row: a draft item plus a stable id for React keys. */
export interface ItemRow extends DraftItem {
  id: string;
}

/** In-memory form state: the draft with keyed item rows. */
export interface QuoteFormState extends Omit<QuoteDraft, "items"> {
  items: ItemRow[];
}

let rowIdCounter = 0;

/** Stable, unique-per-session id for an item row (React list key). */
export function makeRowId(): string {
  rowIdCounter += 1;
  return `item-row-${rowIdCounter}`;
}

export function emptyRow(): ItemRow {
  return { id: makeRowId(), quantity: "1", lengthCm: "", widthCm: "", heightCm: "", weightKg: "" };
}

function isCountry(value: unknown): value is CountryCode {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(COUNTRIES, value);
}

function isServiceType(value: unknown): value is ServiceType {
  return (
    typeof value === "string" &&
    Object.prototype.hasOwnProperty.call(SERVICE_TYPE_LABELS, value)
  );
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

/**
 * Load and validate the stored draft. Returns only the fields that survived
 * validation (a partial), or null when nothing usable is stored.
 */
export function loadDraft(): Partial<QuoteDraft> | null {
  if (typeof window === "undefined") return null;
  let raw: string | null;
  try {
    raw = window.localStorage.getItem(DRAFT_STORAGE_KEY);
  } catch {
    return null; // storage blocked (private mode / permissions)
  }
  if (!raw) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== "object") return null;
  const data = parsed as Record<string, unknown>;

  const draft: Partial<QuoteDraft> = {};
  if (
    typeof data.step === "number" &&
    Number.isInteger(data.step) &&
    data.step >= 0 &&
    data.step <= 2
  ) {
    draft.step = data.step;
  }
  if (isServiceType(data.serviceType)) draft.serviceType = data.serviceType;
  if (isCountry(data.pickupCountry)) draft.pickupCountry = data.pickupCountry;
  if (isCountry(data.deliveryCountry)) draft.deliveryCountry = data.deliveryCountry;
  if (typeof data.pickupLocation === "string") draft.pickupLocation = data.pickupLocation;
  if (typeof data.deliveryLocation === "string") draft.deliveryLocation = data.deliveryLocation;
  if (typeof data.vehicleDescription === "string") {
    draft.vehicleDescription = data.vehicleDescription;
  }
  if (typeof data.readyDate === "string") draft.readyDate = data.readyDate;
  if (typeof data.declaredValue === "string") draft.declaredValue = data.declaredValue;
  if (typeof data.wantsInsurance === "boolean") draft.wantsInsurance = data.wantsInsurance;

  if (Array.isArray(data.items)) {
    const items: DraftItem[] = data.items
      .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
      .slice(0, 50)
      .map((item) => ({
        quantity: asString(item.quantity),
        lengthCm: asString(item.lengthCm),
        widthCm: asString(item.widthCm),
        heightCm: asString(item.heightCm),
        weightKg: asString(item.weightKg),
      }));
    if (items.length > 0) draft.items = items;
  }

  return draft;
}

/** Persist the draft. Extra properties (row ids) are harmless in storage. */
export function saveDraft(draft: QuoteDraft): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
  } catch {
    // Storage full or blocked — autosave is best-effort.
  }
}

export function clearDraft(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(DRAFT_STORAGE_KEY);
  } catch {
    // ignore
  }
}

export interface RoutePrefill {
  pickupCountry: CountryCode;
  pickupLocation: string;
  deliveryCountry: CountryCode;
  deliveryLocation: string;
}

/**
 * Merge a route into the stored draft (back on step 1 so the visitor sees it),
 * then notify any mounted quote form to re-read the draft.
 */
export function prefillRoute(route: RoutePrefill): void {
  if (typeof window === "undefined") return;
  let existing: Record<string, unknown> = {};
  try {
    const raw = window.localStorage.getItem(DRAFT_STORAGE_KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        existing = parsed as Record<string, unknown>;
      }
    }
  } catch {
    // Corrupt or blocked draft — start from the route alone.
  }
  try {
    window.localStorage.setItem(
      DRAFT_STORAGE_KEY,
      JSON.stringify({ ...existing, ...route, step: 0 }),
    );
  } catch {
    return; // storage blocked — nothing to prefill from
  }
  window.dispatchEvent(new Event(PREFILL_EVENT));
}
