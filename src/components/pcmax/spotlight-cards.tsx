"use client";

import { useEffect } from "react";

/* ─────────────────────────────────────────────────────────────────────
 * SpotlightCards — the "newest landing" signature: a soft crimson
 * radial glow that follows the pointer across every .gc-card surface.
 *
 * ONE delegated listener on window (pointermove), rAF-throttled, which
 * stamps --mx/--my CSS custom properties on the hovered card; the paint
 * itself is a pure-CSS ::after radial gradient (globals.css) — no React
 * re-renders, no per-card listeners, no layout reads beyond the hovered
 * card's rect. Only (pointer: fine) devices arm it (touch never fires);
 * the glow tracks the cursor with NO transition (instant
 * direct-manipulation feedback, so there is no motion to reduce).
 * ───────────────────────────────────────────────────────────────────── */

export function SpotlightCards() {
  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;

    let raf = 0;
    let last: HTMLElement | null = null;

    const clearLast = () => {
      if (!last) return;
      last.classList.remove("gc-spot");
      last = null;
    };

    const onMove = (e: PointerEvent) => {
      /* capture before the rAF — the event object is not reused, but the
       * coords are cheap to close over and the target identity is all
       * the callback needs */
      const x = e.clientX;
      const y = e.clientY;
      const target = e.target as Element | null;
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const card = (target?.closest?.(".gc-card") ?? null) as HTMLElement | null;
        if (last && last !== card) clearLast();
        if (!card) return;
        const rect = card.getBoundingClientRect();
        card.classList.add("gc-spot");
        card.style.setProperty("--mx", `${x - rect.left}px`);
        card.style.setProperty("--my", `${y - rect.top}px`);
        last = card;
      });
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      if (raf) cancelAnimationFrame(raf);
      clearLast();
    };
  }, []);

  return null;
}
