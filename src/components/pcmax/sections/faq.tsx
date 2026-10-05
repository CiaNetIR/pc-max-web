"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ChevronDown, MessageCircle, Plus } from "lucide-react";
import { useLanguage } from "@/components/pcmax/language-context";
import { Section, SectionHeading } from "@/components/pcmax/ui/primitives";
import { springFluid } from "@/components/pcmax/ui/motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

/*
 * FAQ — the five questions that decide a download, front and center.
 * Everything else lives behind one quiet "Full FAQ" toggle. All content
 * renders in the initial HTML (SEO + no-JS); the toggle only animates.
 */

export function Faq() {
  const { t } = useLanguage();
  const [fullOpen, setFullOpen] = useState(false);
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
        initial={{ opacity: 0, y: 36 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={springFluid}
        className="mx-auto max-w-3xl"
      >
        {/* the five that matter */}
        <Accordion type="single" collapsible className="w-full">
          {t.faq.core.map((item, i) => (
            <AccordionItem
              key={`faq-core-${i}`}
              value={`faq-core-${i}`}
              className={cn(
                "card-ios rounded-2xl bg-card px-5 sm:px-6",
                i > 0 && "mt-3"
              )}
            >
              <AccordionTrigger className="group press py-5 text-start hover:no-underline [&>svg]:hidden">
                <span className="flex flex-1 items-center gap-4">
                  <span className="hidden font-mono text-xs font-bold text-crimson/70 sm:inline">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="font-display text-base font-bold text-foreground transition-colors group-hover:text-crimson sm:text-lg">
                    {item.q}
                  </span>
                </span>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border/70 text-muted-foreground transition-all duration-300 group-hover:border-crimson/40 group-hover:text-crimson group-data-[state=open]:rotate-45 group-data-[state=open]:border-crimson/50 group-data-[state=open]:bg-crimson/10">
                  <Plus className="h-4 w-4" />
                </span>
              </AccordionTrigger>
              <AccordionContent className="pb-5 pt-0 text-sm leading-relaxed text-muted-foreground sm:ps-10 sm:text-base">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        {/* full FAQ — one quiet toggle, everything else */}
        <div className="mt-6">
          <button
            type="button"
            onClick={() => setFullOpen((v) => !v)}
            aria-expanded={fullOpen}
            aria-controls="faq-full-panel"
            className="press group flex w-full items-center justify-between gap-4 rounded-2xl border border-border/70 bg-card/60 px-5 py-4 text-start transition-colors hover:border-crimson/40"
          >
            <span className="text-sm font-bold text-foreground">
              {t.faq.fullLabel}
            </span>
            <ChevronDown
              className={cn(
                "h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-300 group-hover:text-crimson",
                fullOpen && "rotate-180 text-crimson"
              )}
              aria-hidden="true"
            />
          </button>

          {/* Height tweens 0↔auto; `inert` removes the collapsed accordion
              triggers from the tab order (they sit at height 0 + opacity 0). */}
          <motion.div
            id="faq-full-panel"
            initial={false}
            animate={{ height: fullOpen ? "auto" : 0, opacity: fullOpen ? 1 : 0 }}
            transition={
              reduce ? { duration: 0 } : { ...springFluid, opacity: { duration: 0.25 } }
            }
            className="overflow-hidden"
            aria-hidden={!fullOpen}
            inert={!fullOpen}
          >
            <Accordion type="single" collapsible className="mt-3 w-full">
              {t.faq.full.map((item, i) => (
                <AccordionItem
                  key={`faq-full-${i}`}
                  value={`faq-full-${i}`}
                  className={cn(
                    "card-ios rounded-2xl bg-card/60 px-5 sm:px-6",
                    i > 0 && "mt-3"
                  )}
                >
                  <AccordionTrigger className="group press py-4 text-start hover:no-underline [&>svg]:hidden">
                    <span className="flex flex-1 items-center gap-4">
                      <span className="font-display text-sm font-bold text-foreground/90 transition-colors group-hover:text-crimson sm:text-base">
                        {item.q}
                      </span>
                    </span>
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-border/70 text-muted-foreground transition-all duration-300 group-hover:border-crimson/40 group-hover:text-crimson group-data-[state=open]:rotate-45 group-data-[state=open]:border-crimson/50 group-data-[state=open]:bg-crimson/10">
                      <Plus className="h-3.5 w-3.5" />
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-4 pt-0 text-sm leading-relaxed text-muted-foreground">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>
        </div>
      </motion.div>

      {/* closing CTA */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ ...springFluid, delay: 0.12 }}
        className="mx-auto mt-10 max-w-2xl rounded-3xl border border-crimson/25 bg-crimson/[0.05] px-6 py-8 text-center sm:px-10 sm:py-10"
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
          className="press mt-6 inline-flex items-center gap-2 rounded-full bg-crimson px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-crimson-bright"
        >
          <MessageCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          {t.faq.stillHave.cta}
        </a>
      </motion.div>
    </Section>
  );
}
