"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { useLanguage } from "@/components/pcmax/language-context";
import { Section, SectionHeading } from "@/components/pcmax/ui/primitives";
import { springFluid, whileHoverLift, whileTapPress } from "@/components/pcmax/ui/motion";
import { cn } from "@/lib/utils";

type ProfileKey = "yellow" | "green";

const themeStyles: Record<
  ProfileKey,
  { accent: string; border: string; bg: string; borderTint: string; glow: string; label: string }
> = {
  yellow: {
    /* a11y (Task 23): #d4a504 on white ≈ 2.2:1 — light-mode text rides the
       darker amber cut (yellow-700, 4.9:1); dark mode keeps the bright one. */
    accent: "text-[#a16207] dark:text-[#f5c518]",
    border: "border-[#eab308]/45",
    bg: "bg-gradient-to-b from-[#eab308]/[0.10] to-transparent",
    borderTint: "rgba(234, 179, 8, 0.45)",
    glow: "rgba(234, 179, 8, 0.55)",
    label: "#EAB308",
  },
  green: {
    accent: "text-[#15803d] dark:text-[#4ade80]",
    border: "border-[#22c55e]/45",
    bg: "bg-gradient-to-b from-[#22c55e]/[0.10] to-transparent",
    borderTint: "rgba(34, 197, 94, 0.45)",
    glow: "rgba(34, 197, 94, 0.55)",
    label: "#22C55E",
  },
};

export function Profiles() {
  const { t } = useLanguage();
  const [active, setActive] = useState<ProfileKey>("yellow");

  const profiles: Array<{ key: ProfileKey; data: typeof t.profiles.yellow }> = [
    { key: "yellow", data: t.profiles.yellow },
    { key: "green", data: t.profiles.green },
  ];

  return (
    <Section id="profiles" className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-x-0 top-24 mx-auto h-64 w-[560px] max-w-none rounded-full bg-crimson/[0.06] blur-[110px]"
        aria-hidden="true"
      />

      <SectionHeading
        eyebrow={t.profiles.eyebrow}
        title={t.profiles.title}
        desc={t.profiles.desc}
        align="center"
      />

      {/* segmented switch — iOS material: glass track, solid sliding thumb */}
      <div className="mb-10 flex justify-center">
        <div
          role="tablist"
          aria-label={t.profiles.eyebrow}
          className="glass relative flex rounded-full p-1.5"
        >
          {profiles.map(({ key, data }) => (
            <motion.button
              key={key}
              type="button"
              role="tab"
              aria-selected={active === key}
              onClick={() => setActive(key)}
              whileTap={whileTapPress}
              className={cn(
                "press relative z-10 flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-bold sm:px-8",
                /* theme-aware accent (label colors fail 4.5:1 as text in light) */
                active === key && themeStyles[key].accent
              )}
            >
              {active === key && (
                <motion.span
                  layoutId="profile-thumb"
                  transition={springFluid}
                  className={cn(
                    "pointer-events-none absolute inset-0 -z-10 rounded-full border bg-card specular",
                    themeStyles[key].border
                  )}
                />
              )}
              <span
                className="h-2 w-2 rounded-full transition-colors"
                style={{ background: active === key ? themeStyles[key].label : "var(--muted-foreground)", opacity: active === key ? 1 : 0.4 }}
                aria-hidden="true"
              />
              <span className={active === key ? "" : "text-foreground/60"}>
                {data.name} · {data.mode}
              </span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* live comparison cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:gap-8">
        {profiles.map(({ key, data }) => {
          const isActive = active === key;
          const styles = themeStyles[key];
          return (
            <motion.button
              key={key}
              type="button"
              onClick={() => setActive(key)}
              animate={{
                /* a11y (Task 23): opacity-dimmed text stacks with text-foreground/80
                   to ~2:1 effective contrast — the inactive card now recedes via
                   scale + losing its accent skin (gradient/border/glow/pill)
                   instead, keeping every string at full WCAG contrast. */
                scale: isActive ? 1 : 0.965,
              }}
              whileHover={whileHoverLift}
              whileTap={whileTapPress}
              transition={springFluid}
              className={cn(
                "card-ios press group relative flex flex-col rounded-3xl bg-card p-7 text-start sm:p-8",
                isActive && styles.bg
              )}
              style={
                isActive
                  ? {
                      borderColor: styles.borderTint,
                      boxShadow: `inset 0 1px 0 rgba(255, 255, 255, 0.16), 0 14px 36px -18px rgba(0, 0, 0, 0.14), 0 0 44px -14px ${styles.glow}`,
                    }
                  : undefined
              }
            >
              {/* status strip */}
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span
                    className="flex h-10 w-10 items-center justify-center rounded-xl border"
                    style={{
                      borderColor: `${styles.label}55`,
                      background: `${styles.label}18`,
                    }}
                  >
                    <span className="h-3.5 w-3.5 rounded-full" style={{ background: styles.label }} />
                  </span>
                  <div>
                    <h3 className="type-title font-display text-xl font-bold text-foreground">
                      {data.mode}
                    </h3>
                    <p className={cn("type-eyebrow text-xs font-semibold uppercase", styles.accent)}>
                      {data.name}
                    </p>
                  </div>
                </div>
                {isActive && (
                  <span
                    className={cn(
                      "type-eyebrow flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-bold uppercase",
                      styles.accent
                    )}
                    style={{ borderColor: `${styles.label}66`, background: `${styles.label}14` }}
                  >
                    <Check className="h-3 w-3" strokeWidth={3} />
                    {t.profiles.active}
                  </span>
                )}
              </div>

              {/* points */}
              <ul className="flex-1 space-y-3.5">
                {data.points.map((point, i) => (
                  <motion.li
                    key={point}
                    initial={false}
                    /* opacity dim removed (Task 23 contrast) — the inactive
                       indent alone reads as the receded state */
                    animate={{ x: isActive ? 0 : -4 }}
                    transition={{ ...springFluid, delay: isActive ? i * 0.05 : 0 }}
                    className="flex items-start gap-3 text-sm leading-relaxed text-foreground/80"
                  >
                    <Check
                      className={cn("mt-0.5 h-4 w-4 shrink-0", styles.accent)}
                      strokeWidth={3}
                    />
                    {point}
                  </motion.li>
                ))}
              </ul>

              {/* bottom meter — visual load indicator.
                  Plain CSS fill: width is a layout property and must never be
                  animated (20-k). The previous motion.div was inert anyway —
                  no `initial` and a constant target meant zero animation ever
                  ran — so this is pixel-identical with zero layout-anim risk. */}
              <div className="mt-7 h-1 overflow-hidden rounded-full bg-border/70" aria-hidden="true">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: key === "yellow" ? "38%" : "86%",
                    background: `linear-gradient(90deg, ${styles.label}55, ${styles.label})`,
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
