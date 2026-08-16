/** Slim reassurance strip directly under the hero. */

const ITEMS: Array<{ icon: React.ReactNode; label: string }> = [
  { icon: <ShieldIcon />, label: "Verified cargo companies" },
  { icon: <BoltIcon />, label: "Instant like-for-like quotes" },
  { icon: <UmbrellaIcon />, label: "Insurance available on every route" },
  { icon: <DirectIcon />, label: "You book direct — no middleman fees" },
];

export default function TrustRow() {
  return (
    <section className="border-y border-brand-100 bg-white">
      <ul className="mx-auto grid max-w-6xl grid-cols-1 gap-x-6 gap-y-4 px-4 py-6 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        {ITEMS.map((item) => (
          <li key={item.label} className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700">
              {item.icon}
            </span>
            <p className="text-sm font-semibold text-brand-800">{item.label}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

const iconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
  className: "h-5 w-5",
} as const;

function ShieldIcon() {
  return (
    <svg {...iconProps}>
      <path d="M12 3.5 5 6v5.2c0 4.2 2.9 7.6 7 8.8 4.1-1.2 7-4.6 7-8.8V6l-7-2.5Z" />
      <path d="m9 12 2.2 2.2L15.5 9.7" />
    </svg>
  );
}

function BoltIcon() {
  return (
    <svg {...iconProps}>
      <path d="M13 2.5 4.5 13.5H11l-1 8L18.5 10.5H12l1-8Z" />
    </svg>
  );
}

function UmbrellaIcon() {
  return (
    <svg {...iconProps}>
      <path d="M12 3a9 9 0 0 1 9 9H3a9 9 0 0 1 9-9Z" />
      <path d="M12 12v6.5a2 2 0 0 0 4 0" />
      <path d="M12 3v1.5" />
    </svg>
  );
}

function DirectIcon() {
  return (
    <svg {...iconProps}>
      <circle cx="4.5" cy="12" r="2" />
      <circle cx="19.5" cy="12" r="2" />
      <path d="M8 12h7" />
      <path d="m12.5 9 3 3-3 3" />
    </svg>
  );
}
