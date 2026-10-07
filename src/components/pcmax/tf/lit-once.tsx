"use client";

import { useEffect } from "react";

/*
 * LitOnce — Task 43 "Exact Clone"
 *
 * Ports the mirror's `secIO` one-shot: when the element enters the
 * viewport it gains `.lit` (the #ign conic border sweep — ignSpin +
 * ignFade, owned by tf-home.css). Fire-and-forget, never un-lights.
 * No IntersectionObserver support = no-op (the base .ign style is a
 * plain hairline frame, so nothing is lost).
 */
export function LitOnce({ targetId }: { targetId: string }) {
  useEffect(() => {
    const el = document.getElementById(targetId);
    if (!el || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("lit");
            io.disconnect();
          }
        }
      },
      { threshold: 0, rootMargin: "0px 0px -10% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [targetId]);

  return null;
}
