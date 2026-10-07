"use client";

import { useEffect, useRef, useState } from "react";
import { Globe } from "lucide-react";
import Image from "next/image";
import { useLanguage } from "@/components/pcmax/language-context";
import { asset } from "@/lib/gh-pages";

/* Mobile menu id — pairs the burger's aria-controls with the .mpanel nav,
 * byte-faithful to the tweakfa.com mirror (wireBurger + #mnav). */
const MNAV_ID = "mnav";

/* Sections watched by the scroll-spy — the Task 43 page composition:
 * hero(#top) → show-sec(#show) → uv-sec(#benchmarks) → hp-calc(#tools) →
 * hp-new(#guides) → faq(#faq) → download-cta(#download). Sections that
 * are not mounted yet are simply skipped by the observer effect, so the
 * list stays stable while the page is being rebuilt. */
const SPY_IDS = ["top", "show", "tools", "benchmarks", "guides", "faq", "download"] as const;

/* Scroll threshold (px) at which the header solidifies — tf-home.css
 * `header.tight`: bg rgba(8,8,10,.99) + hairline bottom edge. The class
 * lives on the <header> element itself, exactly like the mirror's site.js
 * (hdr.classList.toggle('tight', scrollY > 8)). */
const TIGHT_AT = 8;

/* Mobile takeover point. tf-home.css hides nav.main + .hd-act .btn-p at
 * ≤900px and force-hides .mpanel/.mnav-scrim at ≥901px, so the open state
 * must reset the moment the viewport grows past 900px — otherwise the
 * html.mnav-on class outlives the (now display:none) UI. */
const DESKTOP_QUERY = "(min-width: 901px)";

/* Pointer-capable clients open the dropdowns on hover (site.js wirePops
 * checks matchMedia('(hover:hover)') per event, so hybrids behave). */
const HOVER_QUERY = "(hover: hover)";

/* ---------------------------- Language toggle ------------------------ */

function LanguageToggle({
  className,
  onActivate,
}: {
  /* "btn btn-g" (header ghost button) or "mp-row" (mobile-menu row) — the
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
  /* The two desktop dropdown groups (.navgrp) — their open/close state is
   * driven imperatively (refs), a direct port of the mirror's wirePops.
   * React owns only the STATIC attributes below (aria-expanded={false},
   * the navpop `hidden` attr); since their prop values never change across
   * re-renders, React never rewrites them, so the imperative mutations
   * persist through every scroll-spy/locale re-render. */
  const grpRefs = useRef<Array<HTMLDivElement | null>>([]);
  const grpRef = (i: number) => (el: HTMLDivElement | null) => {
    grpRefs.current[i] = el;
  };

  /* Scroll-spy (UX polish): ONE IntersectionObserver over the hero + the
   * nav-target sections. The highlight follows the last section that
   * crossed the focus band and clears again at the hero. Zero scroll
   * listeners, zero layout reads; state flips only when the active
   * section actually changes. The "page" value is what tf-home.css keys
   * its current-item styling on (nav.main a[aria-current="page"] …). */
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
   * gains its hairline bottom edge. The initial read covers deep links /
   * refreshes that land mid-page; React bails out on repeated values, so
   * this re-renders only when the threshold is crossed. */
  useEffect(() => {
    const onScroll = () => setTight(window.scrollY > TIGHT_AT);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* Desktop dropdown engine — a faithful port of the mirror's wirePops
   * (site.js §4.4). Mouse: opens on hover, closes after a 160ms pause so
   * an oblique mouse path from the group head into the panel doesn't shut
   * it mid-flight (the classic dropdown trap). Keyboard + touch: click
   * toggles. `hidden` AND the .on class are both set on open/close —
   * `hidden` for screen readers and the no-CSS case, the class for the
   * animation: un-hide first, force a style flush (offsetWidth), then add
   * .on so the transition starts from zero; on close, re-hide only after
   * the 200ms fade-out ran. Focus leaving the group (Tab) closes it;
   * Escape closes every group and returns focus to its head; a click
   * anywhere outside closes all; only ONE group is open at a time. A link
   * click inside a panel closes the group too — the mirror navigates to
   * another page here, our in-page anchors are the SPA equivalent. */
  useEffect(() => {
    const grps = grpRefs.current.filter((g): g is HTMLDivElement => g !== null);
    if (grps.length === 0) return;

    let shutT = 0; /* shared hover-close delay (mirror: one timer) */
    const hideT = new Set<number>(); /* pending 200ms delayed re-hides */

    const open = (g: HTMLDivElement, on: boolean) => {
      const b = g.querySelector<HTMLButtonElement>(".navtop");
      const p = g.querySelector<HTMLElement>(".navpop");
      if (!b || !p) return;
      if (on) {
        p.hidden = false;
        void p.offsetWidth; /* style flush so the transition starts from zero */
      }
      g.classList.toggle("on", on);
      b.setAttribute("aria-expanded", on ? "true" : "false");
      if (!on) {
        /* hide AFTER the close animation, or the fade is never seen */
        const id = window.setTimeout(() => {
          hideT.delete(id);
          if (!g.classList.contains("on")) p.hidden = true;
        }, 200);
        hideT.add(id);
      }
    };
    const closeAll = (except: HTMLDivElement | null) => {
      for (const g of grps) if (g !== except) open(g, false);
    };

    const offs: Array<() => void> = [];
    for (const g of grps) {
      const b = g.querySelector<HTMLButtonElement>(".navtop");
      const p = g.querySelector<HTMLElement>(".navpop");
      if (!b) continue;

      const onEnter = () => {
        window.clearTimeout(shutT);
        if (window.matchMedia(HOVER_QUERY).matches) {
          closeAll(g);
          open(g, true);
        }
      };
      const onLeave = () => {
        if (!window.matchMedia(HOVER_QUERY).matches) return;
        window.clearTimeout(shutT);
        shutT = window.setTimeout(() => open(g, false), 160);
      };
      const onBtnClick = () => {
        const on = b.getAttribute("aria-expanded") === "true";
        closeAll(g);
        open(g, !on);
      };
      const onFocusOut = (e: FocusEvent) => {
        const next = e.relatedTarget;
        if (!(next instanceof Node) || !g.contains(next)) open(g, false);
      };
      const onPopClick = (e: Event) => {
        if (!(e.target instanceof Element)) return;
        const a = e.target.closest("a");
        if (a && p && p.contains(a)) closeAll(null);
      };

      g.addEventListener("mouseenter", onEnter);
      g.addEventListener("mouseleave", onLeave);
      b.addEventListener("click", onBtnClick);
      g.addEventListener("focusout", onFocusOut);
      if (p) p.addEventListener("click", onPopClick);
      offs.push(() => {
        g.removeEventListener("mouseenter", onEnter);
        g.removeEventListener("mouseleave", onLeave);
        b.removeEventListener("click", onBtnClick);
        g.removeEventListener("focusout", onFocusOut);
        if (p) p.removeEventListener("click", onPopClick);
      });
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      for (const g of grps) {
        if (!g.classList.contains("on")) continue;
        open(g, false);
        const b = g.querySelector<HTMLButtonElement>(".navtop");
        if (b) b.focus();
      }
    };
    const onDocClick = (e: MouseEvent) => {
      const target = e.target;
      if (target instanceof Node && grps.some((g) => g.contains(target))) return;
      closeAll(null);
    };
    document.addEventListener("keydown", onKeyDown, true);
    document.addEventListener("click", onDocClick);
    offs.push(() => {
      document.removeEventListener("keydown", onKeyDown, true);
      document.removeEventListener("click", onDocClick);
    });

    return () => {
      for (const off of offs) off();
      window.clearTimeout(shutT);
      for (const id of hideT) window.clearTimeout(id);
    };
  }, []);

  /* Open-state wiring (tweakfa mnav system): <html class="mnav-on"> drives
   * everything — the panel's clip-path unfold + child stagger, the scrim
   * reveal, the scroll lock (globals: html overflow:hidden) and the
   * mobile-cta-bar hide. Class removed on close AND on unmount, so a hot
   * unmount can never leave the page scroll-locked. */
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("mnav-on", open);
    return () => root.classList.remove("mnav-on");
  }, [open]);

  /* Mobile menu a11y: Escape closes it (focus returns to the burger via
   * the effect below) and growing the viewport past 900px — where CSS
   * force-hides the panel and scrim — closes it too. Listeners are
   * registered only while open. No focus trap (tweakfa contract): the
   * scrim dims the page and every close path (link, lang row, CTA, scrim
   * tap, Escape) works from the panel itself. */
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

  /* The tweakfa.com header tree, byte-faithful in classes and geometry:
   * sticky blurred #hdr > .wrap.hd (brand | nav.main | .hd-act) with the
   * .mpanel absolutely tucked UNDER the header (inside it — the mirror
   * does the same), and the .mnav-scrim as the header's SIBLING (the
   * header's backdrop-filter makes it a containing block for fixed
   * descendants, so a "fixed" scrim must never live inside). All styling
   * comes from tf-home.css; the only Tailwind classes below replicate
   * values the ported CSS already sets (31px logo mark, full-width CTA). */
  return (
    <>
      <header id="hdr" className={tight ? "tight" : undefined}>
        <div className="wrap hd">
          {/* brand — real link to #top (CSS scroll-behavior handles smooth
              scrolling + its own reduced-motion override). .logo-fa owns
              the 31px mark + 19.5px/800 wordmark row; its role="img" makes
              the inner text presentational, aria-label carries the name. */}
          <a className="brand" href="#top" aria-label="PC MAX">
            <span className="logo-fa" role="img" aria-label="PC MAX">
              <Image
                src={asset("/brand/pcmax-logo-96.webp")}
                width={31}
                height={31}
                alt=""
                priority
                className="h-[31px] w-[31px] rounded-lg object-contain"
              />
              <span>PC&nbsp;MAX</span>
            </span>
          </a>

          {/* desktop nav (hidden ≤900px by tf-home.css) — two dropdown
              groups + one direct link, mirroring tweakfa's
              Phoenix/Calculators/Blog tree with PC MAX's IA:
              Product → the app; Features → the three feature jumps;
              FAQ direct. aria-current="page" is the value tf-home.css
              styles the current item with. */}
          <nav className="main" aria-label="PC MAX">
            <div className="navgrp" data-grp="" ref={grpRef(0)}>
              <button
                type="button"
                className="navtop"
                aria-expanded={false}
                aria-controls="pop0"
              >
                {t.tw.nav.product}
                <svg
                  className="chev"
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>
              <div className="navpop" id="pop0" hidden>
                <a
                  href="#show"
                  aria-current={active === "show" ? "page" : undefined}
                >
                  <i
                    className="dot"
                    style={{ ["--dc" as any]: "var(--gc-violet-rgb)" }}
                    aria-hidden="true"
                  />
                  <span>{t.tw.nav.app}</span>
                </a>
              </div>
            </div>

            <div className="navgrp" data-grp="" ref={grpRef(1)}>
              <button
                type="button"
                className="navtop"
                aria-expanded={false}
                aria-controls="pop1"
              >
                {t.nav.features}
                <svg
                  className="chev"
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>
              <div className="navpop" id="pop1" hidden>
                <a
                  href="#tools"
                  aria-current={active === "tools" ? "page" : undefined}
                >
                  <i
                    className="dot"
                    style={{ ["--dc" as any]: "var(--gc-success-rgb)" }}
                    aria-hidden="true"
                  />
                  <span>{t.tw.nav.frame}</span>
                </a>
                <a
                  href="#benchmarks"
                  aria-current={active === "benchmarks" ? "page" : undefined}
                >
                  <i
                    className="dot"
                    style={{ ["--dc" as any]: "var(--gc-success-rgb)" }}
                    aria-hidden="true"
                  />
                  <span>{t.nav.benchmarks}</span>
                </a>
                <a
                  href="#guides"
                  aria-current={active === "guides" ? "page" : undefined}
                >
                  <i
                    className="dot"
                    style={{ ["--dc" as any]: "var(--gc-success-rgb)" }}
                    aria-hidden="true"
                  />
                  <span>{t.tw.nav.guides}</span>
                </a>
              </div>
            </div>

            <a href="#faq" aria-current={active === "faq" ? "page" : undefined}>
              {t.nav.faq}
            </a>
          </nav>

          {/* actions — tweakfa's .hd-act/.hd-acct pair: the ghost language
              toggle + the primary Download CTA inside the .hd-acct wrapper
              (the mirror's sign-in/download slot). tf-home.css sizes every
              .btn in here at 40px and auto-hides .btn-p below 901px. */}
          <div className="hd-act">
            <span className="hd-acct">
              <LanguageToggle className="btn btn-g" />
              <a href="#download" className="btn btn-p">
                {t.nav.download}
              </a>
            </span>
            {/* burger — three CSS bars morphing to X (tf-home .burger,
                keyed on aria-expanded); the label swaps to hud.close */}
            <button
              type="button"
              ref={triggerRef}
              className="burger"
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

        {/* mobile menu — tweakfa .mpanel, absolute UNDER the header, inside
            it exactly like the mirror. The clip-path unfold + child stagger
            + scrim + scroll lock all ride on html.mnav-on; `hidden` keeps
            the closed panel out of the a11y tree (tf-home's display:block
            intentionally overrides the UA sheet — clip-path is the visual
            gate) and `inert` keeps it out of the tab order. */}
        <nav
          className="mpanel"
          id={MNAV_ID}
          aria-label={t.nav.menu}
          tabIndex={-1}
          hidden={!open}
          inert={!open}
        >
          <span className="mp-lb">{t.tw.nav.product}</span>
          <a
            className="mp-row"
            href="#show"
            onClick={closeMenu}
            aria-current={active === "show" ? "page" : undefined}
          >
            <span
              className="mp-tile"
              style={{ ["--dc" as any]: "var(--gc-violet-rgb)" }}
            >
              {/* tweakfa's shield mark — the mirror's product-row tile */}
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M12 2 4 6v6c0 5 3.4 8.6 8 10 4.6-1.4 8-5 8-10V6z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </span>
            <span className="mp-nm">{t.tw.nav.app}</span>
            <svg
              className="mp-chev"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="m14 6-6 6 6 6" />
            </svg>
          </a>

          <span className="mp-lb">{t.nav.features}</span>
          {/* the calculators trio → PC MAX's three feature jumps; icons
              copied from the mirror's mpanel (rect tool / perf line / doc) */}
          <div className="mp-trio">
            <a
              href="#tools"
              onClick={closeMenu}
              aria-current={active === "tools" ? "page" : undefined}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="5" y="3" width="14" height="18" rx="2.5" />
                <rect x="8" y="6" width="8" height="3.5" rx="1" />
                <path d="M8.5 13.5h.01M12 13.5h.01M15.5 13.5h.01M8.5 17h.01M12 17h.01M15.5 17h.01" />
              </svg>
              <span>{t.tw.nav.frame}</span>
            </a>
            <a
              href="#benchmarks"
              onClick={closeMenu}
              aria-current={active === "benchmarks" ? "page" : undefined}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M2 12h4l2-7 4 14 3-9 1.5 2H22" />
              </svg>
              <span>{t.nav.benchmarks}</span>
            </a>
            <a
              href="#guides"
              onClick={closeMenu}
              aria-current={active === "guides" ? "page" : undefined}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M4 4.5h16v13H8l-4 3.5z" />
                <path d="M8 9h8M8 13h5" />
              </svg>
              <span>{t.tw.nav.guides}</span>
            </a>
          </div>

          {/* FAQ row — the mirror's consult chat-bubble tile (the closest
              "help" glyph in its mpanel) on the product-family accent */}
          <a
            className="mp-row"
            href="#faq"
            onClick={closeMenu}
            aria-current={active === "faq" ? "page" : undefined}
          >
            <span
              className="mp-tile"
              style={{ ["--dc" as any]: "var(--gc-violet-rgb)" }}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M12 3c4.7 0 8.5 3.1 8.5 7s-3.8 7-8.5 7c-.9 0-1.8-.1-2.6-.3L4.5 19l1-3.6C4.1 14.1 3.5 12.6 3.5 10c0-3.9 3.8-7 8.5-7Z" />
                <path d="M9 10h.01M12 10h.01M15 10h.01" />
              </svg>
            </span>
            <span className="mp-nm">{t.nav.faq}</span>
          </a>

          {/* language row + the mpanel Download CTA (full-width primary,
              riding .mpanel>*'s child stagger like every row above) */}
          <LanguageToggle className="mp-row" onActivate={closeMenu} />
          <a
            href="#download"
            onClick={closeMenu}
            className="btn btn-p mt-3 w-full"
          >
            {t.nav.download}
          </a>
        </nav>
      </header>

      {/* mobile-nav scrim — header's SIBLING, never a child (backdrop-
          filter would pin a "fixed" scrim inside the header). Visibility
          is CSS-gated: tf-home shows .mnav-scrim:not([hidden]) at ≤900px,
          so the hidden attribute is the toggle — exactly the mirror's
          wireBurger (s.hidden = !open). Keyboard users have Escape, so
          the div itself stays aria-hidden. */}
      <div
        className="mnav-scrim"
        hidden={!open}
        aria-hidden="true"
        onClick={closeMenu}
      />
    </>
  );
}
