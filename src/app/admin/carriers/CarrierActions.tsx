"use client";

import { useState, useTransition } from "react";
import { setCarrierSuspendedAction, setCarrierVerifiedAction } from "../actions";

interface CarrierActionsProps {
  carrierId: string;
  verified: boolean;
  suspended: boolean;
  /** Demo mode: actions would throw, so render disabled buttons instead. */
  demo: boolean;
}

const buttonBase =
  "rounded-full border px-3.5 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-45";

/** Verified toggle + suspend/activate buttons for one carrier row. */
export default function CarrierActions({
  carrierId,
  verified,
  suspended,
  demo,
}: CarrierActionsProps) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const run = (action: () => Promise<void>) => {
    setError(null);
    startTransition(async () => {
      try {
        await action();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  };

  const demoTitle = demo ? "Demo mode — admin is read-only" : undefined;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={demo || pending}
          title={demoTitle}
          onClick={() => run(() => setCarrierVerifiedAction({ carrierId, verified: !verified }))}
          className={
            verified
              ? `${buttonBase} border-brand-200 text-brand-700 hover:bg-brand-50`
              : `${buttonBase} border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700`
          }
        >
          {verified ? "Remove verified" : "Verify"}
        </button>
        <button
          type="button"
          disabled={demo || pending}
          title={demoTitle}
          onClick={() => run(() => setCarrierSuspendedAction({ carrierId, suspended: !suspended }))}
          className={
            suspended
              ? `${buttonBase} border-emerald-200 text-emerald-700 hover:bg-emerald-50`
              : `${buttonBase} border-accent-200 text-accent-700 hover:bg-accent-50`
          }
        >
          {suspended ? "Activate" : "Suspend"}
        </button>
      </div>
      {error ? <p className="mt-2 max-w-56 text-xs text-accent-700">{error}</p> : null}
    </div>
  );
}
