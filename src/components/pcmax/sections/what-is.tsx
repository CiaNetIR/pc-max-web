"use client";

import { motion } from "framer-motion";
import { useLanguage } from "@/components/pcmax/language-context";
import { Section, SectionHeading } from "@/components/pcmax/ui/primitives";
import { GamepadIcon, GpuIcon, WindowsIcon, LogoMark, PerformanceIcon } from "@/components/pcmax/icons";
import { springFluid } from "@/components/pcmax/ui/motion";
import { cn } from "@/lib/utils";

const nodeIcons = [GamepadIcon, GpuIcon, WindowsIcon, LogoMark, PerformanceIcon];

/* Guardian pipeline grid (Task 26-d1): the connector-spine timeline is GONE —
 * no vertical/horizontal motion connectors, no absolute-positioned node chips
 * (that spine was the "line crossing over the 01–05 items" bug source behind
 * Task 25). What remains is the Guardian card language: five numbered surface
 * cards in a 3 + 2 grid on lg, staggered whileInView reveals, and the fifth
 * card — the outcome node — closing the sequence in gold. */
export function WhatIsPcMax() {
  const { t } = useLanguage();

  return (
    <Section id="what-is">
      <SectionHeading eyebrow={t.pipeline.eyebrow} title={t.pipeline.title} desc={t.pipeline.desc} />

      <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {t.pipeline.nodes.map((node, i) => {
          const Icon = nodeIcons[i] ?? PerformanceIcon;
          /* the last node — "Optimized Experience" — is the outcome: it
           * closes the pipeline in gold instead of violet. */
          const isLast = i === t.pipeline.nodes.length - 1;

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
                <span
                  className={cn(
                    "font-display text-[13px] font-bold tabular-nums",
                    isLast ? "text-[#fedb29]" : "text-crimson"
                  )}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span
                  className={cn(
                    "flex h-11 w-11 items-center justify-center rounded-xl ring-1 ring-inset",
                    isLast
                      ? "bg-[rgba(254,219,41,0.13)] text-[#fedb29] ring-[rgba(254,219,41,0.3)]"
                      : "bg-crimson/10 text-crimson ring-crimson/25"
                  )}
                >
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
    </Section>
  );
}
