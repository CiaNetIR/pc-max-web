"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { useLanguage } from "@/components/pcmax/language-context";
import { DownloadIcon } from "@/components/pcmax/icons";
import { cn } from "@/lib/utils";

/*
 * MobileCtaBar — fixed bottom conversion bar, phones only (< 640px).
 *
 * MOUNT CONTRACT: render it directly in the page tree (next to <Footer />)
 * outside any section wrapper, so it survives section state changes.
 * It stays translated off-screen until:
 *   - the user has scrolled past the hero (#top section), AND
 *   - the #download section / footer are NOT on screen (redundant there), AND
 *   - the bar has not been dismissed (persisted in localStorage).
 * All window access happens inside effects — the first paint is quiet,
 * SSR-safe, and identical on server and client.
 */

const DISMISS_KEY = "pcmax-cta-dismissed";
const FALLBACK_SHOW_AFTER_PX = 500;

export function MobileCtaBar() {
  const { t } = useLanguage();
  const [visible, setVisible] = useState(false);
  const downloadInView = useRef(false);
  const footerInView = useRef(false);
  const dismissedRef = useRef(false);

  useEffect(() => {
    let dismissed = false;
    try {
      dismissed = window.localStorage.getItem(DISMISS_KEY) === "1";
    } catch {
      /* storage unavailable (private mode) — show normally */
    }
    dismissedRef.current = dismissed;
    if (dismissed) return;

    /* Past the hero: measure the real #top section (100svh) so the bar
     * only surfaces once the hero is actually behind the user. */
    const heroEl = document.getElementById("top");
    const showAfter = heroEl
      ? Math.max(1, heroEl.offsetHeight - 80)
      : FALLBACK_SHOW_AFTER_PX;

    const evaluate = () => {
      /* dismissedRef keeps a mid-session dismissal sticky — without it the
       * scroll listener would resurrect the bar on the next scroll tick. */
      const show =
        !dismissedRef.current &&
        window.scrollY >= showAfter &&
        !downloadInView.current &&
        !footerInView.current;
      setVisible((prev) => (prev === show ? prev : show));
    };

    evaluate();
    window.addEventListener("scroll", evaluate, { passive: true });

    /* Redundant next to the real download section — hide while it (or the
     * footer) is on screen. One observer, both targets, disconnected on
     * unmount — no leaked observers.
     * threshold 0 + rootMargin: the bottom 110px of the viewport count as
     * "occupied" — the bar slides away BEFORE #download or the footer can
     * slide under it, so the last FAQ card / footer content are never
     * covered (110px ≈ bar height incl. safe-area inset on notch phones). */
    const downloadEl = document.getElementById("download");
    const footerEl = document.querySelector("footer");
    let io: IntersectionObserver | null = null;
    if (downloadEl || footerEl) {
      io = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.target === downloadEl) downloadInView.current = entry.isIntersecting;
            else if (entry.target === footerEl) footerInView.current = entry.isIntersecting;
          }
          evaluate();
        },
        { threshold: 0, rootMargin: "0px 0px 110px 0px" }
      );
      if (downloadEl) io.observe(downloadEl);
      if (footerEl) io.observe(footerEl);
    }

    return () => {
      window.removeEventListener("scroll", evaluate);
      io?.disconnect();
    };
  }, []);

  function dismiss() {
    dismissedRef.current = true;
    setVisible(false);
    try {
      window.localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore — the bar simply reappears next visit */
    }
  }

  return (
    <div
      inert={!visible}
      className={cn(
        /* z-40: below the mobile nav menu (z-[59]), header (z-[60]) and
         * modal dialogs (z-50), above in-page content. sm:hidden — phones
         * only; never renders on ≥sm viewports. */
        "fixed inset-x-0 bottom-0 z-40 transition-transform duration-300 ease-out motion-reduce:transition-none sm:hidden",
        visible ? "translate-y-0" : "pointer-events-none translate-y-full"
      )}
    >
      <div className="glass-chrome pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold leading-tight text-foreground">
              {t.cta.bottomBar.label}
            </p>
            <p className="truncate text-[11px] leading-tight text-muted-foreground">
              {t.cta.bottomBar.note}
            </p>
          </div>

          <a
            href="/api/download"
            aria-label={t.cta.bottomBar.label}
            className="btn-convex press inline-flex h-11 shrink-0 items-center gap-2 rounded-full px-5 text-sm font-semibold text-white"
          >
            <DownloadIcon className="h-4 w-4" aria-hidden="true" />
            {t.cta.bottomBar.label}
          </a>

          <button
            type="button"
            onClick={dismiss}
            aria-label={t.cta.bottomBar.close}
            className="press relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground after:absolute after:-inset-2"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
