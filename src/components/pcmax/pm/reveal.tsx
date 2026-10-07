"use client";

import { useEffect } from "react";

/*
 * RevealGate2 — Task 44 scroll-reveal engine (pm layer).
 *
 * Same progressive-enhancement contract as the Task-43 gate, in the
 * premium.css namespace:
 *
 *   <html> gains `pm-rv` on mount  →  `.rv2` elements start hidden via
 *   premium.css (transform/opacity only)  →  an IntersectionObserver
 *   adds `.in` per element as it enters the viewport.
 *
 * If JS never runs, `pm-rv` never lands and every `.rv2` element is
 * plain-visible — content is never hostage to JS.
 * `prefers-reduced-motion: reduce` skips the gate entirely (and
 * premium.css additionally renders .rv2 visible even if the class were
 * present). ONE instance per page, above the sections.
 */
export function RevealGate2() {
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || !("IntersectionObserver" in window)) return;

    const root = document.documentElement;
    root.classList.add("pm-rv");

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -7% 0px", threshold: 0 }
    );

    const scan = () => {
      document.querySelectorAll(".rv2:not(.in)").forEach((el) => io.observe(el));
    };
    scan();

    /* Keyed remounts (showcase tab swaps) re-introduce .rv2 nodes — one
     * MutationObserver keeps the pool fresh without re-subscribing. */
    const mo = new MutationObserver(scan);
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      io.disconnect();
      mo.disconnect();
      root.classList.remove("pm-rv");
    };
  }, []);

  return null;
}
