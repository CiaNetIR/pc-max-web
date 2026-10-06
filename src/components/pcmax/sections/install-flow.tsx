"use client";

import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type MouseEvent,
} from "react";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { ChevronsDown, Cloud, Loader2, Lock, Check } from "lucide-react";
import { useLanguage } from "@/components/pcmax/language-context";
import { springFluid } from "@/components/pcmax/ui/motion";
import { Reveal, Section, SectionHeading } from "@/components/pcmax/ui/primitives";
import {
  APP_RELEASES_URL,
  resolveLatestAppRelease,
} from "@/lib/app-release";
import {
  GamepadIcon,
  FolderIcon,
  DownloadIcon,
  SettingsIcon,
  ShieldIcon,
  PerformanceIcon,
  WindowsIcon,
  LogoMark,
} from "@/components/pcmax/icons";

/* icons follow the real flow: download → setup → launch → sign in → sync →
 * pick a game → apply (fallbacks keep the grid safe if steps ever change) */
const stepIcons = [DownloadIcon, WindowsIcon, LogoMark, ShieldIcon, FolderIcon, GamepadIcon, SettingsIcon];

/* ------------------------- hydration-safe stores ---------------------- */

/* "mounted" via useSyncExternalStore: the SSR snapshot is false AND the
 * hydration pass reuses it (no markup mismatch); the true client value
 * lands one commit later — the same pattern the showcase uses for the
 * reduce query. It flips the static grid → pinned journey AFTER mount,
 * so the raw document (SEO / no-JS) always carries the readable grid. */
const subscribeNever = () => () => {};
const getMountedTrue = () => true;
const getMountedFalse = () => false;

/* prefers-reduced-motion via useSyncExternalStore (showcase pattern):
 * motion-sensitive visitors keep the calm static grid — no pinning, no
 * scroll-driven choreography (ui-ux-pro-max UX rule, severity High). */
const REDUCE_QUERY = "(prefers-reduced-motion: reduce)";
const subscribeReduce = (cb: () => void) => {
  const mq = window.matchMedia(REDUCE_QUERY);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};
const getReduceSnapshot = () => window.matchMedia(REDUCE_QUERY).matches;
const getReduceServerSnapshot = () => false;

/* -------------------- scene copy (mock UI state) ----------------------- *
 * Illustrative fragments shown inside the decorative journey panels —
 * deliberately kept local, exactly like the showcase's panelDetails: the
 * shared dictionary owns section copy, not the mock app's data. Every
 * product fact reused here (Windows 10 & 11 · x64, catalogue/profile
 * sync, snapshot→apply) is documented on-page. */
type SceneCopy = {
  file: string;
  meta: string;
  wizard: string;
  path: string;
  install: string;
  launch: string;
  native: string;
  signIn: string;
  email: string;
  password: string;
  syncs: string;
  catalogue: string;
  profiles: string;
  syncing: string;
  snapshot: string;
  applied: string;
  play: string;
};

const sceneCopy: Record<"en" | "fa", SceneCopy> = {
  en: {
    file: "PC MAX — Setup",
    meta: "Windows 10 & 11 · x64",
    wizard: "Setup Wizard",
    path: "Install location",
    install: "Install",
    launch: "Launching PC MAX",
    native: "Native Windows desktop app",
    signIn: "Sign in",
    email: "Email",
    password: "Password",
    syncs: "Syncs your catalogue",
    catalogue: "Catalogue",
    profiles: "Profiles",
    syncing: "Syncing from the server",
    snapshot: "Snapshot saved",
    applied: "Transaction applied · Rollback ready",
    play: "Play.",
  },
  fa: {
    file: "PC MAX — نصب",
    meta: "ویندوز 10 و 11 · x64",
    wizard: "ویزارد نصب",
    path: "محل نصب",
    install: "نصب",
    launch: "در حال اجرای PC MAX",
    native: "اپلیکیشن دسکتاپ بومی ویندوز",
    signIn: "ورود",
    email: "ایمیل",
    password: "رمز عبور",
    syncs: "کاتالوگ شما را همگام نگه می‌دارد",
    catalogue: "کاتالوگ",
    profiles: "پروفایل‌ها",
    syncing: "همگام‌سازی از سرور",
    snapshot: "اسنپ‌شات ذخیره شد",
    applied: "تراکنش اعمال شد · بازگردانی آماده است",
    play: "بازی کنید.",
  },
};

/* ------------------------------ scenes -------------------------------- */

/* Decorative mock scenes, one per step. Everything is aria-hidden in the
 * parent; the ONLY scrubbed properties are transform/opacity (GPU). The
 * download bar and the sync arc read the intra-step slice of the scrub
 * spring, so the mock reacts to the scrollbar itself. */
function StepScene({
  i,
  scrub,
  total,
  copy,
  gameNames,
  profileName,
}: {
  i: number;
  scrub: MotionValue<number>;
  total: number;
  copy: SceneCopy;
  gameNames: string[];
  profileName: string;
}) {
  /* Scene 1 — the download progress bar fills with the first step's
   * scroll slice; scene 5 — the sync arc sweeps its own slice. */
  const barFill = useTransform(scrub, [0, 1 / total], [0, 1], { clamp: true });
  const arcLen = 2 * Math.PI * 52;
  const arcOffset = useTransform(scrub, [4 / total, 5 / total], [arcLen, 0], {
    clamp: true,
  });

  switch (i) {
    case 0:
      return (
        <div className="gc-jwin">
          <div className="gc-jwin-bar">
            <span className="gc-jdot" />
            <span className="gc-jdot" />
            <span className="gc-jdot" />
          </div>
          <div className="flex flex-col items-center gap-2.5 px-5 py-5 sm:gap-3 sm:px-6 sm:py-7">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-crimson/12 text-crimson ring-1 ring-inset ring-crimson/30">
              <DownloadIcon className="h-5 w-5" />
            </span>
            <span className="text-[14px] font-bold text-white">{copy.file}</span>
            <span className="rounded-full bg-white/5 px-3 py-1 text-[10.5px] font-semibold text-white/55 ring-1 ring-inset ring-white/10">
              {copy.meta}
            </span>
            <div className="gc-jbar w-full" role="presentation">
              <motion.i style={{ scaleX: barFill }} />
            </div>
          </div>
        </div>
      );
    case 1:
      return (
        <div className="gc-jwin">
          <div className="gc-jwin-bar">
            <span className="gc-jdot" />
            <span className="gc-jdot" />
            <span className="gc-jdot" />
            <span className="ms-2 text-[10.5px] font-semibold text-white/40">{copy.wizard}</span>
          </div>
          <div className="flex flex-col gap-2.5 px-4 py-4 sm:gap-3 sm:px-5 sm:py-5">
            <div className="flex items-center gap-3 rounded-xl bg-white/4 p-2.5 ring-1 ring-inset ring-white/8 sm:p-3">
              <FolderIcon className="h-4 w-4 shrink-0 text-crimson" />
              <div className="flex min-w-0 flex-col gap-1.5">
                <span className="text-[11px] font-semibold text-white/60">{copy.path}</span>
                <div className="gc-jbar w-40" role="presentation">
                  <i style={{ transform: "scaleX(1)" }} />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[0, 1].map((k) => (
                <div key={k} className="flex items-center justify-between gap-2 rounded-xl bg-white/4 px-3 py-2.5 ring-1 ring-inset ring-white/8">
                  <SettingsIcon className="h-3.5 w-3.5 text-white/45" />
                  <span className="relative h-4 w-8 rounded-full bg-crimson/70">
                    <span className="absolute inset-y-0 end-0.5 my-auto h-3 w-3 rounded-full bg-white" />
                  </span>
                </div>
              ))}
            </div>
            <span className="gc-btn-primary mt-1 inline-flex items-center justify-center self-end">
              {copy.install}
            </span>
          </div>
        </div>
      );
    case 2:
      return (
        <div className="flex flex-col items-center gap-4">
          <div className="gc-jwin w-[min(72%,340px)]">
            <div className="gc-jwin-bar">
              <span className="gc-jdot" />
              <span className="gc-jdot" />
              <span className="gc-jdot" />
            </div>
            <div className="flex items-center gap-3 px-5 py-4">
              <LogoMark className="h-8 w-8 shrink-0" />
              <div className="flex flex-col">
                <span className="font-display text-[15px] font-bold text-white">
                  PC&nbsp;<span className="text-crimson">MAX</span>
                </span>
                <span className="text-[11px] text-white/50">{copy.native}</span>
              </div>
            </div>
          </div>
          <span className="rounded-full bg-white/5 px-3.5 py-1.5 text-[11px] font-semibold text-white/55 ring-1 ring-inset ring-white/10">
            {copy.launch}
          </span>
        </div>
      );
    case 3:
      return (
        <div className="gc-jwin">
          <div className="gc-jwin-bar">
            <span className="gc-jdot" />
            <span className="gc-jdot" />
            <span className="gc-jdot" />
            <span className="ms-2 flex items-center gap-1.5 text-[10.5px] font-semibold text-white/40">
              <Lock className="h-3 w-3" />
              {copy.signIn}
            </span>
          </div>
          <div className="flex flex-col gap-2.5 px-4 py-4 sm:gap-3 sm:px-5 sm:py-5">
            {[copy.email, copy.password].map((label) => (
              <div key={label} className="flex items-center justify-between gap-3 rounded-xl bg-white/4 px-3 py-2.5 ring-1 ring-inset ring-white/8 sm:px-3.5 sm:py-3">
                <span className="text-[11px] font-semibold text-white/55">{label}</span>
                <span className="flex gap-1" aria-hidden="true">
                  {[0, 1, 2, 3, 4, 5].map((d) => (
                    <span key={d} className="h-1.5 w-1.5 rounded-full bg-white/30" />
                  ))}
                </span>
              </div>
            ))}
            <span className="gc-btn-primary mt-1 inline-flex items-center justify-center self-end">
              {copy.signIn}
            </span>
            <span className="self-center text-[10.5px] font-semibold text-white/40">{copy.syncs}</span>
          </div>
        </div>
      );
    case 4:
      return (
        <div className="flex flex-col items-center gap-4">
          <div className="relative flex h-[120px] w-[120px] items-center justify-center">
            <svg viewBox="0 0 120 120" className="absolute inset-0 h-full w-full" aria-hidden="true">
              <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
              <motion.circle
                cx="60"
                cy="60"
                r="52"
                fill="none"
                stroke="#e50914"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={arcLen}
                style={{ strokeDashoffset: arcOffset, rotate: "-90deg", transformOrigin: "60px 60px" }}
              />
            </svg>
            <Cloud className="h-8 w-8 text-crimson" />
          </div>
          <span className="text-[12px] font-semibold text-white/55">{copy.syncing}</span>
          <div className="flex flex-wrap justify-center gap-2">
            {[copy.catalogue, copy.profiles].map((chip) => (
              <span key={chip} className="rounded-full bg-crimson/10 px-3.5 py-1.5 text-[11px] font-bold text-[#ff8a80] ring-1 ring-inset ring-crimson/25">
                {chip}
              </span>
            ))}
          </div>
        </div>
      );
    case 5:
      return (
        <div className="flex w-[min(88%,430px)] flex-col gap-3">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {gameNames.slice(0, 6).map((name, k) => (
              <div key={name} className={k === 0 ? "gc-jtile on" : "gc-jtile"}>
                <GamepadIcon className="h-3.5 w-3.5 text-white/40" />
                <span className="leading-snug">{name}</span>
              </div>
            ))}
          </div>
          <span className="self-center rounded-full bg-crimson/10 px-3.5 py-1.5 text-[11px] font-bold text-[#ff8a80] ring-1 ring-inset ring-crimson/25">
            {profileName}
          </span>
        </div>
      );
    default:
      return (
        <div className="flex flex-col items-center gap-4">
          <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-crimson/12 text-crimson ring-1 ring-inset ring-crimson/35">
            <Check className="h-7 w-7" strokeWidth={3} />
            <ShieldIcon className="absolute -bottom-1 -end-1 h-6 w-6 rounded-full bg-[#121216] p-1 text-success-gc ring-1 ring-inset ring-white/12" />
          </span>
          <div className="flex flex-col items-center gap-1.5 text-center">
            <span className="text-[13px] font-bold text-white">{copy.snapshot}</span>
            <span className="max-w-[36ch] text-[11.5px] font-semibold leading-relaxed text-white/50">
              {copy.applied}
            </span>
          </div>
          <span className="gc-btn-primary inline-flex items-center justify-center">
            {copy.play}
          </span>
        </div>
      );
  }
}

/* ------------------------------ rail item ----------------------------- */

function RailItem({
  i,
  total,
  active,
  scrub,
  label,
  current,
  onSelect,
}: {
  i: number;
  total: number;
  active: boolean;
  scrub: MotionValue<number>;
  label: string;
  current: number;
  onSelect: (i: number) => void;
}) {
  const fill = useTransform(scrub, [i / total, (i + 1) / total], [0, 1], {
    clamp: true,
  });
  const btnRef = useRef<HTMLButtonElement>(null);

  /* Keep the active chip inside the (scrollable, RTL-aware) phone strip —
   * the same viewport-rect delta math the showcase tablist uses. Desktop
   * rail doesn't scroll, so this is a no-op there. */
  useEffect(() => {
    if (!active) return;
    const btn = btnRef.current;
    const list = btn?.parentElement;
    if (!btn || !list) return;
    const br = btn.getBoundingClientRect();
    const lr = list.getBoundingClientRect();
    const pad = 8;
    if (br.left < lr.left + pad) {
      list.scrollLeft += br.left - lr.left - pad;
    } else if (br.right > lr.right - pad) {
      list.scrollLeft += br.right - lr.right + pad;
    }
  }, [active]);

  return (
    <button
      ref={btnRef}
      type="button"
      onClick={() => onSelect(i)}
      aria-current={active ? "step" : undefined}
      /* the visual path (v2.8): past steps settle at full legibility,
         the active step lights, future steps recede — a readable
         progress trail instead of seven identical chips */
      data-jstate={active ? "active" : i < current ? "past" : "future"}
      className="gc-jrail-btn press"
    >
      <span className="gc-jnum" aria-hidden="true">
        {String(i + 1).padStart(2, "0")}
      </span>
      <span>{label}</span>
      <motion.span className="gc-jfill" style={{ scaleX: fill }} aria-hidden="true" />
    </button>
  );
}

/* ------------------------------ journey ------------------------------- */

function Journey({
  steps,
  labels,
  gameNames,
  profileName,
  locale,
}: {
  steps: { title: string; desc: string }[];
  labels: {
    menuLabel: string;
    scrollHint: string;
    skip: string;
    counter: string;
    disclaimer: string;
  };
  gameNames: string[];
  profileName: string;
  locale: "en" | "fa";
}) {
  const total = steps.length;
  const wrapRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(0);

  /* The scroll runway: one rAF-driven progress value for the whole pinned
   * section, smoothed by a scrub spring (ui-ux-pro-max motion row 6 —
   * "use a small scrub number so it feels tied to the scrollbar"). */
  const { scrollYProgress } = useScroll({
    target: wrapRef,
    offset: ["start start", "end end"],
  });
  const scrub = useSpring(scrollYProgress, {
    stiffness: 110,
    damping: 26,
    mass: 0.4,
  });

  /* The step index flips at 1/total boundaries — at most `total` React
   * commits per pass through the section; the bars/arc never re-render
   * (they read the MotionValue directly). */
  useMotionValueEvent(scrub, "change", (v) => {
    const next = Math.max(
      0,
      Math.min(total - 1, Math.floor(v * total)),
    );
    setStep((cur) => (cur === next ? cur : next));
  });

  /* Rail click → jump the scrollbar to that step's slice of the runway.
   * One layout read per click, never during scroll. */
  const jumpTo = (i: number) => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const top = window.scrollY + wrap.getBoundingClientRect().top;
    const span = Math.max(1, wrap.offsetHeight - window.innerHeight);
    window.scrollTo({
      top: top + (i / total) * span + 4,
      behavior: window.matchMedia(REDUCE_QUERY).matches ? "auto" : "smooth",
    });
  };

  const skip = () => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const top = window.scrollY + wrap.getBoundingClientRect().top;
    const span = Math.max(1, wrap.offsetHeight - window.innerHeight);
    window.scrollTo({
      top: top + span + 12,
      behavior: window.matchMedia(REDUCE_QUERY).matches ? "auto" : "smooth",
    });
  };

  const counter = labels.counter
    .replace("{n}", String(step + 1))
    .replace("{total}", String(total));

  return (
    <div
      ref={wrapRef}
      className="gc-journey"
      style={{ "--gc-jcount": String(total) } as CSSProperties}
    >
      {/* The pinned stage — the "page stays fixed" moment: sticky for the
          whole runway, released the instant the sequence completes. */}
      <div className="gc-jstage">
        <div className="gc-jgrid">
          {/* the menu box — the seven real steps, clickable, each with a
              scroll-driven fill */}
          <div className="gc-jrail" role="group" aria-label={labels.menuLabel}>
            {steps.map((s, i) => (
              <RailItem
                key={s.title}
                i={i}
                total={total}
                active={i === step}
                current={step}
                scrub={scrub}
                label={s.title}
                onSelect={jumpTo}
              />
            ))}
          </div>

          {/* the console — decorative mock scenes crossfading per step */}
          <div className="gc-jvisual">
            <div className="gc-jpanel" aria-hidden="true">
              <AnimatePresence initial={false}>
                <motion.div
                  key={step}
                  className="absolute inset-0 flex items-center justify-center p-5 sm:p-8"
                  initial={{ opacity: 0, y: 16, scale: 0.985 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -12, scale: 0.99 }}
                  transition={springFluid}
                >
                  <StepScene
                    i={step}
                    scrub={scrub}
                    total={total}
                    copy={sceneCopy[locale]}
                    gameNames={gameNames}
                    profileName={profileName}
                  />
                </motion.div>
              </AnimatePresence>
            </div>

            {/* the caption — the REAL step copy (tab pattern: every step
                lives in the DOM, inactive ones carry `hidden`) */}
            <div className="gc-jcaption">
              <span className="gc-jcount" dir="ltr">
                {counter}
              </span>
              {steps.map((s, i) => (
                <div key={s.title} hidden={i !== step}>
                  <span className="gc-jcap-title">{s.title}</span>
                  <p className="gc-jcap-desc">{s.desc}</p>
                </div>
              ))}
            </div>
            <p className="gc-jnote">{labels.disclaimer}</p>
          </div>
        </div>

        {/* floating affordances — hint fades after the first step */}
        <span
          className="gc-jhint"
          aria-hidden="true"
          style={{ opacity: step === 0 ? 1 : 0 }}
        >
          {labels.scrollHint}
          <ChevronsDown className="h-3.5 w-3.5" />
        </span>
        <button type="button" className="gc-jskip press" onClick={skip}>
          {labels.skip}
        </button>
      </div>
    </div>
  );
}

/* --------------------------- static fallback -------------------------- *
 * The calm grid every visitor starts with: server-rendered (SEO / no-JS),
 * and the PERMANENT experience for motion-sensitive visitors (skill rule:
 * reduced motion = the final readable state, no pinning, no parallax). */
function StaticGrid({ steps }: { steps: { title: string; desc: string }[] }) {
  const reduce = useReducedMotion();
  return (
    <>
      {/* Scoped step-circle skin — globals.css is frozen for this wave, so
       * the shipped .gc-step counter badge gets its TweakFa install-step
       * look (reference .step::before) via a tiny local sheet: the 54px
       * counter badge becomes a ring CIRCLE carrying the counter-generated
       * Latin digit. Visual only — the reveal choreography below is the
       * E2E-proven original. */}
      <style>{`
.pcx-isteps .gc-step::before {
  border-radius: 50%;
  content: counter(gcstep);
  font-size: 20px;
  font-weight: 700;
}
@media (max-width: 820px) {
  .pcx-isteps .gc-step::before {
    font-size: 15px;
  }
}`}</style>
      <ol
        role="list"
        style={{ counterReset: "gcstep" }}
        className="pcx-isteps grid gap-x-6 min-[821px]:grid-cols-2 min-[821px]:gap-y-10 lg:grid-cols-4"
      >
        {steps.map((step, i) => {
          const Icon = stepIcons[i] ?? PerformanceIcon;
          return (
            <motion.li
              key={step.title}
              initial={reduce ? false : { opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "0px 0px -40px 0px" }}
              transition={{ ...springFluid, delay: i * 0.07 }}
              className="gc-step"
            >
              <div>
                <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-crimson/10 text-crimson ring-1 ring-inset ring-crimson/25 min-[821px]:mx-auto">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="type-title font-display text-[17px] font-bold text-foreground">
                  {step.title}
                </h3>
                <p className="mt-2 max-w-[34ch] text-[13.5px] leading-[1.95] text-muted-foreground min-[821px]:mx-auto">
                  {step.desc}
                </p>
              </div>
            </motion.li>
          );
        })}
      </ol>
    </>
  );
}

/* ------------------------------ Section ------------------------------ */

export function InstallFlow() {
  const { t, locale } = useLanguage();
  const [busy, setBusy] = useState(false);
  /* Task 32: the step-1 link resolves the newest GitHub release live —
   * same resolver as the main download button (audit 29-b D13 heritage:
   * a direct link, no dead-end, no competition with the premium card). */
  async function onDownload(e: MouseEvent<HTMLAnchorElement>) {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    const release = await resolveLatestAppRelease();
    setBusy(false);
    window.location.href = release?.url ?? APP_RELEASES_URL;
  }

  const reduce = useSyncExternalStore(subscribeReduce, getReduceSnapshot, getReduceServerSnapshot);
  const mounted = useSyncExternalStore(subscribeNever, getMountedTrue, getMountedFalse);

  /* The six real library titles for the "Pick a Game" scene + the real
   * Maximum FPS profile name — sourced from the dictionary, never
   * invented (they mirror the product's catalogue copy on this page). */
  const gameNames = t.library.games.map((g) => g.name);
  const profileName = t.profiles.green.mode;

  return (
    <Section id="install">
      <SectionHeading
        eyebrow={t.install.eyebrow}
        title={t.install.title}
        desc={t.install.desc}
        align="center"
      />

      {/* Task 39 — the pinned scroll journey: after hydration (and only
          when motion is welcome) the seven steps become a scrollytelling
          sequence — the page pins while the menu box + console complete,
          then releases. Everyone else keeps the grid above. */}
      {mounted && !reduce ? (
        <Journey
          steps={t.install.steps}
          labels={t.install.journey}
          gameNames={gameNames}
          profileName={profileName}
          locale={locale}
        />
      ) : (
        <StaticGrid steps={t.install.steps} />
      )}

      {/* terminal flourish — a REAL download link: the newest release of
          github.com/CiaNetIR/pc-max, resolved live (href = releases page) */}
      <Reveal delay={0.15} className="mt-10 flex justify-center">
        <a
          href={APP_RELEASES_URL}
          onClick={onDownload}
          aria-busy={busy}
          className="gc-btn-primary press inline-flex items-center gap-2.5"
        >
          {busy ? (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden="true" />
          ) : (
            <DownloadIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
          )}
          {t.hero.primary}
        </a>
      </Reveal>
    </Section>
  );
}
