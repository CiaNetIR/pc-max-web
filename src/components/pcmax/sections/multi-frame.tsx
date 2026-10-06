"use client";

import { useId, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Check, ChevronDown, FileText, TriangleAlert } from "lucide-react";
import { useLanguage } from "@/components/pcmax/language-context";
import { Section, SectionHeading } from "@/components/pcmax/ui/primitives";
import { springFluid } from "@/components/pcmax/ui/motion";
import { cn } from "@/lib/utils";

/*
 * Frame Generation — Guardian cards (Task 26-d1). Three surface cards carry
 * only the essential (name, tagline, compatibility pills, two tick bullets);
 * the Streamline hardware guard becomes a gold warning chip (reference
 * .caveat tone). Below the grid sits a .compat-style strip — the
 * "Compatibility" label plus teal-dotted platform items — then the
 * expandable technical disclosure and the note. Content is fully
 * server-rendered; the disclosure only toggles animation, never mounts.
 */

const cardEnter = [
  { hidden: { opacity: 0, y: 46 }, show: { opacity: 1, y: 0 } },
  { hidden: { opacity: 0, y: 60 }, show: { opacity: 1, y: 0 } },
  { hidden: { opacity: 0, y: 46 }, show: { opacity: 1, y: 0 } },
];

/* Stable internal IDs — React identity must never ride on display strings
 * (labels are translated; these are not). Order matches the dictionary
 * cards/tech entries: OptiScaler, AI Optical Flow, Streamline. */
const CARD_IDS = ["optiscaler", "ai-optical-flow", "streamline"] as const;

/* Guardian tri-color rhythm — badge pills carry their card's own accent:
 * OptiScaler violet, AI Optical Flow teal, Streamline gold. */
const badgeTone = [
  "bg-crimson/10 text-crimson ring-crimson/25",
  "bg-[rgba(31,191,156,0.14)] text-[#1fbf9c] ring-[rgba(31,191,156,0.32)]",
  "bg-[rgba(254,219,41,0.13)] text-[#fedb29] ring-[rgba(254,219,41,0.3)]",
] as const;

export function MultiFrame() {
  const { t } = useLanguage();
  const [techOpen, setTechOpen] = useState(false);
  /* Unique disclosure id — safe even if this section ever mounts twice. */
  const techId = useId();
  /* Height is not a transform, so the global MotionConfig
   * (reducedMotion="user") alone won't still it — gate it explicitly. */
  const reduce = useReducedMotion();

  /* Compatibility strip items (reference .compat) — the platform badges
   * across all three cards, deduped; each renders with a teal dot. */
  const compatItems = Array.from(
    new Set(t.multiframe.cards.flatMap((card) => ("badges" in card ? card.badges ?? [] : [])))
  );

  return (
    <Section id="multiframe" className="relative overflow-hidden">
      {/* ambient violet aura — one quiet wash, nothing rotating */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-[380px] w-[720px] max-w-none rounded-full bg-crimson/[0.07] blur-[120px]"
        aria-hidden="true"
      />

      <SectionHeading
        eyebrow={t.multiframe.eyebrow}
        title={t.multiframe.title}
        desc={t.multiframe.desc}
        align="center"
      />

      <div className="grid gap-6 lg:grid-cols-3 lg:gap-7">
        {t.multiframe.cards.map((card, i) => {
          const isStreamline = i === 2;
          return (
            <motion.article
              key={CARD_IDS[i]}
              variants={cardEnter[i]}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "0px 0px -60px 0px" }}
              transition={{ ...springFluid, delay: 0.1 + i * 0.1 }}
              className="gc-card flex flex-col p-6"
            >
              {/* header */}
              <div className="mb-4">
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="type-title font-display text-lg font-bold text-foreground">
                    {card.name}
                  </h3>
                  {isStreamline && "warning" in card && (
                    <span className="inline-flex items-center gap-2 rounded-lg bg-[rgba(224,138,0,0.14)] px-3 py-1.5 text-[12.5px] font-bold text-[#f3c07a] ring-1 ring-inset ring-[rgba(224,138,0,0.26)]">
                      <TriangleAlert className="h-3.5 w-3.5" />
                      {card.warning}
                    </span>
                  )}
                </div>
                <p className="mt-1.5 text-sm text-muted-foreground">{card.tagline}</p>
              </div>

              {/* compatibility pills — this card's own accent tone */}
              {"badges" in card && (
                <div className="mb-5 flex flex-wrap gap-2">
                  {(card.badges ?? []).map((badge) => (
                    <span
                      key={badge}
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-[11px] font-bold ring-1 ring-inset",
                        badgeTone[i % badgeTone.length]
                      )}
                    >
                      {badge}
                    </span>
                  ))}
                </div>
              )}

              {/* the two essentials */}
              <ul className="mt-auto flex-1 space-y-3">
                {card.bullets.map((bullet) => (
                  <li
                    key={bullet}
                    className="flex gap-3 text-sm leading-relaxed text-muted-foreground"
                  >
                    <span className="tick mt-0.5">
                      <Check className="h-3 w-3" strokeWidth={3.5} />
                    </span>
                    {bullet}
                  </li>
                ))}
              </ul>
            </motion.article>
          );
        })}
      </div>

      {/* compatibility strip (reference .compat) — platform matrix at a glance */}
      <div className="gc-card mt-6 flex flex-wrap items-center gap-x-7 gap-y-3 px-6 py-5">
        <span className="text-[12.5px] font-bold text-muted-foreground">
          {t.multiframe.compatibility}
        </span>
        {compatItems.map((item) => (
          <span
            key={item}
            className="inline-flex items-center gap-2 text-[13.5px] text-muted-foreground"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[#1fbf9c]" aria-hidden="true" />
            {item}
          </span>
        ))}
      </div>

      {/* expandable technical documentation */}
      <div className="mx-auto mt-10 max-w-3xl">
        <button
          type="button"
          onClick={() => setTechOpen((v) => !v)}
          aria-expanded={techOpen}
          aria-controls={techId}
          className="press group flex w-full items-center justify-between gap-4 rounded-2xl border border-border/70 bg-card/60 px-5 py-4 text-start transition-colors hover:border-crimson/40"
        >
          <span className="flex items-center gap-3 text-sm font-bold text-foreground">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-crimson/10 text-crimson ring-1 ring-inset ring-crimson/25">
              <FileText className="h-4.5 w-4.5" />
            </span>
            {t.multiframe.tech.title}
          </span>
          <ChevronDown
            className={cn(
              "h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-300 group-hover:text-crimson",
              techOpen && "rotate-180 text-crimson"
            )}
          />
        </button>

        <motion.div
          id={techId}
          initial={false}
          animate={{ height: techOpen ? "auto" : 0, opacity: techOpen ? 1 : 0 }}
          transition={reduce ? { duration: 0 } : { ...springFluid, opacity: { duration: 0.25 } }}
          className="overflow-hidden"
          aria-hidden={!techOpen}
        >
          <div className="mt-4 space-y-6 rounded-2xl border border-border/60 bg-card/40 p-5 sm:p-6">
            {t.multiframe.tech.entries.map((entry, i) => (
              <div key={CARD_IDS[i]}>
                <h4 className="font-display text-sm font-bold text-foreground">
                  {entry.name}
                </h4>
                <ul className="mt-2.5 space-y-2">
                  {entry.details.map((detail) => (
                    <li
                      key={detail}
                      className="flex items-start gap-2.5 text-sm leading-relaxed text-muted-foreground"
                    >
                      <span
                        className="mt-2 h-1 w-1 shrink-0 rounded-full bg-crimson/70"
                        aria-hidden="true"
                      />
                      {detail}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "0px 0px -10%" }}
        transition={{ delay: 0.4, duration: 0.8 }}
        className="mt-8 text-center text-xs text-muted-foreground"
      >
        {t.multiframe.note}
      </motion.p>
    </Section>
  );
}
