"use client";

import dynamic from "next/dynamic";
import { Component, useEffect, useState, type ReactNode } from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowDown, ArrowRight } from "lucide-react";
import { useLanguage } from "@/components/pcmax/language-context";
import { MagneticButton } from "@/components/pcmax/ui/primitives";
import { GpuIcon, DownloadIcon } from "@/components/pcmax/icons";
import { asset } from "@/lib/gh-pages";
import { springFluid } from "@/components/pcmax/ui/motion";

/*
 * Progressive-enhancement contract (performance first):
 *
 *   Every viewport : hero copy + CTAs render in the initial HTML.
 *   ≥ 640px        : the WebGL GPU starts loading only once the browser is
 *                    idle AFTER first paint (requestIdleCallback, ~1.1s
 *                    worst-case timeout) — the ~860KB three.js chunk never
 *                    competes with hydration or the first paints.
 *   ≥ 1024px       : the constellation field initializes behind it.
 *   < 640px (phone): NO GPU 3D, NO constellation — the dynamic import is
 *                    never triggered, no canvas exists, no rAF runs. The
 *                    hero is copy + CTAs + a pure-CSS brand emblem.
 *
 * Layer order (z): constellation (0) → atmosphere overlays (1) → readability
 * scrim (2) → GPU visual (3) → content (10). Background layers are
 * pointer-events-none and never block CTAs.
 */

/* Progressive enhancement: no fake loading skeleton — the hero copy and
 * CTAs are already fully rendered while the (desktop-only, idle-deferred)
 * scene chunk streams in; the canvas then fades in at its steady-state pose
 * (see the motion.div wrapper below), so loading never reads as a blink or
 * jump. The import below is only *triggered* when `deferred3d` flips (idle
 * callback) AND the ≥640px tier gate passes — see the effect in Hero(). */
const GpuScene = dynamic(() => import("./gpu-scene").then((m) => m.GpuScene), {
  ssr: false,
  loading: () => null,
});

class SceneErrorBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    /* WebGL unavailable — intentional fallback below */
  }
  render() {
    if (this.state.failed) return this.props.fallback;
    return this.props.children;
  }
}

/* ------------------------- Responsive scene gate ---------------------- */

type ViewportTier = "unknown" | "phone" | "wide";

/* "unknown" until hydration — the server and the first client paint render
 * no device-specific visual at all, so phones never pay for the desktop
 * experience and desktop never flashes the phone fallback. */
function useViewportTier(): ViewportTier {
  const [tier, setTier] = useState<ViewportTier>("unknown");
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const update = () => setTier(mq.matches ? "phone" : "wide");
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return tier;
}

/* ≥1024px — the only viewport where the constellation may exist at all. */
function useIsLargeViewport(): boolean {
  const [large, setLarge] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => setLarge(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return large;
}

const ConstellationBackground = dynamic(
  () => import("./constellation-background").then((m) => m.ConstellationBackground),
  { ssr: false }
);

/* Living brand emblem — floating logo + counter-rotating rings (pure CSS). */
function MobileEmblem() {
  return (
    <div
      className="pointer-events-none absolute inset-x-0 bottom-20 z-[1] flex justify-center"
      aria-hidden="true"
    >
      <div className="relative h-36 w-36">
        <div className="absolute -inset-10 rounded-full bg-crimson/20 blur-3xl dark:bg-crimson/25" />
        <svg className="emblem-ring absolute -inset-5" viewBox="0 0 100 100" fill="none">
          <circle
            cx="50"
            cy="50"
            r="48.5"
            stroke="currentColor"
            strokeWidth="0.7"
            strokeDasharray="7 6"
            className="text-crimson/50"
          />
        </svg>
        <svg className="emblem-ring-rev absolute -inset-2.5" viewBox="0 0 100 100" fill="none">
          <circle
            cx="50"
            cy="50"
            r="49"
            stroke="currentColor"
            strokeWidth="0.5"
            strokeDasharray="2 7"
            className="text-crimson/35"
          />
        </svg>
        <div className="emblem-float relative h-full w-full">
          <Image
            src={asset("/brand/pcmax-logo-256.png")}
            alt=""
            width={144}
            height={144}
            priority
            className="h-full w-full rounded-full ring-1 ring-border/40"
          />
        </div>
      </div>
    </div>
  );
}

const headlineVariants = {
  hidden: {},
  show: (stagger: number) => ({
    transition: { staggerChildren: stagger, delayChildren: 0.15 },
  }),
};

/* Snappy one-time entrance: a short rise + soft de-blur, sprung in with the
 * critically-damped system spring — content is visible quickly, the reveal
 * itself stays subtle and never replays. */
const lineVariants = {
  hidden: { opacity: 0, y: 30, filter: "blur(6px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: springFluid,
  },
};

export function Hero() {
  const { t, isRTL } = useLanguage();
  const reduce = useReducedMotion();
  const tier = useViewportTier();
  const isLarge = useIsLargeViewport();

  /* GPU visual: tablet/desktop only — on phones the dynamic import above
   * is never triggered, so three.js is never downloaded or initialized. */
  const showGpu = tier === "wide";

  /* Idle-deferred 3D (performance contract): the three.js stack is ~862KB of
   * JS and must never start downloading during hydration or the first
   * paints — copy, CTAs and the (cheap canvas-2D) constellation are the
   * critical path. `deferred3d` flips once the browser reports itself idle
   * after paint; the hard timeout (~1.1s) guarantees slow or busy machines
   * still get the card reasonably fast, and Safari (no requestIdleCallback)
   * falls back to a ~900ms timer. The dynamic import is only triggered when
   * this is true AND the ≥640px tier gate passes — on phones the flip is a
   * harmless no-op state change (nothing renders from it). */
  const [deferred3d, setDeferred3d] = useState(false);
  useEffect(() => {
    const kick = () => setDeferred3d(true);
    let idleHandle: number | null = null;
    let timerHandle: ReturnType<typeof setTimeout> | null = null;
    if (typeof window.requestIdleCallback === "function") {
      idleHandle = window.requestIdleCallback(kick, { timeout: 1100 });
    } else {
      timerHandle = setTimeout(kick, 900);
    }
    return () => {
      if (idleHandle !== null) window.cancelIdleCallback(idleHandle);
      if (timerHandle !== null) clearTimeout(timerHandle);
    };
  }, []);

  /* The heavy chunk + canvas mount only after BOTH the tier gate and the
   * idle deferral pass. Timing change only — layer stack, fade-in wrapper
   * and fallback chain are identical to the pre-deferral behavior. */
  const mountGpu = showGpu && deferred3d;

  /* Attention order (premium restraint): headline → value proposition →
   * primary CTA → GPU → background. No badge, no metadata chips — the
   * hero carries one message and two actions. */
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <section id="top" className="relative min-h-[100svh] overflow-hidden">
      {/* L0 — constellation field (desktop-only background texture; the
       * component itself refuses to initialize below 1024px) */}
      {isLarge && <ConstellationBackground />}

      {/* L1 — layered atmosphere */}
      <div className="pointer-events-none absolute inset-0 z-[1] bg-grid [mask-image:radial-gradient(ellipse_75%_65%_at_50%_40%,black,transparent)]" aria-hidden="true" />
      <div className="pointer-events-none absolute -top-48 start-1/2 z-[1] hidden h-[420px] w-[780px] max-w-none -translate-x-1/2 rounded-full bg-crimson/20 blur-[150px] dark:block" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-40 bg-gradient-to-t from-background to-transparent" aria-hidden="true" />

      {/* L2 — readability scrim over the background layers (sits BELOW the
       * GPU so the card is never veiled; only the constellation is calmed) */}
      <div className="hero-scrim pointer-events-none absolute inset-0 z-[2]" aria-hidden="true" />

      {/* L3 — WebGL GPU (≥640px, idle-deferred). Transparent canvas over the
       * constellation; never mounted on phones, never fetched during
       * hydration. Falls back to a branded glyph if WebGL is unavailable. */}
      {mountGpu && (
        /* Smooth loading→ready handoff: opacity-only fade (never transform,
         * so it cannot compound with the scene's single transform source in
         * useFrame). Once complete it stays at 1 forever — the GPU can only
         * be veiled by nothing. */
        <motion.div
          className="absolute inset-0 z-[3]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: reduce ? 0 : 0.8, ease: "easeOut" }}
          aria-hidden="true"
        >
          <SceneErrorBoundary
            fallback={
              <div className="flex h-full w-full items-center justify-center text-crimson/60">
                <GpuIcon className="h-44 w-44 sm:h-60 sm:w-60" strokeWidth={0.8} />
              </div>
            }
          >
            <GpuScene flip={isRTL} />
          </SceneErrorBoundary>
        </motion.div>
      )}
      {/* accessible description of the decorative 3D product view — kept
       * in sync with the card itself (absent until it mounts) */}
      {mountGpu && <p className="sr-only">{t.hero.gpuAlt}</p>}

      {/* phone hero — pure-CSS emblem, mounted after hydration on phones */}
      {tier === "phone" && <MobileEmblem />}

      {/* L4 — content */}
      <div className="relative z-10 mx-auto flex min-h-[100svh] max-w-7xl flex-col justify-center px-4 pb-40 pt-28 sm:px-6 sm:pt-32 lg:flex-col lg:justify-center lg:px-8 lg:pb-24">
        {/* data-hero-copy marks the readable block (headline, sub, CTAs) —
         * the constellation keeps a soft quiet zone around it (see
         * constellation-background.tsx). Presentation-only attribute:
         * language switching just re-measures the rect, never state. */}
        <motion.div
          data-hero-copy
          className="max-w-2xl"
          variants={headlineVariants}
          custom={0.12}
          initial="hidden"
          animate="show"
        >
          {/* headline */}
          <h1 className="type-display font-display font-extrabold">
            <motion.span variants={lineVariants} className="type-display block text-5xl text-foreground sm:text-7xl lg:text-8xl">
              {t.hero.title1}
            </motion.span>
            <motion.span
              variants={lineVariants}
              className="text-glow-crimson glow-crimson type-display block pb-2 text-5xl sm:text-7xl lg:text-8xl"
            >
              {t.hero.title2}
            </motion.span>
          </h1>

          {/* subheadline */}
          <motion.p variants={lineVariants} className="type-lead mt-6 max-w-xl text-base text-muted-foreground sm:text-lg">
            {t.hero.sub}
          </motion.p>

          {/* CTAs */}
          <motion.div variants={lineVariants} className="mt-9 flex flex-wrap items-center gap-4">
            {/* Real anchors (#download / #install) so the CTAs carry link
             * semantics — middle-click / copy-link / "link" role — while the
             * click handler keeps the existing smooth (reduced-motion aware)
             * in-page scroll instead of the browser's instant jump. */}
            <MagneticButton
              asChild
              size="lg"
              className="btn-convex group h-13 rounded-full px-7 text-sm font-semibold text-white sm:text-base"
            >
              <a
                href="#download"
                onClick={(e) => {
                  e.preventDefault();
                  scrollTo("download");
                }}
              >
                <DownloadIcon className="me-2 h-5 w-5 transition-transform duration-300 group-hover:translate-y-0.5" />
                {t.hero.primary}
              </a>
            </MagneticButton>
            <MagneticButton
              asChild
              size="lg"
              variant="outline"
              className="btn-glass group h-13 rounded-full px-7 text-sm font-semibold text-foreground transition-colors hover:border-crimson/50 hover:text-crimson sm:text-base"
            >
              <a
                href="#install"
                onClick={(e) => {
                  e.preventDefault();
                  scrollTo("install");
                }}
              >
                {t.hero.secondary}
                <ArrowRight className={`ms-2 text-lg transition-transform duration-300 ${isRTL ? "rotate-180 group-hover:-translate-x-1" : "group-hover:translate-x-1"}`} />
              </a>
            </MagneticButton>
          </motion.div>
        </motion.div>
      </div>

      {/* scroll hint */}
      <motion.button
        type="button"
        onClick={() => scrollTo("what-is")}
        className="press type-eyebrow group absolute inset-x-0 bottom-6 z-10 mx-auto flex w-fit flex-col items-center gap-1.5 text-[10px] font-semibold uppercase text-muted-foreground transition-colors hover:text-crimson"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6, duration: 1 }}
        aria-label={t.hero.hint}
      >
        {t.hero.hint}
        <motion.span
          animate={reduce ? {} : { y: [0, 7, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          className="glass flex h-9 w-9 items-center justify-center rounded-full"
        >
          <ArrowDown className="h-4 w-4" />
        </motion.span>
      </motion.button>
    </section>
  );
}
