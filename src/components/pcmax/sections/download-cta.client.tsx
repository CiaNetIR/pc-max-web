"use client";

import { useRef, useState, type FormEvent, type MouseEvent, type ToggleEvent } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { Check, ChevronDown, Copy, Github, Loader2, Mail, ShieldCheck, Sparkles } from "lucide-react";
import { useLanguage } from "@/components/pcmax/language-context";
import { Section } from "@/components/pcmax/ui/primitives";
import { springFluid } from "@/components/pcmax/ui/motion";
import { DownloadIcon, PerformanceIcon } from "@/components/pcmax/icons";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useLatestAppRelease } from "@/hooks/use-app-release";
import {
  APP_RELEASES_URL,
  KNOWN_LATEST,
  resolveLatestAppRelease,
  resolveAppReleases,
  type AppRelease,
} from "@/lib/app-release";
import { APP_REPO_URL, IS_STATIC_EXPORT, GITHUB_REPO_URL } from "@/lib/gh-pages";
import { cn } from "@/lib/utils";

/*
 * Download CTA — the conversion section (Task 32: real GitHub releases).
 *
 * Every download surface resolves the NEWEST release of the PC MAX app
 * repository live (api.github.com → newest tag → the x64 setup .exe), with
 * a sessionStorage cache + in-flight memo so the whole page view costs one
 * request (see lib/app-release.ts). The <a href> is always the releases
 * page — the no-JS / crawler / middle-click truth — while the normal click
 * is intercepted to hand the browser the direct installer URL.
 *
 * The chips (version / size / released) start from the hand-verified
 * KNOWN_LATEST baseline painted with the SSR HTML and upgrade live via
 * useLatestAppRelease() — never a fabricated version again. The changelog
 * panel loads the real release list lazily on first open.
 */

type WaitlistState = "idle" | "submitting" | "success" | "duplicate" | "error";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/* ------------------------------ Sub-blocks ---------------------------- */

/* Release meta chips — version / size / released / source. Seeded from the
 * KNOWN_LATEST baseline in the SSR HTML, upgraded live after hydration;
 * aria-live announces the swap when the API knows something newer. */
function ReleaseChips() {
  const { t, locale } = useLanguage();
  const { release } = useLatestAppRelease();

  const date = new Date(release.releasedAt).toLocaleDateString(
    locale === "fa" ? "fa-IR-u-ca-persian-nu-latn" : "en-US",
    { year: "numeric", month: "short", day: "numeric" }
  );

  const chip =
    "rounded-full border border-border bg-[#121216] px-3 py-1 font-medium text-foreground/80";

  return (
    <div className="mt-5 flex min-h-8 flex-wrap items-center justify-center gap-2 text-xs" aria-live="polite">
      <span className="rounded-full border border-crimson/25 bg-crimson/10 px-3 py-1 font-mono font-bold text-crimson">
        {t.cta.versionLabel} {release.version}
      </span>
      <span className={chip}>
        {t.cta.sizeLabel} {release.size}
      </span>
      <span className={chip}>
        {t.cta.releasedLabel}: {date}
      </span>
      <a
        href={APP_REPO_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(chip, "inline-flex items-center gap-1.5 transition-colors hover:border-crimson/40 hover:text-foreground")}
      >
        <Github className="h-3.5 w-3.5" aria-hidden="true" />
        {t.cta.sourceLabel}: GitHub
      </a>
    </div>
  );
}

/* Source row — the honest trust signal for a remote artifact: WHERE the
 * installer ships from. Replaces the old local-file SHA-256 verify row
 * (Task 32): a hash of the retired demo artifact next to the real GitHub
 * download would be actively misleading. */
function SourceRow() {
  const { t } = useLanguage();

  return (
    <div className="mt-4 rounded-xl border border-border/70 bg-[#121216] p-3.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="type-eyebrow flex items-center gap-2 text-[11px] font-bold uppercase text-muted-foreground">
          <Github className="h-3.5 w-3.5 text-crimson" aria-hidden="true" />
          {t.cta.source.label}
        </span>
        <a
          href={APP_REPO_URL}
          target="_blank"
          rel="noopener noreferrer"
          dir="ltr"
          className="press inline-flex min-h-9 items-center gap-1.5 rounded-full border border-border px-3 py-1 font-mono text-[11px] font-semibold text-foreground/85 transition-colors hover:border-crimson/40 hover:text-foreground"
        >
          {t.cta.source.value} <span aria-hidden="true">↗</span>
        </a>
      </div>
      <p className="mt-2 text-[10.5px] leading-relaxed text-muted-foreground/80">
        {t.cta.source.note}
      </p>
    </div>
  );
}

/* Verify row — the REAL SHA-256 of the published installer (Task 35),
 * computed locally from the actual release artifact on GitHub Releases.
 * Version-pinned: rendered ONLY while the download serves exactly the
 * release the hash was measured from — showing a different file's hash
 * next to the button would mislead. The GitHub API exposes no hashes,
 * so once the live resolver knows a NEWER tag the row quietly disappears
 * (the SourceRow above still links the release page for verification). */
function VerifyRow() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { release } = useLatestAppRelease();

  if (release.version !== KNOWN_LATEST.version || !KNOWN_LATEST.sha256) {
    return null;
  }
  const checksum = KNOWN_LATEST.sha256;

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(checksum);
      toast({ title: "PC MAX", description: t.cta.verify.copied });
    } catch {
      /* clipboard denied (permissions / http) — the code block below is
       * select-all, so the fallback hint is honest */
      toast({ title: "PC MAX", description: t.cta.verify.copyFailed });
    }
  }

  return (
    <div className="mt-3 rounded-xl border border-border/70 bg-[#121216] p-3.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="type-eyebrow flex items-center gap-2 text-[11px] font-bold uppercase text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5 text-crimson" aria-hidden="true" />
          {t.cta.verify.label}
        </span>
        <button
          type="button"
          onClick={onCopy}
          className="press inline-flex min-h-9 items-center gap-1.5 rounded-full border border-border px-3 py-1 text-[11px] font-bold text-foreground/85 transition-colors hover:border-crimson/40 hover:text-foreground"
        >
          <Copy className="h-3 w-3" aria-hidden="true" />
          {t.cta.verify.copy}
        </button>
      </div>
      {/* the artifact's own hash — select-all so the manual fallback works */}
      <code
        dir="ltr"
        className="mt-2.5 block break-all rounded-lg bg-[#08080a]/60 px-3 py-2 font-mono text-[10.5px] leading-relaxed text-foreground/85 select-all"
      >
        {checksum}
      </code>
      <p className="mt-2 text-[10.5px] leading-relaxed text-muted-foreground/80">
        {t.cta.verify.note}{" "}
        <span dir="ltr" className="font-mono">
          {KNOWN_LATEST.fileName}
        </span>
      </p>
    </div>
  );
}

/* Changelog — the REAL release list from the app repository, resolved
 * lazily the first time the panel is opened (no render-time request, no
 * API burn for the ~99% of visitors who never open it). */
function Changelog() {
  const { t, locale } = useLanguage();
  const [state, setState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [releases, setReleases] = useState<AppRelease[]>([]);

  function onToggle(e: ToggleEvent<HTMLDetailsElement>) {
    if (!e.currentTarget.open || state !== "idle") return;
    setState("loading");
    resolveAppReleases().then((list) => {
      if (list) {
        setReleases(list);
        setState("ready");
      } else {
        setState("error");
      }
    });
  }

  return (
    <details className="mt-8" onToggle={onToggle}>
      <summary className="press flex min-h-11 cursor-pointer list-none items-center justify-center gap-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground [&::-webkit-details-marker]:hidden">
        <PerformanceIcon className="h-4 w-4 text-crimson" />
        {t.cta.changelog.title}
        <ChevronDown className="gc-chevron h-4 w-4 transition-transform duration-300" aria-hidden="true" />
      </summary>

      <div className="mt-5 max-h-80 space-y-6 overflow-y-auto pe-2 scrollbar-slim" aria-live="polite">
        {state === "loading" && (
          <div className="space-y-3" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-4 animate-pulse rounded-full bg-border/50"
                style={{ width: `${88 - i * 14}%` }}
              />
            ))}
          </div>
        )}
        {state === "error" && (
          <p className="text-sm text-muted-foreground">
            {t.cta.changelog.error}{" "}
            <a
              href={`${APP_REPO_URL}/releases`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-foreground underline decoration-crimson/50 underline-offset-4"
            >
              {t.cta.changelog.viewOnGithub} ↗
            </a>
          </p>
        )}
        {state === "ready" && releases.length === 0 && (
          <p className="text-sm text-muted-foreground">{t.cta.changelog.empty}</p>
        )}
        {state === "ready" &&
          releases.map((release) => (
            <div key={release.tag}>
              <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                <span className="font-mono text-sm font-bold text-crimson" dir="ltr">
                  v{release.version}
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(release.releasedAt).toLocaleDateString(
                    locale === "fa" ? "fa-IR-u-ca-persian-nu-latn" : "en-US",
                    { month: "short", day: "numeric", year: "numeric" }
                  )}
                </span>
                <a
                  href={`${APP_REPO_URL}/releases/tag/${release.tag}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ms-auto text-[11px] font-semibold text-muted-foreground transition-colors hover:text-foreground"
                >
                  {t.cta.changelog.viewOnGithub} ↗
                </a>
              </div>
              {release.notes && (
                <p className="mt-2 max-w-[60ch] text-sm leading-relaxed text-foreground/85">
                  {release.notes}
                </p>
              )}
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
    /* D1/Task 28-d (critical): `grid-cols-1` emits minmax(0,1fr) — the bare
       `grid gap-2.5` implicit auto track sized rows to their min-content
       (~588px, inflated by the nowrap tagline), pushing the price column
       and the Pro waitlist CTA out of the card where .shcard__in's
       overflow:hidden silently clipped them on phones AND 1024–1279px. */
    <div className="grid grid-cols-1 gap-2.5">
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
            className="gc-btn-ghost press min-h-11 rounded-full px-3.5 py-1.5 text-[11px] font-bold"
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
         * point Pro-curious visitors at the app repository instead. */
        <div className="mx-auto mt-6 flex max-w-md flex-1 flex-col items-center justify-center gap-4 rounded-2xl border border-crimson/25 bg-[#121216] px-6 py-8 text-center">
          <p className="text-sm leading-relaxed text-muted-foreground">{t.cta.waitlist.staticNote}</p>
          <a
            href={GITHUB_REPO_URL}
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
            {t.cta.waitlist.emailLabel}
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

export function DownloadCtaClient() {
  const { t } = useLanguage();
  const reduce = useReducedMotion();
  const [busy, setBusy] = useState(false);

  /* `.shcard.in` — lands the perks' staggered entrance once the card enters
   * the viewport (the orbit/glow/sheen run continuously via pure CSS). */
  const cardRef = useRef<HTMLDivElement>(null);
  const cardInView = useInView(cardRef, { once: true, margin: "0px 0px -100px 0px" });

  const scrollToWaitlist = () =>
    /* C8/Task 28-c: respect prefers-reduced-motion like every other
       programmatic scroll on the page. */
    document
      .getElementById("waitlist")
      ?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });

  /* The download action (Task 32): resolve the newest GitHub release and
   * hand the browser the direct installer URL. The anchor's href is the
   * releases page — the truth for no-JS, crawlers and modified clicks. */
  async function onDownload(e: MouseEvent<HTMLAnchorElement>) {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    const release = await resolveLatestAppRelease();
    setBusy(false);
    /* Direct .exe → the browser downloads without leaving the page; any
     * resolve failure falls back to the releases page, which always
     * serves the newest build. */
    window.location.href = release?.url ?? APP_RELEASES_URL;
  }

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
      {/* ambient crimson glow behind the card — physical centering (D2/Task
          28-d): start-1/2 + a physical -translate-x-1/2 never flips in RTL and
          pushed this glow fully off-screen in FA. */}
      <div
        className="pointer-events-none absolute left-1/2 top-16 h-[420px] w-[820px] max-w-none -translate-x-1/2 rounded-full bg-crimson/[0.1] blur-[130px]"
        aria-hidden="true"
      />

      {/* heading — gold kicker (built manually: SectionHeading renders the
          crimson kicker; the premium card section calls for the gold variant) */}
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
                  <h3 className="type-title font-display mt-1 text-[clamp(21px,2.2vw,26px)] font-extrabold leading-snug text-foreground">
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

              {/* REAL download — resolves the newest release of
                  github.com/CiaNetIR/pc-max live; href is the honest
                  no-JS fallback (the releases page). */}
              <a
                href={APP_RELEASES_URL}
                onClick={onDownload}
                aria-label={busy ? t.cta.buttonBusy : t.cta.button}
                aria-busy={busy}
                className="gc-btn-gold press mt-6 flex h-[52px] w-full items-center justify-center gap-2.5 rounded-xl text-[15px] font-extrabold"
              >
                {busy ? (
                  <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                ) : (
                  <DownloadIcon className="h-5 w-5" />
                )}
                {t.cta.button}
              </a>

              <ReleaseChips />
              <p className="mt-3 text-center text-xs text-muted-foreground">{t.cta.meta}</p>
              <SourceRow />
              <VerifyRow />
            </div>
          </div>

          {/* changelog — collapsible, loads the real release list on open */}
          <Changelog />

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
