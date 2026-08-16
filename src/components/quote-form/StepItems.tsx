"use client";

import { formatKg } from "@/lib/format";
import { SERVICE_TYPE_LABELS, type ServiceType } from "@/lib/types";
import type { DraftItem, ItemRow, QuoteFormState } from "./draft";
import { ITEM_PRESETS, type ItemPreset } from "./presets";
import { inputClass, labelClass } from "./ui";

/** Road-groupage volumetric divisor, used only for the live on-form hint. */
const HINT_DIVISOR = 3000;

interface StepItemsProps {
  state: QuoteFormState;
  errors: Record<string, string>;
  onPatch: (patch: Partial<QuoteFormState>) => void;
  onUpdateItem: (id: string, field: keyof DraftItem, value: string) => void;
  onAddItem: () => void;
  onRemoveItem: (id: string) => void;
  onPreset: (preset: ItemPreset) => void;
}

const parse = (value: string): number => {
  const trimmed = value.trim();
  if (trimmed === "") return NaN;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : NaN;
};

function rowStats(row: ItemRow): { pieces: number; actualKg: number; volumetricKg: number } {
  const qty = parse(row.quantity);
  const l = parse(row.lengthCm);
  const w = parse(row.widthCm);
  const h = parse(row.heightCm);
  const kg = parse(row.weightKg);
  const qtyOk = Number.isInteger(qty) && qty >= 1;
  return {
    pieces: qtyOk && l > 0 && w > 0 && h > 0 && kg > 0 ? qty : 0,
    actualKg: qtyOk && kg > 0 ? qty * kg : 0,
    volumetricKg: qtyOk && l > 0 && w > 0 && h > 0 ? (qty * l * w * h) / HINT_DIVISOR : 0,
  };
}

const gridCols =
  "grid grid-cols-[3.25rem_repeat(4,minmax(0,1fr))_1.75rem] items-center gap-x-2";

const cellInput = `${inputClass} no-spinner px-2 text-center`;

/** Step 2 — what is being sent. */
export default function StepItems({
  state,
  errors,
  onPatch,
  onUpdateItem,
  onAddItem,
  onRemoveItem,
  onPreset,
}: StepItemsProps) {
  const isVehicle = state.serviceType === "vehicle";

  const totals = state.items.reduce(
    (acc, row) => {
      const stats = rowStats(row);
      acc.pieces += stats.pieces;
      acc.actualKg += stats.actualKg;
      acc.volumetricKg += stats.volumetricKg;
      return acc;
    },
    { pieces: 0, actualKg: 0, volumetricKg: 0 },
  );

  return (
    <div>
      <p className={labelClass}>What are you sending?</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {(Object.entries(SERVICE_TYPE_LABELS) as [ServiceType, string][]).map(
          ([value, label]) => {
            const selected = state.serviceType === value;
            return (
              <button
                key={value}
                type="button"
                aria-pressed={selected}
                onClick={() => onPatch({ serviceType: value })}
                className={
                  selected
                    ? "rounded-full bg-brand-900 px-4 py-2 text-sm font-semibold text-white"
                    : "rounded-full border border-brand-200 px-4 py-2 text-sm font-semibold text-brand-700 transition hover:bg-brand-50"
                }
              >
                {label}
              </button>
            );
          },
        )}
      </div>

      {isVehicle ? (
        <div className="mt-5">
          <label htmlFor="vehicle-description" className={labelClass}>
            Vehicle details
          </label>
          <textarea
            id="vehicle-description"
            rows={3}
            value={state.vehicleDescription}
            onChange={(event) => onPatch({ vehicleDescription: event.target.value })}
            placeholder="e.g. 2016 BMW 3 Series saloon, starts and drives"
            aria-invalid={errors.vehicleDescription ? true : undefined}
            aria-describedby={errors.vehicleDescription ? "vehicle-description-error" : undefined}
            className={`${inputClass} mt-1.5 resize-none ${
              errors.vehicleDescription ? "border-red-300" : ""
            }`}
          />
          {errors.vehicleDescription ? (
            <p id="vehicle-description-error" className="mt-1 text-xs text-red-600">
              {errors.vehicleDescription}
            </p>
          ) : (
            <p className="mt-1 text-xs text-brand-500">
              Make, model, and whether it is running or non-running. Companies price vehicle
              moves individually and will confirm an exact price with you.
            </p>
          )}
        </div>
      ) : (
        <>
          <div className="mt-5">
            <p className={labelClass}>Quick add</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {ITEM_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => onPreset(preset)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-700 transition hover:border-brand-300 hover:bg-brand-100"
                >
                  <PlusIcon />
                  {preset.label}
                  <span className="text-brand-400">
                    {preset.lengthCm}×{preset.widthCm}×{preset.heightCm} · {preset.weightKg} kg
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5">
            <div
              className={`${gridCols} text-[11px] font-semibold uppercase tracking-wide text-brand-500`}
              aria-hidden="true"
            >
              <span>Qty</span>
              <span>L cm</span>
              <span>W cm</span>
              <span>H cm</span>
              <span>Kg each</span>
              <span />
            </div>
            <div className="mt-1.5 space-y-3">
              {state.items.map((row, index) => {
                const rowError = errors[`item-${row.id}`];
                const rowErrorId = `item-${row.id}-error`;
                const invalidProps = rowError
                  ? { "aria-invalid": true, "aria-describedby": rowErrorId }
                  : {};
                const stats = rowStats(row);
                return (
                  <div key={row.id}>
                    <div className={gridCols}>
                      <input
                        type="number"
                        min={1}
                        step={1}
                        inputMode="numeric"
                        aria-label={`Item ${index + 1} quantity`}
                        {...invalidProps}
                        value={row.quantity}
                        onChange={(e) => onUpdateItem(row.id, "quantity", e.target.value)}
                        className={`${cellInput} ${rowError ? "border-red-300" : ""}`}
                      />
                      <input
                        type="number"
                        min={1}
                        inputMode="decimal"
                        aria-label={`Item ${index + 1} length in centimetres`}
                        {...invalidProps}
                        value={row.lengthCm}
                        onChange={(e) => onUpdateItem(row.id, "lengthCm", e.target.value)}
                        className={`${cellInput} ${rowError ? "border-red-300" : ""}`}
                      />
                      <input
                        type="number"
                        min={1}
                        inputMode="decimal"
                        aria-label={`Item ${index + 1} width in centimetres`}
                        {...invalidProps}
                        value={row.widthCm}
                        onChange={(e) => onUpdateItem(row.id, "widthCm", e.target.value)}
                        className={`${cellInput} ${rowError ? "border-red-300" : ""}`}
                      />
                      <input
                        type="number"
                        min={1}
                        inputMode="decimal"
                        aria-label={`Item ${index + 1} height in centimetres`}
                        {...invalidProps}
                        value={row.heightCm}
                        onChange={(e) => onUpdateItem(row.id, "heightCm", e.target.value)}
                        className={`${cellInput} ${rowError ? "border-red-300" : ""}`}
                      />
                      <input
                        type="number"
                        min={0.1}
                        inputMode="decimal"
                        aria-label={`Item ${index + 1} weight in kilograms per piece`}
                        {...invalidProps}
                        value={row.weightKg}
                        onChange={(e) => onUpdateItem(row.id, "weightKg", e.target.value)}
                        className={`${cellInput} ${rowError ? "border-red-300" : ""}`}
                      />
                      {state.items.length > 1 ? (
                        <button
                          type="button"
                          aria-label={`Remove item ${index + 1}`}
                          onClick={() => onRemoveItem(row.id)}
                          className="flex h-7 w-7 items-center justify-center justify-self-center rounded-full text-brand-400 transition hover:bg-accent-50 hover:text-accent-600"
                        >
                          <CrossIcon />
                        </button>
                      ) : (
                        <span />
                      )}
                    </div>
                    {rowError ? (
                      <p id={rowErrorId} className="mt-1 text-xs text-red-600">{rowError}</p>
                    ) : stats.volumetricKg > 0 ? (
                      <p className="mt-1 text-xs text-brand-500">
                        Volumetric weight ≈ {formatKg(stats.volumetricKg)}
                      </p>
                    ) : null}
                  </div>
                );
              })}
            </div>
            {errors.items ? <p className="mt-2 text-xs text-red-600">{errors.items}</p> : null}
            <button
              type="button"
              onClick={onAddItem}
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 transition hover:text-brand-900"
            >
              <PlusIcon />
              Add another item
            </button>
            {totals.pieces > 0 ? (
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-brand-100 pt-3 text-sm">
                <span className="text-brand-500">Running total</span>
                <span className="font-semibold text-brand-900">
                  {totals.pieces} piece{totals.pieces === 1 ? "" : "s"} ·{" "}
                  {formatKg(totals.actualKg)} actual
                  {totals.volumetricKg > 0
                    ? ` · ${formatKg(totals.volumetricKg)} volumetric`
                    : ""}
                </span>
              </div>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}

function PlusIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
      className="h-3.5 w-3.5"
    >
      <path d="M8 3v10M3 8h10" />
    </svg>
  );
}

function CrossIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
      className="h-3.5 w-3.5"
    >
      <path d="m4 4 8 8M12 4l-8 8" />
    </svg>
  );
}
