"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Globe, Menu, X } from "lucide-react";
import Image from "next/image";
import { useLanguage } from "@/components/pcmax/language-context";
import { cn } from "@/lib/utils";
import { asset } from "@/lib/gh-pages";
import { springFluid } from "@/components/pcmax/ui/motion";

/* Id of the collapsible mobile menu — pairs the trigger's aria-controls
   with the menu container so assistive tech can associate them. */
const MENU_ID = "pcmax-mobile-menu";

/* Sections watched by the scroll-spy (hero + the four nav targets) —
   mirrors the `links` list below. Module-level: the observer effect can
   keep an empty dep array and never resubscribes on re-renders. */
const SPY_IDS = ["top", "features", "install", "benchmarks", "faq"] as const;

/* ---------------------------- Language toggle ------------------------ */

function LanguageToggle() {
  const { t, toggleLocale, alternateHref } = useLanguage();

  /* Static flavor (audit 29-a D7): the toggle is a REAL crawlable <a> to the
   * other language's document (/fa ↔ /) — the Persian page becomes a
   * linkable, shareable, indexable URL instead of a client-only state flip.
   * The click still persists the preference cookie first, so returning
   * visitors on / keep getting their locale restored. SSR/dev flavor keeps
   * the in-place client toggle (cookie + server locale). */
  const sharedClass =
    "press flex h-11 items-center justify-center gap-1.5 rounded-full border border-border bg-transparent px-4 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground sm:h-9 sm:px-3.5";

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
        }}
        className={sharedClass}
      >
        <Globe className="h-4 w-4" />
        <span>{t.common.switchTo}</span>
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleLocale}
      aria-label={t.common.switchTo}
      /* Ghost hairline pill (reference .hdr-cta ghost): transparent bg,
       * hairline border, muted text lifting to foreground on hover.
       * 44px hit area on touch, compact pill from sm up (a11y touch target). */
      className={sharedClass}
    >
      <Globe className="h-4 w-4" />
      <span>{t.common.switchTo}</span>
    </button>
  );
}

/* -------------------------------- Navbar ------------------------------ */

export function Navbar() {
  const { t, isRTL } = useLanguage();
  const [active, setActive] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const headerRef = useRef<HTMLElement | null>(null);
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

  /* Scroll-lock with scrollbar compensation: hiding the viewport scrollbar
   * would shift the page by its width otherwise. The scrollbar sits at the
   * inline-end edge in both LTR and RTL, so padding-inline-end compensates
   * in both directions. */
  useEffect(() => {
    if (open) {
      const scrollbar = window.innerWidth - document.documentElement.clientWidth;
      if (scrollbar > 0) document.body.style.paddingInlineEnd = `${scrollbar}px`;
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.paddingInlineEnd = "";
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.body.style.paddingInlineEnd = "";
    };
  }, [open]);

  /* Mobile menu a11y: Escape closes it, Tab is trapped inside the header
   * (nav actions + menu items), and growing the viewport to the lg
   * breakpoint closes it — listener registered only while open. */
  useEffect(() => {
    if (!open) return;
    const mql = window.matchMedia("(min-width: 1024px)");
    const onViewport = (event: MediaQueryListEvent) => {
      if (event.matches) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        return;
      }
      if (event.key !== "Tab" || !headerRef.current) return;
      const focusables = Array.from(
        headerRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => el.getClientRects().length > 0);
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const activeEl = document.activeElement;
      const inside = activeEl instanceof Node && headerRef.current.contains(activeEl);
      if (event.shiftKey && (!inside || activeEl === first)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (!inside || activeEl === last)) {
        event.preventDefault();
        first.focus();
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
   * Escape, or viewport resize) — never steals focus on first mount. */
  useEffect(() => {
    if (wasOpen.current && !open) {
      const trigger = triggerRef.current;
      if (trigger && trigger.getClientRects().length > 0) trigger.focus();
    }
    wasOpen.current = open;
  }, [open]);

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

  return (
    /* Guardian header (reference .hdr): sticky full-width blurred bar with
     * a hairline bottom edge — always-on chrome, no scrolled state needed. */
    <header ref={headerRef} className="gc-hdr sticky top-0 z-[60]">
      <nav
        aria-label="PC MAX"
        className="mx-auto flex h-[68px] max-w-6xl items-center gap-7 px-4 sm:px-6 lg:px-8"
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
          <span className="font-display text-[17px] font-extrabold text-foreground">
            PC&nbsp;<span className="text-crimson">MAX</span>
          </span>
        </a>

        {/* desktop links — plain text anchors like the reference .nav (no
            underline affordance): scroll-spy highlights the active section
            via aria-current + full-foreground color */}
        <ul className="hidden items-center gap-6 lg:flex">
          {links.map((link) => {
            const isActive = active === link.id;
            return (
              <li key={link.id}>
                <a
                  href={`#${link.id}`}
                  aria-current={isActive ? "true" : undefined}
                  className={cn(
                    "press rounded-full px-1 py-2 text-sm/[14.5px] font-medium transition-colors",
                    isActive
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {link.label}
                </a>
              </li>
            );
          })}
        </ul>

        {/* actions */}
        <div className="ms-auto flex items-center gap-2.5">
          <LanguageToggle />
          {/* real anchor — same classes the shadcn Button rendered, so the
              pixel result is unchanged; now a crawlable link */}
          <a
            href="#download"
            className="gc-btn-primary press hidden h-9 items-center justify-center whitespace-nowrap rounded-xl px-5 text-sm font-bold text-white sm:inline-flex"
          >
            {t.nav.download}
          </a>
          <button
            type="button"
            ref={triggerRef}
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls={MENU_ID}
            aria-label={t.nav.menu}
            className="press flex h-11 w-11 items-center justify-center rounded-full border border-border bg-transparent text-muted-foreground transition-colors hover:text-foreground lg:hidden"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </nav>

      {/* mobile menu — hud-style glass panel floating below the sticky bar */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={springFluid}
            id={MENU_ID}
            className="fixed inset-x-4 top-[76px] z-[59] lg:hidden"
          >
            <div className="rounded-2xl border border-border bg-[#121216]/95 p-3 shadow-[0_24px_60px_rgba(0,0,0,0.6)]">
              <ul className="flex flex-col">
                {links.map((link, i) => {
                  const isActive = active === link.id;
                  return (
                    <motion.li
                      key={link.id}
                      initial={{ opacity: 0, x: isRTL ? 16 : -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ ...springFluid, delay: 0.03 * i }}
                    >
                      <a
                        href={`#${link.id}`}
                        onClick={() => {
                          /* close the panel; the native anchor navigation
                           * (hash + smooth scroll) still runs */
                          setOpen(false);
                        }}
                        aria-current={isActive ? "true" : undefined}
                        className={cn(
                          "press flex w-full items-center justify-between rounded-xl px-4 py-3 text-[15px] font-semibold transition-colors hover:bg-accent hover:text-foreground",
                          isActive ? "text-crimson" : "text-foreground/85"
                        )}
                      >
                        {link.label}
                        <span
                          aria-hidden="true"
                          className={cn(
                            "h-1.5 w-1.5 rounded-full",
                            isActive ? "bg-crimson" : "bg-crimson/60"
                          )}
                        />
                      </a>
                    </motion.li>
                  );
                })}
                <li className="mt-2 border-t border-border/60 pt-3">
                  <a
                    href="#download"
                    onClick={() => setOpen(false)}
                    className="gc-btn-primary press inline-flex h-11 w-full items-center justify-center whitespace-nowrap rounded-xl text-[15px] font-bold text-white"
                  >
                    {t.nav.download}
                  </a>
                </li>
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
