"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";

/*
 * PC MAX hero constellation — a quiet, living star-field texture behind the
 * desktop hero. Canvas 2D + spring physics + O(n²) neighbor links + pointer
 * interaction.
 *
 * Performance shape (visually identical, cheap on weak hardware):
 * - The loop runs at ~30fps: rAF keeps ticking, but ticks that arrive
 *   sooner than TICK_MS after the last processed one are skipped (no
 *   simulate, no draw). The field drifts slowly — half rate is
 *   indistinguishable — and this halves the O(n²) pass cost next to the
 *   WebGL hero.
 * - DPR is capped at 1.5 (soft dots and 1px lines — 2x is wasted fill).
 * - Color strings are pre-baked per theme: link alpha snaps to ~5
 *   discrete buckets and node alpha to a 0.05 quiet-factor grid, so the
 *   hot loop performs zero template-string/toFixed allocations and
 *   strokes are batched one beginPath+stroke per (kind × bucket).
 * - The pointer-link block is skipped entirely while the pointer sits
 *   at its out-of-canvas sentinel.
 *
 * Protected text zone: nodes and links fade to ~20% strength inside a soft
 * rect measured around the hero copy block ([data-hero-copy]) and blend
 * back to full strength across a 180px band — the typography always owns
 * its quiet zone, the rest of the field stays alive.
 *
 * HARD desktop-only rule (performance contract):
 * - Initialization happens ONLY while (min-width: 1024px) matches.
 * - On smaller viewports NOTHING exists: no canvas element, no rAF loop,
 *   no nodes, no listeners. Shrinking the viewport tears everything down.
 * - The loop pauses while the hero is offscreen or the tab is hidden.
 * - prefers-reduced-motion: one static frame, no loop, no listeners.
 */

const DESKTOP_QUERY = "(min-width: 1024px)";
const LINK_DIST = 150; // px — neighbor connection distance
const MOUSE_RADIUS = 170; // px — pointer connection radius
const MOUSE_PUSH = 130; // px — pointer repulsion radius

/* Protected text zone — a soft "quiet zone" around the hero copy block.
 * Text readability beats background effects, but the field is NOT turned
 * off: nodes and links simply fade to a fraction of their strength near
 * the typography and return to full strength across a wide, imperceptible
 * smooth band. The zone is measured from the live DOM rect (works in LTR
 * and RTL, re-measures on language switch / font swap / resize). */
const QUIET_MIN = 0.2; // 20% strength at the quietest (inside the rect)
const QUIET_FADE = 180; // px — smooth fade band around the rect
const QUIET_PAD = 72; // px — rect expansion beyond the visible text block

/* ---- loop governor: ~30fps (see header) -------------------------------- */
const TICK_MS = 33;

/* ---- pre-baked color strings (see header) -------------------------------
 * Link alphas live in 0–0.16, so a 0.034 step gives ~5 meaningful levels;
 * bucket 0 rounds to fully transparent and is not stroked at all. Node
 * alpha snaps to a 0.05 quiet-factor grid whose points include QUIET_MIN
 * 0.2 and 1.0 exactly, so the quiet-zone floor is unchanged. */
const LINK_STEP = 0.034;
const LINK_LEVELS = 5;
const NODE_STEP = 0.05;
const NODE_LEVELS = 21;

type Node = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  ax: number; // anchor x (slow random walk)
  ay: number;
  r: number;
  accent: boolean;
};

type Palette = {
  neighbor: string[]; // stroke styles per link bucket
  pointer: string[]; // stroke styles per pointer-link bucket
  nodeAccent: string[]; // fill styles per quiet-factor level (accent dots)
  nodePlain: string[]; // fill styles per quiet-factor level (plain dots)
};

export function ConstellationBackground() {
  const hostRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();
  const [enabled, setEnabled] = useState(false);
  const themeRef = useRef<string | undefined>(resolvedTheme);
  /* Redraw hook for the frames the rAF loop never paints: the reduced-motion
   * static frame and the paused (hero offscreen) field. A theme switch must
   * recolor those too, not only the next animated frame. */
  const redrawRef = useRef<(() => void) | null>(null);

  /* The only path to any initialization — a desktop viewport. */
  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_QUERY);
    const update = () => setEnabled(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    themeRef.current = resolvedTheme;
    redrawRef.current?.();
  }, [resolvedTheme]);

  useEffect(() => {
    if (!enabled) return;
    const host = hostRef.current;
    if (!host) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const canvas = document.createElement("canvas");
    canvas.style.display = "block";
    canvas.setAttribute("aria-hidden", "true");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    host.appendChild(canvas);

    let w = 0;
    let h = 0;
    let dpr = 1;
    let nodes: Node[] = [];
    let raf = 0;
    let running = false;
    let heroVisible = true;
    const mouse = { x: -9999, y: -9999 };

    /* live quiet-zone rect in canvas coordinates (null = no copy block) */
    let quietRect: { x0: number; y0: number; x1: number; y1: number } | null = null;

    /* Measure the readable copy block (headline + sub + CTAs) relative to
     * the canvas host. getBoundingClientRect includes transforms, so the
     * zone tracks the copy even mid-entrance-animation. */
    const measureQuiet = () => {
      const copyEl = document.getElementById("top")?.querySelector<HTMLElement>("[data-hero-copy]");
      if (!copyEl) {
        quietRect = null;
        return;
      }
      const hostRect = host.getBoundingClientRect();
      const r = copyEl.getBoundingClientRect();
      quietRect = {
        x0: r.left - hostRect.left - QUIET_PAD,
        y0: r.top - hostRect.top - QUIET_PAD,
        x1: r.right - hostRect.left + QUIET_PAD,
        y1: r.bottom - hostRect.top + QUIET_PAD,
      };
    };

    /* Strength factor at a canvas point: QUIET_MIN inside the protected
     * rect, easing smoothly back to 1 across QUIET_FADE px. */
    const quietAt = (x: number, y: number): number => {
      const q = quietRect;
      if (!q) return 1;
      const dx = Math.max(q.x0 - x, 0, x - q.x1);
      const dy = Math.max(q.y0 - y, 0, y - q.y1);
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d >= QUIET_FADE) return 1;
      return QUIET_MIN + (1 - QUIET_MIN) * (d / QUIET_FADE);
    };

    const seed = () => {
      const count = Math.max(34, Math.min(86, Math.round((w * h) / 18000)));
      nodes = Array.from({ length: count }, () => {
        const x = Math.random() * w;
        const y = Math.random() * h;
        return {
          x,
          y,
          vx: 0,
          vy: 0,
          ax: x,
          ay: y,
          r: 0.8 + Math.random() * 1.1,
          accent: Math.random() < 0.14,
        };
      });
    };

    /* ---- pre-baked theme palettes + reused frame buffers -----------------
     * Built once per theme on first use; rebuilt automatically when the
     * theme flips (cached key no longer matches). The hot loop below
     * performs zero string allocations. */
    let paletteKey: "dark" | "light" | null = null;
    let palette: Palette | null = null;
    const getPalette = (light: boolean): Palette => {
      const key: "dark" | "light" = light ? "light" : "dark";
      if (palette && paletteKey === key) return palette;
      const linkStyles = (rgb: string) =>
        Array.from({ length: LINK_LEVELS }, (_, i) => `rgba(${rgb}, ${(i * LINK_STEP).toFixed(3)})`);
      const nodeStyles = (rgb: string, base: number) =>
        Array.from({ length: NODE_LEVELS }, (_, i) => `rgba(${rgb}, ${(base * i * NODE_STEP).toFixed(3)})`);
      palette = light
        ? {
            neighbor: linkStyles("150, 16, 26"),
            pointer: linkStyles("150, 16, 26"),
            nodeAccent: nodeStyles("193, 18, 31", 0.5),
            nodePlain: nodeStyles("24, 24, 28", 0.38),
          }
        : {
            neighbor: linkStyles("229, 9, 20"),
            pointer: linkStyles("255, 255, 255"),
            nodeAccent: nodeStyles("229, 9, 20", 0.6),
            nodePlain: nodeStyles("226, 226, 232", 0.4),
          };
      paletteKey = key;
      return palette;
    };

    /* link alpha -> bucket index; -1 = rounds to fully transparent */
    const linkBucket = (alpha: number): number => {
      const b = Math.round(alpha / LINK_STEP);
      return b <= 0 ? -1 : b >= LINK_LEVELS ? LINK_LEVELS - 1 : b;
    };

    /* per-frame scratch (no allocation inside drawFrame) */
    const qs: number[] = [];
    const segNeighbor: number[][] = Array.from({ length: LINK_LEVELS }, () => []);
    const segPointer: number[][] = Array.from({ length: LINK_LEVELS }, () => []);

    const drawFrame = () => {
      const light = themeRef.current === "light";
      const pal = getPalette(light);
      const nbBase = light ? 0.11 : 0.14; // neighbor link strength
      const ptBase = light ? 0.16 : 0.12; // pointer link strength
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.lineWidth = 1;

      /* Per-frame quiet factors — one per node, plus one for the pointer
       * (links to a pointer hovering over the copy also fade, so attention
       * lines never get drawn across the headline). */
      qs.length = nodes.length;
      for (let i = 0; i < nodes.length; i++) qs[i] = quietAt(nodes[i].x, nodes[i].y);

      /* Pointer parked at its far-away sentinel: nothing can be inside
       * MOUSE_RADIUS, so the whole pointer-link block is skipped. */
      const pointerLive = mouse.x > -9000 && mouse.y > -9000;
      const qMouse = pointerLive ? quietAt(mouse.x, mouse.y) : 1;

      for (let b = 0; b < LINK_LEVELS; b++) {
        segNeighbor[b].length = 0;
        segPointer[b].length = 0;
      }

      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        const ax = a.x;
        const ay = a.y;
        const qi = qs[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = ax - nodes[j].x;
          if (dx > LINK_DIST || dx < -LINK_DIST) continue;
          const dy = ay - nodes[j].y;
          if (dy > LINK_DIST || dy < -LINK_DIST) continue;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < LINK_DIST) {
            const t = 1 - d / LINK_DIST;
            /* a link is quiet if EITHER endpoint is quiet — no line keeps
             * full strength while touching the protected zone */
            const qj = qs[j];
            const lq = qi < qj ? qi : qj;
            const bucket = linkBucket(t * nbBase * lq);
            if (bucket >= 0) segNeighbor[bucket].push(ax, ay, nodes[j].x, nodes[j].y);
          }
        }

        /* subtle link from the pointer to nearby nodes (gated above; the
         * axis checks short-circuit before any sqrt) */
        if (pointerLive) {
          const mdx = ax - mouse.x;
          if (mdx < MOUSE_RADIUS && mdx > -MOUSE_RADIUS) {
            const mdy = ay - mouse.y;
            if (mdy < MOUSE_RADIUS && mdy > -MOUSE_RADIUS) {
              const md = Math.sqrt(mdx * mdx + mdy * mdy);
              if (md < MOUSE_RADIUS) {
                const t = 1 - md / MOUSE_RADIUS;
                const lq = qi < qMouse ? qi : qMouse;
                const bucket = linkBucket(t * ptBase * lq);
                if (bucket >= 0) segPointer[bucket].push(ax, ay, mouse.x, mouse.y);
              }
            }
          }
        }
      }

      /* Strokes grouped by bucket: one beginPath/stroke per (kind ×
       * bucket) instead of one per link. Same styles, same 1px butt-cap
       * segments — identical pixels, a fraction of the state churn. */
      const strokeSegments = (styles: string[], segs: number[][]) => {
        for (let b = 1; b < LINK_LEVELS; b++) {
          const seg = segs[b];
          if (seg.length === 0) continue;
          ctx.strokeStyle = styles[b];
          ctx.beginPath();
          for (let k = 0; k < seg.length; k += 4) {
            ctx.moveTo(seg[k], seg[k + 1]);
            ctx.lineTo(seg[k + 2], seg[k + 3]);
          }
          ctx.stroke();
        }
      };
      strokeSegments(pal.neighbor, segNeighbor);
      strokeSegments(pal.pointer, segPointer);

      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        /* quiet factor snapped to the 0.05 grid (QUIET_MIN 0.2 and 1.0 are
         * grid points — the quiet-zone floor stays exactly 20%) */
        const qb = Math.min(NODE_LEVELS - 1, Math.round(qs[i] / NODE_STEP));
        ctx.fillStyle = (n.accent ? pal.nodeAccent : pal.nodePlain)[qb];
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    /* Theme switches recolor frames the loop does not repaint (the
     * reduced-motion static frame; the paused field while offscreen). */
    redrawRef.current = drawFrame;

    /* ~30fps governor — skipped ticks neither simulate nor draw, but the
     * next rAF is always requested so the loop itself never stalls. */
    let lastTick = -1;
    const step = (now: number) => {
      if (now - lastTick < TICK_MS) {
        raf = requestAnimationFrame(step);
        return;
      }
      lastTick = now;
      for (const n of nodes) {
        /* anchors wander very slowly — the field never repeats */
        n.ax += (Math.random() - 0.5) * 0.05;
        n.ay += (Math.random() - 0.5) * 0.05;
        if (n.ax < 0) n.ax = 0;
        else if (n.ax > w) n.ax = w;
        if (n.ay < 0) n.ay = 0;
        else if (n.ay > h) n.ay = h;

        /* spring toward the anchor */
        n.vx += (n.ax - n.x) * 0.0012;
        n.vy += (n.ay - n.y) * 0.0012;

        /* gentle pointer repulsion */
        const dx = n.x - mouse.x;
        const dy = n.y - mouse.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < MOUSE_PUSH * MOUSE_PUSH && d2 > 0.01) {
          const d = Math.sqrt(d2);
          const f = (1 - d / MOUSE_PUSH) * 0.3;
          n.vx += (dx / d) * f;
          n.vy += (dy / d) * f;
        }

        n.vx *= 0.92;
        n.vy *= 0.92;
        n.x += n.vx;
        n.y += n.vy;
      }
      drawFrame();
      raf = requestAnimationFrame(step);
    };

    const setRunning = (on: boolean) => {
      if (reduced) return; /* static frame only */
      if (on && !running) {
        running = true;
        raf = requestAnimationFrame(step);
      } else if (!on && running) {
        running = false;
        cancelAnimationFrame(raf);
      }
    };

    const syncRunning = () => setRunning(heroVisible && !document.hidden);

    const resize = () => {
      const rect = host.getBoundingClientRect();
      dpr = Math.min(1.5, window.devicePixelRatio || 1);
      w = Math.max(1, Math.round(rect.width));
      h = Math.max(1, Math.round(rect.height));
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      seed();
      measureQuiet();
      if (reduced) drawFrame(); /* keep the static frame current */
    };

    const onPointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };
    const onPointerOut = (e: PointerEvent) => {
      if (!e.relatedTarget) {
        mouse.x = -9999;
        mouse.y = -9999;
      }
    };

    const ro = new ResizeObserver(resize);
    ro.observe(host);

    /* Keep the quiet zone honest: the copy block's rect changes when fonts
     * swap in, when the language (label widths) changes, or when the hero
     * entrance transform settles — a ResizeObserver on the copy element
     * covers the layout cases; two delayed re-measures cover the transform
     * (entrance) and late font-display:swap cases. */
    const copyEl = document.getElementById("top")?.querySelector<HTMLElement>("[data-hero-copy]");
    const copyRo = copyEl ? new ResizeObserver(measureQuiet) : null;
    copyRo?.observe(copyEl!);
    const settle1 = window.setTimeout(measureQuiet, 900);
    const settle2 = window.setTimeout(measureQuiet, 2000);

    const io = new IntersectionObserver(
      (entries) => {
        heroVisible = entries[0].isIntersecting;
        syncRunning();
      },
      { rootMargin: "80px" }
    );
    io.observe(host);

    if (!reduced) {
      window.addEventListener("pointermove", onPointerMove, { passive: true });
      window.addEventListener("pointerout", onPointerOut, { passive: true });
    }
    document.addEventListener("visibilitychange", syncRunning);

    resize();
    syncRunning();

    return () => {
      redrawRef.current = null;
      setRunning(false);
      ro.disconnect();
      io.disconnect();
      copyRo?.disconnect();
      window.clearTimeout(settle1);
      window.clearTimeout(settle2);
      if (!reduced) {
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("pointerout", onPointerOut);
      }
      document.removeEventListener("visibilitychange", syncRunning);
      canvas.remove();
    };
  }, [enabled]);

  if (!enabled) return null;
  return <div ref={hostRef} className="pointer-events-none absolute inset-0 z-0" aria-hidden="true" />;
}
