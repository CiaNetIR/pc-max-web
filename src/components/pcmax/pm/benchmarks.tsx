"use client";

import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
} from "react";
import { ArrowRight, Info } from "lucide-react";
import { useLanguage } from "@/components/pcmax/language-context";
import { Motif } from "./motif";

/*
 * Task 44 — Benchmarks: "Numbers, not promises."
 *
 * One selector strip drives one big readout. Selecting a game swaps the
 * before/after pair in place: the two headline numbers count to their
 * new values (rAF, 700ms, ease-out cubic) while the meter bars re-scale
 * through premium.css's own scaleX transition — nothing reflows, only
 * transforms and text content change.
 *
 * Honesty contract (the whole point of the section):
 *   • the per-game pairs (t.bench.games) are ILLUSTRATIVE — the
 *     gamesNote disclaimer is rendered in the side card directly under
 *     the measured headline, and the per-game uplift chips are plain
 *     arithmetic on that labeled example data;
 *   • t.bench.avg (+34%) is the MEASURED figure and is presented as the
 *     headline, visually separated from the examples, with the
 *     methodology note (t.bench.note) right beside it.
 *
 * Progressive enhancement: SSR, no-JS and reduced-motion all paint every
 * number and every bar at its final value. The count-up and the bar fill
 * run once when the readout first enters the viewport (then only on
 * user-driven selection changes) — never on the first paint, so there is
 * no hydration mismatch and no layout shift.
 *
 * Accessibility: the selector is a toggle-button group (aria-pressed +
 * native focus); the animated numbers and bars are visual, so a polite
 * live region restates the selected game's before/after/uplift whenever
 * the selection changes.
 */

const COUNT_MS = 700;

/* prefers-reduced-motion as an external store — read live (an OS toggle
 * mid-session is honored immediately), false on the server where the
 * in-view flag below is false anyway. */
function subscribeReducedMotion(onChange: () => void): () => void {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}
function getReducedSnapshot(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
function getServerReducedSnapshot(): boolean {
  return false;
}

/* Count-up engine — one number, three states:
 *   not animatable  → the render shows the target directly (SSR / no-JS /
 *                     reduced motion / not yet in view — always the
 *                     final value, exactly what the server painted);
 *   first enable    → count 0 → target when the readout first enters the
 *                     viewport;
 *   target change   → tween from wherever the counter currently stands
 *                     (a user-driven game selection), so rapid switching
 *                     never snaps or restarts from zero.
 * State is only ever written from rAF callbacks — never synchronously
 * in the effect body. */
function useCountUp(target: number, animate: boolean): number {
  const [display, setDisplay] = useState(target);
  const displayRef = useRef(target);
  const rafRef = useRef(0);
  const enabledRef = useRef(false);

  useEffect(() => {
    const firstEnable = animate && !enabledRef.current;
    enabledRef.current = animate;

    if (!animate) {
      /* The render path below already shows the target; just keep the
       * ref honest so a later enable tweens from the right place. */
      displayRef.current = target;
      return;
    }

    const from = firstEnable ? 0 : displayRef.current;
    if (from === target) return;

    cancelAnimationFrame(rafRef.current);
    const start = performance.now();
    const step = (now: number) => {
      const p = Math.min((now - start) / COUNT_MS, 1);
      const eased = 1 - (1 - p) ** 3; /* ease-out cubic */
      const value = Math.round(from + (target - from) * eased);
      displayRef.current = value;
      setDisplay(value);
      if (p < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, animate]);

  return animate ? display : target;
}

export function Benchmarks() {
  const { t } = useLanguage();
  const games = t.bench.games;

  const [sel, setSel] = useState(0);
  const [inView, setInView] = useState(false);
  const readRef = useRef<HTMLDivElement | null>(null);

  const reduced = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedSnapshot,
    getServerReducedSnapshot
  );
  const animate = inView && !reduced;

  /* First in-view reveal of the readout: gates the count-ups and the
   * one-shot bar fill. Without IntersectionObserver nothing ever
   * animates — every value simply stays at its final render. */
  useEffect(() => {
    const el = readRef.current;
    if (!el || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -7% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  /* Bar fill prime — imperative and engine-owned (the established rv2/tf
   * pattern), because it must land between paints, not between renders:
   * SSR paints the final scaleX (no-JS / reduced motion never see an
   * empty bar); on the first in-view reveal both fills are reset to zero
   * with the transition suppressed, then released a frame later so
   * premium.css's own scaleX transition owns the fill. React's inline
   * --v is untouched (the zero/restore pair is bracketed inside two
   * frames — a re-render in between just skips the one-shot fill).
   * Later --v changes (a game selection) ride the same transition. */
  useEffect(() => {
    if (!animate) return;
    const el = readRef.current;
    if (!el) return;
    const bars = Array.from(el.querySelectorAll<HTMLElement>(".pm-bar-f"));
    const final = bars.map((bar) => bar.style.getPropertyValue("--v"));
    bars.forEach((bar) => {
      bar.style.setProperty("--v", "0");
      bar.style.setProperty("transition", "none");
    });
    /* commit the zero state to computed style before releasing it */
    void el.offsetWidth;
    let inner = 0;
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => {
        bars.forEach((bar, i) => bar.style.setProperty("--v", final[i] ?? "0"));
        bars.forEach((bar) => bar.style.removeProperty("transition"));
      });
    });
    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
      bars.forEach((bar) => bar.style.removeProperty("transition"));
    };
  }, [animate]);

  const game = games[sel];
  const gain = Math.round(((game.after - game.before) / game.before) * 100);
  /* One shared ceiling — max(after) rounded up to a clean step — keeps the
   * two bars of a game, and every game's bars, comparable at a glance. */
  const MAX = Math.ceil(Math.max(...games.map((g) => g.after)) / 20) * 20;

  const beforeDisp = useCountUp(game.before, animate);
  const afterDisp = useCountUp(game.after, animate);

  const barVars = (value: number): CSSProperties =>
    ({ "--v": value / MAX } as CSSProperties);

  return (
    <section id="benchmarks" className="pm-sect" aria-labelledby="pm-bench-title">
      <div className="pm-sect-in">
        {/* ── header ── */}
        <div className="rv2">
          <div className="pm-kicker">
            <Motif />
            {t.bench.eyebrow}
          </div>
          <h2 id="pm-bench-title" className="pm-h2">
            {t.bench.title}
          </h2>
          <p className="pm-lead">{t.bench.desc}</p>
        </div>

        {/* ── game selector ── */}
        <div className="rv2" style={{ "--rd": "80ms" } as CSSProperties}>
          <p className="pm-tlabel mt-7">{t.pm.bench.pick}</p>
          <div className="pm-gsel mt-3!" role="group" aria-label={t.pm.bench.pick}>
            {games.map((g, i) => (
              <button
                key={g.name}
                type="button"
                className="pm-gsel-btn"
                aria-pressed={i === sel}
                onClick={() => setSel(i)}
              >
                {g.name}
              </button>
            ))}
          </div>
        </div>

        {/* ── readout + the measured headline ── */}
        <div className="pm-bench-grid">
          <div
            ref={readRef}
            className="pm-card pm-read rv2"
            style={{ "--rd": "140ms" } as CSSProperties}
          >
            <h3 className="pm-read-title">{game.name}</h3>

            <div className="pm-read-cols">
              <div>
                {/* min-w holds the readout column steady while the
                    count-up sweeps through shorter values */}
                <div className="pm-read-num min-w-[3ch]" aria-hidden="true">
                  {beforeDisp}
                </div>
                <div className="pm-read-lab">{t.bench.beforeLabel}</div>
              </div>
              <div className="pm-read-arrow" aria-hidden="true">
                {/* premium.css flips the glyph in RTL */}
                <ArrowRight className="h-6 w-6" strokeWidth={2} />
              </div>
              <div>
                <div className="pm-read-num min-w-[3ch]" data-st="after" aria-hidden="true">
                  {afterDisp}
                </div>
                <div className="pm-read-lab flex items-center gap-2">
                  <span>{t.bench.afterLabel}</span>
                  {/* arithmetic on the labeled example pair — covered by
                      the gamesNote disclaimer in the side card */}
                  <span className="pm-newbadge" dir="ltr">
                    +{gain}%
                  </span>
                </div>
              </div>
            </div>

            {/* the numbers and bars above are visual — this region carries
                the same data to assistive tech, announced on change */}
            <p className="sr-only" aria-live="polite" aria-atomic="true">
              {`${game.name}: ${t.bench.beforeLabel} ${game.before} ${t.bench.unit}, ${t.bench.afterLabel} ${game.after} ${t.bench.unit}, +${gain}%`}
            </p>

            <div className="pm-bars">
              <div className="pm-bar-row">
                <div className="pm-bar-lab">
                  <span>{t.bench.beforeLabel}</span>
                  <span dir="ltr">
                    <b>{game.before}</b> {t.bench.unit}
                  </span>
                </div>
                <div className="pm-bar">
                  <div className="pm-bar-f" style={barVars(game.before)} />
                </div>
              </div>
              <div className="pm-bar-row">
                <div className="pm-bar-lab" data-st="after">
                  <span>{t.bench.afterLabel}</span>
                  <span dir="ltr">
                    <b>{game.after}</b> {t.bench.unit}
                  </span>
                </div>
                <div className="pm-bar">
                  <div className="pm-bar-f" data-st="after" style={barVars(game.after)} />
                </div>
              </div>
            </div>
          </div>

          <div className="pm-card pm-avg rv2" style={{ "--rd": "220ms" } as CSSProperties}>
            <div className="pm-avg-num" dir="ltr">
              {t.bench.avg}
            </div>
            <div className="pm-avg-lab">{t.bench.avgLabel}</div>
            <div className="pm-avg-up">
              <p className="pm-avg-note">
                <Info className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
                <span>{t.bench.gamesNote}</span>
              </p>
              <p className="pm-avg-note">
                <Info className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
                <span>{t.bench.note}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
