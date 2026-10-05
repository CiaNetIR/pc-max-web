"use client";

import { useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, Cloud, Lock, Minus, Square, X } from "lucide-react";
import { useTheme } from "next-themes";
import { useLanguage } from "@/components/pcmax/language-context";
import { Section, SectionHeading, AnimatedCounter } from "@/components/pcmax/ui/primitives";
import { asset } from "@/lib/gh-pages";
import { GpuIcon, PerformanceIcon, BackupIcon, SettingsIcon, ShieldIcon, AiIcon, LogoMark } from "@/components/pcmax/icons";
import { springFluid, whileHoverLift, whileTapPress } from "@/components/pcmax/ui/motion";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type TabKey = "dashboard" | "multiframe" | "windows" | "settings";

const tabOrder: TabKey[] = ["dashboard", "multiframe", "windows", "settings"];
const tabIcons = [PerformanceIcon, GpuIcon, ShieldIcon, SettingsIcon];

/* WebP key-arts (Task 23 image diet: ~68–90 KB JPEG → 43–63 KB WebP,
 * single-encode via scripts/optimize-images.ts). */
const gameFiles = [
  "/games/cyberpunk.webp",
  "/games/gtav.webp",
  "/games/wukong.webp",
  "/games/eldenring.webp",
  "/games/alanwake2.webp",
  "/games/bg3.webp",
].map(asset);

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

/* Dashboard mock rows — the app's Home: per-game cards with a performance
 * rating (0–100), tech badges and the recommended profile + target FPS.
 * Names/genres come from the dictionary library; cover art matches it. */
const dashboardGames = [
  {
    art: gameFiles[0], // Cyberpunk 2077
    dictIndex: 0,
    year: 2020,
    rating: 78,
    tech: ["DLSS", "FG", "RT"],
    profile: { en: "Maximum FPS · Target 165 FPS", fa: "حداکثر FPS · هدف ۱۶۵ فریم" },
    isNew: false,
  },
  {
    art: gameFiles[2], // Black Myth: Wukong
    dictIndex: 2,
    year: 2024,
    rating: 85,
    tech: ["DLSS", "FG"],
    profile: { en: "Balanced · Target 120 FPS", fa: "متعادل · هدف ۱۲۰ فریم" },
    isNew: true,
  },
] as const;

/* ------------------------------ Section ------------------------------ */

export function AppShowcase() {
  const { t, locale, isRTL } = useLanguage();
  const { resolvedTheme } = useTheme();
  const { toast } = useToast();
  /* Tab state lives on STABLE INTERNAL IDs (TabKey: "dashboard" | "multiframe"
   * | "windows" | "settings") — never on translated labels. Switching
   * language re-renders labels only; state, keys and comparisons are
   * language-independent by construction. */
  const [tab, setTab] = useState<TabKey>("dashboard");
  const reduce = useReducedMotion();
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

  const tabs = tabOrder.map((key, i) => ({
    key,
    label: t.showcase.tabs[key], // label only — the ID is the identity
    Icon: tabIcons[i],
  }));

  return (
    <Section id="showcase" className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute start-1/2 top-1/3 h-[420px] w-[820px] max-w-none -translate-x-1/2 rounded-full bg-crimson/[0.08] blur-[130px]"
        aria-hidden="true"
      />

      <SectionHeading
        eyebrow={t.showcase.eyebrow}
        title={t.showcase.title}
        desc={t.showcase.desc}
        align="center"
      />

      {/* floating product window.
          NO 3D tilt on this element — root fix for the Persian/RTL tab bug
          (and an English one hiding behind it): a persistently rotated plane
          + perspective collapses the projected hit quads of the tabs at the
          far end of the strip (elementFromPoint returned the parent panel
          there — zero clickable area for the end tabs; in RTL the mirrored
          order put the FIRST tabs in that dead zone, so it looked
          language-specific). The window keeps its float (a pure translation,
          which never skews hit areas), glass, reflection sweep and entrance —
          everything a user sees — while every tab now keeps its full,
          layout-true hit box in both directions. */}
      <div className="relative mx-auto mt-10 max-w-4xl">
        {/* ground glow */}
        <div
          className="absolute -bottom-10 start-1/2 h-24 w-3/4 -translate-x-1/2 rounded-[100%] bg-crimson/20 blur-3xl"
          aria-hidden="true"
        />

        <motion.div
          animate={reduce ? {} : { y: [0, -12, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        >
          <motion.div
            className="card-ios relative rounded-[28px] bg-card dark:bg-[#0d0d0e]"
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={springFluid}
          >
            {/* glass reflection sweep */}
            <div
              className="pointer-events-none absolute inset-0 z-20 overflow-hidden rounded-[28px]"
              aria-hidden="true"
            >
              <div className="absolute -inset-y-16 -start-1/3 w-1/2 rotate-12 bg-gradient-to-r from-transparent via-white/[0.07] to-transparent dark:via-white/[0.04]" />
            </div>

            {/* title bar — Windows style */}
            <div className="flex items-center justify-between border-b border-border/70 px-4 py-2.5">
              <div className="flex items-center gap-2.5">
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-crimson text-white">
                  <LogoMark className="h-3.5 w-3.5" />
                </span>
                <span className="font-display text-xs font-bold tracking-wide text-foreground">
                  PC MAX
                </span>
                <span className="rounded bg-secondary px-1.5 py-0.5 font-mono text-[9px] font-bold text-muted-foreground">
                  v2.4
                </span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <span className="press flex h-7 w-7 items-center justify-center rounded-md transition-colors hover:bg-secondary hover:text-foreground"><Minus className="h-3 w-3" /></span>
                <span className="press flex h-7 w-7 items-center justify-center rounded-md transition-colors hover:bg-secondary hover:text-foreground"><Square className="h-3 w-3" /></span>
                <span className="press flex h-7 w-7 items-center justify-center rounded-md transition-colors hover:bg-crimson/80 hover:text-white"><X className="h-3 w-3" /></span>
              </div>
            </div>

            <div className="flex">
              {/* sidebar */}
              {/* Mock app sidebar — decorative content inside the product
                  mockup, NOT a real page landmark (spans only, no links). */}
              <div className="hidden w-16 flex-col items-center gap-2 border-e border-border/70 py-4 sm:flex">
                {[GpuIcon, PerformanceIcon, BackupIcon, SettingsIcon].map((Icon, i) => (
                  <span
                    key={i}
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-xl transition-colors",
                      tabOrder.indexOf(tab) === i
                        ? "border border-crimson/40 bg-crimson/10 text-crimson"
                        : "text-muted-foreground/70 hover:text-foreground"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                ))}
              </div>

              {/* main panel */}
              <div className="min-w-0 flex-1 p-4 sm:p-6">
                {/* tab bar — floating glass chrome strip with pill tabs.
                    Hit area = the whole <button> (event lives on the button,
                    never on the text node); shrink-0 + whitespace-nowrap keep
                    every tab its full, overlap-free target in both langs. */}
                <div
                  ref={tablistRef}
                  onKeyDown={onTablistKeyDown}
                  className="glass mb-5 flex min-w-0 gap-1 overflow-x-auto rounded-full p-1 scrollbar-slim"
                  role="tablist"
                  aria-label={t.showcase.eyebrow}
                >
                  {tabs.map(({ key, label, Icon }) => (
                    <button
                      key={key}
                      data-tab={key}
                      id={`${panelId}-${key}`}
                      role="tab"
                      tabIndex={tab === key ? 0 : -1}
                      aria-selected={tab === key}
                      aria-controls={panelId}
                      ref={tab === key ? activeTabRef : undefined}
                      onClick={() => setTab(key)}
                      className={cn(
                        "showcase-tab press relative flex shrink-0 items-center gap-2 rounded-full px-3.5 py-2 text-xs font-semibold transition-colors sm:px-4 sm:text-sm",
                        tab === key ? "text-crimson" : "text-foreground/60 hover:text-foreground"
                      )}
                    >
                      {tab === key && (
                        <motion.span
                          layoutId="showcase-tab-pill"
                          aria-hidden="true"
                          className="pointer-events-none absolute inset-0 rounded-full border border-crimson/25 bg-crimson/10"
                          transition={springFluid}
                        />
                      )}
                      <Icon className="relative h-4 w-4" />
                      <span className="relative whitespace-nowrap">{label}</span>
                    </button>
                  ))}
                </div>

                {/* tab content — quick, controlled swap (no long transitions):
                 * a fast fade+rise in, a faster fade out; the pill keeps the
                 * signature glide, the content never keeps the user waiting. */}
                <div id={panelId} role="tabpanel" aria-labelledby={`${panelId}-${tab}`} className="min-h-[270px]">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={tab}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6, transition: { duration: 0.12, ease: "easeIn" } }}
                      transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
                    >
                      {/* App Home — sync status + per-game optimized cards
                          (performance rating 0–100, tech badges, recommended
                          profile + target FPS), as the real product shows. */}
                      {tab === "dashboard" && (
                        <div className="space-y-3">
                          {/* offline-first cache — online, auto-resync */}
                          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-xl border border-crimson/30 bg-crimson/[0.07] px-4 py-3">
                            <span className="flex items-center gap-3 text-sm font-bold text-foreground">
                              <Cloud className="h-5 w-5 text-crimson" />
                              {copy.sync.label}
                            </span>
                            <span className="flex items-center gap-2 text-xs font-bold text-crimson">
                              <span className="h-2 w-2 shrink-0 rounded-full bg-crimson" aria-hidden="true" />
                              {copy.sync.status}
                            </span>
                          </div>

                          {dashboardGames.map((g, i) => {
                            const game = t.library.games[g.dictIndex];
                            return (
                              <motion.div
                                key={g.dictIndex}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ ...springFluid, delay: 0.1 + i * 0.08 }}
                                className="glass rounded-2xl p-3"
                              >
                                <div className="flex items-center gap-3.5">
                                  <div className="relative h-[52px] w-[92px] shrink-0 overflow-hidden rounded-lg">
                                    <Image src={g.art} alt="" fill sizes="92px" className="object-cover" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                      <h3 className="truncate font-display text-sm font-bold text-foreground">
                                        {game.name}
                                      </h3>
                                      {g.isNew && (
                                        <span className="rounded-full border border-crimson/40 bg-crimson/10 px-2 py-0.5 text-[10px] font-bold text-crimson">
                                          {copy.newOpt}
                                        </span>
                                      )}
                                    </div>
                                    <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                                      {game.genre} · {localizeNum(locale, g.year)}
                                    </p>
                                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                                      {g.tech.map((tech) => (
                                        <span
                                          key={tech}
                                          className="rounded border border-border/80 bg-secondary/60 px-1.5 py-0.5 font-mono text-[10px] font-bold text-muted-foreground"
                                        >
                                          {tech}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                  <div className="flex shrink-0 flex-col items-center gap-1">
                                    <span className="font-display text-lg font-bold leading-none tabular-nums text-foreground">
                                      {localizeNum(locale, `${g.rating}/100`)}
                                    </span>
                                    <div className="h-1.5 w-14 overflow-hidden rounded-full bg-border/70">
                                      <motion.div
                                        className="h-full rounded-full bg-gradient-to-r from-crimson to-crimson-bright"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${g.rating}%` }}
                                        transition={{ ...springFluid, delay: 0.2 + i * 0.08 }}
                                      />
                                    </div>
                                    <span className="type-eyebrow text-[9px] font-semibold uppercase text-muted-foreground">
                                      {copy.rating}
                                    </span>
                                  </div>
                                </div>
                                <p className="mt-2.5 border-t border-border/60 pt-2 text-[11px] font-bold text-crimson">
                                  {g.profile[locale]}
                                </p>
                              </motion.div>
                            );
                          })}
                        </div>
                      )}

                      {tab === "multiframe" && (
                        <div className="space-y-3">
                          {[
                            { name: "OptiScaler", status: t.showcase.mf.status.installed, ok: true },
                            { name: "AI Optical Flow", status: t.showcase.mf.status.ready, ok: true },
                            { name: "Streamline PC MAX", status: t.showcase.mf.status.incompatible, ok: false },
                          ].map((wf, i) => (
                            <motion.div
                              key={wf.name}
                              initial={{ opacity: 0, x: -14 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ ...springFluid, delay: 0.08 * i }}
                              className={cn(
                                "flex items-center justify-between rounded-xl border px-4 py-3.5",
                                wf.ok ? "border-border/70 bg-secondary/40" : "border-crimson/30 bg-crimson/[0.05]"
                              )}
                            >
                              <div className="flex items-center gap-3">
                                {wf.ok ? <Check className="h-4 w-4 text-crimson" strokeWidth={3} /> : <Lock className="h-4 w-4 text-crimson" />}
                                <span className={cn("text-sm font-semibold", wf.ok ? "text-foreground" : "text-muted-foreground")}>
                                  {wf.name}
                                </span>
                              </div>
                              <span className={cn("type-eyebrow text-[10px] font-bold uppercase", wf.ok ? "text-crimson" : "text-muted-foreground")}>
                                {wf.status}
                              </span>
                            </motion.div>
                          ))}
                          <div className="flex items-center justify-between rounded-xl border border-dashed border-border/70 px-4 py-3.5">
                            <span className="flex items-center gap-3 text-sm font-semibold text-muted-foreground">
                              <AiIcon className="h-4 w-4 text-crimson" />
                              {t.showcase.mf.perGame}
                            </span>
                            <span className="font-display text-lg font-bold tabular-nums text-crimson">
                              <AnimatedCounter value={6} />
                            </span>
                          </div>
                        </div>
                      )}

                      {tab === "windows" && (
                        <div className="space-y-4">
                          <div className="rounded-xl border border-border/70 p-4">
                            <div className="mb-2.5 flex items-center justify-between text-xs font-semibold text-muted-foreground">
                              <span>{t.showcase.win.applied}</span>
                              <span className="text-foreground">
                                6 <span className="text-muted-foreground">{t.showcase.win.of}</span> 8 {t.showcase.win.modules}
                              </span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-border/70">
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
                                className="flex items-center gap-2.5 rounded-lg border border-border/70 bg-secondary/40 px-3.5 py-2.5 text-xs font-semibold text-foreground"
                              >
                                <Check className="h-3.5 w-3.5 text-crimson" strokeWidth={3} />
                                {m.label}
                              </motion.div>
                            ))}
                          </div>

                          {/* snapshot taken BEFORE any change — one-click rollback */}
                          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 rounded-xl border border-dashed border-border/70 px-4 py-3">
                            <span className="flex min-w-0 items-center gap-2.5 text-xs font-semibold text-muted-foreground">
                              <BackupIcon className="h-4 w-4 shrink-0 text-crimson" />
                              {copy.win.snapshot}
                            </span>
                            <button
                              type="button"
                              onClick={mockToast}
                              className="press shrink-0 rounded-lg border border-border/80 px-3.5 py-1.5 text-xs font-bold text-muted-foreground transition-colors hover:border-crimson/40 hover:text-crimson"
                            >
                              {t.showcase.win.revert}
                            </button>
                          </div>
                        </div>
                      )}

                      {tab === "settings" && (
                        <div className="space-y-2.5">
                          {[
                            { id: "set-language", label: t.showcase.settings.language, value: locale === "fa" ? "فارسی" : "English" },
                            { id: "set-theme", label: t.showcase.settings.theme, value: resolvedTheme === "light" ? t.common.themeLight : t.common.themeDark },
                            { id: "set-profile", label: t.showcase.settings.profile, value: copy.settings.profileValue },
                          ].map((row) => (
                            <div
                              key={row.id}
                              className="flex items-center justify-between rounded-xl border border-border/70 bg-secondary/40 px-4 py-3.5"
                            >
                              <span className="text-sm font-semibold text-foreground">{row.label}</span>
                              <span className="text-xs font-bold text-muted-foreground">{row.value}</span>
                            </div>
                          ))}
                          {/* offline-first sync — last-sync time + manual sync */}
                          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-xl border border-border/70 bg-secondary/40 px-4 py-3">
                            <div className="flex min-w-0 flex-col">
                              <span className="text-sm font-semibold text-foreground">{copy.settings.sync}</span>
                              <span className="text-[11px] text-muted-foreground">{copy.settings.lastSync}</span>
                            </div>
                            <button
                              type="button"
                              onClick={mockToast}
                              className="press shrink-0 rounded-lg border border-border/80 px-3.5 py-1.5 text-xs font-bold text-muted-foreground transition-colors hover:border-crimson/40 hover:text-crimson"
                            >
                              {copy.settings.syncNow}
                            </button>
                          </div>
                          {/* offline cache — clearable from settings */}
                          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-xl border border-border/70 bg-secondary/40 px-4 py-3">
                            <span className="text-sm font-semibold text-foreground">{copy.settings.cache}</span>
                            <button
                              type="button"
                              onClick={mockToast}
                              className="press shrink-0 rounded-lg border border-border/80 px-3.5 py-1.5 text-xs font-bold text-muted-foreground transition-colors hover:border-crimson/40 hover:text-crimson"
                            >
                              {copy.settings.clearCache}
                            </button>
                          </div>
                          {/* offline behavior — cached data, auto-resync */}
                          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-xl border border-border/70 bg-secondary/40 px-4 py-3">
                            <span className="text-sm font-semibold text-foreground">{copy.settings.offline}</span>
                            <span className="text-[11px] font-semibold text-muted-foreground">{copy.settings.offlineValue}</span>
                          </div>
                          <div className="flex items-center justify-between rounded-xl border border-crimson/30 bg-crimson/[0.05] px-4 py-3.5">
                            <span className="flex items-center gap-2.5 text-sm font-semibold text-foreground">
                              <ShieldIcon className="h-4 w-4 text-crimson" />
                              {t.showcase.settings.telemetry}
                            </span>
                            <span className="type-eyebrow rounded-full border border-crimson/40 bg-crimson/10 px-2.5 py-0.5 text-[10px] font-bold uppercase text-crimson">
                              {t.showcase.settings.off}
                            </span>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* library — recognized titles, folded into the product story */}
        <div className="mt-16 sm:mt-20">
          <div className="mb-2 flex items-center justify-center gap-3" aria-hidden="true">
            <span className="h-px w-10 bg-border/80" />
            <span className="type-eyebrow text-[11px] font-bold uppercase text-crimson">{t.library.eyebrow}</span>
            <span className="h-px w-10 bg-border/80" />
          </div>
          <p className="mx-auto mb-8 max-w-2xl text-center text-sm leading-relaxed text-muted-foreground">
            {t.library.desc}
          </p>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
            {t.library.games.map((game, i) => (
              <motion.article
                key={game.name}
                initial={{ opacity: 0, y: 26 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ ...springFluid, delay: (i % 3) * 0.08 }}
                whileHover={whileHoverLift}
                whileTap={whileTapPress}
                className="card-ios group relative overflow-hidden rounded-2xl bg-card"
              >
                {/* card-ios' hairline lives in unlayered CSS, so the crimson
                    hover edge rides on a pointer-inert overlay instead */}
                <div
                  className="pointer-events-none absolute inset-0 z-10 rounded-2xl border border-crimson/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  aria-hidden="true"
                />
                <div className="relative aspect-[16/9] overflow-hidden">
                  <Image
                    src={gameFiles[i]}
                    alt={`${game.name} — key art`}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" aria-hidden="true" />
                  <div className="absolute inset-x-0 bottom-0 p-4">
                    <p className="type-title font-display text-lg font-bold text-white drop-shadow-lg">
                      {game.name}
                    </p>
                    <p className="mt-0.5 text-[11px] font-medium text-white/70">{game.genre}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between px-4 py-2.5">
                  <span className="type-eyebrow flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase text-muted-foreground">
                    <Check className="h-3 w-3 text-crimson" strokeWidth={3} />
                    {t.library.badges.exe} · {t.library.badges.icon}
                  </span>
                  <span className="type-eyebrow font-mono text-[10px] font-semibold uppercase text-crimson">
                    {t.library.badges.ready}
                  </span>
                </div>
              </motion.article>
            ))}
          </div>

          <p className="mt-5 text-center text-xs text-muted-foreground">{t.library.footnote}</p>
        </div>

        {/* disclaimer */}
        <p className="mt-14 text-center text-xs text-muted-foreground">{t.showcase.disclaimer}</p>
      </div>
    </Section>
  );
}
