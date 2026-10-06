"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Check, Gauge, TriangleAlert } from "lucide-react";
import { useLanguage } from "@/components/pcmax/language-context";
import { Section, SectionHeading, AnimatedCounter } from "@/components/pcmax/ui/primitives";
import { BackupIcon } from "@/components/pcmax/icons";
import { springFluid } from "@/components/pcmax/ui/motion";

/*
 * System Safety — one calm two-pane section on gc-card surfaces.
 * Pane A: Windows Optimizer (inset gc-stat tiles).
 * Pane B: Backup & Restore — the rollback guarantees as a compat-strip
 *         panel (reference .compat / .ticks, Task 42-B6): a hairline
 *         tinted strip of success-tick items. All safety copy kept.
 * Below both panes: the gold caveat strip (reference .caveat) carrying the
 * package-security warning.
 */

export function SystemSafety() {
  const { t } = useLanguage();
  const reduce = useReducedMotion();

  const steps = t.safety.backup.steps;

  return (
    <Section id="safety" className="relative overflow-hidden">
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
          viewport={{ once: true, margin: "0px 0px -60px 0px" }}
          transition={springFluid}
          className="gc-card p-6 sm:p-8 lg:p-10"
        >
          <div className="flex items-start gap-4 sm:gap-5">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-crimson/10 text-crimson ring-1 ring-inset ring-crimson/25">
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

          {/* inset stat tiles — count-up numerals on tinted tiles */}
          <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4">
            {t.safety.optimizer.stats.map((stat) => (
              <div
                key={stat.label}
                className="gc-stat rounded-xl bg-[#1b1b21]/70 p-4 text-center ring-1 ring-inset ring-white/[0.08] sm:p-5"
              >
                <b className="block font-display text-3xl font-bold">
                  <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                </b>
                <span className="mt-1 block text-[13px] text-muted-foreground">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ----------------------- Pane B · Backup & Restore ------------------------ */}
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "0px 0px -60px 0px" }}
          transition={{ ...springFluid, delay: 0.1 }}
          className="gc-card p-6 sm:p-8 lg:p-10"
        >
          <div className="flex items-start gap-4 sm:gap-5">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-crimson/10 text-crimson ring-1 ring-inset ring-crimson/25">
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

          {/* rollback guarantees — compat-strip pattern: a hairline tinted
              panel strip of success-tick items (Snapshot → Apply →
              Rollback → Restore); copy unchanged, the v2.8 numbered
              timeline nodes are retired */}
          <ol className="mt-8 grid gap-5 rounded-md bg-foreground/[0.03] p-5 ring-1 ring-inset ring-white/[0.07] sm:grid-cols-2 sm:gap-x-6 sm:p-6">
            {steps.map((step, i) => (
              <motion.li
                key={step.title}
                initial={reduce ? false : { opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "0px 0px -40px 0px" }}
                transition={{ ...springFluid, delay: 0.18 + i * 0.08 }}
                className="flex gap-3"
              >
                <span className="tick mt-0.5">
                  <Check className="h-3 w-3" strokeWidth={3.5} />
                </span>
                <div className="min-w-0">
                  <h4 className="type-title font-display text-sm font-bold text-foreground">{step.title}</h4>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                    {step.desc}
                  </p>
                </div>
              </motion.li>
            ))}
          </ol>
        </motion.div>
      </div>

      {/* caveat — the gold warning strip (reference .caveat). Reuses the
          package-security note; gold + warning ring per the Guardian
          palette, no invented copy. */}
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "0px 0px -60px 0px" }}
        transition={{ ...springFluid, delay: 0.2 }}
        role="note"
        className="mt-6 flex items-start gap-3 rounded-xl bg-[rgba(224,138,0,0.14)] px-4 py-3.5 text-[13.5px] leading-relaxed text-[#f3c07a] ring-1 ring-inset ring-[rgba(224,138,0,0.26)]"
      >
        <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <p className="min-w-0">{t.safety.optimizer.note}</p>
      </motion.div>
    </Section>
  );
}
