"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, ChevronDown } from "lucide-react";
import { useLanguage } from "@/components/pcmax/language-context";
import { Section, SectionHeading, Reveal } from "@/components/pcmax/ui/primitives";
import { springFluid } from "@/components/pcmax/ui/motion";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Benchmarks — the TweakFa "uv-frame" before/after comparison        */
/*  presentation (Task 42-B6): one framed panel (gc-card, radius-18    */
/*  feel, reference .uv-frame) with hairline-divided rows of          */
/*  label | before → after. Values are Poppins tabular digits with    */
/*  unit chips, delta chips carry the computed gain, and the meter    */
/*  bars stay solid crimson on quiet tint tracks.                     */
/*  Section 37: +34% → few samples → view-all.                        */
/* ------------------------------------------------------------------ */

const VISIBLE = 3;

/* meter rails are quiet tint tracks; the after fill stays one solid
   crimson statement (the before fill keeps its muted semantics) */
const BAR_TRACK = "mt-2 h-2 min-w-0 overflow-hidden rounded-full bg-foreground/[0.07] sm:h-2.5";
const BEFORE_FILL = "h-full rounded-full bg-foreground/30";
const AFTER_FILL = "h-full rounded-full bg-crimson";
/* unit + delta chips — display face, tabular digits */
const UNIT_BEFORE =
  "rounded-full bg-white/[0.05] px-2 py-0.5 text-[10.5px] font-semibold leading-none text-muted-foreground";
const UNIT_AFTER =
  "rounded-full bg-crimson/10 px-2 py-0.5 text-[10.5px] font-semibold leading-none text-crimson";
const DELTA_CHIP =
  "inline-flex shrink-0 items-center rounded-[10px] bg-crimson/10 px-2.5 py-1 font-display text-xs font-bold tabular-nums text-crimson ring-1 ring-inset ring-crimson/25";

/* the comparison row grid — mobile stacks the label above a
   [before | → | after] triple; ≥md it becomes the 4-column uv-row.
   The head row inside the frame reuses the same templates so the
   column labels sit exactly over the value columns. */
const ROW_GRID =
  "grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-x-3 gap-y-3 border-b border-white/[0.08] py-4 md:grid-cols-[minmax(140px,1fr)_minmax(0,1.5fr)_auto_minmax(0,1.5fr)] md:gap-x-4 md:py-5 lg:gap-x-6";
/* same column templates, no row chrome — the frame's head row */
const ROW_HEAD_GRID =
  "grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-x-3 md:grid-cols-[minmax(140px,1fr)_minmax(0,1.5fr)_auto_minmax(0,1.5fr)] md:gap-x-4 lg:gap-x-6";

/** A single animated bar filling its track. Renders its final width when
 *  reduced motion is on. */
function Bar({
  pct,
  delay,
  className,
  reduce,
}: {
  pct: string;
  delay: number;
  className: string;
  reduce: boolean;
}) {
  if (reduce) {
    return <div className={className} style={{ width: pct }} aria-hidden="true" />;
  }
  return (
    <motion.div
      className={className}
      initial={{ width: "0%" }}
      whileInView={{ width: pct }}
      viewport={{ once: true, margin: "0px 0px -40px 0px" }}
      transition={{ ...springFluid, delay }}
      aria-hidden="true"
    />
  );
}

/** One before/after value cell — tabular display digits with a unit chip
 *  over a tint meter rail (the fill animates via <Bar/>). */
function ValueCell({
  value,
  label,
  unit,
  chip,
  tone,
  pct,
  delay,
  fill,
  reduce,
}: {
  value: number;
  label: string;
  unit: string;
  chip: string;
  tone: string;
  pct: string;
  delay: number;
  fill: string;
  reduce: boolean;
}) {
  return (
    <div className="min-w-0">
      {/* dir="ltr" keeps the Latin digits + "fps" unit in reading order
          inside RTL Persian copy (site convention) */}
      <span dir="ltr" className="flex items-baseline gap-2 whitespace-nowrap">
        <span className="sr-only">{label}: </span>
        <b
          className={cn(
            "font-display text-xl font-bold tabular-nums leading-none sm:text-2xl",
            tone
          )}
        >
          {value}
        </b>
        <span className={chip}>{unit}</span>
      </span>
      <div className={BAR_TRACK}>
        <Bar pct={pct} delay={delay} className={fill} reduce={reduce} />
      </div>
    </div>
  );
}

type BenchGame = { name: string; before: number; after: number };

/** One benchmark row — shared by the always-visible list and the
 *  expandable remainder so both stay pixel-identical. */
function BenchRow({
  game,
  delay,
  pctBefore,
  pctAfter,
  reduce,
}: {
  game: BenchGame;
  delay: number;
  pctBefore: string;
  pctAfter: string;
  reduce: boolean;
}) {
  const { t, isRTL } = useLanguage();
  const gain = Math.round(((game.after - game.before) / game.before) * 100);
  /* the comparison arrow always points from the "before" column toward
   * the "after" column — leftward in RTL, rightward in LTR */
  const Arrow = isRTL ? ArrowLeft : ArrowRight;

  return (
    <li className={ROW_GRID}>
      {/* label cell — game title with the delta chip beneath (beside it
       * on mobile). dir="ltr" on the chip keeps "+38%" intact in RTL. */}
      <div className="col-span-3 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1.5 md:col-span-1 md:flex-col md:items-start">
        <h3 className="type-title min-w-0 flex-1 truncate font-display text-sm font-bold text-foreground sm:text-base md:w-full md:flex-none">
          {game.name}
        </h3>
        <span dir="ltr" className={DELTA_CHIP}>
          +{gain}%
        </span>
      </div>

      <ValueCell
        value={game.before}
        label={t.bench.beforeLabel}
        unit={t.bench.unit}
        chip={UNIT_BEFORE}
        tone="text-muted-foreground"
        pct={pctBefore}
        delay={delay}
        fill={BEFORE_FILL}
        reduce={reduce}
      />

      <Arrow
        className="h-4 w-4 justify-self-center text-muted-foreground/60 sm:h-5 sm:w-5"
        aria-hidden="true"
      />

      <ValueCell
        value={game.after}
        label={t.bench.afterLabel}
        unit={t.bench.unit}
        chip={UNIT_AFTER}
        tone="text-crimson"
        pct={pctAfter}
        delay={delay + 0.12}
        fill={AFTER_FILL}
        reduce={reduce}
      />
    </li>
  );
}

export function Benchmarks() {
  const { t } = useLanguage();
  const reduce = useReducedMotion() ?? false;
  const [showAll, setShowAll] = useState(false);

  const games = t.bench.games;
  const maxAfter = Math.max(...games.map((game) => game.after));
  const toPct = (value: number): string =>
    `${Math.round((value / maxAfter) * 1000) / 10}%`;

  /* Headline tiles: the average uplift plus the top games' measured gains —
   * every number derives from the same bench data the rows below chart. */
  const headline: { value: string; label: string }[] = [
    { value: t.bench.avg, label: t.bench.avgLabel },
    ...games.slice(0, 3).map((game) => ({
      value: `+${Math.round(((game.after - game.before) / game.before) * 100)}%`,
      label: game.name,
    })),
  ];

  return (
    <Section id="benchmarks">
      <SectionHeading
        eyebrow={t.bench.eyebrow}
        title={t.bench.title}
        desc={t.bench.desc}
        align="center"
      />

      {/* Headline numbers — gc-stat tiles (display face, tabular digits) */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {headline.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={reduce ? false : { opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "0px 0px -40px 0px" }}
            transition={{ ...springFluid, delay: i * 0.06 }}
            className="gc-stat gc-card p-6 text-center"
          >
            {/* dir="ltr" keeps "+34%" / "+38%" intact inside RTL copy;
                tabular-nums keeps the digits optically steady */}
            <b dir="ltr" className="block font-display text-3xl font-bold tabular-nums">
              {stat.value}
            </b>
            <span className="mt-1 block text-[13px] text-muted-foreground">
              {stat.label}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Comparison frame — reference .uv-frame: one framed panel,
          hairline rows, column heads over the before/after values. */}
      <div className="relative mt-10 sm:mt-12">
        <Reveal y={32}>
          {/* radius-18 feel per the uv-frame reference (gc-card default
              is 16 — the inline value wins without fighting utilities) */}
          <div
            className="gc-card px-4 pb-5 pt-4 sm:px-6 sm:pb-6 sm:pt-5"
            style={{ borderRadius: 18 }}
          >
            {/* Column heads — the before/after legend sits over its value
                columns (mobile: over the [before | → | after] triple) */}
            <div className={cn(ROW_HEAD_GRID, "border-b border-white/[0.08] pb-3")}>
              <span className="hidden md:block" aria-hidden="true" />
              <span className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                <span className="h-2 w-2 rounded-full bg-foreground/30" aria-hidden="true" />
                {t.bench.beforeLabel}
              </span>
              <span aria-hidden="true" />
              <span className="flex items-center gap-2 text-xs font-bold text-crimson">
                <span className="h-2 w-2 rounded-full bg-crimson" aria-hidden="true" />
                {t.bench.afterLabel}
              </span>
            </div>

            {/* Rows — a few examples first */}
            <ul
              role="list"
              aria-label={`${t.bench.eyebrow}: ${t.bench.avgLabel} ${t.bench.avg}`}
              className="flex flex-col"
            >
              {games.slice(0, VISIBLE).map((game, i) => (
                <BenchRow
                  key={game.name}
                  game={game}
                  delay={i * 0.07}
                  pctBefore={toPct(game.before)}
                  pctAfter={toPct(game.after)}
                  reduce={reduce}
                />
              ))}
            </ul>

            {/* The remaining rows — one 200ms height expand away. The rows
                stay in the DOM (SSR/SEO) but are clipped + inert when hidden. */}
            {games.length > VISIBLE && (
              <motion.div
                id="bench-extra"
                initial={false}
                animate={{ height: showAll ? "auto" : 0, opacity: showAll ? 1 : 0 }}
                transition={reduce ? { duration: 0 } : { duration: 0.2, ease: "easeOut" }}
                className="overflow-hidden"
                aria-hidden={!showAll}
                inert={!showAll}
              >
                <ul role="list" className="flex flex-col">
                  {games.slice(VISIBLE).map((game, i) => (
                    <BenchRow
                      key={game.name}
                      game={game}
                      delay={(VISIBLE + i) * 0.07}
                      pctBefore={toPct(game.before)}
                      pctAfter={toPct(game.after)}
                      reduce={reduce}
                    />
                  ))}
                </ul>
              </motion.div>
            )}

            {/* View-all — the rest of the bench, one tap away. The gc
                button owns its geometry (46px / radius 12 / 14.5px). */}
            {games.length > VISIBLE && (
              <button
                type="button"
                onClick={() => setShowAll((v) => !v)}
                aria-expanded={showAll}
                aria-controls="bench-extra"
                className="gc-btn-ghost mx-auto mt-6 flex items-center gap-2"
              >
                {showAll ? t.bench.viewLess : t.bench.viewAll}
                <ChevronDown
                  className={cn("h-4 w-4 transition-transform duration-300", showAll && "rotate-180")}
                  aria-hidden="true"
                />
              </button>
            )}

            {/* Methodology + illustrative-data disclosure — the per-game rows
             * are examples; only the headline average is a measured figure
             * (audit 29-b D6: unsourced pairs must be labeled as such).
             * Text kept byte-identical; presentation = uv-note (centered,
             * dim, gc-logline's "//" console marker). */}
            <p className="gc-logline mx-auto mt-6 max-w-2xl text-center leading-relaxed">
              {t.bench.gamesNote}{" "}
              {t.bench.note}
            </p>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
