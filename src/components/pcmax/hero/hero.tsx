"use client";

import { Fragment, useEffect, useState, type CSSProperties } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowDown, ArrowRight, Check } from "lucide-react";
import { useLanguage } from "@/components/pcmax/language-context";
import { DownloadIcon } from "@/components/pcmax/icons";
import { APP_VERSION, asset } from "@/lib/gh-pages";
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

  return (
    <section
      id="top"
      className="relative overflow-hidden pt-[clamp(96px,12vw,140px)] pb-16 sm:pb-24"
    >
      {/* copy stack */}
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
        {/* kicker — version injected from APP_VERSION (Task 28-c/C1) so it
            can never drift from the shipped installer again */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <span className="kicker">{t.hero.kicker.replace("{version}", APP_VERSION)}</span>
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

        {/* CTAs — real anchors (#download / #install): the browser's native
         * in-page navigation does the scrolling — CSS scroll-behavior + its
         * prefers-reduced-motion override + the sections' scroll-mt-24 — so
         * no JS handler is needed (audit 29-a D7). */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.54, ease: "easeOut" }}
          className="mt-10 flex flex-wrap items-center justify-center gap-4"
        >
          <a
            href="#download"
            className="gc-btn-primary press group inline-flex h-[52px] items-center gap-2.5 rounded-xl px-7 text-[15px] font-bold text-white"
          >
            <DownloadIcon className="h-5 w-5" aria-hidden="true" />
            {t.hero.primary}
          </a>
          <a
            href="#install"
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

        {/* trust line — the verifiable platform facts under the CTA pair
         * (audit 29-b: Free/OS/arch stated once, near the primary action) */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.66, ease: "easeOut" }}
          className="mt-5 text-[13px] font-medium tracking-wide text-muted-foreground"
        >
          {t.hero.trustLine}
        </motion.p>
      </div>

      {/* THE STAGE — framed app-window over artwork. An interface PREVIEW,
       * never a live feed: the badge says so, the chips carry static,
       * verifiable product facts (version / installer size / checksum
       * policy) instead of fabricated FPS/GPU/PING telemetry (audit 29-b
       * D2), and the caption under the frame keeps the framing honest. */}
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
              <span className="rounded-full bg-[rgba(255,255,255,0.08)] px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                {t.hero.stage.badge}
              </span>
            </div>

            {/* media + fact chips — decorative (the facts are stated
             * verbatim in the download card; chips are visual shorthand) */}
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

              {/* fact chips — VER / SIZE / SHA — static, verifiable */}
              <div
                aria-hidden="true"
                className="gc-hud-chip hud-drift pointer-events-none absolute top-[6%] start-[4%] flex items-baseline gap-2 px-3.5 py-2"
              >
                <span className="text-[10px] font-bold tracking-wider text-muted-foreground">
                  VER
                </span>
                <b className="font-display text-xl font-bold tabular-nums text-[#1fbf9c]">
                  {APP_VERSION}
                </b>
              </div>
              <div
                aria-hidden="true"
                className="gc-hud-chip hud-drift-2 pointer-events-none absolute top-[6%] end-[4%] flex items-baseline gap-2 px-3.5 py-2"
              >
                <span className="text-[10px] font-bold tracking-wider text-muted-foreground">
                  WIN
                </span>
                <b className="font-display text-xl font-bold tabular-nums text-white">10/11</b>
              </div>
              <div
                aria-hidden="true"
                className="gc-hud-chip hud-drift-3 pointer-events-none absolute bottom-[6%] end-[4%] flex items-baseline gap-2 px-3.5 py-2"
              >
                <span className="text-[10px] font-bold tracking-wider text-muted-foreground">
                  SHA-256
                </span>
                <b className="font-display text-xl font-bold tabular-nums text-[#fedb29]">
                  ✓
                </b>
              </div>
            </div>
          </div>
        </div>
        <p className="mx-auto mt-3 max-w-4xl text-center text-xs text-muted-foreground/80">
          {t.hero.stage.caption}
        </p>
      </motion.div>

      {/* scroll hint — content-flow below the stage (hero is no longer
       * 100svh), pointing at the first content section; a real anchor —
       * native in-page navigation + CSS smooth scroll like the CTAs */}
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
          className="gc-btn-ghost flex h-9 w-9 items-center justify-center rounded-full"
        >
          <ArrowDown className="h-4 w-4" />
        </motion.span>
      </motion.a>
    </section>
  );
}
