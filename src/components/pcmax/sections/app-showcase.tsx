"use client";

import { useEffect, useId, useRef, useState, type ComponentProps } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Cloud, Lock } from "lucide-react";
import { useLanguage } from "@/components/pcmax/language-context";
import { Section, SectionHeading, AnimatedCounter } from "@/components/pcmax/ui/primitives";
import { asset } from "@/lib/gh-pages";
import { AiIcon, BackupIcon, GpuIcon, PerformanceIcon, ShieldIcon } from "@/components/pcmax/icons";
import { springFluid } from "@/components/pcmax/ui/motion";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type TabKey = "dashboard" | "multiframe" | "windows" | "settings";

const tabOrder: TabKey[] = ["dashboard", "multiframe", "windows", "settings"];

/* Responsive WebP key-arts (Task 24, Lighthouse "Improve image delivery":
 * −123 KiB mobile). The Pages export runs images unoptimized, so next/image
 * emits a bare src with NO srcset — every device downloaded the full 840px
 * art. The gallery now hand-rolls a srcSet (plain <img>): 480w serves DPR-1
 * desktop cards + the mock's thumbnails, 672w serves DPR-1.75 mobile
 * (~380 CSS × 1.75 = 662 px), 840w stays for high-DPR. Variants are
 * single-encoded from the git-tracked JPEGs by scripts/responsive-images.ts. */
const gameFiles = [
  "cyberpunk",
  "gtav",
  "wukong",
  "eldenring",
  "alanwake2",
  "bg3",
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
    sync: { label: "همگام‌سازی", status: "آنلاین · آخرین همگام‌سازی ۲ دقیقه پیش" },
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
      lastSync: "۲ دقیقه پیش همگام شد",
      syncNow: "همگام‌سازی الآن",
      cache: "کش",
      clearCache: "پاک کردن کش",
      offline: "حالت آفلاین",
      offlineValue: "آفلاین کار می‌کند · همگام‌سازی خودکار",
      profileValue: "متعادل",
    },
  },
} as const;

/* Persian digit shaping for the FA locale (display only). */
const FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
function localizeNum(locale: string, value: number | string): string {
  const s = String(value);
  return locale === "fa" ? s.replace(/\d/g, (d) => FA_DIGITS.charAt(Number(d))) : s;
}

/* Dashboard mock data — per-game metadata for the titles the product mock
 * has full ratings for (names/genres come from the dictionary library;
 * cover art matches it via dictIndex). */
const dashboardGames = [
  {
    dictIndex: 0, // Cyberpunk 2077
    year: 2020,
    rating: 78,
    tech: ["DLSS", "FG", "RT"],
    profile: { en: "Maximum FPS · Target 165 FPS", fa: "حداکثر FPS · هدف ۱۶۵ فریم" },
    isNew: false,
  },
  {
    dictIndex: 2, // Black Myth: Wukong
    year: 2024,
    rating: 85,
    tech: ["DLSS", "FG"],
    profile: { en: "Balanced · Target 120 FPS", fa: "متعادل · هدف ۱۲۰ فریم" },
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
    const id = tabOrder[next];
    setTab(id);
    requestAnimationFrame(() => {
      tablistRef.current
        ?.querySelector<HTMLButtonElement>(`[data-tab="${id}"]`)
        ?.focus();
    });
  }

  const mockToast = () => {
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

  /* Frame + surface shared by every media panel: violet gradient frame,
   * diagonal sheen sweep, dark app surface, gentle hover scale. */
  const frameClass = "gc-frame media-sheen transition-transform duration-500 ease-out hover:scale-[1.012]";
  const surfaceClass =
    "relative overflow-hidden rounded-[calc(var(--radius)-4px)] bg-[#0d0d11] p-5 pt-16 sm:p-6 sm:pt-16";

  return (
    <Section id="showcase" className="overflow-hidden">
      {/* ambient violet glow behind the slider */}
      <div
        className="pointer-events-none absolute start-1/2 top-24 h-[420px] w-[820px] max-w-none -translate-x-1/2 rounded-full bg-crimson/[0.07] blur-[130px]"
        aria-hidden="true"
      />

      <SectionHeading
        eyebrow={t.showcase.eyebrow}
        title={t.showcase.title}
        desc={t.showcase.desc}
        align="center"
      />

      {/* Tab strip — Guardian .ftabs language: pill tabs on a hairline-
          scrollable strip, hidden scrollbar, centered when it fits. The
          whole <button> is the hit area; snap keeps pills readable mid-scroll. */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "0px 0px -60px 0px" }}
        transition={springFluid}
      >
        <div
          ref={tablistRef}
          role="tablist"
          aria-label={t.showcase.eyebrow}
          onKeyDown={onTablistKeyDown}
          className="-mx-4 flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:justify-center"
        >
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
              onClick={() => setTab(key)}
              className={cn(
                "press h-10 flex-none snap-center rounded-full px-4 text-[13.5px] font-bold transition-colors",
                tab === key
                  ? "bg-[#6734ff] text-white shadow-[0_8px_24px_rgba(103,52,255,0.35)]"
                  : "bg-[#1b1b21] text-muted-foreground ring-1 ring-inset ring-border hover:text-foreground"
              )}
            >
              <span className="whitespace-nowrap">{label}</span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Slider — only the active tab's panel is rendered; a quick fade+rise
          swaps slides. Mobile stacks media above the copy (reference order). */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "0px 0px -60px 0px" }}
        transition={springFluid}
      >
        <div id={panelId} role="tabpanel" aria-labelledby={`${panelId}-${tab}`}>
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
                            alt={`${gameInfo.name} — key art`}
                            loading="lazy"
                            decoding="async"
                            className="absolute inset-0 h-full w-full object-cover"
                          />
                          <div
                            className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent"
                            aria-hidden="true"
                          />
                          {/* floating HUD stats */}
                          <HudChip className="hud-drift start-3 top-3 sm:start-4 sm:top-4">
                            <Cloud className="h-3.5 w-3.5 text-crimson" />
                            <span className="text-foreground">{copy.sync.label}</span>
                            <span className="h-1.5 w-1.5 rounded-full bg-[#1fbf9c]" aria-hidden="true" />
                            <span className="font-medium text-muted-foreground">{copy.sync.status}</span>
                          </HudChip>
                          <HudChip className="hud-drift-2 end-3 top-3 sm:end-4 sm:top-4">
                            <PerformanceIcon className="h-3.5 w-3.5 text-crimson" />
                            <b className="font-display tabular-nums text-[#1fbf9c]">{t.bench.avg}</b>
                            <span className="font-medium text-muted-foreground">{t.bench.unit}</span>
                          </HudChip>
                          {gameMeta && (
                            <HudChip className="hud-drift-3 end-3 top-[4.25rem] sm:end-4 sm:top-[4.5rem]">
                              <GpuIcon className="h-3.5 w-3.5 text-crimson" />
                              <b className="font-display tabular-nums text-foreground">
                                {localizeNum(locale, `${gameMeta.rating}/100`)}
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
                              {gameMeta ? ` · ${localizeNum(locale, gameMeta.year)}` : ""}
                            </p>
                            {gameMeta && (
                              <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                                <span className="text-[11px] font-bold text-[#fedb29]">{gameMeta.profile[locale]}</span>
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
                        {/* thumbnail strip — 92px thumbs, active gets the violet ring */}
                        <div className="flex snap-x gap-2 overflow-x-auto border-t border-white/[0.07] p-2.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                          {gameFiles.map((g, i) => (
                            <button
                              key={g.src}
                              type="button"
                              onClick={() => setGameIdx(i)}
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
                          <HudChip className="hud-drift start-4 top-4">
                            <AiIcon className="h-3.5 w-3.5 text-crimson" />
                            <span className="text-foreground">{badgeLabel}</span>
                          </HudChip>
                        )}
                        {"warning" in streamlineCard && (
                          <HudChip className="hud-drift-2 end-4 top-4">
                            <Lock className="h-3.5 w-3.5 text-[#fedb29]" />
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
                        <HudChip className="hud-drift start-4 top-4">
                          <BackupIcon className="h-3.5 w-3.5 text-[#fedb29]" />
                          <span className="text-[#fedb29]">{copy.win.rollbackChip}</span>
                        </HudChip>
                        <HudChip className="hud-drift-2 end-4 top-4">
                          <span className="font-display tabular-nums text-[#1fbf9c]">{localizeNum(locale, "6/8")}</span>
                          <span className="font-medium text-muted-foreground">{t.showcase.win.modules}</span>
                        </HudChip>
                        <div className="space-y-4">
                          <div className="rounded-xl border border-white/[0.06] bg-[#15151a] p-4">
                            <div className="mb-2.5 flex items-center justify-between text-xs font-semibold text-muted-foreground">
                              <span>{t.showcase.win.applied}</span>
                              <span className="text-foreground">
                                {localizeNum(locale, 6)} <span className="text-muted-foreground">{t.showcase.win.of}</span>{" "}
                                {localizeNum(locale, 8)} {t.showcase.win.modules}
                              </span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-white/[0.08]">
                              <motion.div
                                className="h-full rounded-full bg-gradient-to-r from-crimson to-crimson-bright"
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
                        <HudChip className="hud-drift start-4 top-4">
                          <Cloud className="h-3.5 w-3.5 text-[#1fbf9c]" />
                          <span className="font-medium text-muted-foreground">{copy.settings.offlineValue}</span>
                        </HudChip>
                        <HudChip className="hud-drift-2 end-4 top-4">
                          <ShieldIcon className="h-3.5 w-3.5 text-[#1fbf9c]" />
                          <span className="text-[#1fbf9c]">{t.footer.platformItems[3]}</span>
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

                {/* TEXT */}
                <div className="min-w-0 lg:order-1">
                  <span className="kicker">{t.showcase.tabs[tab]}</span>
                  <h2 className="type-title font-display mt-4 text-2xl font-bold text-foreground sm:text-3xl">
                    {slide.title}
                  </h2>
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

      {/* disclaimer */}
      <p className="mt-10 text-center text-xs text-muted-foreground">{t.showcase.disclaimer}</p>
    </Section>
  );
}
