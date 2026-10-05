"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, FileCheck2, ShieldCheck, WifiOff } from "lucide-react";
import { useLanguage } from "@/components/pcmax/language-context";
import { AnimatedCounter, Reveal, Section, SectionHeading } from "@/components/pcmax/ui/primitives";
import { springFluid } from "@/components/pcmax/ui/motion";

/* Prop payload — serialized server → client. The server wrapper
 * (social-proof.tsx) runs the same aggregates /api/stats runs and seeds
 * this, so no /api/stats request ever happens on the client. null = the
 * aggregate failed at render time → the live pill stays hidden (exactly the
 * old fetch-catch behavior). */
export type StatsResponse = {
  downloads: number;
  waitlist: number;
  releases: number;
};

export type SocialProofClientProps = {
  stats: StatsResponse | null;
};

/*
 * Stats strip dividers — the grid is 2×2 below lg and a single row of 4 at lg.
 * Manual logical borders (instead of divide-*) so every breakpoint reads
 * correctly and mirrors automatically in RTL:
 *   base (2×2):  0: e | 1: — | 2: e+t | 3: t
 *   lg   (1×4):  0: e | 1: e | 2: e   | 3: —
 */
const STAT_CELL_BORDERS = [
  "border-e",
  "lg:border-e",
  "border-e border-t lg:border-t-0",
  "border-t lg:border-t-0",
];

/* Code-signed · VirusTotal clean (dated + linked) · zero telemetry */
const TRUST_ICONS = [FileCheck2, ShieldCheck, WifiOff];

/* Same UI/behavior as the pre-SSR version minus the mount-time /api/stats
 * fetch: the live-downloads pill now renders with the server HTML (real
 * number in the initial document — crawlers and no-JS see it), and the
 * AnimatedCounter stats keep their SSR-final-value behavior. */
export function SocialProofClient({ stats }: SocialProofClientProps) {
  const { t } = useLanguage();
  const reduce = useReducedMotion();

  /* Live-downloads pill — seeded from the server aggregate; hidden when the
   * aggregate was unavailable (stats === null). */
  const liveDownloads = stats !== null && typeof stats.downloads === "number" ? stats.downloads : null;

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

      {/* live badge — only when the server aggregate answered */}
      {liveDownloads !== null && (
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springFluid}
          className="mb-5 inline-flex items-center gap-2.5 rounded-full border border-crimson/25 bg-crimson/[0.06] px-4 py-1.5 text-crimson"
        >
          <span className="relative flex h-2 w-2 shrink-0" aria-hidden="true">
            <span
              className={`absolute inline-flex h-full w-full rounded-full bg-crimson opacity-60 ${
                reduce ? "" : "animate-ping"
              }`}
            />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-crimson" />
          </span>
          <span className="text-xs font-mono">
            <span dir="ltr">{liveDownloads.toLocaleString("en-US")}</span>
            <span className="mx-1.5 opacity-50" aria-hidden="true">
              ·
            </span>
            {t.social.liveLabel}
          </span>
        </motion.div>
      )}

      {/* stats strip — Apple-style divided row (2×2 → 1×4) */}
      <Reveal className="relative">
        {/* the one ambient — soft crimson halo behind the numbers */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -inset-x-16 -inset-y-12 rounded-full bg-crimson/[0.05] blur-[110px]"
        />
        <div className="relative grid grid-cols-2 overflow-hidden rounded-3xl card-ios bg-card lg:grid-cols-4">
          {t.social.stats.map((stat, i) => (
            <div
              key={stat.label}
              className={`border-border/60 p-6 text-center sm:p-8 ${STAT_CELL_BORDERS[i] ?? ""}`}
            >
              {/* dir="ltr" keeps digits + suffix ("290K+", "99.9%") intact in RTL;
                  reduced motion → the counter settles on its first frame */}
              <span dir="ltr">
                <AnimatedCounter
                  value={stat.value}
                  suffix={stat.suffix}
                  duration={reduce ? 1 : 1400}
                  className="font-display text-3xl font-extrabold tabular-nums text-foreground sm:text-4xl"
                />
              </span>
              <p className="mt-2 text-xs text-muted-foreground sm:text-sm">{stat.label}</p>
            </div>
          ))}
        </div>
      </Reveal>

      {/* trust claims — every provable one carries its evidence (date, result, link) */}
      <Reveal delay={0.05}>
        <h3 className="type-eyebrow mt-12 text-center text-sm font-bold uppercase text-muted-foreground">
          {t.social.trust.title}
        </h3>
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {t.social.trust.items.map((item, i) => {
            const Icon = TRUST_ICONS[i] ?? ShieldCheck;
            const hasEvidence = Boolean(item.href);
            const Wrapper = hasEvidence ? "a" : "div";
            return (
              <Wrapper
                key={item.title}
                {...(hasEvidence
                  ? { href: item.href, target: "_blank", rel: "noopener noreferrer" }
                  : {})}
                className="card-ios group flex items-start gap-3.5 rounded-2xl bg-card/60 p-5 transition-colors hover:border-crimson/40"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-crimson/10 text-crimson">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="flex items-center gap-1.5 text-sm font-bold text-foreground">
                    {item.title}
                    {hasEvidence && (
                      <ArrowUpRight
                        className="h-3.5 w-3.5 text-crimson/70 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                        aria-hidden="true"
                      />
                    )}
                  </span>
                  <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                    {item.desc}
                  </span>
                  {item.meta && (
                    <span className="mt-2 block text-[10px] font-semibold uppercase tracking-wide text-crimson/70">
                      {item.meta}
                      {hasEvidence && ` · ${t.social.trust.viewReport}`}
                    </span>
                  )}
                </span>
              </Wrapper>
            );
          })}
        </div>
      </Reveal>

      {/* artifacts over words — real, checkable things on this very page */}
      <Reveal delay={0.1}>
        <p className="mt-10 text-center text-xs text-muted-foreground/80">
          {t.social.artifacts.title}
        </p>
        <div className="mt-3 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => scrollTo("benchmarks")}
            className="press glass inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold text-foreground/80 transition-colors hover:border-crimson/40 hover:text-crimson"
          >
            {t.social.artifacts.benchmarks}
          </button>
          <button
            type="button"
            onClick={() => scrollTo("download")}
            className="press glass inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold text-foreground/80 transition-colors hover:border-crimson/40 hover:text-crimson"
          >
            {t.social.artifacts.changelog}
          </button>
        </div>
      </Reveal>
    </Section>
  );
}
