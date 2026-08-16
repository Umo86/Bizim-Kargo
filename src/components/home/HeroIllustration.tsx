/**
 * Decorative hero backdrop: stylised, low-detail UK and Turkey outlines joined
 * by a dashed flight arc with a small plane glyph. Purely ornamental — hidden
 * from assistive tech and rendered at low opacity behind the hero content.
 */
export default function HeroIllustration() {
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 1200 640"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
    >
      {/* Stylised Great Britain, left */}
      <g className="text-brand-300" stroke="currentColor" strokeWidth="2.5" opacity="0.16">
        <path
          d="M196 96l30 26-10 40 22 26-20 32 26 36 30 38 16 46-38 22-50-8-32 24-36-14 20-42-16-38 26-28-16-42 26-28-12-46 34-44Z"
          strokeLinejoin="round"
        />
        {/* Northern Ireland hinted as a small offshore shape */}
        <path d="M96 320l26-12 18 18-12 24-28 2-10-20Z" strokeLinejoin="round" />
      </g>

      {/* Stylised Turkey, right */}
      <g className="text-brand-300" stroke="currentColor" strokeWidth="2.5" opacity="0.16">
        <path
          d="M872 336l44-30 82-14 84 6 62 20 24 32-38 34-72 18-84-4-52 22-44-24 12-34-18-26Z"
          strokeLinejoin="round"
        />
      </g>

      {/* Dashed route arc with origin/destination markers */}
      <g className="text-accent-400" opacity="0.45">
        <path
          d="M268 300 Q 600 60 936 330"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeDasharray="2 14"
          strokeLinecap="round"
        />
        <circle cx="268" cy="300" r="5" fill="currentColor" />
        <circle cx="936" cy="330" r="5" fill="currentColor" />
        <circle cx="268" cy="300" r="11" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="936" cy="330" r="11" stroke="currentColor" strokeWidth="1.5" />
      </g>

      {/* Small plane glyph at the arc's apex, nosing towards Turkey */}
      <g className="text-accent-400" opacity="0.6" transform="translate(586 168) rotate(14)">
        <path
          d="M0 8 34 0 12 14 14 24 6 16 0 8Z"
          fill="currentColor"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}
