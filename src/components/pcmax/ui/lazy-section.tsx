import type { ReactNode } from "react";

/*
 * LazySection — content-first section wrapper (API-compatible).
 *
 * Why this is a pass-through now:
 * - Sections are server-rendered in the initial HTML (SEO + no-JS safe).
 * - Every heavy visual effect is scoped to the hero (WebGL GPU + canvas
 *   constellation) and those are gated to desktop viewports by the hero
 *   itself — mobile never downloads or initializes them.
 * - Below-fold sections are plain DOM + `whileInView` animations, so they
 *   must stay mounted: unmounting them behind IntersectionObservers made
 *   users scroll into empty placeholders and wait for remounts (especially
 *   on mobile). Content renders immediately; only animation is deferred
 *   (by framer-motion viewport triggers inside each section).
 *
 * `anchor` is kept for call-site compatibility; sections define their own
 * ids and scroll-mt on the <Section> primitive.
 */
export function LazySection({
  children,
  anchor: _anchor,
}: {
  children: ReactNode;
  anchor?: string;
}) {
  return <>{children}</>;
}
