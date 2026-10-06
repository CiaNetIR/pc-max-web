"use client";

import { useCallback, useEffect, useId, useRef, useState, useSyncExternalStore, type ComponentProps } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Cloud, Lock, Pause, Play } from "lucide-react";
import { useLanguage } from "@/components/pcmax/language-context";
import { Section, SectionHeading, AnimatedCounter } from "@/components/pcmax/ui/primitives";
import { asset } from "@/lib/gh-pages";
import { AiIcon, BackupIcon, GpuIcon, PerformanceIcon, ShieldIcon } from "@/components/pcmax/icons";
import { springFluid } from "@/components/pcmax/ui/motion";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type TabKey = "dashboard" | "multiframe" | "windows" | "settings";

const tabOrder: TabKey[] = ["dashboard", "multiframe", "windows", "settings"];

/* Auto-rotation heartbeat (owner request): the showcase panels swap on
 * this cadence while the region is on screen, un-hovered and un-focused;
 * the full a11y contract lives with the autoplay state block below. */
const AUTOPLAY_MS = 1500;

/* prefers-reduced-motion via useSyncExternalStore: the SSR snapshot is
 * false AND the hydration pass reuses it, so markup can never mismatch;
 * the real client value (and any live toggle of it) lands one commit
 * later. (framer's useReducedMotion reads the media query synchronously
 * on the first client render — fine for animation props, unsafe for
 * structure.) */
const REDUCE_QUERY = "(prefers-reduced-motion: reduce)";
const subscribeReduce = (cb: () => void) => {
  const mq = window.matchMedia(REDUCE_QUERY);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};
const getReduceSnapshot = () => window.matchMedia(REDUCE_QUERY).matches;
const getReduceServerSnapshot = () => false;

/* Responsive WebP key-arts (Task 24, Lighthouse "Improve image delivery":
 * −123 KiB mobile; Task 33: famous-character swap). The Pages export runs
 * images unoptimized, so next/image emits a bare src with NO srcset — every
 * device downloaded the full 840px art. The gallery hand-rolls a srcSet
 * (plain <img>): 480w serves DPR-1 desktop cards + the mock's thumbnails,
 * 672w serves DPR-1.75 mobile (~380 CSS × 1.75 = 662 px), 840w stays for
 * high-DPR. Every key art now carries an instantly recognizable character
 * (user request): Johnny Silverhand, the GTA V trio, the Destined One,
 * Kratos, Geralt, Arthur Morgan — generated one-shot by
 * scripts/character-keyart.ts. */
const gameFiles = [
  "cyberpunk",
  "gtav",
  "wukong",
  "kratos",
  "geralt",
  "rdr2",
].map((name) => {
  const master = asset(`/games/${name}.webp`);
  return {
    thumb: asset(`/games/${name}-480.webp`),
    src: master,
    srcSet: `${asset(`/games/${name}-480.webp`)} 480w, ${asset(`/games/${name}-672.webp`)} 672w, ${master} 840w`,
  };
});

/* ------------------- Panel detail copy (mock UI state) -----------------
 * Illustrative values shown inside the product mock — deliberately kept
 * local: the shared dictionary owns section copy, not the mock app's data.
 * Profile names mirror the real product's Optimization Profiles
 * (Maximum FPS / Balanced / High Quality / Ultra Quality). */

const panelDetails = {
  en: {
    sync: { label: "Sync", status: "Online · synced 2 min ago" },
    rating: "Performance",
    newOpt: "New optimization",
    win: {
      registry: "Registry",
      tasks: "Scheduled tasks",
      gameFiles: "Game files",
      snapshot: "Snapshot saved before changes — one-click rollback.",
      rollbackChip: "1-click rollback",
    },
    settings: {
      sync: "Sync",
      lastSync: "Synced 2 min ago",
      syncNow: "Sync now",
      cache: "Cache",
      clearCache: "Clear cache",
      offline: "Offline mode",
      offlineValue: "Works offline · auto-resync",
      profileValue: "Balanced",
    },
  },
  fa: {
    sync: { label: "همگام‌سازی", status: "آنلاین · آخرین همگام‌سازی 2 دقیقه پیش" },
    rating: "کارایی",
    newOpt: "بهینه‌سازی جدید",
    win: {
      registry: "رجیستری",
      tasks: "وظایف زمان‌بندی‌شده",
      gameFiles: "فایل‌های بازی",
      snapshot: "پیش از تغییرات Snapshot ذخیره می‌شود — بازگردانی با یک کلیک.",
      rollbackChip: "بازگردانی با یک کلیک",
    },
    settings: {
      sync: "همگام‌سازی",
      lastSync: "2 دقیقه پیش همگام شد",
      syncNow: "همگام‌سازی الآن",
      cache: "کش",
      clearCache: "پاک کردن کش",
      offline: "حالت آفلاین",
      offlineValue: "آفلاین کار می‌کند · همگام‌سازی خودکار",
      profileValue: "متعادل",
    },
  },
} as const;

/* Dashboard mock data — per-game metadata for the titles the product mock
 * has full ratings for (names/genres come from the dictionary library;
 * cover art matches it via dictIndex). */
const dashboardGames = [
  {
    dictIndex: 0, // Cyberpunk 2077
    year: 2020,
    rating: 78,
    tech: ["DLSS", "FG", "RT"],
    profile: { en: "Maximum FPS · Target 165 FPS", fa: "حداکثر FPS · هدف 165 فریم" },
    isNew: false,
  },
  {
    dictIndex: 2, // Black Myth: Wukong
    year: 2024,
    rating: 85,
    tech: ["DLSS", "FG"],
    profile: { en: "Balanced · Target 120 FPS", fa: "متعادل · هدف 120 فریم" },
    isNew: true,
  },
] as const;

/* Glassy stat chip floating over a media panel (`.gc-hud-chip` + drift).
 * Position classes come from the caller — each panel places its own HUD. */
function HudChip({ className, children, ...props }: ComponentProps<"div">) {
  return (
    <div className={cn("gc-hud-chip absolute z-10 flex items-center gap-2 px-3 py-2 text-[11px] font-bold", className)} {...props}>
      {children}
    </div>
  );
}

/* ------------------------------ Section ------------------------------ */

export function AppShowcase() {
  const { t, locale, isRTL } = useLanguage();
  const { toast } = useToast();
  /* Tab state lives on STABLE INTERNAL IDs (TabKey: "dashboard" | "multiframe"
   * | "windows" | "settings") — never on translated labels. Switching
   * language re-renders labels only; state, keys and comparisons are
   * language-independent by construction. */
  const [tab, setTab] = useState<TabKey>("dashboard");
  /* Gallery selection for the Dashboard media panel (click a thumbnail to
   * swap the key art — the Guardian media panel keeps the old gallery's
   * informational content in a single focused surface). */
  const [gameIdx, setGameIdx] = useState(0);
  /* --- Auto-rotation (owner request): panels swap every AUTOPLAY_MS ---
   * A11y contract (WCAG 2.2.2 + the APG carousel pattern): rotation
   * pauses on hover/focus (reading time) and while off-screen; any manual
   * activation (tab click/keys, thumbnail, mock button) hands control to
   * the visitor for good — the toggle by the disclaimer re-arms it — and
   * prefers-reduced-motion never starts it. */
  const reduce = useSyncExternalStore(subscribeReduce, getReduceSnapshot, getReduceServerSnapshot);
  const [autoOn, setAutoOn] = useState(true);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [inView, setInView] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  /* Off-screen → no wasted ticks (and nothing moving under a viewport the
   * visitor is not looking at). The stable tabpanel div is the anchor. */
  useEffect(() => {
    const el = panelRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => setInView(entries[0]?.isIntersecting ?? false),
      { threshold: 0 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const playing = autoOn && !reduce && !hovered && !focused && inView;

  /* The heartbeat — one tab per tick. The functional setTab reads the live
   * tab (no stale closure); hidden-document ticks are skipped so returning
   * to the page never shows a mid-sequence jump. */
  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => {
      if (document.hidden) return;
      setTab((cur) => tabOrder[(tabOrder.indexOf(cur) + 1) % tabOrder.length]);
    }, AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [playing]);

  /* Hover/focus reading-time pauses — shared by the tab strip and the
   * slider (two sibling regions, no wrapper div: the tuned strip layout
   * stays byte-identical). Focus merely MOVING between the two never
   * resumes rotation spuriously — only focus landing outside both does. */
  const hoverIn = () => setHovered(true);
  const hoverOut = () => setHovered(false);
  const focusIn = () => setFocused(true);
  const focusOut = (e: React.FocusEvent<HTMLDivElement>) => {
    const next = e.relatedTarget;
    if (!(next instanceof Node) || !e.currentTarget.contains(next)) setFocused(false);
  };
  const regionProps = {
    onPointerEnter: hoverIn,
    onPointerLeave: hoverOut,
    onFocusCapture: focusIn,
    onBlurCapture: focusOut,
  } as const;

  /* Unique panel id — stays unique even if this section ever mounts twice. */
  const panelId = useId();
  /* Local mock-data copy for the current locale. */
  const copy = panelDetails[locale];
  /* Windows Optimizer change types (the real Rust engine: registry,
   * services, scheduled tasks, game files) — stable ids, translated labels. */
  const winModules = [
    { id: "win-registry", label: copy.win.registry },
    { id: "win-services", label: t.showcase.win.services },
    { id: "win-tasks", label: copy.win.tasks },
    { id: "win-gamefiles", label: copy.win.gameFiles },
  ];

  const tablistRef = useRef<HTMLDivElement>(null);
  const activeTabRef = useRef<HTMLButtonElement>(null);

  /* Keep the active tab inside the (scrollable, RTL-aware) strip after a
   * tab OR language switch — label widths change with the locale, and the
   * active pill must never sit clipped outside the visible strip. The
   * viewport-rect delta form is direction-agnostic (RTL scrollports use
   * negative scrollLeft in Chromium; += by the measured overshoot reveals
   * the tab correctly in both directions) and never scrolls the page. */
  useEffect(() => {
    const list = tablistRef.current;
    const btn = activeTabRef.current;
    if (!list || !btn) return;
    const br = btn.getBoundingClientRect();
    const lr = list.getBoundingClientRect();
    const pad = 8;
    if (br.left < lr.left + pad) {
      list.scrollLeft += br.left - lr.left - pad;
    } else if (br.right > lr.right - pad) {
      list.scrollLeft += br.right - lr.right + pad;
    }
  }, [tab, locale]);

  /* --- fpill sliding indicator (TweakFa tab pattern, Wave A contract) ---
   * JS measures the ACTIVE pill against the pill row's top-left corner and
   * writes the physical vars (--px/--py/--pw/--ph) on the .fpill element;
   * `.ready` fades it in after the first measurement. getBoundingClientRect
   * returns PHYSICAL (viewport) rects, so the numbers are RTL-safe with zero
   * scrollLeft sign-juggling — and because the indicator lives INSIDE the
   * scrolling pill row, strip scrolling (the reveal effect above, touch
   * swipes) carries it along with the tabs: no scroll listener, no drift.
   * Triggers: mount, tab/locale switch (label widths change with the
   * language), window resize, and font-load (Poppins/IRANYekanX swapping in
   * reflows the labels — a language switch can land with fonts already
   * cached, so the locale dep is required, not just `loadingdone`). Every
   * trigger funnels through one rAF-coalesced scheduler: at most a single
   * read-modify-write per frame, no layout-thrash loops. The .42s
   * ease-unfold slide itself is pure CSS (killed by the global
   * reduced-motion guard); only geometry is measured here. */
  const fpillRef = useRef<HTMLSpanElement>(null);
  const pillRowRef = useRef<HTMLDivElement>(null);
  const fpillRaf = useRef(0);

  const measureFpill = useCallback(() => {
    const row = pillRowRef.current;
    const btn = activeTabRef.current;
    const pill = fpillRef.current;
    if (!row || !btn || !pill) return;
    const br = btn.getBoundingClientRect();
    const rr = row.getBoundingClientRect();
    const s = pill.style;
    s.setProperty("--px", `${br.left - rr.left}px`);
    s.setProperty("--py", `${br.top - rr.top}px`);
    s.setProperty("--pw", `${br.width}px`);
    s.setProperty("--ph", `${br.height}px`);
    pill.classList.add("ready");
  }, []);

  const scheduleFpill = useCallback(() => {
    if (fpillRaf.current) return;
    fpillRaf.current = requestAnimationFrame(() => {
      fpillRaf.current = 0;
      measureFpill();
    });
  }, [measureFpill]);

  /* Passive observers — attached once for the section's lifetime. */
  useEffect(() => {
    window.addEventListener("resize", scheduleFpill);
    const fonts = document.fonts;
    fonts.addEventListener("loadingdone", scheduleFpill);
    void fonts.ready.then(scheduleFpill);
    return () => {
      window.removeEventListener("resize", scheduleFpill);
      fonts.removeEventListener("loadingdone", scheduleFpill);
      if (fpillRaf.current) cancelAnimationFrame(fpillRaf.current);
      fpillRaf.current = 0;
    };
  }, [scheduleFpill]);

  /* Re-measure whenever the active pill — or the label rendering it —
   * changes (runs after the reveal effect above; irrelevant for the row-
   * relative math, but keeps the two effects from interleaving reads). */
  useEffect(() => {
    scheduleFpill();
  }, [tab, locale, scheduleFpill]);

  /* Accessible tabs pattern — works identically in EN and FA: arrow keys
   * move the active tab (direction-aware: in RTL, ArrowLeft means "next"),
   * Home/End jump to the ends, focus follows the roving tabindex. */
  function onTablistKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    const idx = tabOrder.indexOf(tab);
    const last = tabOrder.length - 1;
    const nextKey = isRTL ? "ArrowLeft" : "ArrowRight";
    const prevKey = isRTL ? "ArrowRight" : "ArrowLeft";
    let next: number | null = null;
    if (e.key === nextKey) next = idx === last ? 0 : idx + 1;
    else if (e.key === prevKey) next = idx === 0 ? last : idx - 1;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = last;
    if (next === null) return;
    e.preventDefault();
    /* roving-tabindex navigation is manual control too */
    setAutoOn(false);
    const id = tabOrder[next];
    setTab(id);
    requestAnimationFrame(() => {
      tablistRef.current
        ?.querySelector<HTMLButtonElement>(`[data-tab="${id}"]`)
        ?.focus();
    });
  }

  const mockToast = () => {
    /* engaging with the mock = stop rotating away from it */
    setAutoOn(false);
    toast({ title: "PC MAX", description: t.showcase.disclaimer });
  };

  const tabs = tabOrder.map((key) => ({
    key,
    label: t.showcase.tabs[key], // label only — the ID is the identity
  }));

  /* Slide copy per tab — every string is REUSED dictionary content
   * (library / multiframe / features / safety / social-trust), the mock's
   * own local state copy, or bench numbers. No new keys, no new copy. */
  const slides: Record<TabKey, { title: string; bullets: string[] }> = {
    dashboard: {
      title: t.library.title,
      bullets: [
        t.hero.bullets[0],
        t.features.groups[0].items[1],
        t.features.groups[1].items[1],
        t.features.groups[0].items[2],
      ],
    },
    multiframe: {
      title: t.multiframe.title,
      bullets: [
        t.multiframe.cards[0].bullets[0],
        t.multiframe.cards[1].bullets[0],
        t.multiframe.cards[2].bullets[0],
        t.multiframe.note,
      ],
    },
    windows: {
      title: t.safety.optimizer.title,
      bullets: [
        t.features.groups[1].items[0],
        t.features.groups[2].items[0],
        t.features.groups[2].items[1],
      ],
    },
    settings: {
      title: t.social.trust.title,
      bullets: [
        t.social.trust.items[2].desc,
        t.features.groups[2].items[2],
        t.safety.desc,
      ],
    },
  };
  const slide = slides[tab];

  const gameInfo = t.library.games[gameIdx];
  const gameMeta = dashboardGames.find((g) => g.dictIndex === gameIdx);
  /* Streamline card — the only workflow carrying a hardware warning. */
  const streamlineCard = t.multiframe.cards[2];
  /* OptiScaler card — carries the upscaler compatibility badges. */
  const optiCard = t.multiframe.cards[0];
  const badgeLabel = "badges" in optiCard ? (optiCard.badges ?? []).join(" · ") : "";

  /* Frame + surface shared by every media panel: flat bezel frame,
   * dark app surface, gentle hover scale (v2.8: the sheen sweep is
   * retired — the panel reads as product UI, not as a promo card). */
  const frameClass = "gc-frame transition-transform duration-500 ease-out hover:scale-[1.012]";
  const surfaceClass =
    "relative overflow-hidden rounded-[calc(var(--radius)-4px)] bg-[#0d0d11] p-5 pt-16 sm:p-6 sm:pt-16";

  return (
    <Section id="showcase" className="overflow-hidden">
      <SectionHeading
        eyebrow={t.showcase.eyebrow}
        title={t.showcase.title}
        desc={t.showcase.desc}
        align="center"
      />

      {/* Interface-preview label — hoisted to the tab strip (audit 29-b D9:
          visitors see the mock panels first; the label must not live only in
          a 12px footnote 700px below) — plus the auto-rotation control:
          WCAG 2.2.2 asks for an explicit pause for auto-updating content,
          so a small icon toggle sits by the preview label (hidden when
          reduced motion keeps rotation off entirely). */}
      <div className="mt-3 flex items-center justify-center gap-2.5">
        <p className="gc-logline text-center text-xs">
          {t.showcase.disclaimer}
        </p>
        {!reduce && (
          <button
            type="button"
            onClick={() => setAutoOn((v) => !v)}
            aria-label={autoOn ? t.showcase.pauseAuto : t.showcase.resumeAuto}
            title={autoOn ? t.showcase.pauseAuto : t.showcase.resumeAuto}
            className="press relative flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground/60 transition-colors hover:text-foreground after:absolute after:-inset-2"
          >
            {autoOn ? (
              <Pause className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <Play className="h-3.5 w-3.5" aria-hidden="true" />
            )}
          </button>
        )}
      </div>

      {/* Tab strip — Guardian .ftabs language: pill tabs on a hairline-
          scrollable strip, hidden scrollbar, centered when it fits. The
          whole <button> is the hit area; snap keeps pills readable mid-scroll.
          TweakFa restyle (Task 42): the pills are TRANSPARENT — .showcase-tab
          owns the colors (text-mid → hover → white) — and the active state is
          drawn by the .fpill indicator sliding underneath, so the per-tab
          bg/ring/shadow utilities are retired per the Wave A contract. The
          strip splits in two layers: the tablist stays the (scrollable)
          viewport, while the inner pill row (position:relative) anchors the
          fpill and scrolls WITH the pills. */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "0px 0px -60px 0px" }}
        transition={springFluid}
        {...regionProps}
      >
        <div
          ref={tablistRef}
          role="tablist"
          aria-label={t.showcase.eyebrow}
          onKeyDown={onTablistKeyDown}
          className="-mx-4 overflow-x-auto snap-x snap-mandatory px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {/* pill row — w-max + sm:mx-auto reproduces the old
              flex+justify-center centering (and scrolls cleanly when it
              overflows, in either direction); role=presentation keeps the
              tablist's a11y tree flat around the wrapper. */}
          <div
            ref={pillRowRef}
            role="presentation"
            className="relative flex w-max gap-2 sm:mx-auto"
          >
            <span ref={fpillRef} className="fpill" aria-hidden="true" />
            {tabs.map(({ key, label }) => (
              <button
                key={key}
                data-tab={key}
                id={`${panelId}-${key}`}
                type="button"
                role="tab"
                tabIndex={tab === key ? 0 : -1}
                aria-selected={tab === key}
                aria-controls={panelId}
                ref={tab === key ? activeTabRef : undefined}
                onClick={() => {
                  /* manual selection takes the wheel — auto-rotation stops */
                  setAutoOn(false);
                  setTab(key);
                }}
                className="press showcase-tab h-10 flex-none snap-center rounded-full px-4 text-[13.5px] font-bold"
              >
                <span className="whitespace-nowrap">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Slider — only the active tab's panel is rendered; a quick fade+rise
          swaps slides. Mobile stacks media above the copy (reference order). */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "0px 0px -60px 0px" }}
        transition={springFluid}
        {...regionProps}
      >
        <div id={panelId} ref={panelRef} role="tabpanel" aria-labelledby={`${panelId}-${tab}`}>
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8, transition: { duration: 0.14, ease: "easeIn" } }}
              transition={{ duration: 0.32, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)] lg:gap-14">
                {/* MEDIA */}
                <div className="min-w-0 lg:order-2">
                  {/* Dashboard — the game gallery as the media panel: key art
                       with caption + floating HUD stats, thumbnail strip below
                       (click to swap art; 480w variant serves the 92px thumbs). */}
                  {tab === "dashboard" && (
                    <div className={frameClass}>
                      <div className="relative overflow-hidden rounded-[calc(var(--radius)-4px)] bg-[#0d0d11]">
                        <div className="relative aspect-[16/10] overflow-hidden">
                          {/* plain <img>: unoptimized export strips next/image's
                              srcset pipeline — srcSet is hand-rolled here instead.
                              sizes mirrors the media panel: full-width below lg
                              (column padding + frame), ~592px column at lg+. */}
                          <img
                            src={gameFiles[gameIdx].src}
                            srcSet={gameFiles[gameIdx].srcSet}
                            sizes="(max-width: 640px) calc(100vw - 2.5rem), (max-width: 1024px) calc(100vw - 3.5rem), 592px"
                            alt={gameInfo.name}
                            loading="lazy"
                            decoding="async"
                            className="absolute inset-0 h-full w-full object-cover"
                          />
                          <div
                            className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent"
                            aria-hidden="true"
                          />
                          {/* floating HUD stats */}
                          <HudChip className="start-3 top-3 sm:start-4 sm:top-4">
                            <Cloud className="h-3.5 w-3.5 text-crimson" />
                            <span className="text-foreground">{copy.sync.label}</span>
                            <span className="h-1.5 w-1.5 rounded-full bg-success-gc" aria-hidden="true" />
                            <span className="font-medium text-muted-foreground">{copy.sync.status}</span>
                          </HudChip>
                          <HudChip className="end-3 top-3 sm:end-4 sm:top-4">
                            <PerformanceIcon className="h-3.5 w-3.5 text-crimson" />
                            <b className="font-display tabular-nums text-success-gc">{t.bench.avg}</b>
                            <span className="font-medium text-muted-foreground">{t.bench.unit}</span>
                          </HudChip>
                          {gameMeta && (
                            <HudChip className="end-3 top-[4.25rem] sm:end-4 sm:top-[4.5rem]">
                              <GpuIcon className="h-3.5 w-3.5 text-crimson" />
                              <b className="font-display tabular-nums text-foreground">
                                {gameMeta.rating}/100
                              </b>
                              <span className="font-medium text-muted-foreground">{copy.rating}</span>
                            </HudChip>
                          )}
                          {/* art caption */}
                          <div className="absolute inset-x-0 bottom-0 p-4 pt-12">
                            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                              <h3 className="font-display text-lg font-bold text-white drop-shadow-lg">
                                {gameInfo.name}
                              </h3>
                              {gameMeta?.isNew && (
                                <span className="rounded-full border border-crimson/40 bg-crimson/15 px-2 py-0.5 text-[10px] font-bold text-crimson">
                                  {copy.newOpt}
                                </span>
                              )}
                            </div>
                            <p className="mt-0.5 text-[11px] font-medium text-white/70">
                              {gameInfo.genre}
                              {gameMeta ? ` · ${gameMeta.year}` : ""}
                            </p>
                            {gameMeta && (
                              <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                                <span className="text-[11px] font-bold text-crimson">{gameMeta.profile[locale]}</span>
                                {gameMeta.tech.map((tech) => (
                                  <span
                                    key={tech}
                                    className="rounded border border-white/20 bg-black/40 px-1.5 py-0.5 font-mono text-[9px] font-bold text-white/70"
                                  >
                                    {tech}
                                  </span>
                                ))}
                              </p>
                            )}
                          </div>
                        </div>
                        {/* thumbnail strip — 92px thumbs, active gets the crimson ring */}
                        <div className="flex snap-x gap-2 overflow-x-auto border-t border-white/[0.07] p-2.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                          {gameFiles.map((g, i) => (
                            <button
                              key={g.src}
                              type="button"
                              onClick={() => {
                /* picking art is manual control — rotation stops */
                setAutoOn(false);
                setGameIdx(i);
              }}
                              aria-label={t.library.games[i].name}
                              aria-pressed={i === gameIdx}
                              className={cn(
                                "press relative h-[52px] w-[92px] flex-none snap-start overflow-hidden rounded-lg transition-opacity duration-200",
                                i === gameIdx
                                  ? "ring-2 ring-crimson-bright ring-offset-2 ring-offset-[#0d0d11]"
                                  : "opacity-55 hover:opacity-90"
                              )}
                            >
                              {/* 480w variant — the full 840px master is 5× oversized for a 92px thumb */}
                              <img
                                src={g.thumb}
                                alt=""
                                loading="lazy"
                                decoding="async"
                                className="absolute inset-0 h-full w-full object-cover"
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Multi-Frame — the three workflows the engine installs,
                      with live per-game counter. */}
                  {tab === "multiframe" && (
                    <div className={frameClass}>
                      <div className={surfaceClass}>
                        {badgeLabel && (
                          <HudChip className="start-4 top-4">
                            <AiIcon className="h-3.5 w-3.5 text-crimson" />
                            <span className="text-foreground">{badgeLabel}</span>
                          </HudChip>
                        )}
                        {"warning" in streamlineCard && (
                          <HudChip className="end-4 top-4">
                            <Lock className="h-3.5 w-3.5 text-warning-gc" />
                            <span className="font-medium text-muted-foreground">{streamlineCard.warning}</span>
                          </HudChip>
                        )}
                        <div className="space-y-2.5">
                          {[
                            { name: "OptiScaler", status: t.showcase.mf.status.installed, ok: true },
                            { name: "AI Optical Flow", status: t.showcase.mf.status.ready, ok: true },
                            { name: "Streamline PC MAX", status: t.showcase.mf.status.incompatible, ok: false },
                          ].map((wf, i) => (
                            <motion.div
                              key={wf.name}
                              initial={{ opacity: 0, x: isRTL ? 14 : -14 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ ...springFluid, delay: 0.08 * i }}
                              className={cn(
                                "flex items-center justify-between rounded-xl border px-4 py-3.5",
                                wf.ok ? "border-white/[0.06] bg-[#15151a]" : "border-crimson/30 bg-crimson/[0.06]"
                              )}
                            >
                              <div className="flex items-center gap-3">
                                {wf.ok ? (
                                  <Check className="h-4 w-4 text-crimson" strokeWidth={3} />
                                ) : (
                                  <Lock className="h-4 w-4 text-crimson" />
                                )}
                                <span className={cn("text-sm font-semibold", wf.ok ? "text-foreground" : "text-muted-foreground")}>
                                  {wf.name}
                                </span>
                              </div>
                              <span
                                className={cn(
                                  "type-eyebrow text-[10px] font-bold uppercase",
                                  wf.ok ? "text-crimson" : "text-muted-foreground"
                                )}
                              >
                                {wf.status}
                              </span>
                            </motion.div>
                          ))}
                          <div className="flex items-center justify-between rounded-xl border border-dashed border-white/[0.12] px-4 py-3.5">
                            <span className="flex items-center gap-3 text-sm font-semibold text-muted-foreground">
                              <AiIcon className="h-4 w-4 text-crimson" />
                              {t.showcase.mf.perGame}
                            </span>
                            <span className="font-display text-lg font-bold tabular-nums text-crimson">
                              <AnimatedCounter value={6} />
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Optimized Windows — applied progress, the four change
                      types, snapshot + one-click rollback. */}
                  {tab === "windows" && (
                    <div className={frameClass}>
                      <div className={surfaceClass}>
                        <HudChip className="start-4 top-4">
                          <BackupIcon className="h-3.5 w-3.5 text-crimson" />
                          <span className="text-crimson">{copy.win.rollbackChip}</span>
                        </HudChip>
                        <HudChip className="end-4 top-4">
                          <span className="font-display tabular-nums text-success-gc">6/8</span>
                          <span className="font-medium text-muted-foreground">{t.showcase.win.modules}</span>
                        </HudChip>
                        <div className="space-y-4">
                          <div className="rounded-xl border border-white/[0.06] bg-[#15151a] p-4">
                            <div className="mb-2.5 flex items-center justify-between text-xs font-semibold text-muted-foreground">
                              <span>{t.showcase.win.applied}</span>
                              <span className="text-foreground">
                                {6} <span className="text-muted-foreground">{t.showcase.win.of}</span>{" "}
                                {8} {t.showcase.win.modules}
                              </span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-white/[0.08]">
                              <motion.div
                                className="h-full rounded-full bg-crimson"
                                initial={{ width: 0 }}
                                animate={{ width: "75%" }}
                                transition={{ ...springFluid, delay: 0.2 }}
                              />
                            </div>
                          </div>

                          {/* the four change types the engine really makes:
                              registry, services, scheduled tasks, game files */}
                          <div className="grid grid-cols-2 gap-2.5">
                            {winModules.map((m, i) => (
                              <motion.div
                                key={m.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ ...springFluid, delay: 0.1 + i * 0.07 }}
                                className="flex items-center gap-2.5 rounded-lg border border-white/[0.06] bg-[#15151a] px-3.5 py-2.5 text-xs font-semibold text-foreground"
                              >
                                <Check className="h-3.5 w-3.5 text-crimson" strokeWidth={3} />
                                {m.label}
                              </motion.div>
                            ))}
                          </div>

                          {/* snapshot taken BEFORE any change — one-click rollback */}
                          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 rounded-xl border border-dashed border-white/[0.12] px-4 py-3">
                            <span className="flex min-w-0 items-center gap-2.5 text-xs font-semibold text-muted-foreground">
                              <BackupIcon className="h-4 w-4 shrink-0 text-crimson" />
                              {copy.win.snapshot}
                            </span>
                            <button
                              type="button"
                              onClick={mockToast}
                              className="press shrink-0 rounded-lg border border-white/10 px-3.5 py-1.5 text-xs font-bold text-muted-foreground transition-colors hover:border-crimson/40 hover:text-crimson"
                            >
                              {t.showcase.win.revert}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Settings — language, default profile, offline-first sync,
                      cache, telemetry off. */}
                  {tab === "settings" && (
                    <div className={frameClass}>
                      <div className={surfaceClass}>
                        <HudChip className="start-4 top-4">
                          <Cloud className="h-3.5 w-3.5 text-success-gc" />
                          <span className="font-medium text-muted-foreground">{copy.settings.offlineValue}</span>
                        </HudChip>
                        <HudChip className="end-4 top-4">
                          <ShieldIcon className="h-3.5 w-3.5 text-success-gc" />
                          <span className="text-success-gc">{t.footer.platformItems[3]}</span>
                        </HudChip>
                        <div className="space-y-2.5">
                          {[
                            { id: "set-language", label: t.showcase.settings.language, value: locale === "fa" ? "فارسی" : "English" },
                            { id: "set-profile", label: t.showcase.settings.profile, value: copy.settings.profileValue },
                          ].map((row) => (
                            <div
                              key={row.id}
                              className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-[#15151a] px-4 py-3.5"
                            >
                              <span className="text-sm font-semibold text-foreground">{row.label}</span>
                              <span className="text-xs font-bold text-muted-foreground">{row.value}</span>
                            </div>
                          ))}
                          {/* offline-first sync — last-sync time + manual sync */}
                          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-xl border border-white/[0.06] bg-[#15151a] px-4 py-3">
                            <div className="flex min-w-0 flex-col">
                              <span className="text-sm font-semibold text-foreground">{copy.settings.sync}</span>
                              <span className="text-[11px] text-muted-foreground">{copy.settings.lastSync}</span>
                            </div>
                            <button
                              type="button"
                              onClick={mockToast}
                              className="press shrink-0 rounded-lg border border-white/10 px-3.5 py-1.5 text-xs font-bold text-muted-foreground transition-colors hover:border-crimson/40 hover:text-crimson"
                            >
                              {copy.settings.syncNow}
                            </button>
                          </div>
                          {/* offline cache — clearable from settings */}
                          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-xl border border-white/[0.06] bg-[#15151a] px-4 py-3">
                            <span className="text-sm font-semibold text-foreground">{copy.settings.cache}</span>
                            <button
                              type="button"
                              onClick={mockToast}
                              className="press shrink-0 rounded-lg border border-white/10 px-3.5 py-1.5 text-xs font-bold text-muted-foreground transition-colors hover:border-crimson/40 hover:text-crimson"
                            >
                              {copy.settings.clearCache}
                            </button>
                          </div>
                          {/* offline behavior — cached data, auto-resync */}
                          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-xl border border-white/[0.06] bg-[#15151a] px-4 py-3">
                            <span className="text-sm font-semibold text-foreground">{copy.settings.offline}</span>
                            <span className="text-[11px] font-semibold text-muted-foreground">{copy.settings.offlineValue}</span>
                          </div>
                          <div className="flex items-center justify-between rounded-xl border border-crimson/30 bg-crimson/[0.06] px-4 py-3.5">
                            <span className="flex items-center gap-2.5 text-sm font-semibold text-foreground">
                              <ShieldIcon className="h-4 w-4 text-crimson" />
                              {t.showcase.settings.telemetry}
                            </span>
                            <span className="type-eyebrow rounded-full border border-crimson/40 bg-crimson/10 px-2.5 py-0.5 text-[10px] font-bold uppercase text-crimson">
                              {t.showcase.settings.off}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* TEXT — h3 (Task 28-b/B7): the slide title sits under the
                    section's own h2; a second h2 broke the outline. */}
                <div className="min-w-0 lg:order-1">
                  <span className="kicker">{t.showcase.tabs[tab]}</span>
                  <h3 className="type-title font-display mt-4 text-2xl font-bold text-foreground sm:text-3xl">
                    {slide.title}
                  </h3>
                  <ul className="mt-6 grid gap-3.5">
                    {slide.bullets.map((b) => (
                      <li key={b} className="flex items-start gap-3 text-[14.5px] leading-relaxed text-muted-foreground">
                        <span className="tick mt-0.5">
                          <Check className="h-3.5 w-3.5" strokeWidth={3} />
                        </span>
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>

      {/* library — recognized titles, folded into the product story as a
          compact strip under the slider (the art grid itself now lives in
          the Dashboard media panel). */}
      <div className="mt-16 sm:mt-20">
        <div className="mb-2 flex items-center justify-center gap-3" aria-hidden="true">
          <span className="h-px w-10 bg-border/80" />
          <span className="type-eyebrow text-[11px] font-bold uppercase text-crimson">{t.library.eyebrow}</span>
          <span className="h-px w-10 bg-border/80" />
        </div>
        <p className="mx-auto mb-6 max-w-2xl text-center text-sm leading-relaxed text-muted-foreground">
          {t.library.desc}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-2">
          <span className="type-eyebrow flex items-center gap-1.5 rounded-full border border-border bg-[#121216] px-3 py-1 font-mono text-[10px] font-semibold uppercase text-muted-foreground">
            <Check className="h-3 w-3 text-crimson" strokeWidth={3} />
            {t.library.badges.exe} · {t.library.badges.icon}
          </span>
          <span className="type-eyebrow flex items-center gap-1.5 rounded-full border border-crimson/25 bg-crimson/10 px-3 py-1 font-mono text-[10px] font-semibold uppercase text-crimson">
            {t.library.badges.ready}
          </span>
        </div>

        <p className="mt-5 text-center text-xs text-muted-foreground">{t.library.footnote}</p>
      </div>

      {/* disclaimer — hoisted to the tab strip (see above); the mock-button
          toast below still re-states it on interaction. */}
    </Section>
  );
}
