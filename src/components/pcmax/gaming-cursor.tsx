"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

/* ─────────────────────────────────────────────────────────────────────
 * GamingCursor — the owner's "gaming mouse icon": a crimson reticle
 * (ring + crosshair ticks + center dot) that chases the pointer on
 * springs, with a loose trailing dot for the visible "lag" gamers know
 * from FPS HUDs.
 *
 * Mount contract (progressive enhancement, zero hydration risk):
 *   • the reticle DOM is ALWAYS mounted but visually inert (off-screen
 *     at -100,-100, opacity 0 via .gc-cursor-hidden) until the first
 *     mousemove — CRITICAL: framer's useSpring only follows the source
 *     motion value once its consumer is attached to a rendered element,
 *     so unmounting until "armed" would silently DROP the first pointer
 *     position and park the ring at its initial value (found in E2E);
 *   • arms only on (pointer: fine) devices WITHOUT prefers-reduced-motion
 *     (a flying reticle is exactly the motion those visitors asked to
 *     avoid — the native cursor stays);
 *   • `cursor: none` is applied via the JS-added html.gc-cursor-on class:
 *     no-JS / touch / reduced-motion visitors keep the native cursor;
 *   • hover state (interactive targets) expands the reticle and rotates
 *     the ticks 45°, press contracts it — transform/opacity only;
 *   • hides when the pointer leaves the document; pointer-events:none so
 *     it can never intercept a click.
 * ───────────────────────────────────────────────────────────────────── */

const INTERACTIVE =
  "a, button, [role='tab'], summary, input, textarea, select, label, [data-gc-interactive]";

export function GamingCursor() {
  const [armed, setArmed] = useState(false);
  const [visible, setVisible] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [pressed, setPressed] = useState(false);

  const mx = useMotionValue(-100);
  const my = useMotionValue(-100);
  /* ring — snappy spring (feels attached to the hand) */
  const ringX = useSpring(mx, { stiffness: 560, damping: 44, mass: 0.5 });
  const ringY = useSpring(my, { stiffness: 560, damping: 44, mass: 0.5 });
  /* trail dot — deliberately loose (the visible lag behind the ring) */
  const trailX = useSpring(mx, { stiffness: 130, damping: 18, mass: 0.8 });
  const trailY = useSpring(my, { stiffness: 130, damping: 18, mass: 0.8 });

  const armedRef = useRef(false);

  useEffect(() => {
    /* Touch / reduced-motion visitors never swap the native cursor. */
    if (!window.matchMedia("(pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const onMove = (e: MouseEvent) => {
      mx.set(e.clientX);
      my.set(e.clientY);
      if (!armedRef.current) {
        armedRef.current = true;
        setArmed(true);
        document.documentElement.classList.add("gc-cursor-on");
      }
      setVisible(true);
      const target = e.target as Element | null;
      setHovering(Boolean(target?.closest?.(INTERACTIVE)));
    };
    const onLeave = () => setVisible(false);
    const onDown = () => setPressed(true);
    const onUp = () => setPressed(false);

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mousedown", onDown, { passive: true });
    window.addEventListener("mouseup", onUp, { passive: true });
    document.documentElement.addEventListener("mouseleave", onLeave);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      document.documentElement.classList.remove("gc-cursor-on");
    };
  }, [mx, my]);

  return (
    <div
      aria-hidden="true"
      className={armed && visible ? "gc-cursor" : "gc-cursor gc-cursor-hidden"}
    >
      {/* trailing dot — the loose-spring lag */}
      <motion.div className="gc-cursor-trail" style={{ x: trailX, y: trailY }} />
      {/* reticle */}
      <motion.div className="gc-cursor-ring" style={{ x: ringX, y: ringY }}>
        <motion.div
          className="gc-cursor-reticle"
          animate={{
            scale: pressed ? 0.78 : hovering ? 1.34 : 1,
            rotate: hovering ? 45 : 0,
          }}
          transition={{ type: "spring", stiffness: 380, damping: 22 }}
        >
          <span className="gc-cursor-tick gc-tick-n" />
          <span className="gc-cursor-tick gc-tick-e" />
          <span className="gc-cursor-tick gc-tick-s" />
          <span className="gc-cursor-tick gc-tick-w" />
          <span className={hovering ? "gc-cursor-dot gc-dot-hot" : "gc-cursor-dot"} />
        </motion.div>
      </motion.div>
    </div>
  );
}
