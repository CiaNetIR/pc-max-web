"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { useLanguage } from "@/components/pcmax/language-context";
import { Section, SectionHeading } from "@/components/pcmax/ui/primitives";
import {
  GamepadIcon,
  GpuIcon,
  WindowsIcon,
  LogoMark,
  PerformanceIcon,
  iconMap,
} from "@/components/pcmax/icons";
import { springFluid } from "@/components/pcmax/ui/motion";
import { cn } from "@/lib/utils";

const nodeIcons = [GamepadIcon, GpuIcon, WindowsIcon, LogoMark, PerformanceIcon];

/* Discipline tick rhythm — each discipline's checklist keeps its own
 * muted tick accent: Detect → teal (default), Optimize → amber, Protect →
 * crimson (v2.8: softened — semantic color that whispers). */
const tickTone = ["", "tick-gold", "tick-crimson"] as const;

/*
 * WHAT PC MAX DOES — one section (IA merge, audit 29-b: what-is and features
 * taught the same concept twice, ~2,100px apart with heavy copy reuse).
 *
 * Part 1 — the pipeline (what the platform is): five numbered surface cards
 * in a 3 + 2 grid on lg, staggered whileInView reveals, every numeral in
 * the single crimson accent (v2.8: the gold "outcome node" special-case
 * is retired — one accent, stated once per card). The connector-spine
 * timeline is long gone (that spine was the "line crossing the 01–05 items"
 * bug source behind Task 25).
 *
 * Part 2 — the disciplines (how it works): three quiet editorial rows —
 * Detect → Optimize → Protect — hairline-separated, ring-inset icon chips,
 * display numerals, tri-color tick rhythm. Split layout alternates sides on
 * lg+, stacks on mobile.
 *
 * The merged section owns the #features anchor (navbar link + scroll-spy
 * target unchanged); the old standalone features.tsx is deleted.
 */
export function WhatIsPcMax() {
  const { t } = useLanguage();

  return (
    <Section id="features">
      {/* Part 1 — the platform pipeline */}
      <SectionHeading eyebrow={t.pipeline.eyebrow} title={t.pipeline.title} desc={t.pipeline.desc} />

      <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {t.pipeline.nodes.map((node, i) => {
          const Icon = nodeIcons[i] ?? PerformanceIcon;
          return (
            <motion.li
              key={`pipeline-node-${i}`}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "0px 0px -60px 0px" }}
              transition={{ ...springFluid, delay: 0.05 + i * 0.06 }}
              className="gc-card p-6"
            >
              {/* HUD row — display numeral (start) + icon chip (end) */}
              <div className="flex items-center justify-between gap-3">
                <span className="font-display text-[13px] font-bold tabular-nums text-crimson">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-crimson/10 text-crimson ring-1 ring-inset ring-crimson/25">
                  <Icon className="h-5 w-5" />
                </span>
              </div>

              <h3 className="type-title font-display mt-4 text-lg font-bold text-foreground">
                {node.label}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{node.desc}</p>
            </motion.li>
          );
        })}
      </ol>

      {/* Part 2 — the three disciplines. A compact mid-section heading
       * (not a second full SectionHeading) keeps one visual owner per band
       * while the editorial rows below carry the depth. */}
      <div className="mt-20 border-t border-border/60 pt-16 text-center sm:mt-24 sm:pt-20">
        <h3 className="type-display font-display text-[clamp(22px,2.6vw,30px)] font-bold text-foreground">
          {t.features.title}
        </h3>
        <p className="type-lead mx-auto mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">
          {t.features.desc}
        </p>
      </div>

      <div className="mx-auto mt-10 max-w-6xl sm:mt-12">
        {t.features.groups.map((group, i) => {
          const Icon = iconMap[group.icon] ?? iconMap.gpu;
          const flip = i % 2 === 1;
          return (
            <motion.article
              key={group.title}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "0px 0px -60px 0px" }}
              transition={{ ...springFluid, delay: 0.04 }}
              className={cn(
                "relative py-10 sm:py-12",
                i > 0 && "border-t border-border/60"
              )}
            >
              <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-16">
                {/* intro side */}
                <div className={cn(flip && "lg:order-2")}>
                  <div className="flex items-center gap-4">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-crimson/10 text-crimson ring-1 ring-inset ring-crimson/25">
                      <Icon className="h-6 w-6" />
                    </span>
                    <span className="font-display text-[13px] font-bold tabular-nums text-crimson">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <h4 className="type-title font-display mt-5 text-2xl font-bold text-foreground sm:text-3xl">
                    {group.title}
                  </h4>
                  <p className="type-lead mt-3 max-w-md text-sm text-muted-foreground sm:text-base">
                    {group.desc}
                  </p>
                </div>

                {/* checklist side */}
                <ul className={cn("space-y-4 lg:space-y-5", flip && "lg:order-1")}>
                  {group.items.map((item, j) => (
                    <motion.li
                      key={item}
                      initial={{ opacity: 0, x: flip ? -12 : 12 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, margin: "0px 0px -40px 0px" }}
                      transition={{ ...springFluid, delay: 0.08 + j * 0.06 }}
                      className="flex items-start gap-3.5 text-sm leading-relaxed text-muted-foreground sm:text-[15px]"
                    >
                      <span className={cn("tick mt-0.5", tickTone[i % tickTone.length])}>
                        <Check className="h-3 w-3" strokeWidth={3.5} />
                      </span>
                      {item}
                    </motion.li>
                  ))}
                </ul>
              </div>
            </motion.article>
          );
        })}
      </div>
    </Section>
  );
}
