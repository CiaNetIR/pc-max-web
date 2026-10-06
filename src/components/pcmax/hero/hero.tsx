"use client";

import { Fragment, useRef, type CSSProperties, type ReactNode } from "react";
import { motion, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import { ArrowDown, ArrowRight, Check } from "lucide-react";
import { useLanguage } from "@/components/pcmax/language-context";
import { DownloadIcon } from "@/components/pcmax/icons";
import { useLatestAppRelease } from "@/hooks/use-app-release";
import { asset } from "@/lib/gh-pages";
import { cn } from "@/lib/utils";

/*
 * Guardian hero (reference word-reveal landing): a centered copy stack —
 * chamfered kicker pill, masked word-reveal headline, lead, tick bullets,
 * TweakFa CTA row, compat-style trust strip — over a gradient-bezel
 * framed "app window" stage with static HUD fact chips, plus one ambient
 * glow orb and rising sparks behind the stage (Task 42-B2, globals v3.0).
 *
 * Progressive enhancement: the whole copy block is server-rendered. The
 * word-reveal runs purely in CSS — gated on `html.fx-on`, which the
 * layout's inline script adds synchronously before first paint (never
 * for reduced-motion visitors). No-JS / reduced-motion: no gate, no
 * transform — plain visible words, zero CLS, because the mask boxes
 * occupy their final space either way.
 */

/* One headline line split into word-reveal masks (Wave A contract):
 * `<span class="w"><span class="wi">word</span></span>` — each word
 * rises out of its overflow mask with a per-word `--wd` delay once
 * `html.fx-on` is on <html> (see globals.css). `base` continues the
 * stagger across lines so the headline reads as one sweep; the split
 * spans are aria-hidden while the accessible string rides the h1's
 * aria-label. `accentClassName` colors the second line. */
function WordLine({
  text,
  base = 0,
  accentClassName,
}: {
  text: string;
  base?: number;
  accentClassName?: string;
}) {
  const words = text.split(" ").filter(Boolean);
  return (
    <span className="block" aria-hidden="true">
      {words.map((word, i) => (
        <Fragment key={`${word}-${i}`}>
          {i > 0 && " "}
          <span className="w">
            <span
              className={cn("wi", accentClassName)}
              style={{ "--wd": `${base + i * 80}ms` } as CSSProperties}
            >
              {word}
            </span>
          </span>
        </Fragment>
      ))}
    </span>
  );
}

/* Rising motes (Wave A `.spark` contract): per-instance vars — origin
 * (--x/--y), size --s, loop --t (22–27s, never equal), delay --d, drift
 * --dx/--dy, pulse --p, tint --sc (crimson default, `254,219,41` = gold)
 * and peak opacity --so. Non-integer durations keep them out of sync
 * with each other and with the orb's 23.41s drift loop. */
const SPARKS = [
  { x: "10%", y: "86%", s: "4px", t: "23.11s", d: "-2.1s", dx: "24px", dy: "-330px", p: "3.13s", sc: "255,59,48", so: ".65" },
  { x: "24%", y: "92%", s: "3px", t: "23.69s", d: "-7.4s", dx: "-30px", dy: "-420px", p: "4.27s", sc: "255,59,48", so: ".55" },
  { x: "38%", y: "80%", s: "5px", t: "24.31s", d: "-13.9s", dx: "18px", dy: "-360px", p: "3.71s", sc: "255,59,48", so: ".6" },
  { x: "52%", y: "95%", s: "3px", t: "24.93s", d: "-5.2s", dx: "-22px", dy: "-460px", p: "5.09s", sc: "254,219,41", so: ".5" },
  { x: "68%", y: "84%", s: "4px", t: "25.57s", d: "-18.6s", dx: "28px", dy: "-390px", p: "4.61s", sc: "255,59,48", so: ".6" },
  { x: "86%", y: "90%", s: "3px", t: "26.23s", d: "-9.8s", dx: "-16px", dy: "-440px", p: "3.37s", sc: "254,219,41", so: ".5" },
] as const;

/* Magnetic — the CTA drifts toward the pointer while it hovers (spring
 * physics, ±~10px max), settling back dead-center on leave. Reduced-motion
 * and touch visitors get the plain inline wrapper (no motion values).
 * The drift is pure transform — it composes with the button's own hover
 * lift and never moves the layout. */
function Magnetic({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion() ?? false;
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const x = useSpring(mx, { stiffness: 300, damping: 20, mass: 0.5 });
  const y = useSpring(my, { stiffness: 300, damping: 20, mass: 0.5 });

  if (reduce) return <div className="inline-flex">{children}</div>;

  return (
    <motion.div
      ref={ref}
      style={{ x, y }}
      className="inline-flex"
      onMouseMove={(e) => {
        const el = ref.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        mx.set((e.clientX - (r.left + r.width / 2)) * 0.28);
        my.set((e.clientY - (r.top + r.height / 2)) * 0.28);
      }}
      onMouseLeave={() => {
        mx.set(0);
        my.set(0);
      }}
    >
      {children}
    </motion.div>
  );
}

export function Hero() {
  const { t, isRTL } = useLanguage();
  const reduce = useReducedMotion();
  /* Scroll parallax (Task 38 motion pass): as the hero scrolls out, the
   * copy drifts up slowly and the stage slower still + fades — depth
   * without autonomous motion (scroll-linked = direct manipulation, so
   * it stays for reduced-motion users too... except framer collapses
   * transforms for them via MotionConfig, so gate explicitly to keep
   * the exit clean). Transform/opacity only — zero layout work. */
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const copyY = useTransform(scrollYProgress, [0, 1], [0, 44]);
  const stageY = useTransform(scrollYProgress, [0, 1], [0, 96]);
  const stageO = useTransform(scrollYProgress, [0, 0.85], [1, 0.35]);
  const parallax = reduce ? undefined : { y: copyY };
  const stageParallax = reduce ? undefined : { y: stageY, opacity: stageO };

  /* Real app version — KNOWN_LATEST baseline paints with the SSR HTML and
   * upgrades live from the app repo's GitHub releases after hydration
   * (Task 32: one shared request per page view, never a stale number). */
  const { release } = useLatestAppRelease();

  /* Word-reveal stagger: line 2 continues 80ms/word after line 1 so the
   * headline animates as one choreographed sweep. */
  const line1Words = t.hero.title1.split(" ").filter(Boolean).length;

  /* Trust strip items — the compat-strip presentation (hairline panel +
   * success dots) replaces the old "a · b · c" sentence; every segment's
   * text is kept verbatim, only the separator glyph became layout. */
  const trustItems = t.hero.trustLine
    .split("·")
    .map((item) => item.trim())
    .filter(Boolean);

  return (
    <section
      ref={heroRef}
      id="top"
      className="relative overflow-hidden pt-[clamp(96px,12vw,140px)] pb-16 sm:pb-24"
    >
      {/* ambient layer (Task 42 §3): one crimson glow orb drifting behind
       * the stage side + six rising motes. Decorative only — aria-hidden,
       * pointer-dead, clipped to the hero; globals kills the loops under
       * reduced-motion / reduced-transparency. Negative z keeps it behind
       * the copy and the opaque stage panel no matter what transforms
       * framer holds at rest. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <div
          className="glow dA"
          style={{ width: 480, height: 480, top: "52%", insetInlineStart: "-170px" }}
        />
        {SPARKS.map((spark) => (
          <span
            key={spark.x}
            className="spark"
            style={
              {
                "--x": spark.x,
                "--y": spark.y,
                "--s": spark.s,
                "--t": spark.t,
                "--d": spark.d,
                "--dx": spark.dx,
                "--dy": spark.dy,
                "--p": spark.p,
                "--sc": spark.sc,
                "--so": spark.so,
              } as CSSProperties
            }
          >
            <i />
          </span>
        ))}
      </div>

      {/* copy stack */}
      <motion.div style={parallax}>
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
        {/* kicker — chamfered TweakFa pill (globals v3.0); version injected
            from the live release store so it can never drift from the
            installer the download button fetches */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <span className="kicker">{t.hero.kicker.replace("{version}", release.version)}</span>
        </motion.div>

        {/* headline — word-reveal; accessible text lives on the h1 label,
         * the split spans are hidden from the a11y tree. The whole second
         * line keeps its solid-crimson accent (text-glow-crimson). */}
        <h1
          aria-label={`${t.hero.title1} ${t.hero.title2}`}
          className="type-display font-display font-bold leading-tight text-[clamp(30px,4.4vw,54px)] sm:text-[clamp(34px,5vw,58px)]"
        >
          <WordLine text={t.hero.title1} />
          <WordLine
            text={t.hero.title2}
            base={line1Words * 80}
            accentClassName="text-glow-crimson"
          />
        </h1>

        {/* lead */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
          className="mx-auto mt-5 max-w-2xl text-balance text-[15.5px] leading-[1.6] text-muted-foreground sm:text-lg sm:leading-[1.6]"
        >
          {t.hero.sub}
        </motion.p>

        {/* bullets — a bare centered feature row (v2.8: no box chrome —
            the checks sit directly on the canvas like an editorial deck) */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.42, ease: "easeOut" }}
          className="gc-check-strip mt-8 flex flex-wrap items-center justify-center gap-x-7 gap-y-3 text-sm text-muted-foreground"
        >
          {t.hero.bullets.map((bullet) => (
            <span key={bullet} className="flex items-center gap-2.5">
              <span className="tick">
                <Check className="h-3 w-3" strokeWidth={3.5} />
              </span>
              {bullet}
            </span>
          ))}
        </motion.div>

        {/* CTAs — real anchors (#download / #install): the browser's native
         * in-page navigation does the scrolling — CSS scroll-behavior + its
         * prefers-reduced-motion override + the sections' scroll-mt-24 — so
         * no JS handler is needed (audit 29-a D7). Magnetic wrapper drifts
         * them toward the pointer (Task 38 motion pass). Geometry (46px /
         * radius 12 / 14.5-700) now ships with the .gc-btn-* classes. */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.54, ease: "easeOut" }}
          className="mt-10 flex flex-wrap items-center justify-center gap-4"
        >
          <Magnetic>
          <a
            href="#download"
            className="gc-btn-primary press inline-flex items-center gap-2.5"
          >
            <DownloadIcon className="h-5 w-5" aria-hidden="true" />
            {t.hero.primary}
          </a>
          </Magnetic>
          <Magnetic>
          <a
            href="#install"
            className="gc-btn-ghost press group inline-flex items-center gap-2"
          >
            {t.hero.secondary}
            <ArrowRight
              aria-hidden="true"
              className={cn(
                "text-lg transition-transform duration-300",
                isRTL ? "rotate-180 group-hover:-translate-x-1" : "group-hover:translate-x-1"
              )}
            />
          </a>
          </Magnetic>
        </motion.div>

        {/* trust strip — the verifiable platform facts under the CTA pair
         * (audit 29-b: Free/OS/arch stated once, near the primary action),
         * restyled as the TweakFa compat strip: hairline surface panel +
         * success-dot items. Text unchanged — the "·" separators became
         * the panel's item layout. */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.66, ease: "easeOut" }}
          className="mx-auto mt-6 flex w-fit max-w-full flex-wrap items-center justify-center gap-x-6 gap-y-2 rounded-[14px] bg-[#121216] px-6 py-3.5 text-[13.5px] text-muted-foreground shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]"
        >
          {trustItems.map((item) => (
            <span key={item} className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className="h-1.5 w-1.5 flex-none rounded-full bg-success-gc"
              />
              {item}
            </span>
          ))}
        </motion.div>
      </div>
      </motion.div>

      {/* THE STAGE — framed app-window over artwork. An interface PREVIEW,
       * never a live feed: the badge says so, the chips carry static,
       * verifiable product facts (version / platform / distribution source)
       * instead of fabricated FPS/GPU/PING telemetry (audit 29-b D2), and
       * the caption under the frame keeps the framing honest. The key art
       * is Ghost — Call of Duty's masked operator, one of the most
       * instantly recognizable characters in gaming (Task 33) — served
       * with a hand-rolled srcSet like the gallery (unoptimized static
       * export). The .gc-frame bezel (globals v3.0) draws the crimson
       * gradient ring through its clamp()'d padding. */}
      <motion.div style={stageParallax} className="mt-12 px-4 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      >
        <div className="gc-frame mx-auto max-w-4xl">
          <div className="overflow-hidden bg-[#121216]">
            {/* app-window chrome */}
            <div className="flex items-center gap-2 px-4 py-3">
              <span
                aria-hidden="true"
                className="h-2.5 w-2.5 rounded-full bg-[#e8352c] opacity-80"
              />
              <span
                aria-hidden="true"
                className="h-2.5 w-2.5 rounded-full bg-[#e08a00] opacity-80"
              />
              <span
                aria-hidden="true"
                className="h-2.5 w-2.5 rounded-full bg-[#1fbf9c] opacity-80"
              />
              <span className="ms-2 flex-1 text-start text-xs font-semibold text-muted-foreground">
                PC MAX
              </span>
              <span className="rounded-full bg-[rgba(255,255,255,0.08)] px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                {t.hero.stage.badge}
              </span>
            </div>

            {/* media + fact chips — decorative (the facts are stated
             * verbatim in the download card; chips are visual shorthand) */}
            <div className="relative aspect-[16/10] overflow-hidden">
              <img
                src={asset("/games/ghost.webp")}
                srcSet={`${asset("/games/ghost-480.webp")} 480w, ${asset("/games/ghost-672.webp")} 672w, ${asset("/games/ghost.webp")} 840w`}
                sizes="(max-width: 640px) calc(100vw - 2rem), (max-width: 944px) calc(100vw - 3rem), 896px"
                alt=""
                loading="eager"
                decoding="async"
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div
                aria-hidden="true"
                className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#08080a]/80 to-transparent"
              />

              {/* fact chips — VER / WIN / GITHUB — static, verifiable; v2.8:
                 all values render white (labels stay muted) — the data
                 reads as one calm readout, no tri-color soup */}
              <div
                aria-hidden="true"
                className="gc-hud-chip pointer-events-none absolute top-[6%] start-[4%] flex items-baseline gap-2 px-3.5 py-2"
              >
                <span className="text-[10px] font-bold tracking-wider text-muted-foreground">
                  VER
                </span>
                <b className="font-display text-xl font-bold tabular-nums text-white">
                  {release.version}
                </b>
              </div>
              <div
                aria-hidden="true"
                className="gc-hud-chip pointer-events-none absolute top-[6%] end-[4%] flex items-baseline gap-2 px-3.5 py-2"
              >
                <span className="text-[10px] font-bold tracking-wider text-muted-foreground">
                  WIN
                </span>
                <b className="font-display text-xl font-bold tabular-nums text-white">10/11</b>
              </div>
              <div
                aria-hidden="true"
                className="gc-hud-chip pointer-events-none absolute bottom-[6%] end-[4%] flex items-baseline gap-2 px-3.5 py-2"
              >
                <span className="text-[10px] font-bold tracking-wider text-muted-foreground">
                  GITHUB
                </span>
                <b className="font-display text-xl font-bold tabular-nums text-white">
                  ✓
                </b>
              </div>
            </div>
          </div>
        </div>
        <p className="gc-logline mx-auto mt-3 max-w-4xl text-center">
          {t.hero.stage.caption}
        </p>
      </motion.div>
      </motion.div>

      {/* scroll hint — content-flow below the stage (hero is no longer
       * 100svh), pointing at the first content section; a real anchor —
       * native in-page navigation + CSS smooth scroll like the CTAs. The
       * tile is the 40px .gc-btn-icon circle (Wave A risk #1 fix). */}
      <motion.a
        href="#showcase"
        className="press type-eyebrow mx-auto mt-12 flex w-fit flex-col items-center gap-1.5 text-[10px] font-semibold uppercase text-muted-foreground transition-colors hover:text-foreground"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6, duration: 1 }}
        aria-label={t.hero.hint}
      >
        {t.hero.hint}
        <motion.span
          animate={reduce ? {} : { y: [0, 7, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          className="gc-btn-ghost gc-btn-icon flex items-center justify-center"
        >
          <ArrowDown className="h-4 w-4" aria-hidden="true" />
        </motion.span>
      </motion.a>
    </section>
  );
}
