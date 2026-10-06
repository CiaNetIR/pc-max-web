"use client";

import { useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "framer-motion";

export function AnimatedCounter({
  value,
  suffix = "",
  prefix = "",
  duration = 1200,
  className,
}: {
  value: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -40px 0px" });
  const reduce = useReducedMotion();
  /* Initial state = final value: SSR + no-JS + pre-hydration all show the
   * real number (SEO/no-JS never see "0"). The count-up only starts once
   * the element actually enters the viewport, so the first paint below the
   * fold is replaced by the animation before the user ever sees it. */
  const [display, setDisplay] = useState(value);
  const started = useRef(false);

  useEffect(() => {
    if (!inView || started.current) return;
    started.current = true;
    /* prefers-reduced-motion — no counting animation; the final value
     * is rendered directly below (no state, no frames). */
    if (reduce) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(eased * value));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      /* StrictMode double-effect (audit 29-c): the dev-only remount re-runs
       * this effect, but `started` was already consumed — the count-up was
       * silently skipped. Reset the guard in cleanup so the second (real)
       * effect run animates again. Production is unaffected. */
      started.current = false;
    };
  }, [inView, reduce, value, duration]);

  return (
    /* dir="ltr" — site convention: Latin digits (+ suffixes like "K+",
       "%") stay in reading order inside RTL Persian text. */
    <span ref={ref} dir="ltr" className={className}>
      {prefix}
      {reduce ? value : display}
      {suffix}
    </span>
  );
}
