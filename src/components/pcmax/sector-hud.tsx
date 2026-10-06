"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronUp, Joystick } from "lucide-react";
import { useLanguage } from "@/components/pcmax/language-context";
import { springFluid } from "@/components/pcmax/ui/motion";
import { cn } from "@/lib/utils";

/* The page's real section ids, in scroll order — mirrors the page.tsx
 * composition exactly (hero → showcase → features → multiframe →
 * profiles → safety → benchmarks → community → install → faq →
 * download). Names come from the dictionary (hud.sectors, EN+FA). */
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

const pad = (n: number) => String(n).padStart(2, "0");

/* ---------------------------- Sector HUD ------------------------------ *
 * Task 39 — the fixed scroll menu box (lg+ only): while the visitor
 * scrolls, a small gaming HUD chip tracks the current sector of the
 * page; clicking it opens a quick-jump panel of REAL in-page anchors
 * (#id links — crawlable, middle-click friendly, the CSS smooth-scroll
 * + scroll-mt offsets do the rest). One IntersectionObserver, zero
 * scroll listeners; the chip hides itself at the hero like the navbar's
 * scroll-spy. Purely informational — it stays functional (and static)
 * under prefers-reduced-motion. */
export function SectorHud() {
  const { t } = useLanguage();
  const [active, setActive] = useState<number | null>(null);
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  /* Scroll-spy over the eleven sections — same focus band the navbar
   * uses (-40%/-55%), so the two never disagree. The hero clears the
   * chip; everything else pins it. */
  useEffect(() => {
    const els = SECTOR_IDS.map((id) => document.getElementById(id)).filter(
      (el): el is HTMLElement => el !== null,
    );
    if (els.length === 0) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const idx = SECTOR_IDS.indexOf(entry.target.id as (typeof SECTOR_IDS)[number]);
          if (idx === -1) continue;
          setActive(idx === 0 ? null : idx);
        }
      },
      { rootMargin: "-40% 0px -55% 0px" },
    );
    for (const el of els) io.observe(el);
    return () => io.disconnect();
  }, []);

  /* Escape closes the quick-jump panel and hands focus back to the chip. */
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setOpen(false);
      btnRef.current?.focus();
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [open]);

  const names = t.hud.sectors;
  const total = SECTOR_IDS.length;
  /* Dictionary guard — ids and names must stay 1:1. */
  if (names.length !== total) return null;

  const visible = active !== null;

  return (
    <div
      className={cn(
        "gc-sector-hud transition-opacity duration-300",
        visible ? "opacity-100" : "pointer-events-none opacity-0",
      )}
      /* inert while hidden: the chip is chrome for mid-page scrolling —
       * at the hero (and before it) it is removed from the tab order and
       * the accessibility tree entirely. */
      inert={!visible}
    >
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={t.hud.menuLabel}
        className="gc-sector-chip press"
      >
        <Joystick className="h-[18px] w-[18px] text-crimson" aria-hidden="true" />
        <span className="flex flex-col items-start gap-0.5 leading-none">
          <span className="gc-sector-kicker">
            {t.hud.label} <span dir="ltr">{pad((active ?? 0) + 1)}/{pad(total)}</span>
          </span>
          <span className="gc-sector-name">
            <i aria-hidden="true" />
            {names[active ?? 0]}
          </span>
        </span>
        <ChevronUp
          className={cn("h-3.5 w-3.5 text-white/50 transition-transform duration-300", open && "rotate-180")}
          aria-hidden="true"
        />
      </button>

      {/* the quick-jump menu box — real #section anchors (crawlable),
          the active sector highlighted like the navbar's scroll-spy */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.97 }}
            transition={springFluid}
            className="gc-sector-menu"
          >
            <ul>
              {SECTOR_IDS.map((id, i) => (
                <li key={id}>
                  <a
                    href={`#${id}`}
                    onClick={() => setOpen(false)}
                    aria-current={active === i ? "true" : undefined}
                    className="gc-sector-item press"
                  >
                    <span className="gc-sector-n" dir="ltr">
                      {pad(i + 1)}
                    </span>
                    <span>{names[i]}</span>
                    <span className="dot" aria-hidden="true" />
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
