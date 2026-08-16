"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import SignOutButton from "./SignOutButton";

const TABS: Array<{ href: string; label: string }> = [
  { href: "/carrier/dashboard", label: "Dashboard" },
  { href: "/carrier/rates", label: "My rates" },
  { href: "/carrier/profile", label: "Profile" },
];

/**
 * Carrier portal sub-navigation, rendered under the global header on every
 * authed carrier page. Hidden on the login and signup pages, where there is
 * no session to navigate.
 */
export default function CarrierNav({ demo }: { demo: boolean }) {
  const pathname = usePathname();

  if (
    pathname.startsWith("/carrier/login") ||
    pathname.startsWith("/carrier/signup")
  ) {
    return null;
  }

  return (
    <div className="border-b border-brand-100 bg-white">
      <nav
        aria-label="Carrier portal"
        className="mx-auto flex max-w-6xl items-center gap-1 overflow-x-auto px-4 sm:px-6"
      >
        {TABS.map((tab) => {
          const active = pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={`whitespace-nowrap border-b-2 px-3 py-3 text-sm font-medium transition ${
                active
                  ? "border-accent-500 text-brand-900"
                  : "border-transparent text-brand-600 hover:border-brand-200 hover:text-brand-900"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
        <span className="ml-auto flex shrink-0 items-center gap-3 py-2 pl-3">
          {demo ? (
            <>
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-900">
                Demo
              </span>
              <Link
                href="/"
                className="text-sm font-medium text-brand-600 transition hover:text-brand-900"
              >
                Exit demo
              </Link>
            </>
          ) : (
            <SignOutButton />
          )}
        </span>
      </nav>
    </div>
  );
}
