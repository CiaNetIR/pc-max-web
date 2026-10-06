"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useLanguage } from "@/components/pcmax/language-context";
import { springFluid } from "@/components/pcmax/ui/motion";
import { Reveal, Section, SectionHeading } from "@/components/pcmax/ui/primitives";
import { installerHref } from "@/lib/gh-pages";
import {
  GamepadIcon,
  FolderIcon,
  DownloadIcon,
  SettingsIcon,
  ShieldIcon,
  PerformanceIcon,
  WindowsIcon,
  LogoMark,
} from "@/components/pcmax/icons";

/* icons follow the real flow: download → setup → launch → sign in → sync →
 * pick a game → apply (fallbacks keep the grid safe if steps ever change) */
const stepIcons = [DownloadIcon, WindowsIcon, LogoMark, ShieldIcon, FolderIcon, GamepadIcon, SettingsIcon];

/* ------------------------------ Section ------------------------------ */

export function InstallFlow() {
  const { t } = useLanguage();
  /* Latest known installer — the step-1 card links straight to it (audit
   * 29-b D13: this was the 4th scroll-CTA before the single real download
   * button; a direct link removes the dead-end feel without competing with
   * the premium card, which stays the canonical download surface). */
  const downloadHref = installerHref();
  /* motion-sensitive users get the same calm grid — no scroll hijacking,
   * no pinned rail; the entrance tween simply snaps in place. */
  const reduce = useReducedMotion();

  return (
    <Section id="install">
      <SectionHeading
        eyebrow={t.install.eyebrow}
        title={t.install.title}
        desc={t.install.desc}
        align="center"
      />

      {/* Guardian steps grid (reference .steps). The `.gc-step` counter
       * circle (01, 02, … via CSS counters) renders above each step on wide
       * screens and slides into its own 64px start column on mobile
       * (globals.css ≤820px). Each li carries exactly ONE wrapper child so
       * the mobile "tx" grid area holds the whole text stack — icon, title,
       * desc — beside the circle instead of stacking the children on top of
       * each other. The counter is reset inline so this grid stays
       * self-contained wherever it is rendered. `steps-ambient` wires the
       * staggered ring pulse on the counter circles (Task 28). */}
      <ol
        role="list"
        style={{ counterReset: "gcstep" }}
        className="steps-ambient grid gap-x-6 min-[821px]:grid-cols-2 min-[821px]:gap-y-10 lg:grid-cols-4"
      >
        {t.install.steps.map((step, i) => {
          const Icon = stepIcons[i] ?? PerformanceIcon;
          return (
            <motion.li
              key={step.title}
              initial={reduce ? false : { opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "0px 0px -40px 0px" }}
              transition={{ ...springFluid, delay: i * 0.07 }}
              className="gc-step"
            >
              <div>
                <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-crimson/10 text-crimson ring-1 ring-inset ring-crimson/25 min-[821px]:mx-auto">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="type-title font-display text-[16px] font-bold text-foreground">
                  {step.title}
                </h3>
                <p className="mt-2 max-w-[34ch] text-[13.5px] leading-relaxed text-muted-foreground min-[821px]:mx-auto">
                  {step.desc}
                </p>
              </div>
            </motion.li>
          );
        })}
      </ol>

      {/* terminal flourish — a REAL download link (SSR: counting route,
          static: the deployed artifact), not another scroll-to-CTA */}
      <Reveal delay={0.15} className="mt-10 flex justify-center">
        <a
          href={downloadHref}
          className="gc-btn-primary press inline-flex items-center gap-2.5 rounded-full px-7 py-3.5 text-sm font-bold"
        >
          <DownloadIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
          {t.hero.primary}
        </a>
      </Reveal>
    </Section>
  );
}
