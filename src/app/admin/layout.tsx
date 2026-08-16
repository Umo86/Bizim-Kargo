import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import AdminNav from "./AdminNav";
import AdminDemoBanner from "./DemoBanner";
import { getAdminAccess } from "./guard";

export const metadata: Metadata = {
  title: {
    default: "Admin",
    template: "%s · Admin | Bizim Kargo",
  },
  robots: { index: false, follow: false },
};

/**
 * Admin chrome + server-side guard. In Supabase mode only signed-in users
 * whose profiles.role is 'admin' get past this layout; everyone else is sent
 * home. In demo mode the area renders read-only behind an amber banner.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const access = await getAdminAccess();
  if (!access) redirect("/");

  return (
    <div className="flex min-h-screen flex-col bg-brand-50/40">
      {/* Slim dark sub-nav */}
      <header className="border-b border-brand-800 bg-brand-950">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3 sm:gap-6">
            <Link href="/admin/carriers" className="flex shrink-0 items-baseline gap-2">
              <span className="text-base font-bold tracking-tight text-white">
                Bizim<span className="text-accent-400">Kargo</span>
              </span>
              <span className="hidden rounded-full bg-brand-800 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-200 sm:inline-block">
                Admin
              </span>
            </Link>
            <AdminNav />
          </div>
          <Link
            href="/"
            className="shrink-0 text-sm font-medium text-brand-300 transition hover:text-white"
          >
            View site
          </Link>
        </div>
      </header>

      {access.mode === "demo" ? (
        <div className="mx-auto w-full max-w-6xl px-4 pt-6 sm:px-6">
          <AdminDemoBanner />
        </div>
      ) : null}

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
        {children}
      </main>

      <footer className="border-t border-brand-100 bg-white">
        <p className="mx-auto max-w-6xl px-4 py-4 text-xs text-brand-500 sm:px-6">
          Bizim Kargo admin — internal use only.
        </p>
      </footer>
    </div>
  );
}
