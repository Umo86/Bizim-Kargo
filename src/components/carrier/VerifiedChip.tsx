import { chipClass } from "./ui";

/** Emerald "Verified" / amber "Pending verification" status chip. */
export default function VerifiedChip({ verified }: { verified: boolean }) {
  if (verified) {
    return (
      <span className={`${chipClass} bg-emerald-100 text-emerald-800`}>
        <svg width="11" height="11" viewBox="0 0 12 12" aria-hidden="true">
          <path
            d="m2.5 6.5 2.5 2.5 4.5-5.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Verified
      </span>
    );
  }
  return (
    <span className={`${chipClass} bg-amber-100 text-amber-900`}>
      Pending verification — we’ll email you
    </span>
  );
}
