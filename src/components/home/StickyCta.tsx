"use client";

import { useEffect, useState } from "react";

/**
 * Mobile-only bottom bar that appears once the hero (and its quote box) has
 * scrolled out of view, offering a one-tap way back to the form. Driven by an
 * IntersectionObserver on the #hero-sentinel element rendered after the hero.
 */
export default function StickyCta() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const sentinel = document.getElementById("hero-sentinel");
    if (!sentinel || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry) return;
      // Show only once the sentinel has been scrolled past (above the viewport),
      // not while it is still below the fold on initial load.
      setVisible(!entry.isIntersecting && entry.boundingClientRect.top < 0);
    });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-brand-100 bg-white/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgb(13_27_51_/_0.12)] backdrop-blur sm:hidden">
      <button
        type="button"
        onClick={() =>
          document.getElementById("quote")?.scrollIntoView({ behavior: "smooth", block: "start" })
        }
        className="w-full rounded-full bg-cta px-6 py-3 text-sm font-semibold text-white transition hover:bg-cta-hover"
      >
        Get free quotes
      </button>
    </div>
  );
}
