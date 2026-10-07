"use client";

import { useEffect, useRef, useState } from "react";
import { Globe } from "lucide-react";
import Image from "next/image";
import { useLanguage } from "@/components/pcmax/language-context";
import { asset } from "@/lib/gh-pages";

/*
 * Task 44 — the premium PC MAX header. Simple, fast, trustworthy: a
 * translucent sticky bar (brand | 4 links | language + download) that
 * solidifies on scroll, and a fullscreen takeover menu on mobile. All
 * geometry, material and motion come from premium.css §10 (pm-hdr /
 * pm-hd / pm-nav / pm-lang / pm-burger / pm-mnav / pm-scrim) — this
 * file only owns structure, state and behavior.
 *
 * Behaviors ported from the proven tweakfa-clone navbar (Task 43-A),
 * re-housed on the pm classes:
 *   • LanguageToggle — static flavor renders a REAL crawlable <a> to the
 *     other language's document; SSR flavor keeps the in-place button.
 *   • Scroll-spy — one IntersectionObserver, -40%/-55% focus band, the
 *     highlight clears at the hero; aria-current="page" is the value
 *     premium.css styles.
 *   • Scroll-tightening — .tight lands on the <header> at scrollY > 8.
 *   • Mobile menu — aria-expanded burger, html.mnav-on scroll lock,
 *     Escape / ≥900px mql / link-click closes, focus returns to burger.
 *
 * Stacking contract (why the panel lives INSIDE the header): premium.css
 * pins .pm-mnav at z-index:-1 and the header at z-index:60, so the panel
 * rides inside the header's stacking context — under the translucent
 * .pm-hdr-in bar (the bar frosts the top 68px of the menu through its
 * backdrop blur) yet above every page layer. It must be a DIRECT child
 * of the header: .pm-hdr-in's backdrop-filter would make it a containing
 * block for the fixed panel and pin the "fullscreen" panel to the bar's
 * own box. The .pm-scrim (z-index:55) is the header's SIBLING for the
 * same backdrop-filter reason.
 */

/* Mobile menu id — pairs the burger's aria-controls with the .pm-mnav nav. */
const MNAV_ID = "pm-mnav";

/* Sections watched by the scroll-spy — the Task 44 page composition:
 * hero(#top) → showcase(#show) → frame-gen(#tools) → benchmarks → faq →
 * download. Sections not mounted yet are simply skipped by the observer
 * effect, so the list stays stable while the page is being rebuilt. */
const SPY_IDS = ["top", "show", "tools", "benchmarks", "faq", "download"] as const;

/* Scroll threshold (px) at which the header solidifies — premium.css
 * .pm-hdr.tight: bg rgba(8,8,10,.97) + hairline bottom edge, .pm-hd pads
 * 15px → 9px. State flips only when the threshold is crossed. */
const TIGHT_AT = 8;

/* Mobile takeover point — premium.css §10 flips .pm-nav (none→flex) and
 * .pm-burger (inline-flex→none) at min-width: 900px and force-hides
 * .pm-mnav/.pm-scrim there, so the open state must reset the moment the
 * viewport grows past 900px — otherwise the html.mnav-on scroll lock
 * outlives the (now display:none) UI. */
const DESKTOP_QUERY = "(min-width: 900px)";

/* ---------------------------- Language toggle ------------------------ */

function LanguageToggle({
  className,
  onActivate,
}: {
  /* "pm-lang" (header + mobile foot) — the class fully owns the styling;
   * only the markup skeleton is shared. */
  className?: string;
  /* Extra behavior after a toggle (e.g. closing the mobile panel). */
  onActivate?: () => void;
}) {
  const { t, toggleLocale, alternateHref } = useLanguage();

  /* Static flavor (audit 29-a D7): the toggle is a REAL crawlable <a> to
   * the other language's document (/fa ↔ /) — the Persian page stays a
   * linkable, shareable, indexable URL instead of a client-only state
   * flip. The click still persists the preference cookie first, so
   * returning visitors keep getting their locale restored. SSR/dev flavor
   * keeps the in-place client toggle (cookie + server locale). */
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
          /* Persist the target locale before navigating (storage+cookie
           * via setLocale — the context's store flips too, which is
           * harmless one frame before the navigation replaces the
           * document). */
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

  /* Scroll-spy (ported verbatim from the shipped navbar): ONE
   * IntersectionObserver over the hero + the nav-target sections. The
   * highlight follows the last section that crossed the focus band and
   * clears again at the hero. Zero scroll listeners, zero layout reads;
   * state flips only when the active section actually changes.
   * aria-current="page" is the value premium.css keys its current-item
   * styling on (.pm-nav a[aria-current="page"],
   * .pm-mnav-link[aria-current="page"]). */
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

  /* Scroll-tightening: ONE passive listener flips the .tight class
   * carrier at scrollY > 8 — the blurred bar solidifies and gains its
   * hairline bottom edge. The initial read covers deep links / refreshes
   * that land mid-page; React bails out on repeated values, so this
   * re-renders only when the threshold is crossed. */
  useEffect(() => {
    const onScroll = () => setTight(window.scrollY > TIGHT_AT);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* Open-state wiring: <html class="mnav-on"> drives the scroll lock
   * (premium.css: html.mnav-on { overflow: hidden }) and hides any
   * legacy mobile CTA bar still on the page (globals.css wiring). Class
   * removed on close AND on unmount, so a hot unmount can never leave
   * the page scroll-locked. */
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("mnav-on", open);
    return () => root.classList.remove("mnav-on");
  }, [open]);

  /* Mobile menu a11y: Escape closes it (focus returns to the burger via
   * the effect below) and growing the viewport past 900px — where
   * premium.css force-hides the panel and scrim — closes it too.
   * Listeners are registered only while open. No focus trap: the
   * fullscreen panel covers the page, and every close path (link, lang
   * row, CTA, scrim tap, Escape) works from the panel itself. */
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

  /* The four nav targets — shared by the desktop nav and the mobile rows
   * so the two never drift apart. */
  const links = [
    { id: "show", href: "#show", label: t.tw.nav.product },
    { id: "tools", href: "#tools", label: t.nav.features },
    { id: "benchmarks", href: "#benchmarks", label: t.nav.benchmarks },
    { id: "faq", href: "#faq", label: t.nav.faq },
  ];

  return (
    <>
      <header className={tight ? "pm-hdr tight" : "pm-hdr"}>
        <div className="pm-hdr-in">
          {/* container — mirrors .pm-sect-in (1168px rail) so the bar's
              content aligns with every section below it */}
          <div className="mx-auto w-full max-w-[1168px] px-4 sm:px-6 lg:px-8">
            <div className="pm-hd">
              {/* brand — real crawlable #top anchor. The wordmark is
                  brand identity ("PC" + crimson <b>MAX</b>), exempt from
                  i18n exactly like the shipped navbar; aria-label carries
                  the name, the image is decorative. */}
              <a className="pm-brand" href="#top" aria-label="PC MAX">
                <Image
                  src={asset("/brand/pcmax-logo-96.webp")}
                  width={30}
                  height={30}
                  alt=""
                  priority
                />
                <span>
                  PC&nbsp;<b>MAX</b>
                </span>
              </a>

              {/* desktop nav (hidden <900px by premium.css) — Product →
                  the app showcase, Features → frame generation, plus the
                  two direct jumps. */}
              <nav className="pm-nav" aria-label="PC MAX">
                {links.map((link) => (
                  <a
                    key={link.id}
                    href={link.href}
                    aria-current={active === link.id ? "page" : undefined}
                  >
                    {link.label}
                  </a>
                ))}
              </nav>

              {/* actions — language toggle + download CTA + burger. The
                  CTA wears a display wrapper because premium.css
                  (unlayered) sets .pm-btn{display:inline-flex}, which
                  would beat a utilities-layer `hidden` on the anchor
                  itself — a bare <span> has no display rule, so the
                  CSS-gated wrapper hides reliably below 900px, where the
                  menu foot carries the full-width CTA instead (brand +
                  lang + burger already fill a 320px bar). */}
              <div className="pm-hd-act">
                <LanguageToggle className="pm-lang" />
                <span className="hidden min-[900px]:contents">
                  <a href="#download" className="pm-btn pm-btn-sm">
                    {t.nav.download}
                  </a>
                </span>

                {/* burger — three CSS bars morphing to X (premium.css
                    .pm-burger, keyed on aria-expanded); the label swaps
                    to hud.close while the menu is open */}
                <button
                  type="button"
                  ref={triggerRef}
                  className="pm-burger"
                  onClick={() => setOpen((v) => !v)}
                  aria-expanded={open}
                  aria-controls={MNAV_ID}
                  aria-label={open ? t.hud.close : t.nav.menu}
                >
                  <span aria-hidden="true" />
                  <span aria-hidden="true" />
                  <span aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* mobile menu — fullscreen takeover, a DIRECT child of the
            header (after .pm-hdr-in) so premium.css's z-index:-1 tucks
            it under the translucent bar while the header's z-index:60
            stack keeps it above every page layer. `hidden` + `inert`
            keep the closed panel out of the a11y tree and the tab order
            (.pm-mnav has no author display rule, so the UA [hidden]
            sheet gates it cleanly); show/hide is instant — premium.css
            gives the bar's burger morph and the scrim's fade all the
            motion. */}
        <nav
          className="pm-mnav"
          id={MNAV_ID}
          aria-label={t.nav.menu}
          hidden={!open}
          inert={!open}
        >
          <div className="pm-mnav-in">
            {links.map((link, i) => (
              <a
                key={link.id}
                className="pm-mnav-link"
                href={link.href}
                onClick={closeMenu}
                aria-current={active === link.id ? "page" : undefined}
              >
                <i>{String(i + 1).padStart(2, "0")}</i>
                {link.label}
              </a>
            ))}
            <a
              className="pm-mnav-link"
              href="#download"
              onClick={closeMenu}
              aria-current={active === "download" ? "page" : undefined}
            >
              <i>{String(links.length + 1).padStart(2, "0")}</i>
              {t.nav.download}
            </a>

            {/* foot — full-width language row + download CTA
                (.pm-mnav-foot is a grid, so both rows stretch) */}
            <div className="pm-mnav-foot">
              <LanguageToggle className="pm-lang w-full" onActivate={closeMenu} />
              <a
                href="#download"
                className="pm-btn pm-btn-sm"
                onClick={closeMenu}
              >
                {t.nav.download}
              </a>
            </div>
          </div>
        </nav>
      </header>

      {/* mobile-nav scrim — the header's SIBLING (never a child: the
          bar's backdrop-filter would trap a "fixed" scrim inside it),
          dimming the page under premium.css's own opacity transition.
          The fullscreen .98-opaque panel paints above it (the whole
          header stack sits at z-index:60 > 55), so the fade is a soft
          edge under the takeover rather than a visible curtain — the
          click-to-close wiring is kept for the day the panel's surface
          lightens. Keyboard users have Escape, so the div stays
          aria-hidden. */}
      <div
        className="pm-scrim"
        data-on={open ? "1" : undefined}
        aria-hidden="true"
        onClick={closeMenu}
      />
    </>
  );
}
