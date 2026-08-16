"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/admin/carriers", label: "Carriers" },
  { href: "/admin/leads", label: "Leads" },
] as const;

/** The two admin section links, with the active one highlighted. */
export default function AdminNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Admin sections" className="flex items-center gap-1">
      {LINKS.map((link) => {
        const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={
              active
                ? "rounded-full bg-brand-800 px-4 py-1.5 text-sm font-semibold text-white"
                : "rounded-full px-4 py-1.5 text-sm font-medium text-brand-300 transition hover:bg-brand-900 hover:text-white"
            }
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
