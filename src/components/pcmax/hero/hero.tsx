"use client";

import { Fragment, useEffect, useState, type CSSProperties } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowDown, ArrowRight, Check } from "lucide-react";
import { useLanguage } from "@/components/pcmax/language-context";
import { DownloadIcon } from "@/components/pcmax/icons";
import { asset } from "@/lib/gh-pages";
import { cn } from "@/lib/utils";

/*
 * Guardian hero (reference word-reveal landing): a centered copy stack —
 * kicker pill, masked word-reveal headline, lead, tick bullets, CTAs —
 * over a violet-gradient framed "app window" stage with drifting HUD
 * stat chips and a sheen sweep. The 3D GPU scene and constellation field
 * are retired for this design (files stay on disk, simply unimported);
 * the background grid + violet top glow come from the page-level .bgfx.
 *
 * Progressive enhancement: the whole copy block is server-rendered;
 * entrance motion is opacity/transform-only (covered by the
 * `html:not(.hydrated)` overrides) and the word-reveal masks are forced
 * open until hydration adds `.hydrated` (see globals.css).
 */

/* One headline line split into word-reveal masks (reference .w/.wi):
 * each word rises out of its overflow mask with a per-word `--wd` delay
 * once `landed` adds `.in`. `wordClassName` colors the second line. */
function WordLine({
  text,
  landed,
  wordClassName,
}: {
  text: string;
  landed: boolean;
  wordClassName?: string;
}) {
  const words = text.split(" ").filter(Boolean);
  return (
    <span className="block" aria-hidden="true">
      {words.map((word, i) => (
        <Fragment key={`${word}-${i}`}>
          {i > 0 && " "}
          <span className={cn("word", landed && "in")}>
            <span
              className={cn("wi", wordClassName)}
              style={{ "--wd": `${i * 70}ms` } as CSSProperties}
            >
              {word}
            </span>
          </span>
        </Fragment>
      ))}
    </span>
  );
}

export function Hero() {
  const { t, isRTL } = useLanguage();
  const reduce = useReducedMotion();

  /* Word-reveal landing: one rAF after mount flips `landed`, adding .in to
   * every .word so the split headline words rise in staggered. Pre-mount
   * (SSR + first paint) the masks are forced open by the
   * `html:not(.hydrated) .wi` override — no-JS visitors always see the
   * full headline. */
  const [landed, setLanded] = useState(false);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setLanded(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const scrollTo = (id: string) => {
    /* Programmatic smooth scrolling ignores the CSS reduced-motion
     * override, so respect the media query explicitly. */
    document.getElementById(id)?.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <section
      id="top"
      className="relative overflow-hidden pt-[clamp(96px,12vw,140px)] pb-16 sm:pb-24"
    >
      {/* copy stack */}
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
        {/* kicker */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <span className="kicker">{t.hero.kicker}</span>
        </motion.div>

        {/* headline — word-reveal; accessible text lives on the h1 label,
         * the split spans are hidden from the a11y tree */}
        <h1
          aria-label={`${t.hero.title1} ${t.hero.title2}`}
          className="type-display font-display font-extrabold leading-tight text-[clamp(30px,4.4vw,54px)] sm:text-[clamp(34px,5vw,58px)]"
        >
          <WordLine text={t.hero.title1} landed={landed} />
          <WordLine text={t.hero.title2} landed={landed} wordClassName="text-glow-crimson" />
        </h1>

        {/* lead */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
          className="mx-auto mt-5 max-w-2xl text-balance text-[15.5px] text-muted-foreground sm:text-lg"
        >
          {t.hero.sub}
        </motion.p>

        {/* bullets */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.42, ease: "easeOut" }}
          className="mt-8 flex flex-wrap items-center justify-center gap-x-7 gap-y-3 text-sm text-muted-foreground"
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

        {/* CTAs — real anchors (#download / #install) so the buttons carry
         * link semantics (middle-click / copy-link) while the click handler
         * keeps the reduced-motion-aware smooth in-page scroll */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.54, ease: "easeOut" }}
          className="mt-10 flex flex-wrap items-center justify-center gap-4"
        >
          <a
            href="#download"
            onClick={(e) => {
              e.preventDefault();
              scrollTo("download");
            }}
            className="gc-btn-primary press group inline-flex h-[52px] items-center gap-2.5 rounded-xl px-7 text-[15px] font-bold text-white"
          >
            <DownloadIcon className="h-5 w-5" aria-hidden="true" />
            {t.hero.primary}
          </a>
          <a
            href="#install"
            onClick={(e) => {
              e.preventDefault();
              scrollTo("install");
            }}
            className="gc-btn-ghost press group inline-flex h-[52px] items-center gap-2 rounded-xl px-7 text-[15px] font-bold"
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
        </motion.div>
      </div>

      {/* THE STAGE — framed app-window with live HUD chips. Sits below the
       * max-w-3xl copy stack as a sibling so its max-w-4xl width is not
       * capped by the narrower copy container. */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="mt-14 px-4 sm:px-6"
      >
        <div className="gc-frame media-sheen mx-auto max-w-4xl">
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
              <span className="rounded-full bg-[rgba(31,191,156,0.14)] px-2.5 py-0.5 text-[11px] font-bold text-[#1fbf9c]">
                LIVE
              </span>
            </div>

            {/* media + HUD overlay — decorative (stat glyphs are universal
             * hardware shorthand, not localized copy) */}
            <div className="relative aspect-[16/10] overflow-hidden">
              <img
                src={asset("/games/cyberpunk.webp")}
                alt=""
                loading="eager"
                decoding="async"
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div
                aria-hidden="true"
                className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#08080a]/80 to-transparent"
              />

              {/* HUD chips — FPS / GPU / PING */}
              <div
                aria-hidden="true"
                className="gc-hud-chip hud-drift pointer-events-none absolute top-[6%] start-[4%] flex items-baseline gap-2 px-3.5 py-2"
              >
                <span className="text-[10px] font-bold tracking-wider text-muted-foreground">
                  FPS
                </span>
                <b className="font-display text-xl font-bold tabular-nums text-[#1fbf9c]">142</b>
              </div>
              <div
                aria-hidden="true"
                className="gc-hud-chip hud-drift-2 pointer-events-none absolute top-[6%] end-[4%] flex items-baseline gap-2 px-3.5 py-2"
              >
                <span className="text-[10px] font-bold tracking-wider text-muted-foreground">
                  GPU
                </span>
                <b className="font-display text-xl font-bold tabular-nums text-white">61°C</b>
              </div>
              <div
                aria-hidden="true"
                className="gc-hud-chip hud-drift-3 pointer-events-none absolute bottom-[6%] end-[4%] flex items-baseline gap-2 px-3.5 py-2"
              >
                <span className="text-[10px] font-bold tracking-wider text-muted-foreground">
                  PING
                </span>
                <b className="font-display text-xl font-bold tabular-nums text-[#fedb29]">
                  4.2ms
                </b>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* scroll hint — content-flow below the stage (hero is no longer
       * 100svh), pointing at the first content section */}
      <motion.button
        type="button"
        onClick={() => scrollTo("what-is")}
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
          className="gc-btn-ghost flex h-9 w-9 items-center justify-center rounded-full"
        >
          <ArrowDown className="h-4 w-4" />
        </motion.span>
      </motion.button>
    </section>
  );
}
