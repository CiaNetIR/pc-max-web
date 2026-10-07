"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from "react";
import Image from "next/image";
import {
  AppWindow,
  Layers,
  LayoutDashboard,
  Search,
  Settings,
  SlidersHorizontal,
} from "lucide-react";
import { useLanguage } from "@/components/pcmax/language-context";
import type { Dictionary, Locale } from "@/components/pcmax/i18n/dictionary";
import { asset } from "@/lib/gh-pages";
import { Motif } from "./motif";

/*
 * Task 44 — the product console (showcase, section #show).
 *
 * The page's centerpiece after the hero: a real DOM-built tabbed console
 * window. Five tabs (Dashboard / Frame Generation / Game Profiles /
 * Windows / Settings) swap a `.pm-win` body with the pm-panel-in sweep;
 * a `.pm-tabind` morph pill tracks the active tab via physical
 * offsetLeft/offsetWidth math (direction-agnostic — works unchanged in
 * RTL because both the pill's `left` origin and offsetLeft are physical).
 *
 * Honesty contract: the console is an explicitly-labeled illustrative
 * interface preview (t.showcase.disclaimer rides a visible caption under
 * the window; t.pm.hero.preview chips the window header). Every factual
 * row restates a documented product behavior from the dictionary
 * (Rust-engine GPU detection, server-synced catalogue, snapshot-first,
 * zero telemetry); the only invented values are small UI-state strings
 * inside the labeled preview ("18 of 24" modules — matching the 0.75
 * progress bar so the mock stays internally consistent).
 *
 * Keyboard: proper tablist/tab/tabpanel ARIA with roving tabindex,
 * arrow keys (direction-aware for RTL), Home/End. No auto-rotation —
 * the user drives every panel swap, so no pause control is needed.
 * Reduced motion: all swap/measure animations are CSS-owned and already
 * null'd by premium.css; the one JS-driven fill animation (Windows
 * progress) checks matchMedia and degrades to the final value instantly.
 */

type TabId = "dash" | "frame" | "profiles" | "windows" | "settings";

/* Icon rail glyphs mirroring the five tabs (decorative, aria-hidden —
 * the tabs themselves carry the accessible names). */
const RAIL_ICONS = [LayoutDashboard, Layers, SlidersHorizontal, AppWindow, Settings];

/* ── tab panels (pure renders, dictionary-driven) ─────────────────── */

function PanelDash({ t }: { t: Dictionary }) {
  const p = t.pm.hero;
  const s = t.pm.show;
  const activity = [s.activityItems.applied, s.activityItems.snapshot, s.activityItems.synced];
  return (
    <div>
      {/* illustrative search chrome — non-interactive by design */}
      <div className="pm-ccard flex items-center gap-3" aria-hidden="true">
        <Search
          className="h-4 w-4 flex-none text-[var(--pm-ink-faint)]"
          strokeWidth={2}
          aria-hidden="true"
        />
        <span className="text-[12.5px] text-[var(--pm-ink-faint)]">{s.search}</span>
      </div>
      <div className="pm-ccols mt-3">
        <div className="pm-ccard">
          <div className="pm-ccard-t">{p.sysTitle}</div>
          <div className="pm-row pm-scanrow">
            <span className="pm-row-k">{p.sysGpu}</span>
            <span className="pm-row-v">{p.sysGpuValue}</span>
          </div>
          <div className="pm-row">
            <span className="pm-row-k">{p.sysCatalogue}</span>
            <span className="pm-row-v">{p.sysCatalogueValue}</span>
          </div>
          <div className="pm-row">
            <span className="pm-row-k">{p.sysSnapshot}</span>
            <span className="pm-row-v">{p.sysSnapshotValue}</span>
          </div>
        </div>
        <div className="pm-ccard">
          <div className="pm-ccard-t">{s.activity}</div>
          <ul className="m-0 list-none p-0">
            {activity.map((item) => (
              <li key={item} className="pm-row">
                <span className="pm-dot" aria-hidden="true" />
                <span className="min-w-0 flex-1 truncate">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function PanelFrame({ t }: { t: Dictionary }) {
  return (
    <div>
      {t.multiframe.cards.map((card) => {
        /* Streamline carries a `warning` instead of a badge list — it
         * becomes the gold status chip; the other two are "ready". */
        const warn = card.warning ?? null;
        const badgeLine = card.badges ? card.badges.join(" · ") : null;
        return (
          <div className="pm-wf" key={card.name}>
            <div className="min-w-0 flex-1">
              <div className="pm-wf-name">{card.name}</div>
              <div className="pm-wf-tag">{card.tagline}</div>
              {badgeLine && (
                <div className="mt-1 text-[11px] font-semibold tracking-[0.04em] text-[var(--pm-ink-faint)] rtl:tracking-normal rtl:text-[11.5px]">
                  {badgeLine}
                </div>
              )}
            </div>
            <span className="pm-wf-chip" data-st={warn ? "warn" : "ok"}>
              {warn ?? t.showcase.mf.status.ready}
            </span>
          </div>
        );
      })}
      <div className="mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="pm-tlabel">{t.showcase.mf.perGame}</span>
        <span className="text-[12px] leading-relaxed text-[var(--pm-ink-faint)]">
          {t.multiframe.note}
        </span>
      </div>
    </div>
  );
}

function PanelProfiles({ t }: { t: Dictionary }) {
  const names = t.pm.show.profileNames;
  return (
    <div className="pm-ccols">
      <div className="pm-opts">
        {names.map((name, i) => (
          <div
            key={name}
            className="pm-opt-item"
            data-on={i === 0 ? "1" : undefined}
          >
            <span className="pm-opt-radio" aria-hidden="true" />
            <span className="truncate">{name}</span>
            {i === names.length - 1 && (
              <span className="pm-newbadge">{t.pm.show.badgeNew}</span>
            )}
          </div>
        ))}
      </div>
      <div className="pm-ccard">
        <div className="pm-ccard-t">{t.profiles.eyebrow}</div>
        <div className="pm-opt-item" data-on="1">
          <span className="pm-opt-radio" aria-hidden="true" />
          <span className="truncate">{t.profiles.green.mode}</span>
        </div>
        <div className="pm-opt-item mt-1.5">
          <span className="pm-opt-radio" aria-hidden="true" />
          <span className="truncate">{t.profiles.yellow.mode}</span>
        </div>
        <div className="mt-4">
          <span className="pm-tlabel">{t.multiframe.compatibility}</span>
          <p className="m-0 mt-1 text-[12px] leading-relaxed text-[var(--pm-ink-faint)]">
            {t.multiframe.note}
          </p>
        </div>
      </div>
    </div>
  );
}

function PanelWindows({ t }: { t: Dictionary }) {
  const w = t.showcase.win;
  /* Illustrative preview-state value (18 of 24 = the 0.75 bar below) —
   * allowed only because the whole console is a labeled preview. */
  const MODULES_APPLIED = 18;
  const MODULES_TOTAL = 24;
  const fillRef = useRef<HTMLDivElement>(null);

  /* The fill animates in on every panel mount (keyed remount); under
   * prefers-reduced-motion it jumps straight to the final value. */
  useEffect(() => {
    const el = fillRef.current;
    if (!el) return;
    const final = `${MODULES_APPLIED / MODULES_TOTAL}`;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.style.setProperty("--v", final);
      return;
    }
    el.style.setProperty("--v", "0");
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => el.style.setProperty("--v", final));
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="pm-ccard">
      <div className="pm-ccard-t">{w.applied}</div>
      <div className="text-[14.5px] font-bold tabular-nums text-[var(--pm-ink)]">
        {MODULES_APPLIED} {w.of} {MODULES_TOTAL}{" "}
        <span className="font-semibold text-[var(--pm-ink-faint)]">{w.modules}</span>
      </div>
      <div className="pm-prog mt-2">
        <div className="pm-prog-f" ref={fillRef} style={{ "--v": "0.75" } as CSSProperties} />
      </div>
      <div className="mt-4 flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="pm-tlabel">{w.services}</span>
        <span className="text-[12px] leading-relaxed text-[var(--pm-ink-faint)]">
          {t.pipeline.nodes[2].desc}
        </span>
      </div>
      <div className="mt-4 flex">
        <span className="pm-set-v">{w.revert}</span>
      </div>
    </div>
  );
}

function PanelSettings({ t, locale }: { t: Dictionary; locale: Locale }) {
  const s = t.showcase.settings;
  /* The app's two supported languages — proper nouns, current first. */
  const lang = locale === "en" ? "English / فارسی" : "فارسی / English";
  return (
    <div>
      <div className="pm-set">
        <span className="pm-set-k">{s.language}</span>
        <span className="pm-set-v">{lang}</span>
      </div>
      <div className="pm-set">
        <span className="pm-set-k">{s.profile}</span>
        <span className="pm-set-v">{t.pm.show.profileNames[0]}</span>
      </div>
      <div className="pm-set">
        <span className="pm-set-k">{s.telemetry}</span>
        <span className="pm-set-v" data-st="ok">
          {s.off}
        </span>
      </div>
    </div>
  );
}

/* ── the console ──────────────────────────────────────────────────── */

export function Showcase() {
  const { t, locale, isRTL } = useLanguage();

  /* Tab definitions — rebuilt on locale switch so the morph pill
   * re-measures for the new label widths. */
  const tabs = useMemo<
    Array<{ id: TabId; label: string }>
  >(
    () => [
      { id: "dash", label: t.showcase.tabs.dashboard },
      { id: "frame", label: t.pm.show.tabs.frame },
      { id: "profiles", label: t.pm.show.tabs.profiles },
      { id: "windows", label: t.showcase.tabs.windows },
      { id: "settings", label: t.showcase.tabs.settings },
    ],
    [t]
  );

  const [active, setActive] = useState(0);
  const stripRef = useRef<HTMLDivElement>(null);
  const indRef = useRef<HTMLSpanElement>(null);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  /* Morph pill — physical left/width math from the active tab, minus the
   * strip's 4px padding (the pill's own `left: 4px` origin). Runs
   * pre-paint so the first render never shows a misplaced pill. */
  const measure = useCallback(() => {
    const btn = tabRefs.current[active];
    const ind = indRef.current;
    if (!btn || !ind) return;
    ind.style.setProperty("--tx", `${btn.offsetLeft - 4}px`);
    ind.style.setProperty("--tw", `${btn.offsetWidth}px`);
  }, [active]);

  useLayoutEffect(() => {
    measure();
  }, [measure, tabs]);

  /* Re-measure on strip resize (viewport / layout changes) and after
   * webfonts settle (FA label widths shift with the font swap). */
  useEffect(() => {
    const strip = stripRef.current;
    if (!strip) return;
    const ro =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => measure())
        : null;
    ro?.observe(strip);
    window.addEventListener("resize", measure);
    document.fonts?.ready.then(() => measure());
    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [measure]);

  /* Tablist keyboard — arrows are direction-aware (RTL swaps Left/Right),
   * Up/Down are physical, Home/End jump to the ends. Automatic
   * activation: selection follows focus. */
  const onTabKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    const n = tabs.length;
    let target: number;
    if (e.key === "Home") {
      target = 0;
    } else if (e.key === "End") {
      target = n - 1;
    } else {
      let d = 0;
      if (e.key === "ArrowRight") d = isRTL ? -1 : 1;
      else if (e.key === "ArrowLeft") d = isRTL ? 1 : -1;
      else if (e.key === "ArrowDown") d = 1;
      else if (e.key === "ArrowUp") d = -1;
      else return;
      target = (active + d + n) % n;
    }
    e.preventDefault();
    setActive(target);
    tabRefs.current[target]?.focus();
  };

  const tab = tabs[active];

  return (
    <section id="show" className="pm-sect" aria-labelledby="pm-show-title">
      <div className="pm-sect-in">
        {/* ── section header ── */}
        <div className="rv2">
          <span className="pm-kicker">
            <Motif />
            {t.showcase.eyebrow}
          </span>
          <h2 id="pm-show-title" className="pm-h2 mt-4">
            {t.showcase.title}
          </h2>
          <p className="pm-lead">{t.showcase.desc}</p>
        </div>

        {/* ── tab strip + console window ── */}
        <div className="rv2 mt-10" style={{ "--rd": "80ms" } as CSSProperties}>
          <div
            className="pm-tabs"
            role="tablist"
            aria-label={t.tw.show.alt}
            ref={stripRef}
          >
            {tabs.map((tb, i) => (
              <button
                key={tb.id}
                type="button"
                role="tab"
                id={`pm-tab-${tb.id}`}
                aria-selected={i === active}
                aria-controls={`pm-panel-${tb.id}`}
                tabIndex={i === active ? 0 : -1}
                className="pm-tab"
                ref={(el) => {
                  tabRefs.current[i] = el;
                }}
                onClick={() => setActive(i)}
                onKeyDown={onTabKey}
              >
                {tb.label}
              </button>
            ))}
            <span className="pm-tabind" ref={indRef} aria-hidden="true" />
          </div>

          <div className="pm-win">
            <div className="pm-win-hd">
              <Image
                src={asset("/brand/pcmax-logo-96.webp")}
                alt=""
                width={22}
                height={22}
                className="flex-none rounded-[6px]"
              />
              <span className="pm-win-title">PC&nbsp;MAX</span>
              {/* the active tab name rides the window title bar */}
              <span className="pm-win-sub min-w-0 flex-1" key={active}>
                {tab.label}
              </span>
              <span className="pm-win-ctl" aria-hidden="true">
                <span />
                <span />
                <span />
              </span>
              {/* honest-preview chip (pure Tailwind — no pm-* margin
                  contract to fight with inside this flex row) */}
              <span className="hidden min-[420px]:inline-flex flex-none items-center whitespace-nowrap rounded-full bg-white/[0.045] px-[9px] py-[3.5px] text-[10.5px] font-semibold tracking-[0.04em] text-[var(--pm-ink-dim)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.055)] rtl:tracking-normal rtl:text-[11.5px]">
                {t.pm.hero.preview}
              </span>
            </div>
            <div className="pm-win-bd">
              {/* decorative icon rail — mirrors the tabs, never in the
                  a11y tree (the tablist owns that) */}
              <div className="pm-rail" aria-hidden="true">
                {RAIL_ICONS.map((Icon, i) => (
                  <span
                    key={i}
                    className="pm-rail-i"
                    data-on={i === active ? "1" : undefined}
                  >
                    <Icon className="h-[17px] w-[17px]" strokeWidth={2} aria-hidden="true" />
                  </span>
                ))}
              </div>
              <div
                className="pm-win-c"
                key={tab.id}
                data-anim="1"
                role="tabpanel"
                id={`pm-panel-${tab.id}`}
                aria-labelledby={`pm-tab-${tab.id}`}
                tabIndex={0}
              >
                {tab.id === "dash" && <PanelDash t={t} />}
                {tab.id === "frame" && <PanelFrame t={t} />}
                {tab.id === "profiles" && <PanelProfiles t={t} />}
                {tab.id === "windows" && <PanelWindows t={t} />}
                {tab.id === "settings" && <PanelSettings t={t} locale={locale} />}
              </div>
            </div>
          </div>
        </div>

        {/* ── honest framing + the window's own CTA ── */}
        <div className="rv2" style={{ "--rd": "160ms" } as CSSProperties}>
          <p className="pm-stagecap">
            <span className="pm-dot" aria-hidden="true" />
            {t.showcase.disclaimer}
          </p>
          <div className="mt-5 flex justify-center">
            <a href="#download" className="pm-btn pm-btn-g pm-btn-sm">
              {t.pm.fg.installWith}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
