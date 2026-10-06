"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { useLanguage } from "@/components/pcmax/language-context";
import { Section, SectionHeading } from "@/components/pcmax/ui/primitives";
import { springFluid, whileTapPress } from "@/components/pcmax/ui/motion";
import { cn } from "@/lib/utils";

type ProfileKey = "yellow" | "green";

/* Guardian accents (Task 26-d1): the two optimization tiers ride the
 * brand's premium pair — "yellow" (High Quality) → gold, "green"
 * (Maximum FPS) → teal. The keys keep their dictionary names; only the
 * presentation changed. v3.0: raw values sit on the Wave A tokens
 * (gold-gc #fedb29 / success-gc #1fbf9c) and the checklist renders the
 * TweakFa tick square (tick / tick-gold). Dark-only site — no light-mode
 * color cuts anymore. */
const accents: Record<
  ProfileKey,
  {
    /** tier pill variant (kicker-gold / kicker-teal) */
    kicker: string;
    /** accent text — active switch option label */
    text: string;
    /** sliding switch thumb inset ring */
    thumb: string;
    /** status icon chip bg + ring */
    chip: string;
    /** status / switch dot */
    dot: string;
    /** raw hex for the meter fill + switch dot (inline styles) */
    hex: string;
    /** checklist tick variant — default success tick or tick-gold */
    tick: string;
  }
> = {
  yellow: {
    kicker: "kicker-gold",
    text: "text-gold-gc",
    thumb: "ring-[rgba(254,219,41,0.32)]",
    chip: "bg-gold-gc/10 ring-gold-gc/25",
    dot: "bg-gold-gc",
    hex: "#fedb29",
    tick: "tick-gold",
  },
  green: {
    kicker: "kicker-teal",
    text: "text-success-gc",
    thumb: "ring-[rgba(31,191,156,0.32)]",
    chip: "bg-success-gc/10 ring-success-gc/25",
    dot: "bg-success-gc",
    hex: "#1fbf9c",
    tick: "",
  },
};

export function Profiles() {
  const { t } = useLanguage();
  const [active, setActive] = useState<ProfileKey>("yellow");

  /* C4/Task 28-c: this is a 2-option segmented switch, not a tab set — the
   * radiogroup/radio semantics (aria-checked, no tabpanel needed) match
   * what it actually does and satisfy the ARIA pattern it declares. */

  const profiles: Array<{ key: ProfileKey; data: typeof t.profiles.yellow }> = [
    { key: "yellow", data: t.profiles.yellow },
    { key: "green", data: t.profiles.green },
  ];

  return (
    <Section id="profiles" className="relative overflow-hidden">
      <SectionHeading
        eyebrow={t.profiles.eyebrow}
        title={t.profiles.title}
        desc={t.profiles.desc}
        align="center"
      />

      {/* segmented switch — glass track, solid sliding thumb */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "0px 0px -60px 0px" }}
        transition={springFluid}
        className="mb-10 flex justify-center"
      >
        <div
          role="radiogroup"
          aria-label={t.profiles.eyebrow}
          className="glass relative flex rounded-full p-1.5"
        >
          {profiles.map(({ key, data }) => {
            const a = accents[key];
            return (
              <motion.button
                key={key}
                type="button"
                role="radio"
                aria-checked={active === key}
                onClick={() => setActive(key)}
                whileTap={whileTapPress}
                className={cn(
                  "press relative z-10 flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-bold sm:px-8",
                  active === key && a.text
                )}
              >
                {active === key && (
                  <motion.span
                    layoutId="profile-thumb"
                    transition={springFluid}
                    className={cn(
                      "pointer-events-none absolute inset-0 -z-10 rounded-full bg-secondary ring-1 ring-inset",
                      a.thumb
                    )}
                  />
                )}
                <span
                  className="h-2 w-2 rounded-full transition-colors"
                  style={{
                    background: active === key ? a.hex : "var(--muted-foreground)",
                    opacity: active === key ? 1 : 0.4,
                  }}
                  aria-hidden="true"
                />
                <span className={active === key ? "" : "text-foreground/60"}>
                  {data.name} · {data.mode}
                </span>
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* live comparison cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:gap-8">
        {profiles.map(({ key, data }) => {
          const isActive = active === key;
          const a = accents[key];
          return (
            <motion.button
              key={key}
              type="button"
              onClick={() => setActive(key)}
              /* B8/Task 28-c: the whole card is one control — give it a real
               * accessible name instead of the 60-word card contents. */
              aria-label={`${data.name} · ${data.mode}`}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "0px 0px -60px 0px" }}
              /* a11y: the inactive card recedes via scale + losing its
               * accent skin (ring / tick tints) — every string stays at
               * full WCAG contrast, no opacity dimming. */
              animate={{ scale: isActive ? 1 : 0.965 }}
              whileTap={whileTapPress}
              transition={springFluid}
              className="gc-card press group relative flex flex-col p-6 text-start sm:p-8"
              /* The active surface states itself in the brand accent —
               * the same crimson inset-ring value the FAQ open state
               * carries. Inline so it layers over .gc-card's class-owned
               * resting ring (cards paint rings, never borders, in v3.0;
               * the old drop shadow is retired with them). */
              style={
                isActive
                  ? { boxShadow: "inset 0 0 0 1px rgba(255, 59, 48, 0.4)" }
                  : undefined
              }
            >
              {/* status strip */}
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-xl ring-1 ring-inset",
                      a.chip
                    )}
                  >
                    <span className={cn("h-3.5 w-3.5 rounded-full", a.dot)} aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="type-title font-display text-xl font-bold text-foreground">
                      {data.mode}
                    </h3>
                    {/* tier label — Guardian kicker pill */}
                    <div className="mt-1.5">
                      <span className={cn("kicker", a.kicker)}>{data.name}</span>
                    </div>
                  </div>
                </div>
                {isActive && <span className="kicker">{t.profiles.active}</span>}
              </div>

              {/* points — TweakFa tick bullets; the tier keeps its tone
               * via the tick modifier (gold / default success) */}
              <ul className="flex-1 space-y-3.5">
                {data.points.map((point, i) => (
                  <motion.li
                    key={point}
                    initial={false}
                    /* the inactive indent alone reads as the receded state */
                    animate={{ x: isActive ? 0 : -4 }}
                    transition={{ ...springFluid, delay: isActive ? i * 0.05 : 0 }}
                    className="flex items-start gap-3 text-sm leading-relaxed text-foreground/80"
                  >
                    <span className={cn("tick mt-0.5", a.tick)}>
                      <Check className="h-3 w-3" strokeWidth={3.5} />
                    </span>
                    {point}
                  </motion.li>
                ))}
              </ul>

              {/* bottom meter — visual load indicator.
                  Plain CSS fill: width is a layout property and must never be
                  animated (20-k). */}
              <div className="mt-7 h-1 overflow-hidden rounded-full bg-border/70" aria-hidden="true">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: key === "yellow" ? "38%" : "86%",
                    background: a.hex,
                  }}
                />
              </div>
            </motion.button>
          );
        })}
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground">{t.profiles.switchHint}</p>
    </Section>
  );
}
