"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useMotionValueEvent, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useLanguage } from "@/components/pcmax/language-context";
import { springFluid } from "@/components/pcmax/ui/motion";
import { Section, SectionHeading } from "@/components/pcmax/ui/primitives";
import {
  GamepadIcon,
  FolderIcon,
  DownloadIcon,
  SettingsIcon,
  ShieldIcon,
  PerformanceIcon,
  WindowsIcon,
  LogoMark,
  iconMap,
} from "@/components/pcmax/icons";

/* icons follow the real flow: download → setup → launch → sign in → sync →
 * pick a game → apply (fallbacks keep the rail safe if steps ever change) */
const stepIcons = [DownloadIcon, WindowsIcon, LogoMark, ShieldIcon, FolderIcon, GamepadIcon, SettingsIcon];

/* --------------------------- Arrow connector ------------------------- */

function FlowArrow() {
  return (
    <div className="flex shrink-0 items-center px-1" aria-hidden="true">
      <svg width="56" height="24" viewBox="0 0 56 24" fill="none" className="text-crimson/70 rtl:rotate-180">
        <path
          d="M2 12h44m0 0-8-7m8 7-8 7"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="60"
          className="flow-arrow-draw"
        />
      </svg>
    </div>
  );
}

/* --------------------------- Step card ------------------------------- */

function StepCard({
  index,
  title,
  desc,
}: {
  index: number;
  title: string;
  desc: string;
}) {
  const Icon = stepIcons[index] ?? PerformanceIcon;
  return (
    <div className="card-ios group relative flex w-[280px] shrink-0 flex-col rounded-2xl bg-card p-6 transition-colors duration-300 hover:border-crimson/40 sm:w-[320px] xl:w-[340px]">
      <div className="mb-5 flex items-center justify-between">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-crimson/25 bg-crimson/10 text-crimson transition-all duration-300 group-hover:bg-crimson group-hover:text-white">
          <Icon className="h-6 w-6" />
        </span>
        <span className="glass rounded-full px-2.5 py-1 font-mono text-xs font-bold tabular-nums text-muted-foreground transition-colors duration-300 group-hover:text-crimson">
          {String(index + 1).padStart(2, "0")}
        </span>
      </div>
      <h3 className="type-title font-display text-lg font-bold text-foreground">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{desc}</p>
    </div>
  );
}

/* ------------------------------ Section ------------------------------ */

export function InstallFlow() {
  const { t } = useLanguage();
  const targetRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [shift, setShift] = useState(0);
  const [active, setActive] = useState(0);
  /* motion-sensitive users get the calm vertical timeline at every
   * breakpoint — no scroll hijacking, no pinned rail. */
  const reduce = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start start", "end end"],
  });

  const { isRTL } = useLanguage();

  useEffect(() => {
    const measure = () => {
      const track = trackRef.current;
      if (!track) return;
      const viewport = track.parentElement;
      if (!viewport) return;
      const overflow = track.scrollWidth - viewport.clientWidth;
      setShift(overflow > 0 ? overflow + 48 : 0);
    };
    measure();
    const id = window.setTimeout(measure, 400);
    window.addEventListener("resize", measure);
    return () => {
      window.clearTimeout(id);
      window.removeEventListener("resize", measure);
    };
  }, [t]);

  const x = useTransform(scrollYProgress, [0.04, 0.96], [0, isRTL ? shift : -shift]);
  const progressScale = useTransform(scrollYProgress, [0.04, 0.96], [0, 1]);

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const idx = Math.min(t.install.steps.length - 1, Math.max(0, Math.round((v - 0.04) / 0.92 * (t.install.steps.length - 1))));
    setActive(idx);
  });

  return (
    /* NOTE: no `overflow-hidden` here — an overflow-clipping ancestor would
       break `position: sticky` on the cinematic rail below and leave the
       pinned viewport empty (the "black screen" bug). Horizontal overflow
       is clipped by the sticky rail itself instead. */
    <Section id="install">
      <SectionHeading eyebrow={t.install.eyebrow} title={t.install.title} desc={t.install.desc} />

      {/* ---------- cinematic horizontal rail (desktop) ---------- */}
      <div ref={targetRef} className={reduce ? "hidden" : "relative hidden lg:block"} style={{ height: "280vh" }}>
        <div className="sticky top-0 flex h-screen flex-col justify-center overflow-hidden">
          {/* ambient depth so the pinned viewport never reads as a flat void */}
          <div
            className="pointer-events-none absolute start-1/2 top-1/3 h-[360px] w-[720px] max-w-none -translate-x-1/2 rounded-full bg-crimson/[0.06] blur-[120px]"
            aria-hidden="true"
          />

          <div className="relative mx-auto mb-10 w-full max-w-7xl px-8">
            <div className="flex items-center justify-between">
              <span className="type-eyebrow font-mono text-xs font-bold uppercase text-muted-foreground">
                {t.install.eyebrow}
              </span>
              <span className="glass rounded-full px-3 py-1 font-mono text-sm font-bold text-crimson tabular-nums">
                {String(Math.min(active + 1, t.install.steps.length)).padStart(2, "0")}
                <span className="text-muted-foreground"> / {String(t.install.steps.length).padStart(2, "0")}</span>
              </span>
            </div>
            <div className="mt-3 h-1 overflow-hidden rounded-full bg-border/70">
              <motion.div
                style={{ scaleX: progressScale, transformOrigin: isRTL ? "right" : "left" }}
                className="h-full bg-gradient-to-r from-crimson-deep via-crimson to-crimson-bright rtl:bg-gradient-to-l"
              />
            </div>
          </div>

          <div className="relative w-full overflow-hidden px-8">
            <motion.div ref={trackRef} style={{ x }} className="flex w-max items-stretch gap-0">
              {t.install.steps.map((step, i) => (
                <div key={step.title} className="flex items-stretch">
                  <StepCard index={i} title={step.title} desc={step.desc} />
                  {i < t.install.steps.length - 1 && <FlowArrow />}
                </div>
              ))}

              {/* terminal card */}
              <div className="ms-6 flex items-center">
                <div className="relative flex h-36 w-36 items-center justify-center rounded-full border border-crimson/40 bg-crimson/10">
                  <span className="absolute inset-0 animate-ping rounded-full border border-crimson/30 [animation-duration:2.4s]" aria-hidden="true" />
                  {(() => {
                    const Icon = iconMap.performance;
                    return <Icon className="h-12 w-12 text-crimson" />;
                  })()}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* ---------- vertical timeline (mobile / tablet / reduced motion) ---------- */}
      <ol className={reduce ? "relative space-y-5" : "relative space-y-5 lg:hidden"}>
        <div className="absolute inset-y-4 start-[22px] w-px bg-border" aria-hidden="true" />
        {t.install.steps.map((step, i) => {
          const Icon = stepIcons[i] ?? PerformanceIcon;
          return (
            <motion.li
              key={step.title}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "0px 0px -40px 0px" }}
              transition={{ ...springFluid, delay: i * 0.05 }}
              className="relative ps-14"
            >
              <span className="absolute start-0 top-0 z-10 flex h-11 w-11 items-center justify-center rounded-xl border border-crimson/30 bg-card text-crimson shadow-md shadow-black/5 dark:shadow-black/40">
                <Icon className="h-5 w-5" />
              </span>
              <div className="card-ios rounded-2xl bg-card p-4 sm:p-5">
                <div className="flex items-baseline gap-2.5">
                  <span className="font-mono text-[10px] font-bold text-crimson">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="type-title font-display text-base font-bold text-foreground">{step.title}</h3>
                </div>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{step.desc}</p>
              </div>
            </motion.li>
          );
        })}
      </ol>
    </Section>
  );
}
