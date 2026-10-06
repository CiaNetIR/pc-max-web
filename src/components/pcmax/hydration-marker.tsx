"use client";

import { useEffect } from "react";

/* ─────────────────────────────────────────────────────────────────────
 * Progressive-enhancement marker — pairs with the `html:not(.hydrated)`
 * override at the bottom of globals.css.
 *
 * Scroll-reveal elements (framer-motion `whileInView`/mount initials) ship
 * `style="opacity:0;…"` in the static HTML. Until JS downloads, hydrates
 * and the IntersectionObserver fires, ALL of that content is invisible —
 * on a slow mobile connection the visitor scrolls through a blank page
 * (hero renders, every section below it doesn't).
 *
 * The stylesheet therefore force-shows any inline-hidden reveal target
 * while <html> lacks the `.hydrated` class; this component adds the class
 * the moment React mounts, handing visibility control back to
 * framer-motion. Failure modes covered:
 *   • slow network / long pre-hydration window → content visible
 *   • JS stalled, blocked or failed entirely      → content visible
 *   • no-JS visitors                              → content visible
 *   • runtime error unmounts React (cleanup runs) → content visible again
 * ───────────────────────────────────────────────────────────────────── */
export function HydrationMarker() {
  useEffect(() => {
    document.documentElement.classList.add("hydrated");
    return () => document.documentElement.classList.remove("hydrated");
  }, []);
  return null;
}
