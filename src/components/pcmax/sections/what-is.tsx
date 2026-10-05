"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useLanguage } from "@/components/pcmax/language-context";
import { Section, SectionHeading } from "@/components/pcmax/ui/primitives";
import { GamepadIcon, GpuIcon, WindowsIcon, LogoMark, PerformanceIcon } from "@/components/pcmax/icons";
import { springFluid } from "@/components/pcmax/ui/motion";
import { cn } from "@/lib/utils";

const nodeIcons = [GamepadIcon, GpuIcon, WindowsIcon, LogoMark, PerformanceIcon];

export function WhatIsPcMax() {
  const { t } = useLanguage();
  const timelineRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: timelineRef,
    offset: ["start 0.8", "end 0.55"],
  });

  const spineScale = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <Section id="what-is" className="overflow-hidden">
      <SectionHeading eyebrow={t.pipeline.eyebrow} title={t.pipeline.title} desc={t.pipeline.desc} />

      <div ref={timelineRef} className="relative mx-auto max-w-4xl">
        {/* the spine — draws itself with scroll */}
        <div className="absolute inset-y-0 start-[26px] w-px lg:start-1/2" aria-hidden="true">
          <div className="absolute inset-0 bg-border" />
          <motion.div
            style={{ scaleY: spineScale }}
            className="absolute inset-0 origin-top bg-gradient-to-b from-crimson-bright via-crimson to-crimson-deep"
          />
        </div>

        <ol className="space-y-10 sm:space-y-14">
          {t.pipeline.nodes.map((node, i) => {
            const Icon = nodeIcons[i] ?? PerformanceIcon;
            const isLast = i === t.pipeline.nodes.length - 1;
            const desktopSide = i % 2 === 0 ? "start" : "end"; // alternating on lg+

            return (
              <li key={node.label} className="relative ps-16 lg:ps-0">
                {/* spine node — pulses when reached */}
                <motion.span
                  initial={{ scale: 0, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={springFluid}
                  className="glass absolute start-0 top-1 z-10 flex h-[52px] w-[52px] items-center justify-center rounded-2xl lg:start-[calc(50%-26px)]"
                >
                  <Icon className={cn("h-6 w-6", isLast ? "text-crimson" : "text-crimson/80")} />
                </motion.span>

                {/* connector */}
                <motion.span
                  initial={{ scaleX: 0, opacity: 0 }}
                  whileInView={{ scaleX: 1, opacity: 1 }}
                  viewport={{ once: true, margin: "-100px" }}
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
                  viewport={{ once: true, margin: "-100px" }}
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
                      <span className="font-mono text-[11px] font-bold text-crimson/70">
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
      </div>
    </Section>
  );
}
