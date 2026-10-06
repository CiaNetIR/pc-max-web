"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { useLanguage } from "@/components/pcmax/language-context";
import { Section, SectionHeading } from "@/components/pcmax/ui/primitives";
import { springFluid } from "@/components/pcmax/ui/motion";
import { iconMap } from "@/components/pcmax/icons";
import { cn } from "@/lib/utils";

/*
 * Features — three disciplines, told as three quiet editorial rows instead
 * of a wall of cards: Detect → Optimize → Protect. Guardian re-skin
 * (Task 26-d1): hairline-separated rows, ring-inset icon chips, display
 * numerals, and a tri-color tick rhythm — teal / gold / violet per group.
 * Server-rendered content, whileInView animation only (opacity / small y).
 * Split layout alternates sides on lg+, stacks on mobile.
 */

/* Guardian tri-color rhythm — each discipline's checklist keeps its own
 * tick accent: Detect → teal (default), Optimize → gold, Protect → violet. */
const tickTone = ["", "tick-gold", "tick-violet"] as const;

export function Features() {
  const { t } = useLanguage();

  return (
    <Section id="features" className="relative overflow-hidden">
      <SectionHeading
        eyebrow={t.features.eyebrow}
        title={t.features.title}
        desc={t.features.desc}
        align="start"
      />

      <div className="mx-auto mt-14 max-w-6xl sm:mt-16">
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
                  <h3 className="type-title font-display mt-5 text-2xl font-bold text-foreground sm:text-3xl">
                    {group.title}
                  </h3>
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
