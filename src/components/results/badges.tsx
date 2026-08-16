/**
 * Small shared presentational pieces for the results + booking funnel:
 * verified badge, star rating and transport-mode pill. Pure render — safe in
 * both server and client components.
 */

import type { TransportMode } from "@/lib/types";

export const MODE_LABELS: Record<TransportMode, string> = {
  road: "Road",
  air: "Air",
  sea: "Sea",
};

/** Shield-with-tick badge shown next to verified carriers. */
export function VerifiedBadge() {
  return (
    <span className="inline-flex items-center gap-1 text-brand-600">
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className="h-4 w-4 shrink-0"
        role="img"
        aria-label="Verified by Bizim Kargo"
      >
        <title>Verified by Bizim Kargo</title>
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M12 2 4 5v6.09c0 4.94 3.41 9.55 8 10.91 4.59-1.36 8-5.97 8-10.91V5l-8-3Zm3.79 7.7-4.5 4.5a1 1 0 0 1-1.41 0l-2.09-2.08 1.41-1.42 1.38 1.38 3.8-3.79 1.41 1.41Z"
        />
      </svg>
      <span className="text-xs font-semibold">Verified</span>
    </span>
  );
}

/**
 * Star rating with review count. Carriers without reviews render a muted
 * "New on Bizim Kargo" line instead of empty stars.
 */
export function RatingStars({
  rating,
  reviewCount,
  yearsOperating,
}: {
  rating: number;
  reviewCount: number;
  yearsOperating: number | null;
}) {
  const rated = rating > 0 && reviewCount > 0;
  const filled = Math.round(rating);
  return (
    <span className="inline-flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
      {rated ? (
        <>
          <span
            className="inline-flex items-center"
            role="img"
            aria-label={`Rated ${rating.toFixed(1)} out of 5`}
          >
            {[0, 1, 2, 3, 4].map((i) => (
              <svg
                key={i}
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
                className={`h-3.5 w-3.5 ${i < filled ? "text-amber-400" : "text-brand-200"}`}
              >
                <path d="M10 1.5l2.6 5.27 5.82.85-4.21 4.1.99 5.79L10 14.77l-5.2 2.74.99-5.79-4.21-4.1 5.82-.85L10 1.5Z" />
              </svg>
            ))}
          </span>
          <span className="text-xs font-semibold text-brand-800">{rating.toFixed(1)}</span>
          <span className="text-xs text-brand-500">
            ({reviewCount} review{reviewCount === 1 ? "" : "s"})
          </span>
        </>
      ) : (
        <span className="text-xs text-brand-500">New on Bizim Kargo</span>
      )}
      {yearsOperating !== null && yearsOperating > 0 && (
        <span className="text-xs text-brand-500">
          · {yearsOperating} year{yearsOperating === 1 ? "" : "s"} operating
        </span>
      )}
    </span>
  );
}

/** Pill showing the transport mode with a small icon. */
export function ModePill({ mode }: { mode: TransportMode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-100 bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700">
      <ModeIcon mode={mode} />
      {MODE_LABELS[mode]}
    </span>
  );
}

function ModeIcon({ mode }: { mode: TransportMode }) {
  const shared = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className: "h-3.5 w-3.5 shrink-0",
    "aria-hidden": true,
  };
  if (mode === "road") {
    return (
      <svg {...shared}>
        <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
        <path d="M15 18H9" />
        <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62l-3.48-4.35A1 1 0 0 0 17.52 8H14" />
        <circle cx="17" cy="18" r="2" />
        <circle cx="7" cy="18" r="2" />
      </svg>
    );
  }
  if (mode === "air") {
    return (
      <svg {...shared}>
        <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2Z" />
      </svg>
    );
  }
  return (
    <svg {...shared}>
      <path d="M12 10.19V14" />
      <path d="M12 2v3" />
      <path d="M19 13V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v6" />
      <path d="M19.38 20A11.6 11.6 0 0 0 21 14l-8.19-3.64a2 2 0 0 0-1.62 0L3 14a11.6 11.6 0 0 0 1.62 6" />
      <path d="M2 21c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1 .6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
    </svg>
  );
}
