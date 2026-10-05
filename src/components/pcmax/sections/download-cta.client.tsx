"use client";

import { useState, type FormEvent } from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { Check, HardDrive, Loader2, Mail, MemoryStick, Sparkles } from "lucide-react";
import { useLanguage } from "@/components/pcmax/language-context";
import { MagneticButton, Section } from "@/components/pcmax/ui/primitives";
import { springFluid } from "@/components/pcmax/ui/motion";
import { GpuIcon, CpuIcon, WindowsIcon, DownloadIcon, ShieldIcon, PerformanceIcon } from "@/components/pcmax/icons";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { installerHref, IS_STATIC_EXPORT, GITHUB_REPO_URL } from "@/lib/gh-pages";

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

function ReleaseChips({ state, release, locale }: { state: DataState; release: ReleaseInfo | null; locale: "en" | "fa" }) {
  const { t } = useLanguage();

  const date = release
    ? new Date(release.releasedAt).toLocaleDateString(locale === "fa" ? "fa-IR" : "en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "";

  return (
    <div className="mt-8 flex min-h-8 flex-wrap items-center justify-center gap-2.5 text-xs" aria-live="polite">
      {state === "loading" && (
        <span className="glass rounded-full px-4 py-1.5 font-medium text-foreground/80">
          {t.cta.fetching}
        </span>
      )}
      {state === "error" && (
        <span className="glass rounded-full px-4 py-1.5 font-medium text-foreground/80">
          {t.cta.error}
        </span>
      )}
      {/* Chips render for the live release OR the static fallback — the
          error pill above stays honest about which one it is. */}
      {release && (
        <>
          <span className="glass rounded-full px-4 py-1.5 font-mono font-bold text-crimson">
            {t.cta.versionLabel} {release.version}
          </span>
          <span className="glass rounded-full px-4 py-1.5 font-medium text-foreground/80">
            {t.cta.sizeLabel} {release.size}
          </span>
          <span className="glass flex items-center gap-1.5 rounded-full px-4 py-1.5 font-medium text-foreground/80">
            <ShieldIcon className="h-4 w-4 text-crimson" />
            {t.cta.channelLabel}: {release.channel}
          </span>
          <span className="glass rounded-full px-4 py-1.5 font-medium text-foreground/80">
            {t.cta.releasedLabel}: {date}
          </span>
          {release.checksum && (
            <span
              dir="ltr"
              className="glass rounded-full px-4 py-1.5 font-mono text-[11px] text-foreground/80"
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

function RequirementsCard() {
  const { t } = useLanguage();
  const rows = [
    { Icon: WindowsIcon, label: t.cta.requirements.os, value: t.cta.requirements.osValue },
    { Icon: CpuIcon, label: t.cta.requirements.arch, value: t.cta.requirements.archValue },
    { Icon: MemoryStick, label: t.cta.requirements.ram, value: t.cta.requirements.ramValue },
    { Icon: HardDrive, label: t.cta.requirements.disk, value: t.cta.requirements.diskValue },
    { Icon: GpuIcon, label: t.cta.requirements.gpu, value: t.cta.requirements.gpuValue },
  ];

  return (
    <div className="card-ios flex h-full flex-col rounded-3xl bg-card p-6 sm:p-8">
      <h3 className="type-eyebrow flex items-center gap-2.5 text-sm font-semibold uppercase text-muted-foreground">
        <WindowsIcon className="h-4 w-4 text-crimson" />
        {t.cta.requirements.title}
      </h3>
      <dl className="mt-6 flex-1 space-y-0 divide-y divide-border/60">
        {rows.map(({ Icon, label, value }) => (
          <div key={label} className="flex items-center justify-between gap-4 py-3.5 first:pt-0 last:pb-0">
            <dt className="flex items-center gap-3 text-sm font-medium text-muted-foreground">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-crimson/10 text-crimson">
                <Icon className="h-4 w-4" />
              </span>
              {label}
            </dt>
            <dd dir="ltr" className="text-end text-sm font-bold text-foreground">
              {value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function ChangelogCard({ state, groups }: { state: DataState; groups: ChangelogGroup[] }) {
  const { t } = useLanguage();

  return (
    <div className="card-ios flex h-full flex-col rounded-3xl bg-card p-6 sm:p-8">
      <h3 className="type-eyebrow flex items-center gap-2.5 text-sm font-semibold uppercase text-muted-foreground">
        <PerformanceIcon className="h-4 w-4 text-crimson" />
        {t.cta.changelog.title}
      </h3>

      {/* aria-live announces state swaps; the skeleton only ever shows for a
          defensive "loading" state — server seeding renders entries at SSR. */}
      <div className="mt-6 max-h-96 flex-1 space-y-6 overflow-y-auto pe-2 scrollbar-slim" aria-live="polite">
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
                <span className="text-xs text-muted-foreground/70">
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
                            : "type-eyebrow mt-0.5 shrink-0 rounded-full border border-crimson/20 px-2 py-0.5 text-[10px] font-bold uppercase text-crimson/80"
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
    </div>
  );
}

function EditionsCard({ downloadHref }: { downloadHref: string }) {
  const { t } = useLanguage();

  return (
    <div className="card-ios rounded-3xl bg-card p-6 sm:p-8">
      <h3 className="type-eyebrow text-sm font-semibold uppercase text-muted-foreground">{t.cta.editions.title}</h3>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {/* Free — current */}
        <div className="relative flex flex-col rounded-2xl border border-crimson/40 bg-crimson/[0.04] p-5">
          <span className="type-eyebrow absolute end-4 top-4 rounded-full border border-crimson/30 bg-crimson/10 px-2.5 py-0.5 text-[10px] font-bold uppercase text-crimson">
            {t.cta.editions.free.badge}
          </span>
          <span className="font-display text-lg font-bold text-foreground">{t.cta.editions.free.name}</span>
          <span className="mt-1 font-display text-3xl font-extrabold text-crimson">{t.cta.editions.free.price}</span>
          <p className="mt-2.5 flex-1 text-sm leading-relaxed text-muted-foreground">{t.cta.editions.free.tagline}</p>
          <a
            href={downloadHref}
            className="press mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-crimson px-5 text-sm font-semibold text-white transition-colors hover:bg-crimson-bright"
          >
            <DownloadIcon className="h-4 w-4" />
            {t.cta.editions.free.cta}
          </a>
        </div>
        {/* Pro — coming */}
        <div className="relative flex flex-col rounded-2xl border border-border/70 p-5">
          <span className="type-eyebrow absolute end-4 top-4 rounded-full border border-border/70 px-2.5 py-0.5 text-[10px] font-bold uppercase text-muted-foreground">
            {t.cta.editions.pro.badge}
          </span>
          <span className="flex items-center gap-2 font-display text-lg font-bold text-foreground">
            {t.cta.editions.pro.name}
            <Sparkles className="h-4 w-4 text-crimson/70" />
          </span>
          <span className="mt-1 font-display text-3xl font-extrabold text-muted-foreground">{t.cta.editions.pro.price}</span>
          <p className="mt-2.5 flex-1 text-sm leading-relaxed text-muted-foreground">{t.cta.editions.pro.tagline}</p>
          <button
            type="button"
            onClick={() => document.getElementById("waitlist")?.scrollIntoView({ behavior: "smooth", block: "center" })}
            className="press mt-5 inline-flex h-11 items-center justify-center rounded-full border border-crimson/40 px-5 text-sm font-semibold text-crimson transition-colors hover:bg-crimson/10"
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
    <div id="waitlist" className="card-ios flex h-full flex-col rounded-3xl bg-crimson/[0.04] p-6 sm:p-8">
      <h3 className="type-eyebrow flex items-center gap-2.5 text-sm font-semibold uppercase text-crimson">
        <Mail className="h-4 w-4" />
        {t.cta.waitlist.title}
      </h3>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{t.cta.waitlist.desc}</p>

      {done ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springFluid}
          className="mt-6 flex flex-1 flex-col items-center justify-center rounded-2xl border border-crimson/25 bg-card px-6 py-6 text-center"
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
        <div className="mt-6 flex flex-1 flex-col items-center justify-center gap-4 rounded-2xl border border-crimson/25 bg-card px-6 py-8 text-center">
          <p className="text-sm leading-relaxed text-muted-foreground">{t.cta.waitlist.staticNote}</p>
          <a
            href={`${GITHUB_REPO_URL}/releases`}
            target="_blank"
            rel="noopener noreferrer"
            className="press inline-flex h-11 items-center justify-center gap-2 rounded-full border border-crimson/40 px-6 text-sm font-semibold text-crimson transition-colors hover:bg-crimson/10"
          >
            GitHub <span aria-hidden="true">↗</span>
          </a>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-3 sm:flex-row" noValidate>
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
            className="h-12 flex-1 rounded-full border-border/80 bg-card text-sm"
            autoComplete="email"
          />
          <button
            type="submit"
            disabled={state === "submitting"}
            className="press inline-flex h-12 items-center justify-center gap-2 rounded-full bg-crimson px-6 text-sm font-semibold text-white transition-colors hover:bg-crimson-bright disabled:opacity-60"
          >
            {state === "submitting" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {t.cta.waitlist.button}
          </button>
        </form>
      )}
      {state === "error" && (
        <p className="mt-3 text-xs font-medium text-crimson" role="alert">
          {t.cta.waitlist.error}
        </p>
      )}
    </div>
  );
}

/* ------------------------------ Section ------------------------------- */

/* Same UI/behavior as the pre-SSR version minus the two mount-time fetches
 * (release + changelog): the data arrives as props from the server render,
 * so chips + changelog paint with the HTML — no HTML → JS → fetch → render
 * waterfall. Waitlist submit stays a client POST; the download button keeps
 * its real /api/download href. */
export function DownloadCtaClient({
  release,
  releaseState,
  changelog,
  changelogState,
}: DownloadCtaClientProps) {
  const { t, locale } = useLanguage();
  const reduce = useReducedMotion();

  return (
    <section id="download" className="relative scroll-mt-24 overflow-hidden py-24 sm:py-32">
      {/* ambient layers */}
      <div className="absolute inset-0 bg-grid [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,black,transparent)]" aria-hidden="true" />
      <div className="absolute start-1/2 top-1/2 h-[420px] w-[820px] max-w-none -translate-x-1/2 -translate-y-1/2 rounded-full bg-crimson/[0.12] blur-[130px]" aria-hidden="true" />

      <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6">
        {/* official emblem — reduced motion skips the scale/blur entrance */}
        <motion.div
          initial={reduce ? false : { opacity: 0, scale: 0.82, filter: "blur(10px)" }}
          whileInView={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          viewport={{ once: true, margin: "-60px" }}
          transition={springFluid}
          className="relative mx-auto mb-9 h-24 w-24 sm:h-28 sm:w-28"
        >
          <div
            className="absolute -inset-5 rounded-full bg-crimson/25 blur-2xl dark:bg-crimson/30"
            aria-hidden="true"
          />
          <Image
            src="/brand/pcmax-logo-256.png"
            alt="PC MAX"
            width={112}
            height={112}
            className="relative h-full w-full rounded-full ring-1 ring-border/60"
          />
        </motion.div>

        <motion.h2
          initial={reduce ? false : { opacity: 0, y: 32, filter: "blur(8px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true, margin: "-80px" }}
          transition={springFluid}
          className="type-display font-display text-4xl font-extrabold text-foreground sm:text-6xl"
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
          viewport={{ once: true, margin: "-80px" }}
          transition={{ ...springFluid, delay: 0.12 }}
          className="type-lead mx-auto mt-5 max-w-xl text-base text-muted-foreground sm:text-lg"
        >
          {t.cta.sub}
        </motion.p>

        {/* REAL download — streams the installer from /api/download */}
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ ...springFluid, delay: 0.2 }}
          className="mt-10"
        >
          <MagneticButton
            size="lg"
            strength={18}
            asChild
            className="btn-convex group press h-12 rounded-full px-8 text-base font-semibold text-white"
          >
            <a href={installerHref(release.fileName)} aria-label={t.cta.button}>
              <DownloadIcon className="me-2.5 h-5 w-5 transition-transform duration-300 group-hover:translate-y-0.5" />
              {t.cta.button}
            </a>
          </MagneticButton>
        </motion.div>

        <ReleaseChips state={releaseState} release={release} locale={locale} />

        <p className="mt-4 text-xs text-muted-foreground/80">{t.cta.meta}</p>
      </div>

      {/* detail cards — requirements / changelog / editions / waitlist */}
      <div className="relative mx-auto mt-16 grid max-w-6xl gap-5 px-4 sm:px-6 lg:grid-cols-2">
        <RequirementsCard />
        <ChangelogCard state={changelogState} groups={changelog} />
        <EditionsCard downloadHref={installerHref(release.fileName)} />
        <WaitlistCard />
      </div>
    </section>
  );
}
