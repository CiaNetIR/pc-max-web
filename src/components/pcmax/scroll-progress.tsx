"use client";

import { motion, useScroll, useSpring } from "framer-motion";

/* ─────────────────────────────────────────────────────────────────────
 * ScrollProgress — the thin crimson reading bar pinned to the very top
 * of the viewport, spring-smoothed off the page's scrollYProgress.
 *
 * Scroll-LINKED (not autonomous): the bar only moves when the visitor
 * scrolls, so it stays up under WCAG even for reduced-motion users —
 * direct-manipulation feedback, like a scrollbar. Origin flips to the
 * right on the RTL document (globals.css) so it grows with the reading
 * direction. Pure transform (scaleX) — no layout work per frame.
 * ───────────────────────────────────────────────────────────────────── */

export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 140,
    damping: 30,
    mass: 0.4,
  });

  return <motion.div aria-hidden="true" className="gc-scroll-progress" style={{ scaleX }} />;
}
