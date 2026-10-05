"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Gauge, Info } from "lucide-react";
import { useLanguage } from "@/components/pcmax/language-context";
import { Section, SectionHeading, AnimatedCounter } from "@/components/pcmax/ui/primitives";
import { BackupIcon } from "@/components/pcmax/icons";
import { springFluid } from "@/components/pcmax/ui/motion";
import { cn } from "@/lib/utils";

/*
 * System Safety — one calm two-pane section.
 * Pane A: Windows Optimizer (inset stat tiles + reversible-note footnote).
 * Pane B: Backup & Restore (numbered vertical safety timeline, 01→04).
 * Replaces the old windows-optimizer bento + backup-restore timeline.
 *
 * Timeline geometry (logical props, RTL-safe): each li carries `ps-8` so the
 * absolutely-positioned node (`start-0` resolves against the li's padding box,
 * i.e. the gutter start) sits at 0px while text starts at 32px; the connector
 * `start-[13px]` on the <ol> threads the 28px node centers (0..28 → 14px).
 */

export function SystemSafety() {
  const { t } = useLanguage();
  const reduce = useReducedMotion();

  const steps = t.safety.backup.steps;
  const lastStep = steps.length - 1;

  return (
    <Section id="safety" className="relative overflow-hidden">
      {/* the single soft ambient wash behind the two panes */}
      <div
        className="pointer-events-none absolute inset-x-0 top-56 mx-auto h-72 w-[640px] max-w-none rounded-full bg-crimson/[0.04] blur-[110px] sm:top-64"
        aria-hidden="true"
      />

      <SectionHeading
        align="start"
        eyebrow={t.safety.eyebrow}
        title={t.safety.title}
        desc={t.safety.desc}
      />

      <div className="grid grid-cols-1 gap-5 sm:gap-6 lg:grid-cols-2">
        {/* ----------------------- Pane A · Windows Optimizer ----------------------- */}
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={springFluid}
          className="card-ios rounded-3xl bg-card p-6 sm:p-8 lg:p-10"
        >
          <div className="flex items-start gap-4 sm:gap-5">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-crimson/10 text-crimson">
              <Gauge className="h-6 w-6" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="type-eyebrow text-[11px] font-semibold uppercase text-crimson">
                {t.safety.optimizer.eyebrow}
              </p>
              <h3 className="type-title mt-1.5 font-display text-xl font-bold text-foreground sm:text-2xl">
                {t.safety.optimizer.title}
              </h3>
              <p className="type-lead mt-3 max-w-lg text-sm text-muted-foreground sm:text-base">
                {t.safety.optimizer.desc}
              </p>
            </div>
          </div>

          {/* Apple-style inset stat tiles */}
          <div className="mt-8 grid grid-cols-2 gap-4">
            {t.safety.optimizer.stats.map((stat) => (
              <div
                key={stat.label}
                className="card-ios rounded-3xl bg-background/40 p-5"
              >
                <AnimatedCounter
                  value={stat.value}
                  suffix={stat.suffix}
                  className="font-display text-3xl font-extrabold tabular-nums text-foreground"
                />
                <p className="mt-1 text-xs text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* reversibility footnote */}
          <p className="mt-6 flex items-center gap-2 border-t border-border/60 pt-4 text-xs text-muted-foreground">
            <Info className="h-3.5 w-3.5 shrink-0 text-crimson/60" aria-hidden="true" />
            {t.safety.optimizer.note}
          </p>
        </motion.div>

        {/* ----------------------- Pane B · Backup & Restore ------------------------ */}
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ ...springFluid, delay: 0.1 }}
          className="card-ios rounded-3xl bg-card p-6 sm:p-8 lg:p-10"
        >
          <div className="flex items-start gap-4 sm:gap-5">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-crimson/10 text-crimson">
              <BackupIcon className="h-6 w-6" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="type-eyebrow text-[11px] font-semibold uppercase text-crimson">
                {t.safety.backup.eyebrow}
              </p>
              <h3 className="type-title mt-1.5 font-display text-xl font-bold text-foreground sm:text-2xl">
                {t.safety.backup.title}
              </h3>
              <p className="type-lead mt-3 max-w-lg text-sm text-muted-foreground sm:text-base">
                {t.safety.backup.desc}
              </p>
            </div>
          </div>

          {/* vertical safety timeline: Backup → Optimize → Verify → Restore */}
          <ol className="relative mt-8 space-y-5">
            <span
              className="absolute start-[13px] top-2 bottom-2 w-px bg-border"
              aria-hidden="true"
            />
            {steps.map((step, i) => (
              <motion.li
                key={step.title}
                initial={reduce ? false : { opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ ...springFluid, delay: 0.18 + i * 0.08 }}
                className="relative ps-8"
              >
                <span
                  className={cn(
                    "absolute start-0 top-0 flex h-7 w-7 items-center justify-center rounded-full font-mono text-[11px] font-bold",
                    i === lastStep
                      ? "specular border border-crimson bg-crimson text-white"
                      : "glass text-crimson"
                  )}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h4 className="type-title font-display text-sm font-bold text-foreground">{step.title}</h4>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                  {step.desc}
                </p>
              </motion.li>
            ))}
          </ol>
        </motion.div>
      </div>
    </Section>
  );
}
