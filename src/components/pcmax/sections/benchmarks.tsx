"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useLanguage } from "@/components/pcmax/language-context";
import { Section, SectionHeading, Reveal } from "@/components/pcmax/ui/primitives";
import { springFluid } from "@/components/pcmax/ui/motion";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Benchmarks — one number that matters, a few examples, then the   */
/*  rest one tap away. Section 37: +34% → few samples → view-all.     */
/* ------------------------------------------------------------------ */

const VISIBLE = 3;

const BEFORE_BAR =
  "h-2.5 rounded-full bg-foreground/15 dark:bg-foreground/20 sm:h-3";
const AFTER_BAR =
  "h-2.5 rounded-full bg-gradient-to-r from-crimson-deep via-crimson to-crimson-bright rtl:bg-gradient-to-l sm:h-3";
const CHIP =
  "glass inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold text-foreground";
const VALUE =
  "w-16 shrink-0 whitespace-nowrap text-end font-mono text-[11px] font-bold tabular-nums";

/** A single animated bar. Renders its final width when reduced motion is on. */
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
  const { t } = useLanguage();
  const gain = Math.round(((game.after - game.before) / game.before) * 100);

  return (
    <li className="card-ios grid grid-cols-1 gap-3 rounded-2xl bg-background/40 p-4 sm:grid-cols-[180px_1fr_auto] sm:items-center sm:gap-5 sm:p-5">
      <h3 className="type-title min-w-0 truncate font-display text-sm font-bold text-foreground sm:text-base">
        {game.name}
      </h3>

      {/* Stacked before / after bars */}
      <div className="flex min-w-0 flex-col">
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <Bar pct={pctBefore} delay={delay} className={BEFORE_BAR} reduce={reduce} />
          </div>
          <span className={`${VALUE} text-muted-foreground`}>
            <span className="sr-only">{t.bench.beforeLabel}: </span>
            {game.before} {t.bench.unit}
          </span>
        </div>

        <div className="mt-1.5 flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <Bar pct={pctAfter} delay={delay + 0.12} className={AFTER_BAR} reduce={reduce} />
          </div>
          <span className={`${VALUE} text-crimson`}>
            <span className="sr-only">{t.bench.afterLabel}: </span>
            {game.after} {t.bench.unit}
          </span>
        </div>
      </div>

      {/* Gain badge — Latin numerals, keep LTR inside RTL copy */}
      <span
        dir="ltr"
        className="justify-self-start whitespace-nowrap rounded-full border border-crimson/25 bg-crimson/10 px-2.5 py-1 font-mono text-xs font-bold tabular-nums text-crimson"
      >
        +{gain}%
      </span>
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

  return (
    <Section id="benchmarks">
      <SectionHeading
        eyebrow={t.bench.eyebrow}
        title={t.bench.title}
        desc={t.bench.desc}
        align="center"
      />

      {/* Hero stat — the one number that matters (dir=ltr keeps "+34%" intact in RTL) */}
      <Reveal y={16} className="mb-12 text-center sm:mb-16">
        <p className="type-eyebrow text-[11px] font-semibold uppercase text-muted-foreground">
          {t.bench.avgLabel}
        </p>
        <p dir="ltr" className="type-display mt-3 font-display text-5xl font-extrabold text-crimson sm:text-7xl">
          {t.bench.avg}
        </p>
      </Reveal>

      {/* Chart canvas */}
      <div className="relative">
        {/* ambient — a very soft crimson halo behind the card */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -inset-4 rounded-[3rem] bg-crimson/[0.04] blur-[100px] sm:-inset-6"
        />

        <Reveal y={32}>
          <div className="card-ios relative rounded-3xl bg-card p-6 sm:p-10">
            {/* Legend */}
            <div className="mb-6 flex flex-wrap items-center gap-2 sm:mb-8 sm:gap-3">
              <span className={CHIP}>
                <span
                  className="h-2 w-2 rounded-full bg-foreground/30 dark:bg-foreground/40"
                  aria-hidden="true"
                />
                {t.bench.beforeLabel}
              </span>
              <span className={CHIP}>
                <span className="h-2 w-2 rounded-full bg-crimson" aria-hidden="true" />
                {t.bench.afterLabel}
              </span>
            </div>

            {/* Rows — a few examples first */}
            <ul
              role="list"
              aria-label={`${t.bench.eyebrow}: ${t.bench.avgLabel} ${t.bench.avg}`}
              className="flex flex-col gap-4 sm:gap-5"
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
                <ul role="list" className="flex flex-col gap-4 pt-4 sm:gap-5 sm:pt-5">
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

            {/* View-all — the rest of the bench, one tap away */}
            {games.length > VISIBLE && (
              <button
                type="button"
                onClick={() => setShowAll((v) => !v)}
                aria-expanded={showAll}
                aria-controls="bench-extra"
                className="press group mx-auto mt-7 flex items-center gap-2 rounded-full border border-border/70 bg-background/40 px-5 py-2.5 text-xs font-bold text-muted-foreground transition-colors hover:border-crimson/40 hover:text-crimson"
              >
                {showAll ? t.bench.viewLess : t.bench.viewAll}
                <ChevronDown
                  className={cn("h-4 w-4 transition-transform duration-300", showAll && "rotate-180")}
                  aria-hidden="true"
                />
              </button>
            )}

            {/* Methodology */}
            <p className="card-ios mt-8 max-w-2xl rounded-2xl bg-background/40 p-4 text-xs leading-relaxed text-muted-foreground sm:p-5">
              {t.bench.note}
            </p>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
