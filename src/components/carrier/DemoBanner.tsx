/**
 * Slim amber banner shown across the carrier portal whenever the app runs
 * without Supabase. Pages pass an optional extra sentence for context.
 */
export default function DemoBanner({ note }: { note?: string }) {
  return (
    <div
      role="status"
      className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-900"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        aria-hidden="true"
        className="mt-0.5 shrink-0"
      >
        <path
          d="M8 1.5 15 14H1L8 1.5Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path d="M8 6v3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="8" cy="11.75" r=".9" fill="currentColor" />
      </svg>
      <p>
        <span className="font-semibold">Demo mode</span> — connect Supabase to
        enable real carrier accounts.
        {note ? <span> {note}</span> : null}
      </p>
    </div>
  );
}
