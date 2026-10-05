"use client";

import { MotionConfig, type Transition } from "framer-motion";
import type { ReactNode } from "react";

/* ------------------------------------------------------------------ */
/*  Apple motion system — "Designing Fluid Interfaces" (WWDC 2018)    */
/*  Springs, not durations: interruptible, velocity-aware, and they   */
/*  always animate FROM the current on-screen value.                  */
/* ------------------------------------------------------------------ */

/** Default UI spring — critically damped, no overshoot, ~0.3s response. */
export const springFluid: Transition = {
  type: "spring",
  stiffness: 300,
  damping: 30,
  mass: 1,
};

/** Momentum spring — gentle bounce for flicks, hovers, playful moves. */
export const springBounce: Transition = {
  type: "spring",
  stiffness: 380,
  damping: 24,
  mass: 1,
};

/** Press feedback for motion elements (pairs with the `.press` CSS class). */
export const whileTapPress = { scale: 0.96 } as const;

/** Hover lift for interactive cards. */
export const whileHoverLift = { scale: 1.02, y: -3 } as const;

/** Global MotionConfig — honors the OS reduced-motion setting by
 *  collapsing transform/layout animations to opacity changes. */
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
