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

/* Code-signed · VirusTotal clean (dated + linked) · zero telemetry */
const TRUST_ICONS = [FileCheck2, ShieldCheck, WifiOff];

/* Same data as the pre-SSR version minus the mount-time /api/stats fetch:
 * the live-downloads pill renders with the server HTML (real number in the
 * initial document), the gc-stat tiles keep their SSR-final-value counters,
 * and the trust claims read as reference-style voices cards. */
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

      {/* stats — reference .stats grid of Guardian stat tiles (teal Sora
          numerals; AnimatedCounter drives the count-up inside the <b>) */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {t.social.stats.map((stat, i) => (
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

      {/* trust claims — reference .voices grid. Every provable claim keeps
          its evidence (date, result, link); icon badge in the avatar slot,
          claim title as the caption name, evidence meta as the handle chip. */}
      <Reveal delay={0.05}>
        <h3 className="type-eyebrow mt-12 text-center text-sm font-bold uppercase text-muted-foreground">
          {t.social.trust.title}
        </h3>
        <div className="mt-5 grid gap-5 md:grid-cols-3">
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
                className="group block"
              >
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
                        {hasEvidence && ` · ${t.social.trust.viewReport}`}
                      </span>
                    )}
                    {hasEvidence && (
                      <ArrowUpRight
                        className="h-3.5 w-3.5 text-crimson/70 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                        aria-hidden="true"
                      />
                    )}
                  </figcaption>
                </figure>
              </Wrapper>
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
