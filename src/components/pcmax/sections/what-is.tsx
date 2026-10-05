"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useLanguage } from "@/components/pcmax/language-context";
import { Section, SectionHeading } from "@/components/pcmax/ui/primitives";
import { GamepadIcon, GpuIcon, WindowsIcon, LogoMark, PerformanceIcon } from "@/components/pcmax/icons";
import { springFluid } from "@/components/pcmax/ui/motion";
import { cn } from "@/lib/utils";

const nodeIcons = [GamepadIcon, GpuIcon, WindowsIcon, LogoMark, PerformanceIcon];

export function WhatIsPcMax() {
  const { t } = useLanguage();
  /* Only used to keep the destination pulse still for motion-sensitive
   * users — the reveal spring itself is fine either way (our reduced-motion
   * CSS zeroes its duration). */
  const reduce = useReducedMotion();

  return (
    <Section id="what-is" className="overflow-hidden">
      <SectionHeading eyebrow={t.pipeline.eyebrow} title={t.pipeline.title} desc={t.pipeline.desc} />

      <ol className="space-y-10 sm:space-y-14">
        {t.pipeline.nodes.map((node, i) => {
          const Icon = nodeIcons[i] ?? PerformanceIcon;
          const isLast = i === t.pipeline.nodes.length - 1;
          const desktopSide = i % 2 === 0 ? "start" : "end"; // alternating on lg+

          return (
            <li key={`pipeline-node-${i}`} className="relative ps-16 lg:ps-0">
              {/* spine node — the destination node softly pulses, forever.
                  NOTE: initial scale/y values are deliberately NON-zero-area
                  (Task 25): a scale(0) initial collapses the element's
                  IntersectionObserver rect to a zero-area point — Chrome
                  then reports isIntersecting=false forever and whileInView
                  never fires, leaving the node permanently invisible (the
                  bug behind "a line crossing over these items"). */}
              <motion.span
                initial={{ scale: 0.55, opacity: 0, y: 10 }}
                whileInView={{ scale: 1, opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "0px 0px -100px 0px" }}
                transition={springFluid}
                className="glass absolute start-0 top-1 z-10 flex h-[52px] w-[52px] items-center justify-center rounded-2xl lg:start-[calc(50%-26px)]"
              >
                <Icon className={cn("h-6 w-6", isLast ? "text-crimson" : "text-crimson/80")} />
                {isLast && !reduce && (
                  <motion.span
                    initial={{ scale: 0.92, opacity: 0.55 }}
                    animate={{ scale: 1.55, opacity: 0 }}
                    transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut" }}
                    className="absolute inset-0 rounded-2xl border border-crimson/50"
                    aria-hidden="true"
                  />
                )}
              </motion.span>

              {/* vertical connector — a short segment drawn in the gap
                  between this node and the next one (Task 25: the old
                  continuous scroll-drawn spine crossed the whole list as
                  one hot line and, shining through the frosted-glass chips,
                  tinted them pink — segments read as connectors instead). */}
              {!isLast && (
                <motion.span
                  initial={{ scaleY: 0.08, opacity: 0 }}
                  whileInView={{ scaleY: 1, opacity: 1 }}
                  viewport={{ once: true, margin: "0px 0px -80px 0px" }}
                  transition={{ ...springFluid, delay: 0.2 }}
                  className="absolute start-[26px] top-[60px] bottom-[-41px] w-px origin-top bg-gradient-to-b from-crimson/35 to-crimson/10 sm:bottom-[-57px] lg:start-1/2"
                  aria-hidden="true"
                />
              )}

              {/* horizontal connector (lg+: node → card on its side) —
                  same zero-area rule: scaleX starts at 0.06, not 0 */}
              <motion.span
                initial={{ scaleX: 0.06, opacity: 0 }}
                whileInView={{ scaleX: 1, opacity: 1 }}
                viewport={{ once: true, margin: "0px 0px -100px 0px" }}
                transition={{ ...springFluid, delay: 0.15 }}
                className={cn(
                  "absolute top-[26px] hidden h-px w-[calc(50%-40px)] bg-crimson/40 lg:block",
                  desktopSide === "start" ? "start-0" : "end-0"
                )}
                aria-hidden="true"
              />

              {/* card */}
              <motion.div
                initial={{ opacity: 0, y: 32, x: 0 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "0px 0px -100px 0px" }}
                transition={{ ...springFluid, delay: 0.1 }}
                className={cn(
                  "lg:w-[calc(50%-70px)]",
                  desktopSide === "start" ? "lg:me-auto" : "lg:ms-auto"
                )}
              >
                <div
                  className={cn(
                    "card-ios group rounded-3xl bg-card p-5 transition-transform duration-300 hover:-translate-y-1 sm:p-6",
                    isLast && "bg-gradient-to-br from-crimson/[0.06] to-transparent dark:from-crimson/[0.09]"
                  )}
                >
                  <div className="flex items-baseline gap-3">
                    <span className="font-mono text-[11px] font-bold text-crimson">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <h3 className="type-title font-display text-lg font-bold text-foreground sm:text-xl">
                      {node.label}
                    </h3>
                  </div>
                  <p className="type-lead mt-2 text-sm text-muted-foreground">{node.desc}</p>
                </div>
              </motion.div>
            </li>
          );
        })}
      </ol>
    </Section>
  );
}
