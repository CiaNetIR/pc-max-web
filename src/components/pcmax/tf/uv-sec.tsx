"use client";

/*
 * uv-sec — Task 43 "Exact Clone" (impl-agent-43-C)
 *
 * Port of tweakfa.com's before/after comparison
 * (`<section class="uv-sec">` … `</section>` — NO trailing seam: the mirror
 * butts hp-soon directly against this section) with the tweakfa UV engine
 * (the site.js block for #uv) reimplemented on React refs:
 *
 *   • UV_DWELL 5300ms auto-rotate across the game tabs, writing the `--p`
 *     progress fill on the ACTIVE pill only (paused while hovered, out of
 *     view — IO 60px margin — or on a hidden tab; permanently stopped after
 *     any user click, which also adds `.uv-auto-off` to hide the bars).
 *   • 560ms cubic-out tween of the two numbers (FPS delta + uplift %).
 *     Latin digits in BOTH locales — parseFloat works, and the Poppins
 *     digit graft renders them inside Persian text exactly like the mirror.
 *   • Thermometer `--lvl` mapped from the uplift % (mirror: .84 − t·.07 for
 *     a °C drop; PC MAX: .84 − pct·.012, floored at .2).
 *   • Fan glyphs spin at 540°/s (stock) vs 140°/s (optimized) on one rAF.
 *   • `.is-swap` 420ms flash + mobile scroller centering on every swap.
 *   • prefers-reduced-motion: no fans, no auto-rotate, instant tweens,
 *     `.uv-auto-off` applied up front — full mirror parity.
 *
 * Data = t.bench.games (real titles; the per-game pairs are illustrative —
 * the two .uv-note lines under the frame carry the honest disclosure).
 * The tweened text nodes and `--lvl` are rendered as CONSTANTS (game 0,
 * like the mirror ships GPU 0's numbers in its static HTML) so React never
 * rewrites them on locale re-renders — the engine owns those nodes.
 */

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { useLanguage } from "@/components/pcmax/language-context";
import type { Dictionary } from "@/components/pcmax/i18n/dictionary";

type GamePair = Dictionary["bench"]["games"][number];

/* Mirror constants (site.js UV block). */
const UV_DWELL = 5300;
const TWEEN_MS = 560;
const FAN_A_DPS = 540; /* stock fan — fast */
const FAN_B_DPS = 140; /* optimized fan — slow */
const SWAP_MS = 420;

function upliftPct(g: GamePair): number {
  return Math.round((g.after / g.before - 1) * 100);
}

/* Thermometer fill: mirror does .84 − tempDrop·.07; PC MAX maps the FPS
 * uplift % onto the same visual scale (≈.38 at a 38% uplift). */
function thermLvl(pct: number): number {
  return Math.max(0.2, 0.84 - pct * 0.012);
}

function lvlStyle(lvl: number): CSSProperties {
  return { "--lvl": String(lvl) } as CSSProperties;
}

/* The mirror's tween(): 560ms cubic-out number roll, reading the element's
 * current textContent as the "from" value (latin digits → parseFloat-safe).
 * Reduced motion or a no-op delta resolves instantly. */
function tween(
  el: HTMLElement | null,
  to: number,
  reduced: boolean,
  raf: { current: number }
): void {
  if (!el) return;
  cancelAnimationFrame(raf.current);
  const from = parseFloat(el.textContent ?? "") || 0;
  if (reduced || from === to) {
    el.textContent = String(to);
    return;
  }
  const t0 = performance.now();
  const step = (now: number) => {
    const p = Math.min(1, (now - t0) / TWEEN_MS);
    const e = 1 - Math.pow(1 - p, 3); /* cubic-out */
    el.textContent = String(Math.round(from + (to - from) * e));
    if (p < 1) raf.current = requestAnimationFrame(step);
    else el.textContent = String(to);
  };
  raf.current = requestAnimationFrame(step);
}

export function UvSec() {
  const { t } = useLanguage();
  const games = t.bench.games;

  /* Active tab — React state ONLY for the buttons' aria-selected; every
   * number/meter/progress write below is imperative over refs (the mirror's
   * DOM-owning engine, so tweens never fight the reconciler). */
  const [uvG, setUvG] = useState(0);

  const uvRef = useRef<HTMLDivElement | null>(null); /* #uv */
  const gpusRef = useRef<HTMLDivElement | null>(null); /* #uvGpus */
  const frameRef = useRef<HTMLDivElement | null>(null); /* #uvFrame */
  const wRef = useRef<HTMLSpanElement | null>(null); /* #uvW */
  const tRef = useRef<HTMLSpanElement | null>(null); /* #uvT */
  const thermRef = useRef<HTMLSpanElement | null>(null); /* #uvTherm */
  const fanARef = useRef<SVGSVGElement | null>(null); /* #uvFanA */
  const fanBRef = useRef<SVGSVGElement | null>(null); /* #uvFanB */
  const gBtns = useRef<Array<HTMLButtonElement | null>>([]); /* .uv-g */

  /* Engine state the rAF loop reads without re-subscribing. */
  const uvGRef = useRef(0);
  const gamesRef = useRef(games);
  const reducedRef = useRef(false);
  const uvUser = useRef(false);
  const uvHover = useRef(false);
  const uvIn = useRef(true);

  /* Cancellable animation handles (all torn down on unmount). */
  const wRaf = useRef(0);
  const tRaf = useRef(0);
  const swapT = useRef<number | undefined>(undefined);

  useEffect(() => {
    gamesRef.current = games;
  }, [games]);

  /* The mirror's uvRender(g): tween both numbers, set the thermometer level,
   * center the active pill if it fell outside the mobile scroller, and flash
   * .is-swap for 420ms. (aria-selected is React-rendered from `uvG`.) */
  const renderUv = useCallback((g: number) => {
    const list = gamesRef.current;
    const d = list[g] ?? list[0];
    const delta = d.after - d.before;
    const pct = upliftPct(d);
    tween(wRef.current, delta, reducedRef.current, wRaf);
    tween(tRef.current, pct, reducedRef.current, tRaf);
    thermRef.current?.style.setProperty("--lvl", String(thermLvl(pct)));

    const btn = gBtns.current[g];
    const wrap = gpusRef.current;
    if (btn && wrap) {
      const ar = btn.getBoundingClientRect();
      const gr = wrap.getBoundingClientRect();
      if (ar.left < gr.left + 1 || ar.right > gr.right - 1) {
        wrap.scrollBy({
          left: (ar.left + ar.right) / 2 - (gr.left + gr.right) / 2,
          behavior: reducedRef.current ? "auto" : "smooth",
        });
      }
    }

    const frame = frameRef.current;
    if (frame) {
      frame.classList.add("is-swap");
      window.clearTimeout(swapT.current);
      swapT.current = window.setTimeout(
        () => frame.classList.remove("is-swap"),
        SWAP_MS
      );
    }
  }, []);

  /* The engine — one rAF loop (the mirror runs fanStep + uvTick with the
   * same math). Runs uvRender on every tab change (mount included, matching
   * the mirror's boot-time uvRender() call). */
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    reducedRef.current = reduced;
    const uvEl = uvRef.current;
    if (!uvEl) return;

    let raf = 0;
    if (!reduced) {
      let angA = 0;
      let angB = 0;
      let fanLast = 0;
      let uvAcc = 0;
      let uvLastT = performance.now();
      const allowed = () =>
        !uvUser.current && !uvHover.current && uvIn.current && !document.hidden;

      const tick = (now: number) => {
        /* Fans — 540°/s vs 140°/s, delta capped at 50ms. */
        if (!fanLast) fanLast = now;
        const dt = Math.min(50, now - fanLast) / 1000;
        fanLast = now;
        angA = (angA + FAN_A_DPS * dt) % 360;
        angB = (angB + FAN_B_DPS * dt) % 360;
        if (fanARef.current)
          fanARef.current.style.transform = `rotate(${angA.toFixed(1)}deg)`;
        if (fanBRef.current)
          fanBRef.current.style.transform = `rotate(${angB.toFixed(1)}deg)`;

        /* Auto-advance — elapsed ms capped at 60/frame, --p on the active
         * pill only; at 100% the pill resets and the next game renders. */
        if (allowed()) {
          uvAcc += Math.min(now - uvLastT, 60);
          const p = Math.min(1, uvAcc / UV_DWELL);
          const btn = gBtns.current[uvGRef.current];
          if (btn) btn.style.setProperty("--p", p.toFixed(3));
          if (p >= 1) {
            uvAcc = 0;
            if (btn) btn.style.setProperty("--p", "0");
            const next = (uvGRef.current + 1) % gamesRef.current.length;
            uvGRef.current = next;
            setUvG(next);
          }
        }
        uvLastT = now;
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    } else {
      /* Reduced motion: auto-rotate is off from the first frame and the
       * progress bars stay hidden (mirror parity). */
      uvEl.classList.add("uv-auto-off");
    }

    /* In-view gate — the mirror's 60px rootMargin IO on #uv. */
    let io: IntersectionObserver | null = null;
    if ("IntersectionObserver" in window) {
      io = new IntersectionObserver(
        (entries) => {
          for (const e of entries) uvIn.current = e.isIntersecting;
        },
        { rootMargin: "60px 0px" }
      );
      io.observe(uvEl);
    }

    return () => {
      if (raf) cancelAnimationFrame(raf);
      io?.disconnect();
      window.clearTimeout(swapT.current);
      cancelAnimationFrame(wRaf.current);
      cancelAnimationFrame(tRaf.current);
    };
  }, []);

  useEffect(() => {
    uvGRef.current = uvG;
    renderUv(uvG);
  }, [uvG, renderUv]);

  /* Tab click — the mirror's handler: the first interaction permanently
   * disables auto-rotate (.uv-auto-off hides the progress bars), every
   * pill's --p resets, and the game renders. A re-click on the ACTIVE tab
   * still replays the swap flash. */
  const onTab = (i: number) => {
    uvUser.current = true;
    uvRef.current?.classList.add("uv-auto-off");
    gBtns.current.forEach((b) => b?.style.setProperty("--p", "0"));
    if (i === uvG) {
      renderUv(i);
      return;
    }
    uvGRef.current = i;
    setUvG(i);
  };

  /* First-paint values (game 0) — rendered as constants; see the header
   * note. FA keeps latin digits exactly like the mirror. */
  const first = games[0];

  return (
    <section className="uv-sec" id="benchmarks">
      <div
        className="uv-side warm"
        style={{ left: "calc(50% + 468px)", top: "22%", width: "170px", height: "170px" }}
        aria-hidden="true"
      >
        <i className="uv-amb" />
        <svg
          className="uv-glyph warm"
          style={{ transform: "rotate(12deg)" }}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.1}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M13 2 4 14h7l-1 8 9-12h-7z" />
        </svg>
      </div>
      <div
        className="uv-side cool"
        style={{ right: "calc(50% + 462px)", bottom: "12%", width: "190px", height: "190px" }}
        aria-hidden="true"
      >
        <i className="uv-amb" />
        <svg
          className="uv-glyph cool"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.1}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M10.827 16.379a6.082 6.082 0 0 1-8.618-7.002l5.412 1.45a6.082 6.082 0 0 1 7.002-8.618l-1.45 5.412a6.082 6.082 0 0 1 8.618 7.002l-5.412-1.45a6.082 6.082 0 0 1-7.002 8.618l1.45-5.412Z" />
          <path d="M12 12v.01" />
        </svg>
      </div>
      <div className="wrap">
        <h2 className="rvh rv dn">{t.tw.uv.title}</h2>
        <div
          className="uv rv"
          id="uv"
          style={{ transitionDelay: ".1s" }}
          ref={uvRef}
          onPointerEnter={() => {
            uvHover.current = true;
          }}
          onPointerLeave={() => {
            uvHover.current = false;
          }}
        >
          <div
            className="uv-gpus"
            role="tablist"
            aria-label={t.bench.eyebrow}
            id="uvGpus"
            ref={gpusRef}
          >
            {games.map((g, i) => (
              <button
                key={g.name}
                type="button"
                className="uv-g"
                role="tab"
                data-g={i}
                aria-selected={i === uvG}
                onClick={() => onTab(i)}
                ref={(el) => {
                  gBtns.current[i] = el;
                }}
              >
                {g.name}
                <i />
              </button>
            ))}
          </div>
          <div className="uv-frame" id="uvFrame" ref={frameRef}>
            <div className="uv-row head">
              <span className="uv-lbl" />
              <span className="uv-before">{t.bench.beforeLabel}</span>
              <span className="uv-arrow" />
              <span className="uv-after">{t.bench.afterLabel}</span>
            </div>
            <div className="uv-row">
              <span className="uv-lbl">{t.tw.uv.fps}</span>
              <span className="uv-before">
                <svg
                  className="uv-ic"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.6}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M13 2 4 14h7l-1 8 9-12h-7z" />
                </svg>
                <span className="uv-tx">{t.tw.uv.stock}</span>
              </span>
              <span className="uv-arrow" aria-hidden="true">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M19 12H5" />
                  <path d="m11 6-6 6 6 6" />
                </svg>
              </span>
              <span className="uv-after">
                <svg
                  className="uv-ic"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.6}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M13 2 4 14h7l-1 8 9-12h-7z" />
                </svg>
                <span className="uv-val">
                  <span className="uv-n" id="uvW" ref={wRef}>
                    {first.after - first.before}
                  </span>
                  <span className="uv-u">{t.tw.uv.higher}</span>
                </span>
              </span>
            </div>
            <div className="uv-row">
              <span className="uv-lbl">{t.tw.uv.gain}</span>
              <span className="uv-before">
                <span className="uv-therm" style={lvlStyle(0.84)}>
                  <u />
                  <i />
                  <b />
                </span>
                <span className="uv-tx">{t.tw.uv.stock}</span>
              </span>
              <span className="uv-arrow" aria-hidden="true">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M19 12H5" />
                  <path d="m11 6-6 6 6 6" />
                </svg>
              </span>
              <span className="uv-after">
                <span className="uv-therm" id="uvTherm" ref={thermRef} style={lvlStyle(thermLvl(upliftPct(first)))}>
                  <u />
                  <i />
                  <b />
                </span>
                <span className="uv-val">
                  <span className="uv-n" id="uvT" ref={tRef}>
                    {upliftPct(first)}
                  </span>
                  <span className="uv-u">{t.bench.avgLabel}</span>
                </span>
              </span>
            </div>
            <div className="uv-row">
              <span className="uv-lbl">{t.tw.uv.frameGen}</span>
              <span className="uv-before">
                <svg
                  className="uv-ic uv-fan"
                  id="uvFanA"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.6}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                  ref={fanARef}
                >
                  <path d="M10.827 16.379a6.082 6.082 0 0 1-8.618-7.002l5.412 1.45a6.082 6.082 0 0 1 7.002-8.618l-1.45 5.412a6.082 6.082 0 0 1 8.618 7.002l-5.412-1.45a6.082 6.082 0 0 1-7.002 8.618l1.45-5.412Z" />
                  <path d="M12 12v.01" />
                </svg>
                <span className="uv-tx">{t.tw.uv.default}</span>
              </span>
              <span className="uv-arrow" aria-hidden="true">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M19 12H5" />
                  <path d="m11 6-6 6 6 6" />
                </svg>
              </span>
              <span className="uv-after">
                <svg
                  className="uv-ic uv-fan"
                  id="uvFanB"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.6}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                  ref={fanBRef}
                >
                  <path d="M10.827 16.379a6.082 6.082 0 0 1-8.618-7.002l5.412 1.45a6.082 6.082 0 0 1 7.002-8.618l-1.45 5.412a6.082 6.082 0 0 1 8.618 7.002l-5.412-1.45a6.082 6.082 0 0 1-7.002 8.618l1.45-5.412Z" />
                  <path d="M12 12v.01" />
                </svg>
                <span className="uv-tx">{t.tw.uv.ifCompatible}</span>
              </span>
            </div>
          </div>
          <p className="uv-note">
            <b>{t.bench.avg}</b> {t.bench.avgLabel} · {t.bench.note}
          </p>
          <p className="uv-note">{t.bench.gamesNote}</p>
        </div>
      </div>
    </section>
  );
}
