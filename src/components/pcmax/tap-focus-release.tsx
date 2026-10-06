"use client";

import { useEffect } from "react";

/**
 * TapFocusRelease — kill the persistent focus box after pointer clicks.
 *
 * Chrome (incl. Android Chrome) treats a TOUCH tap as a keyboard-like
 * interaction: tapping a button/summary/card matches `:focus-visible`, so
 * the focus outline stays painted around it for the rest of the visit —
 * reported as the "red square around the profile card" (Task 32; the ring
 * color itself was also neutralized in globals.css).
 *
 * Fix: after a REAL pointer click (e.detail > 0 — keyboard Enter and
 * synthetic .click() both report 0) blur the activated control IF it is
 * currently showing a :focus-visible ring. Keyboard focus is untouched,
 * screen-reader programmatic focus is untouched, and the activated state
 * (aria-checked, open <details>, React state) is unaffected — only the
 * stale ring goes away.
 */
export function TapFocusRelease() {
  useEffect(() => {
    const onSelect = (e: MouseEvent) => {
      /* detail === 0 → keyboard-triggered (Enter/Space) or synthetic click:
       * keep the focus ring, it is the keyboard user's indicator. */
      if (e.detail === 0) return;
      const target = e.target;
      if (!(target instanceof Element)) return;
      const control = target.closest(
        "button, [role='button'], [role='radio'], [role='tab'], summary, a[href]"
      );
      if (control instanceof HTMLElement && control.matches(":focus-visible")) {
        control.blur();
      }
    };
    document.addEventListener("click", onSelect);
    return () => document.removeEventListener("click", onSelect);
  }, []);

  return null;
}
