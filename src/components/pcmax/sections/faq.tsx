"use client";

import { motion, useReducedMotion } from "framer-motion";
import { MessageCircle } from "lucide-react";
import { useLanguage } from "@/components/pcmax/language-context";
import { Section, SectionHeading } from "@/components/pcmax/ui/primitives";
import { springFluid } from "@/components/pcmax/ui/motion";

/*
 * FAQ — the reference two-column grid of native <details> cards.
 * The five that matter first, then the full set under a hairline subhead;
 * every Q&A renders in the initial HTML (SSR + no-JS + SEO) and the
 * open/close state is pure CSS — no Radix, no JS state, no hydration cost.
 */

type FaqItem = { q: string; a: string };

/** One native disclosure card (reference .q). `.gc-q` + `.gc-glyph` are
 *  hand-rolled in globals.css (details[open] state) — the plus flips into
 *  a cross and the border warms violet while the details is open. */
function FaqCard({ item }: { item: FaqItem }) {
  return (
    <details className="gc-card gc-q overflow-hidden p-0">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 text-[15px] font-bold text-foreground [&::-webkit-details-marker]:hidden">
        <span className="min-w-0 flex-1">{item.q}</span>
        <span
          aria-hidden="true"
          className="gc-glyph flex h-7 w-7 shrink-0 items-center justify-center font-display text-xl font-bold leading-none text-muted-foreground transition-transform duration-200"
        >
          +
        </span>
      </summary>
      <div className="px-6 pb-5 text-sm leading-relaxed text-muted-foreground">
        {item.a}
      </div>
    </details>
  );
}

export function Faq() {
  const { t } = useLanguage();
  const reduce = useReducedMotion();

  return (
    <Section id="faq" className="relative overflow-hidden">
      <SectionHeading
        eyebrow={t.faq.eyebrow}
        title={t.faq.title}
        desc={t.faq.desc}
        align="center"
      />

      <motion.div
        initial={reduce ? false : { opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "0px 0px -60px 0px" }}
        transition={springFluid}
        className="mx-auto max-w-5xl"
      >
        {/* the five that matter */}
        <div className="grid items-start gap-3 md:grid-cols-2">
          {t.faq.core.map((item) => (
            <FaqCard key={item.q} item={item} />
          ))}
        </div>

        {/* full FAQ — everything else, same native grid */}
        <div className="mt-10 flex items-center gap-4">
          <span className="h-px flex-1 bg-border" aria-hidden="true" />
          <h3 className="type-eyebrow text-[13px] font-bold uppercase tracking-wide text-muted-foreground">
            {t.faq.fullLabel}
          </h3>
          <span className="h-px flex-1 bg-border" aria-hidden="true" />
        </div>
        <div className="mt-4 grid items-start gap-3 md:grid-cols-2">
          {t.faq.full.map((item) => (
            <FaqCard key={item.q} item={item} />
          ))}
        </div>
      </motion.div>

      {/* closing CTA */}
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "0px 0px -60px 0px" }}
        transition={{ ...springFluid, delay: 0.12 }}
        className="gc-card mx-auto mt-10 max-w-2xl px-6 py-8 text-center sm:px-10"
      >
        <h3 className="type-title font-display text-lg font-bold text-foreground sm:text-xl">
          {t.faq.stillHave.title}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {t.faq.stillHave.desc}
        </p>
        <a
          href="https://discord.gg/pcmax"
          target="_blank"
          rel="noopener noreferrer"
          className="gc-btn-primary mt-6 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold"
        >
          <MessageCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          {t.faq.stillHave.cta}
        </a>
      </motion.div>
    </Section>
  );
}
