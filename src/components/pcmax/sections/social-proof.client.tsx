"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, ClipboardList, FileCheck2, WifiOff } from "lucide-react";
import { useLanguage } from "@/components/pcmax/language-context";
import { AnimatedCounter, Reveal, Section, SectionHeading } from "@/components/pcmax/ui/primitives";
import { springFluid } from "@/components/pcmax/ui/motion";
import { cn } from "@/lib/utils";

/* Prop payload — serialized server → client. The server wrapper
 * (social-proof.tsx) runs the same aggregates /api/stats runs and seeds
 * this, so no /api/stats request ever happens on the client. null = the
 * aggregate failed at render time → the DB-derived tiles fall back to the
 * dictionary's documented fallbacks. */
export type StatsResponse = {
  downloads: number;
  waitlist: number;
  releases: number;
};

export type SocialProofClientProps = {
  stats: StatsResponse | null;
};

/* Verify-every-install · no telemetry · open changelog */
const TRUST_ICONS = [FileCheck2, WifiOff, ClipboardList];

/* Same shape as the old fetch-based strip minus the fabricated claims
 * (audit 29-b): every number here is either DB-derived at render
 * (downloads, releases — seeded from prisma/seed.ts and baked at build time
 * in the static flavor) or a documented static fact (test suites,
 * telemetry scope). The two former fabrications ("56 profiles shipped",
 * "14 games in the launch catalogue", "34% average FPS gain" as a social
 * tile) and the mislabeled "downloads served from this site" live pill are
 * gone — one canonical, DB-derived download number remains. */
export function SocialProofClient({ stats }: SocialProofClientProps) {
  const { t, isRTL } = useLanguage();
  const reduce = useReducedMotion();

  /* DB-derived values with documented fallbacks for the DB-unavailable
   * case. Downloads floor to thousands (the canonical "293K+" figure);
   * the pill-style exact count is intentionally NOT shown twice. */
  const downloadsK =
    stats !== null && stats.downloads > 0
      ? Math.floor(stats.downloads / 1000)
      : t.social.stats.downloads.fallback;
  const releasesCount =
    stats !== null && stats.releases > 0 ? stats.releases : t.social.stats.releases.fallback;

  const tiles = [
    { value: downloadsK, suffix: t.social.stats.downloads.suffix, label: t.social.stats.downloads.label },
    { value: releasesCount, suffix: t.social.stats.releases.suffix, label: t.social.stats.releases.label },
    { value: t.social.stats.tests.value, suffix: t.social.stats.tests.suffix, label: t.social.stats.tests.label },
    { value: t.social.stats.telemetry.value, suffix: t.social.stats.telemetry.suffix, label: t.social.stats.telemetry.label },
  ];

  /* Reduced motion → jump, don't glide, to the anchored section. */
  const scrollTo = (id: string) => {
    document
      .getElementById(id)
      ?.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <Section id="community" className="relative overflow-hidden">
      <SectionHeading
        eyebrow={t.social.eyebrow}
        title={t.social.title}
        desc={t.social.desc}
        align="start"
      />

      {/* stats — reference .stats grid of Guardian stat tiles (AnimatedCounter
          drives the count-up inside the <b>). DB-derived where possible. */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={reduce ? false : { opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "0px 0px -40px 0px" }}
            transition={{ ...springFluid, delay: i * 0.06 }}
            className="gc-stat gc-card p-6 text-center"
          >
            <b className="block font-display text-3xl font-bold">
              <AnimatedCounter
                value={stat.value}
                suffix={stat.suffix}
                duration={reduce ? 1 : 1400}
              />
            </b>
            <span className="mt-1 block text-[13px] text-muted-foreground">
              {stat.label}
            </span>
          </motion.div>
        ))}
      </div>

      {/* trust claims — reference .voices grid. Cards link to on-page
          evidence anchors (#download → checksum + changelog); external
          hrefs would open in a new tab, in-page anchors scroll. */}
      <Reveal delay={0.05}>
        <h3 className="type-eyebrow mt-12 text-center text-sm font-bold uppercase text-muted-foreground">
          {t.social.trust.title}
        </h3>
        <div className="mt-5 grid gap-5 md:grid-cols-3">
          {t.social.trust.items.map((item, i) => {
            const Icon = TRUST_ICONS[i] ?? ClipboardList;
            const hasHref = Boolean(item.href);
            /* In-page anchors (#…) scroll; only absolute URLs open a tab. */
            const isExternal = hasHref && /^https?:/i.test(item.href);
            const card = (
              <figure className="gc-card m-0 flex h-full flex-col justify-between gap-5 p-6">
                <p className="m-0 text-[15px] leading-[2] text-foreground">
                  {item.desc}
                </p>
                <figcaption className="flex flex-wrap items-center gap-3 text-[13px] text-muted-foreground">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-crimson/15 font-bold text-crimson">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <b className="text-foreground/85">{item.title}</b>
                  {item.meta && (
                    <span className="rounded-full bg-[#1b1b21] px-2.5 py-0.5 text-[11px] text-muted-foreground ring-1 ring-inset ring-border">
                      {item.meta}
                    </span>
                  )}
                  {isExternal && (
                    <ArrowUpRight
                      className={cn(
                        "h-3.5 w-3.5 text-crimson/70 transition-transform duration-300",
                        /* D6/Task 28-d: mirror the external-link glyph in RTL
                         * and nudge it toward the reading direction. */
                        isRTL
                          ? "-scale-x-100 group-hover:-translate-x-0.5 group-hover:-translate-y-0.5"
                          : "group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                      )}
                      aria-hidden="true"
                    />
                  )}
                </figcaption>
              </figure>
            );
            return hasHref ? (
              isExternal ? (
                <a
                  key={item.title}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block"
                >
                  {card}
                </a>
              ) : (
                <a
                  key={item.title}
                  href={item.href}
                  onClick={(e) => {
                    e.preventDefault();
                    scrollTo(item.href.replace(/^#/, ""));
                  }}
                  className="group block"
                >
                  {card}
                </a>
              )
            ) : (
              <div key={item.title} className="group block">
                {card}
              </div>
            );
          })}
        </div>
      </Reveal>

      {/* artifacts over words — real, checkable things on this very page */}
      <Reveal delay={0.1}>
        <p className="mt-10 text-center text-xs text-muted-foreground">
          {t.social.artifacts.title}
        </p>
        <div className="mt-3 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => scrollTo("benchmarks")}
            className="gc-btn-ghost inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold"
          >
            {t.social.artifacts.benchmarks}
          </button>
          <button
            type="button"
            onClick={() => scrollTo("download")}
            className="gc-btn-ghost inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold"
          >
            {t.social.artifacts.changelog}
          </button>
        </div>
      </Reveal>
    </Section>
  );
}
