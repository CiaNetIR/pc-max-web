"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useScroll, useSpring } from "framer-motion";
import { Globe, Menu, Moon, Sun, X } from "lucide-react";
import Image from "next/image";
import { useTheme } from "next-themes";
import { useLanguage } from "@/components/pcmax/language-context";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { springBounce, springFluid } from "@/components/pcmax/ui/motion";

/* Id of the collapsible mobile menu — pairs the trigger's aria-controls
   with the menu container so assistive tech can associate them. */
const MENU_ID = "pcmax-mobile-menu";

/* ------------------------------ Theme toggle ------------------------- */

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const { t } = useLanguage();

  const toggle = () => {
    const next = resolvedTheme === "dark" ? "light" : "dark";
    const root = document.documentElement;
    root.classList.add("theme-anim");
    setTheme(next);
    window.setTimeout(() => root.classList.remove("theme-anim"), 460);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`${t.common.themeLight} / ${t.common.themeDark}`}
      /* 44px on touch, 36px from sm up — a11y touch-target rule */
      className="press flex h-11 w-11 items-center justify-center rounded-full border border-border/70 bg-card/60 text-muted-foreground backdrop-blur-sm transition-colors hover:border-crimson/40 hover:text-crimson sm:h-9 sm:w-9"
    >
      <motion.span
        key="theme-icon"
        initial={{ rotate: -60, opacity: 0, scale: 0.6 }}
        animate={{ rotate: 0, opacity: 1, scale: 1 }}
        transition={springBounce}
        className="relative flex"
      >
        <Sun className="h-4 w-4 rotate-0 scale-100 transition-all duration-500 dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all duration-500 dark:rotate-0 dark:scale-100" />
      </motion.span>
    </button>
  );
}

/* ---------------------------- Language toggle ------------------------ */

function LanguageToggle({ compact = false }: { compact?: boolean }) {
  const { t, toggleLocale } = useLanguage();
  return (
    <button
      type="button"
      onClick={toggleLocale}
      aria-label={t.common.switchTo}
      className={cn(
        "press flex items-center justify-center gap-1.5 rounded-full border border-border/70 bg-card/60 text-foreground/80 backdrop-blur-sm transition-colors hover:border-crimson/40 hover:text-crimson",
        /* 44px hit area on touch, compact from sm up (a11y touch target) */
        compact ? "h-11 w-11 sm:h-9 sm:w-9" : "h-11 px-4 text-xs font-bold sm:h-9"
      )}
    >
      <Globe className="h-4 w-4" />
      {!compact && <span>{t.common.switchTo}</span>}
    </button>
  );
}

/* -------------------------------- Navbar ------------------------------ */

export function Navbar() {
  const { t, isRTL } = useLanguage();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const headerRef = useRef<HTMLElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const wasOpen = useRef(false);

  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 28, mass: 0.4 });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* Scroll-lock with scrollbar compensation: hiding the viewport scrollbar
   * would shift the fixed chrome by its width otherwise. The scrollbar sits
   * at the inline-end edge in both LTR and RTL, so padding-inline-end
   * compensates in both directions. */
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
      const active = document.activeElement;
      const inside = active instanceof Node && headerRef.current.contains(active);
      if (event.shiftKey && (!inside || active === first)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (!inside || active === last)) {
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

  /* Section 44 — simple nav: Features · How it works · Benchmarks · FAQ */
  const links = [
    { id: "features", label: t.nav.features },
    { id: "install", label: t.nav.install },
    { id: "benchmarks", label: t.nav.benchmarks },
    { id: "faq", label: t.nav.faq },
  ];

  const go = (id: string) => {
    setOpen(false);
    requestAnimationFrame(() => {
      /* Programmatic smooth scrolling ignores the CSS reduced-motion
       * override, so respect the media query explicitly. */
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      document.getElementById(id)?.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
    });
  };

  return (
    <>
      {/* scroll progress */}
      <motion.div
        style={{ scaleX: progress, transformOrigin: isRTL ? "right" : "left" }}
        className="fixed inset-x-0 top-0 z-[70] h-[2px] bg-gradient-to-r from-crimson-deep via-crimson to-crimson-bright"
        aria-hidden="true"
      />

      <header
        ref={headerRef}
        className={cn(
          "fixed inset-x-0 top-0 z-[60] transition-all duration-500",
          scrolled ? "py-2" : "py-4"
        )}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <nav
            aria-label="PC MAX"
            className={cn(
              "flex items-center justify-between gap-4 rounded-2xl px-4 py-2.5 transition-all duration-500 sm:px-5",
              scrolled
                ? "glass-chrome"
                : "border border-transparent bg-transparent"
            )}
          >
            {/* brand — real link to #top (CSS scroll-behavior handles smooth
                scrolling + its own reduced-motion override); the visible
                "PC MAX" wordmark is the accessible name, the logo is decorative */}
            <a href="#top" className="group flex items-center gap-3">
              <span className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full ring-1 ring-border/70 transition-all duration-300 group-hover:scale-105 group-hover:ring-crimson/50 group-hover:shadow-[0_0_18px_rgba(229,9,20,0.35)]">
                <Image
                  src="/brand/pcmax-logo-96.png"
                  alt=""
                  width={40}
                  height={40}
                  priority
                  className="h-full w-full object-cover"
                />
              </span>
              <span className="type-title font-display text-lg font-bold text-foreground">
                PC&nbsp;<span className="text-crimson">MAX</span>
              </span>
            </a>

            {/* desktop links */}
            <ul className="hidden items-center gap-1 lg:flex">
              {links.map((link) => (
                <li key={link.id}>
                  <button
                    type="button"
                    onClick={() => go(link.id)}
                    className="press relative rounded-full px-3.5 py-2 text-sm font-medium text-foreground/80 transition-colors hover:text-foreground after:absolute after:bottom-0.5 after:start-3.5 after:h-px after:w-0 after:bg-crimson after:transition-all after:duration-300 hover:after:w-[calc(100%-1.75rem)]"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>

            {/* actions */}
            <div className="flex items-center gap-2">
              <LanguageToggle />
              <ThemeToggle />
              <Button
                size="sm"
                onClick={() => go("download")}
                className="btn-convex press hidden h-9 rounded-full px-5 text-sm font-semibold text-white sm:inline-flex"
              >
                {t.nav.download}
              </Button>
              <button
                type="button"
                ref={triggerRef}
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
                aria-controls={MENU_ID}
                aria-label={t.nav.menu}
                className="press flex h-11 w-11 items-center justify-center rounded-full border border-border/70 bg-card/60 text-foreground backdrop-blur-sm transition-colors hover:border-crimson/40 hover:text-crimson lg:hidden"
              >
                {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </button>
            </div>
          </nav>
        </div>

        {/* mobile menu */}
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.98 }}
              transition={springFluid}
              id={MENU_ID}
              className="fixed inset-x-4 top-[72px] z-[59] rounded-3xl lg:hidden"
            >
              <div className="glass overflow-hidden rounded-3xl">
                <ul className="flex flex-col p-3">
                  {links.map((link, i) => (
                    <motion.li
                      key={link.id}
                      initial={{ opacity: 0, x: isRTL ? 16 : -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ ...springFluid, delay: 0.03 * i }}
                    >
                      <button
                        type="button"
                        onClick={() => go(link.id)}
                        className="press flex w-full items-center justify-between rounded-2xl px-4 py-3.5 text-base font-semibold text-foreground/85 transition-colors hover:bg-accent hover:text-foreground"
                      >
                        {link.label}
                        <span className="h-1.5 w-1.5 rounded-full bg-crimson/60" aria-hidden="true" />
                      </button>
                    </motion.li>
                  ))}
                  <li className="mt-2 border-t border-border/60 pt-3">
                    <Button
                      onClick={() => go("download")}
                      className="btn-convex press h-11 w-full rounded-full text-sm font-semibold text-white"
                    >
                      {t.nav.download}
                    </Button>
                  </li>
                </ul>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  );
}
