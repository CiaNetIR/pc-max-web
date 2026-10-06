"use client";

import { useRef, useState, type FormEvent } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { Check, ChevronDown, Loader2, Mail, Sparkles } from "lucide-react";
import { useLanguage } from "@/components/pcmax/language-context";
import { Section } from "@/components/pcmax/ui/primitives";
import { springFluid } from "@/components/pcmax/ui/motion";
import { DownloadIcon, PerformanceIcon, ShieldIcon } from "@/components/pcmax/icons";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { installerHref, IS_STATIC_EXPORT, GITHUB_REPO_URL } from "@/lib/gh-pages";
import { cn } from "@/lib/utils";

/* Prop payloads — serialized server → client. The server wrapper
 * (download-cta.tsx) queries the DB directly and seeds these, so no
 * /api/release or /api/changelog request ever happens on the client. */
export type ReleaseInfo = {
  version: string;
  size: string;
  channel: string;
  releasedAt: string;
  checksum: string | null;
  /* Installer file name — resolves the download href (API route in the SSR
   * flavor, deployed artifact in the static GitHub Pages flavor). */
  fileName: string;
};

export type ChangelogGroup = {
  version: string;
  channel: string;
  releasedAt: string;
  entries: { tag: string; text: string }[];
};

/* "loading" is kept for the sub-component contracts; with SSR seeding this
 * component starts at "ready" or "error" — the skeleton states are defensive
 * only (they can no longer occur on the happy path). */
export type DataState = "loading" | "ready" | "error";

export type DownloadCtaClientProps = {
  release: ReleaseInfo;
  releaseState: DataState;
  changelog: ChangelogGroup[];
  changelogState: DataState;
};

type WaitlistState = "idle" | "submitting" | "success" | "duplicate" | "error";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/* ------------------------------ Sub-blocks ---------------------------- */

/* Release meta chips — version / size / channel / released / checksum.
 * Rendered with the initial HTML (SSR-seeded props), aria-live announces
 * the defensive loading/error states. */
function ReleaseChips({ state, release, locale }: { state: DataState; release: ReleaseInfo | null; locale: "en" | "fa" }) {
  const { t } = useLanguage();

  const date = release
    ? new Date(release.releasedAt).toLocaleDateString(locale === "fa" ? "fa-IR" : "en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "";

  const chip = "rounded-full border border-border bg-[#121216] px-3 py-1 font-medium text-foreground/80";

  return (
    <div className="mt-5 flex min-h-8 flex-wrap items-center justify-center gap-2 text-xs" aria-live="polite">
      {state === "loading" && <span className={chip}>{t.cta.fetching}</span>}
      {state === "error" && <span className={chip}>{t.cta.error}</span>}
      {/* Chips render for the live release OR the static fallback — the
          error pill above stays honest about which one it is. */}
      {release && (
        <>
          <span className="rounded-full border border-crimson/25 bg-crimson/10 px-3 py-1 font-mono font-bold text-crimson">
            {t.cta.versionLabel} {release.version}
          </span>
          <span className={chip}>
            {t.cta.sizeLabel} {release.size}
          </span>
          <span className={cn(chip, "flex items-center gap-1.5")}>
            <ShieldIcon className="h-3.5 w-3.5 text-crimson" />
            {t.cta.channelLabel}: {release.channel}
          </span>
          <span className={chip}>
            {t.cta.releasedLabel}: {date}
          </span>
          {release.checksum && (
            <span
              dir="ltr"
              className="rounded-full border border-border bg-[#121216] px-3 py-1 font-mono text-[11px] text-foreground/80"
              title={release.checksum}
            >
              {t.cta.checksumLabel}: {release.checksum}
            </span>
          )}
        </>
      )}
    </div>
  );
}

/* Changelog — kept as real content (SSR-seeded from the DB), folded into a
 * collapsible hairline panel so the premium card stays focused on the
 * download action. Tag pills reuse the existing changelog.tags strings. */
function Changelog({ state, groups }: { state: DataState; groups: ChangelogGroup[] }) {
  const { t } = useLanguage();

  return (
    <details className="mt-8">
      <summary className="press flex cursor-pointer list-none items-center justify-center gap-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground [&::-webkit-details-marker]:hidden">
        <PerformanceIcon className="h-4 w-4 text-crimson" />
        {t.cta.changelog.title}
        <ChevronDown className="gc-chevron h-4 w-4 transition-transform duration-300" aria-hidden="true" />
      </summary>

      {/* aria-live announces state swaps; the skeleton only ever shows for a
          defensive "loading" state — server seeding renders entries at SSR. */}
      <div className="mt-5 max-h-80 space-y-6 overflow-y-auto pe-2 scrollbar-slim" aria-live="polite">
        {state === "loading" && (
          <div className="space-y-3" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-4 animate-pulse rounded-full bg-border/50" style={{ width: `${88 - i * 14}%` }} />
            ))}
          </div>
        )}
        {state === "error" && <p className="text-sm text-muted-foreground">{t.cta.changelog.error}</p>}
        {state === "ready" &&
          groups.map((group) => (
            <div key={group.version}>
              <div className="flex items-baseline gap-2.5">
                <span className="font-mono text-sm font-bold text-crimson">v{group.version}</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(group.releasedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </span>
              </div>
              <ul className="mt-2.5 space-y-2">
                {group.entries.map((entry, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm leading-relaxed text-foreground/85">
                    <span
                      className={
                        entry.tag === "feature"
                          ? "type-eyebrow mt-0.5 shrink-0 rounded-full border border-crimson/30 bg-crimson/10 px-2 py-0.5 text-[10px] font-bold uppercase text-crimson"
                          : entry.tag === "fix"
                            ? "type-eyebrow mt-0.5 shrink-0 rounded-full border border-border/70 px-2 py-0.5 text-[10px] font-bold uppercase text-muted-foreground"
                            : "type-eyebrow mt-0.5 shrink-0 rounded-full border border-crimson/20 px-2 py-0.5 text-[10px] font-bold uppercase text-crimson"
                      }
                    >
                      {t.cta.changelog.tags[entry.tag as "feature" | "improvement" | "fix"] ?? entry.tag}
                    </span>
                    {entry.text}
                  </li>
                ))}
              </ul>
            </div>
          ))}
      </div>
    </details>
  );
}

/* Editions — Free (current, the download itself) and Pro (coming, waitlist).
 * Restyled as dark selectable rows inside the premium card's action column. */
function EditionPicker({ onPro }: { onPro: () => void }) {
  const { t } = useLanguage();

  return (
    <div className="grid gap-2.5">
      {/* Free — current */}
      <div className="relative flex items-center justify-between gap-3 rounded-xl border border-crimson/40 bg-crimson/[0.08] px-4 py-3.5">
        <div className="flex min-w-0 items-center gap-3">
          <span className="tick">
            <Check className="h-3.5 w-3.5" strokeWidth={3} />
          </span>
          <div className="min-w-0">
            <span className="flex flex-wrap items-center gap-2 font-display text-sm font-bold text-foreground">
              {t.cta.editions.free.name}
              <span className="type-eyebrow rounded-full border border-crimson/30 bg-crimson/10 px-2 py-0.5 text-[10px] font-bold uppercase text-crimson">
                {t.cta.editions.free.badge}
              </span>
            </span>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{t.cta.editions.free.tagline}</p>
          </div>
        </div>
        <span className="shrink-0 font-display text-lg font-extrabold text-crimson">{t.cta.editions.free.price}</span>
      </div>
      {/* Pro — coming */}
      <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-[#121216] px-4 py-3.5">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-[21px] w-[21px] flex-none items-center justify-center text-crimson/70">
            <Sparkles className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <span className="flex flex-wrap items-center gap-2 font-display text-sm font-bold text-foreground">
              {t.cta.editions.pro.name}
              <span className="type-eyebrow rounded-full border border-border px-2 py-0.5 text-[10px] font-bold uppercase text-muted-foreground">
                {t.cta.editions.pro.badge}
              </span>
            </span>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{t.cta.editions.pro.tagline}</p>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <span className="font-display text-lg font-extrabold text-muted-foreground">{t.cta.editions.pro.price}</span>
          <button
            type="button"
            onClick={onPro}
            className="gc-btn-ghost press rounded-full px-3.5 py-1.5 text-[11px] font-bold"
          >
            {t.cta.editions.pro.cta}
          </button>
        </div>
      </div>
    </div>
  );
}

function WaitlistCard() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [state, setState] = useState<WaitlistState>("idle");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (state === "submitting" || state === "success") return;
    if (!EMAIL_RE.test(email.trim())) {
      setState("error");
      return;
    }
    setState("submitting");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (!res.ok) throw new Error("waitlist failed");
      const data = (await res.json()) as { status: "created" | "duplicate" };
      setState(data.status === "duplicate" ? "duplicate" : "success");
      if (data.status === "created") {
        toast({ title: "PC MAX", description: t.cta.waitlist.success });
      }
    } catch {
      setState("error");
    }
  }

  const done = state === "success" || state === "duplicate";

  return (
    <div id="waitlist" className="gc-card mx-auto mt-10 w-full max-w-2xl p-6 sm:p-8">
      <h3 className="type-eyebrow flex items-center justify-center gap-2.5 text-sm font-semibold uppercase text-crimson">
        <Mail className="h-4 w-4" />
        {t.cta.waitlist.title}
      </h3>
      <p className="mx-auto mt-3 max-w-md text-center text-sm leading-relaxed text-muted-foreground">{t.cta.waitlist.desc}</p>

      {done ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springFluid}
          className="mx-auto mt-6 flex max-w-md flex-1 flex-col items-center justify-center rounded-2xl border border-crimson/25 bg-[#121216] px-6 py-6 text-center"
          role="status"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-crimson/10 text-crimson">
            <Check className="h-5 w-5" strokeWidth={3} />
          </span>
          <p className="mt-3 font-display text-base font-bold text-foreground">
            {state === "duplicate" ? t.cta.waitlist.duplicate : t.cta.waitlist.success}
          </p>
          {state === "success" && (
            <p className="mt-1 text-xs text-muted-foreground">{t.cta.waitlist.successDesc}</p>
          )}
        </motion.div>
      ) : IS_STATIC_EXPORT ? (
        /* Static GitHub Pages mirror: there is no server to submit to —
         * point Pro-curious visitors at the GitHub releases instead. */
        <div className="mx-auto mt-6 flex max-w-md flex-1 flex-col items-center justify-center gap-4 rounded-2xl border border-crimson/25 bg-[#121216] px-6 py-8 text-center">
          <p className="text-sm leading-relaxed text-muted-foreground">{t.cta.waitlist.staticNote}</p>
          <a
            href={`${GITHUB_REPO_URL}/releases`}
            target="_blank"
            rel="noopener noreferrer"
            className="gc-btn-ghost press inline-flex h-11 items-center justify-center rounded-full px-6 text-sm font-semibold"
          >
            GitHub <span aria-hidden="true">↗</span>
          </a>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="mx-auto mt-6 flex max-w-md flex-col gap-3 sm:flex-row" noValidate>
          <label className="sr-only" htmlFor="waitlist-email">
            {t.cta.waitlist.placeholder}
          </label>
          <Input
            id="waitlist-email"
            type="email"
            dir="ltr"
            required
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (state === "error") setState("idle");
            }}
            placeholder={t.cta.waitlist.placeholder}
            className="h-12 flex-1 rounded-full border-border bg-[#121216] text-sm"
            autoComplete="email"
          />
          <button
            type="submit"
            disabled={state === "submitting"}
            className="gc-btn-primary press inline-flex h-12 items-center justify-center gap-2 rounded-full px-6 text-sm font-bold disabled:opacity-60"
          >
            {state === "submitting" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {t.cta.waitlist.button}
          </button>
        </form>
      )}
      {state === "error" && (
        <p className="mt-3 text-center text-xs font-medium text-crimson" role="alert">
          {t.cta.waitlist.error}
        </p>
      )}
    </div>
  );
}

/* ------------------------------ Section ------------------------------- */

/* Same data/behavior as the pre-SSR version minus the two mount-time fetches
 * (release + changelog): the data arrives as props from the server render,
 * so chips + changelog paint with the HTML — no HTML → JS → fetch → render
 * waterfall. Waitlist submit stays a client POST; the download button keeps
 * its real href (SSR: /api/download counting route, static: the artifact). */
export function DownloadCtaClient({
  release,
  releaseState,
  changelog,
  changelogState,
}: DownloadCtaClientProps) {
  const { t, locale } = useLanguage();
  const reduce = useReducedMotion();

  /* `.shcard.in` — lands the perks' staggered entrance once the card enters
   * the viewport (the orbit/glow/sheen run continuously via pure CSS). */
  const cardRef = useRef<HTMLDivElement>(null);
  const cardInView = useInView(cardRef, { once: true, margin: "0px 0px -100px 0px" });

  const scrollToWaitlist = () =>
    document.getElementById("waitlist")?.scrollIntoView({ behavior: "smooth", block: "center" });

  /* Perks — 100% reused dictionary strings: hero bullets, platform facts,
   * and the Free edition's own tagline. */
  const perks = [
    t.hero.bullets[0],
    t.hero.bullets[1],
    t.hero.bullets[2],
    t.footer.platformItems[2],
    t.footer.platformItems[3],
    t.cta.editions.free.tagline,
  ];

  /* Requirements meta row (reference .instal__foot) — OS / arch / memory /
   * disk / GPU with the teal compatibility dots. */
  const requirements = [
    { label: t.cta.requirements.os, value: t.cta.requirements.osValue },
    { label: t.cta.requirements.arch, value: t.cta.requirements.archValue },
    { label: t.cta.requirements.ram, value: t.cta.requirements.ramValue },
    { label: t.cta.requirements.disk, value: t.cta.requirements.diskValue },
    { label: t.cta.requirements.gpu, value: t.cta.requirements.gpuValue },
  ];

  return (
    <Section id="download" className="overflow-hidden">
      {/* ambient violet glow behind the card */}
      <div
        className="pointer-events-none absolute start-1/2 top-16 h-[420px] w-[820px] max-w-none -translate-x-1/2 rounded-full bg-crimson/[0.1] blur-[130px]"
        aria-hidden="true"
      />

      {/* heading — gold kicker (built manually: SectionHeading renders the
          violet kicker; the premium card section calls for the gold variant) */}
      <div className="mx-auto mb-10 max-w-2xl text-center sm:mb-12">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "0px 0px -80px 0px" }}
          transition={springFluid}
          className="mb-5 flex justify-center"
        >
          <span className="kicker kicker-gold">{t.nav.download}</span>
        </motion.div>

        <motion.h2
          initial={reduce ? false : { opacity: 0, y: 32, filter: "blur(8px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true, margin: "0px 0px -80px 0px" }}
          transition={springFluid}
          className="type-display font-display text-[clamp(24px,2.9vw,34px)] font-extrabold text-foreground"
        >
          {t.cta.title.split(".").map((part, i, arr) =>
            part.trim() ? (
              <span key={i} className={i === arr.length - 2 ? "text-glow-crimson" : ""}>
                {part.trim()}
                {i < arr.length - 1 ? ". " : ""}
              </span>
            ) : null
          )}
        </motion.h2>

        <motion.p
          initial={reduce ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "0px 0px -80px 0px" }}
          transition={{ ...springFluid, delay: 0.12 }}
          className="type-lead mx-auto mt-4 max-w-xl text-base text-muted-foreground sm:text-lg"
        >
          {t.cta.sub}
        </motion.p>
      </div>

      {/* premium card — animated conic orbit border, drifting glows, sheen
          sweep and the breathing three-bar mark (all pure CSS in globals) */}
      <div ref={cardRef} className={cn("shcard", cardInView && "in")}>
        <span className="shcard__edge" aria-hidden="true" />
        <span className="shcard__gA" aria-hidden="true" />
        <span className="shcard__gB" aria-hidden="true" />
        <span className="shcard__sheen" aria-hidden="true" />

        <div className="shcard__in">
          {/* top grid — brand lock + perks ⇄ editions + download */}
          <div className="grid items-center gap-8 border-b border-border pb-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-12">
            {/* LEFT — brand lock + perks */}
            <div className="min-w-0">
              <div className="flex items-center gap-4">
                <div className="shmark" aria-hidden="true">
                  <i className="f1" />
                  <i className="f2" />
                  <i className="f3" />
                </div>
                <div className="min-w-0">
                  <span
                    dir="ltr"
                    className="block bg-gradient-to-r from-[#fedb29] via-[#ff3b30] to-[#1fbf9c] bg-clip-text text-[11px] font-bold tracking-[0.22em] text-transparent"
                  >
                    PC MAX
                  </span>
                  <h3 className="type-title font-display mt-1 text-[clamp(21px,2.2vw,26px)] font-black leading-snug text-foreground">
                    {t.footer.tagline}
                  </h3>
                </div>
              </div>

              <div className="shperks mt-7">
                <ul>
                  {perks.map((perk) => (
                    <li key={perk}>
                      <b aria-hidden="true" />
                      {perk}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* RIGHT — editions + the download action */}
            <div className="min-w-0">
              <EditionPicker onPro={scrollToWaitlist} />

              {/* REAL download — streams the installer from /api/download
                  (SSR flavor) / the deployed artifact (static flavor) */}
              <a
                href={installerHref(release.fileName)}
                aria-label={t.cta.button}
                className="gc-btn-gold press mt-6 flex h-[52px] w-full items-center justify-center gap-2.5 rounded-xl text-[15px] font-extrabold"
              >
                <DownloadIcon className="h-5 w-5" />
                {t.cta.button}
              </a>

              <ReleaseChips state={releaseState} release={release} locale={locale} />
              <p className="mt-3 text-center text-xs text-muted-foreground">{t.cta.meta}</p>
            </div>
          </div>

          {/* changelog — collapsible */}
          <Changelog state={changelogState} groups={changelog} />

          {/* foot — compatibility row (reference .instal__foot) */}
          <div className="mt-8 border-t border-border pt-6">
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-[13px] text-muted-foreground">
              {requirements.map(({ label, value }) => (
                <span key={label} className="flex items-center gap-2">
                  <i className="h-1.5 w-1.5 flex-none rounded-full bg-[#1fbf9c]" aria-hidden="true" />
                  <span className="flex flex-wrap items-baseline gap-1.5">
                    <span>{label}</span>
                    <b className="font-semibold text-foreground">{value}</b>
                  </span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* waitlist — Pro early access, kept as its own compact card so the
          premium card stays a single focused download surface */}
      <WaitlistCard />
    </Section>
  );
}
