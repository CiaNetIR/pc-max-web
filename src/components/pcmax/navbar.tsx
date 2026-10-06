"use client";

import { useEffect, useRef, useState } from "react";
import { Globe } from "lucide-react";
import Image from "next/image";
import { useLanguage } from "@/components/pcmax/language-context";
import { cn } from "@/lib/utils";
import { asset } from "@/lib/gh-pages";

/* Id of the collapsible mobile menu — pairs the trigger's aria-controls
   with the menu container so assistive tech can associate them. */
const MENU_ID = "pcmax-mobile-menu";

/* Sections watched by the scroll-spy (hero + the four nav targets) —
   mirrors the `links` list below. Module-level: the observer effect can
   keep an empty dep array and never resubscribes on re-renders. */
const SPY_IDS = ["top", "features", "install", "benchmarks", "faq"] as const;

/* The page's real section ids, in scroll order — the SAME eleven
 * anchors/labels the SectorHud quick-jump uses (sector-hud.tsx mirrors
 * the page.tsx composition: hero → showcase → features → multiframe →
 * profiles → safety → benchmarks → community → install → faq →
 * download). The mobile menu offers every section, not just the four
 * desktop links; names come from hud.sectors (EN+FA), never hardcoded. */
const SECTOR_IDS = [
  "top",
  "showcase",
  "features",
  "multiframe",
  "profiles",
  "safety",
  "benchmarks",
  "community",
  "install",
  "faq",
  "download",
] as const;

/* Scroll threshold (px) at which the header solidifies — globals.css
 * .gc-hdr.tight: bg rgba(8,8,10,.96) + hairline bottom edge. */
const TIGHT_AT = 8;

/* Desktop takeover point. globals.css shows .burger at ≤900px and force-
 * hides .mpanel/.mnav-scrim at ≥901px, so the desktop nav links and the
 * header Download CTA return at exactly 901px to never leave a dead zone
 * (the old 1024px lg: breakpoint would collide with the CSS system). */
const DESKTOP_QUERY = "(min-width: 901px)";

const pad = (n: number) => String(n).padStart(2, "0");

/* ---------------------------- Language toggle ------------------------ */

function LanguageToggle({
  className,
  onActivate,
}: {
  /* "pill" (header ghost button) or "row" (mobile-menu .mp-row) — the
   * class fully owns the styling; only the markup skeleton is shared. */
  className?: string;
  /* Extra behavior after a toggle (e.g. closing the mobile panel). */
  onActivate?: () => void;
}) {
  const { t, toggleLocale, alternateHref } = useLanguage();

  /* Static flavor (audit 29-a D7): the toggle is a REAL crawlable <a> to the
   * other language's document (/fa ↔ /) — the Persian page becomes a
   * linkable, shareable, indexable URL instead of a client-only state flip.
   * The click still persists the preference cookie first, so returning
   * visitors on / keep getting their locale restored. SSR/dev flavor keeps
   * the in-place client toggle (cookie + server locale). */
  const inner = (
    <>
      <Globe className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span>{t.common.switchTo}</span>
    </>
  );

  if (alternateHref) {
    return (
      <a
        href={alternateHref}
        aria-label={t.common.switchTo}
        onClick={() => {
          /* Persist the target locale before navigating (storage+cookie via
           * setLocale — the context's store flips too, which is harmless one
           * frame before the navigation replaces the document). */
          toggleLocale();
          onActivate?.();
        }}
        className={className}
      >
        {inner}
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        toggleLocale();
        onActivate?.();
      }}
      aria-label={t.common.switchTo}
      className={className}
    >
      {inner}
    </button>
  );
}

/* -------------------------------- Navbar ------------------------------ */

export function Navbar() {
  const { t } = useLanguage();
  const [active, setActive] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [tight, setTight] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const wasOpen = useRef(false);

  /* Scroll-spy (UX polish): ONE IntersectionObserver over the hero + the
   * four nav-target sections. The highlight follows the last section that
   * crossed the focus band and clears again at the hero. Zero scroll
   * listeners, zero layout reads; state flips only when the active
   * section actually changes. Presentation-only — never touches the
   * anchor/go() logic. */
  useEffect(() => {
    const sections = SPY_IDS.map((id) => document.getElementById(id)).filter(
      (el): el is HTMLElement => el !== null
    );
    if (sections.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActive(entry.target.id === "top" ? null : entry.target.id);
          }
        }
      },
      { rootMargin: "-40% 0px -55% 0px" }
    );
    for (const section of sections) observer.observe(section);
    return () => observer.disconnect();
  }, []);

  /* Scroll-tightening (TweakFa header): ONE passive listener flips the
   * .tight class carrier at scrollY > 8 — the blurred bar solidifies and
   * drops its hairline. The initial read covers deep links / refreshes
   * that land mid-page; React bails out on repeated values, so this
   * re-renders only when the threshold is crossed. */
  useEffect(() => {
    const onScroll = () => setTight(window.scrollY > TIGHT_AT);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* Open-state wiring (Wave A mnav system): <html class="mnav-on"> drives
   * everything — the panel's clip-path unfold + child stagger, the scrim
   * fade, and the scroll lock (html overflow:hidden). The old body-lock
   * effect (body overflow + scrollbar padding compensation) is retired in
   * its favor. Class removed on close AND on unmount, so a hot unmount
   * can never leave the page scroll-locked. */
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("mnav-on", open);
    return () => root.classList.remove("mnav-on");
  }, [open]);

  /* Mobile menu a11y: Escape closes it (focus returns to the burger via
   * the effect below) and growing the viewport past 900px — where CSS
   * force-hides the panel and scrim — closes it too, so the html class
   * never outlives the visible UI. Listeners registered only while open.
   * No focus trap (Wave A contract): the scrim dims the page and every
   * close path (link, lang row, CTA, scrim tap, Escape) works from the
   * panel itself. */
  useEffect(() => {
    if (!open) return;
    const mql = window.matchMedia(DESKTOP_QUERY);
    const onViewport = (event: MediaQueryListEvent) => {
      if (event.matches) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
      }
    };
    mql.addEventListener("change", onViewport);
    window.addEventListener("keydown", onKeyDown, true);
    return () => {
      mql.removeEventListener("change", onViewport);
      window.removeEventListener("keydown", onKeyDown, true);
    };
  }, [open]);

  /* Focus returns to the trigger whenever the menu closes (link click,
   * lang switch, Escape, or viewport resize) — never steals focus on
   * first mount. */
  useEffect(() => {
    if (wasOpen.current && !open) {
      const trigger = triggerRef.current;
      if (trigger && trigger.getClientRects().length > 0) trigger.focus();
    }
    wasOpen.current = open;
  }, [open]);

  const closeMenu = () => setOpen(false);

  /* Section 44 — simple nav: Features · How it works · Benchmarks · FAQ.
   *
   * Semantic anchors (audit 29-a D7 fix): every nav target is a real
   * <a href="#…"> — crawlable in-page links, middle-click / copy-link /
   * no-JS all work. The smooth scroll + its prefers-reduced-motion
   * override come from CSS (html scroll-behavior) and the offset from the
   * sections' scroll-mt-24 — no JS needed anywhere. The mobile menu links
   * keep a single onClick to close the panel; the native anchor navigation
   * still runs (hash + scroll), so Back works like on desktop. */
  const links = [
    { id: "features", label: t.nav.features },
    { id: "install", label: t.nav.install },
    { id: "benchmarks", label: t.nav.benchmarks },
    { id: "faq", label: t.nav.faq },
  ];

  /* Mobile-menu rows — hud.sectors must stay 1:1 with the page ids (same
   * dictionary guard the SectorHud applies); on drift the section list is
   * skipped rather than showing mismatched labels. */
  const names = t.hud.sectors;
  const sectorsAligned = names.length === SECTOR_IDS.length;

  return (
    /* TweakFa header: sticky blurred bar (.gc-hdr) that tightens past 8px
     * of scroll. The scrim must live OUTSIDE this element — the header's
     * backdrop-filter makes it a containing block for fixed descendants —
     * so this component renders <header> + scrim as siblings. */
    <>
      <header className={cn("gc-hdr sticky top-0 z-[60]", tight && "tight")}>
        <nav
          aria-label="PC MAX"
          className="mx-auto flex h-[61px] max-w-6xl items-center gap-7 px-4 sm:px-6 lg:px-8"
        >
          {/* brand — real link to #top (CSS scroll-behavior handles smooth
              scrolling + its own reduced-motion override); the visible
              "PC MAX" wordmark is the accessible name, the logo is decorative */}
          <a href="#top" className="flex shrink-0 items-center gap-2.5">
            {/* Circular transparent WebP emblem (Task 34): no tile, no glow —
              the ring art floats directly on the bar, nothing frames it. */}
            <Image
              src={asset("/brand/pcmax-logo-96.webp")}
              alt=""
              width={36}
              height={36}
              priority
              className="h-9 w-9 shrink-0 object-contain"
            />
            <span className="font-display text-[17px] font-bold text-foreground">
              PC&nbsp;<span className="text-crimson">MAX</span>
            </span>
          </a>

          {/* desktop links — TweakFa .gc-nav-link owns size/weight/color/
              hover/current states; the padding only grows the hit area.
              901px breakpoint mirrors the CSS that hides the burger. */}
          <ul className="hidden items-center gap-8 min-[901px]:flex">
            {links.map((link) => {
              const isActive = active === link.id;
              return (
                <li key={link.id}>
                  <a
                    href={`#${link.id}`}
                    aria-current={isActive ? "true" : undefined}
                    className="gc-nav-link rounded-full px-1 py-2"
                  >
                    {link.label}
                  </a>
                </li>
              );
            })}
          </ul>

          {/* actions — compact 40px header CTAs (.gc-btn-sm modifiers; the
              geometry lives in the classes, so no utility padding/height) */}
          <div className="ms-auto flex items-center gap-2.5">
            <LanguageToggle className="gc-btn-ghost gc-btn-sm inline-flex items-center justify-center gap-1.5" />
            {/* real anchor — crawlable download CTA; the primary button
                moves into the mobile panel below 901px (TweakFa hides the
                header CTA exactly where the burger appears) */}
            <a
              href="#download"
              className="gc-btn-primary gc-btn-sm hidden items-center justify-center min-[901px]:inline-flex"
            >
              {t.nav.download}
            </a>
            {/* burger — three CSS bars morphing to X (globals .burger);
                the label swaps to the existing hud.close string on open */}
            <button
              type="button"
              ref={triggerRef}
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls={MENU_ID}
              aria-label={open ? t.hud.close : t.nav.menu}
              className="burger press"
            >
              <span aria-hidden="true" />
              <span aria-hidden="true" />
              <span aria-hidden="true" />
            </button>
          </div>
        </nav>

        {/* mobile menu — TweakFa .mpanel: absolute under the header, the
            clip-path unfold + child stagger + scrim + scroll lock all ride
            on html.mnav-on (this component's open state). `inert` keeps
            the hidden panel out of the tab order and a11y tree. Rows are
            the SAME eleven #anchors the SectorHud jumps to; the numbering
            mirrors the HUD exactly (hero blank, content 01–10). */}
        <div id={MENU_ID} className="mpanel" inert={!open}>
          <span className="mp-lb">{t.hud.label}</span>
          {sectorsAligned && (
            <ul>
              {SECTOR_IDS.map((id, i) => (
                <li key={id}>
                  <a
                    href={`#${id}`}
                    onClick={closeMenu}
                    aria-current={active === id ? "true" : undefined}
                    className="mp-row press"
                  >
                    <span
                      dir="ltr"
                      aria-hidden="true"
                      className="gc-sector-n w-6 shrink-0 text-center"
                    >
                      {i === 0 ? "" : pad(i)}
                    </span>
                    <span className="min-w-0 flex-1">{names[i]}</span>
                  </a>
                </li>
              ))}
            </ul>
          )}
          <LanguageToggle className="mp-row press" onActivate={closeMenu} />
          <a
            href="#download"
            onClick={closeMenu}
            className="gc-btn-primary gc-btn-sm mt-3 inline-flex w-full items-center justify-center"
          >
            {t.nav.download}
          </a>
        </div>
      </header>

      {/* mobile-nav scrim — header's SIBLING, never a child (backdrop-
          filter would pin a "fixed" scrim inside the header). Pointer
          events + visibility are CSS-gated by html.mnav-on; keyboard users
          have Escape, so the div itself stays aria-hidden. */}
      <div className="mnav-scrim" aria-hidden="true" onClick={closeMenu} />
    </>
  );
}
