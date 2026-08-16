"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { toggleServiceActiveAction } from "@/app/carrier/actions";

/**
 * Active/paused switch on a rate card. Optimistic: flips immediately, calls
 * the server action, and reverts with an error message on failure. Disabled
 * in demo mode (the demo dataset is read-only).
 */
export default function ServiceActiveToggle({
  serviceId,
  active: initialActive,
  disabled,
}: {
  serviceId: string;
  active: boolean;
  disabled: boolean;
}) {
  const router = useRouter();
  const [active, setActive] = useState(initialActive);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    if (disabled || saving) return;
    const next = !active;
    setActive(next);
    setSaving(true);
    setError(null);
    try {
      await toggleServiceActiveAction({ serviceId, active: next });
      router.refresh();
    } catch (caught) {
      setActive(!next);
      setError(
        caught instanceof Error ? caught.message : "Could not update the rate card.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-brand-700">
        <span className={active ? "text-emerald-700" : "text-brand-400"}>
          {active ? "Active" : "Paused"}
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={active}
          aria-label={active ? "Pause this rate card" : "Activate this rate card"}
          disabled={disabled || saving}
          onClick={toggle}
          title={disabled ? "Demo mode — rate cards are read-only" : undefined}
          className={`relative h-6 w-11 shrink-0 rounded-full transition disabled:cursor-not-allowed disabled:opacity-60 ${
            active ? "bg-emerald-500" : "bg-brand-200"
          }`}
        >
          <span
            className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
              active ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </label>
      {error ? <p className="max-w-52 text-right text-xs text-accent-700">{error}</p> : null}
    </div>
  );
}
