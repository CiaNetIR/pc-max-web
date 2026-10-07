"use client";

import { useEffect } from "react";

/*
 * RevealGate — Task 43 "Exact Clone"
 *
 * Ports tweakfa.com's scroll-reveal system (site.js `rv-on` engine) onto React:
 *
 *   <html> gains `rv-on` on mount  →  .rv elements start hidden via CSS
 *   (tf-home.css owns the transforms)  →  an IntersectionObserver adds `.in`
 *   per element as it enters the viewport.
 *
 * Progressive enhancement, exactly like the source: if JS never runs, `rv-on`
 * is never added and every `.rv` element renders plain-visible — content is
 * never hostage to JS. `prefers-reduced-motion: reduce)` skips the gate
 * entirely (the mirror's `reduced` check).
 *
 * ONE instance per page (rendered by page.tsx above the sections). The
 * observer watches the whole document subtree so late-mounted slides (hero
 * caption rewrites) are picked up without re-subscribing.
 */
export function RevealGate() {
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || !("IntersectionObserver" in window)) return;

    const root = document.documentElement;
    root.classList.add("rv-on");

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0 }
    );

    const scan = () => {
      document.querySelectorAll(".rv:not(.in)").forEach((el) => io.observe(el));
    };
    scan();

    /* Hero caption rewrites and lazy content swap `.rv` elements in and out;
     * a single MutationObserver keeps the pool fresh without re-mounts. */
    const mo = new MutationObserver(scan);
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      io.disconnect();
      mo.disconnect();
      root.classList.remove("rv-on");
    };
  }, []);

  return null;
}
