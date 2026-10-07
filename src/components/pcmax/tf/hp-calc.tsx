"use client";

import type { CSSProperties } from "react";
import { useLanguage } from "@/components/pcmax/language-context";

/*
 * hp-calc — Task 43 "Exact Clone" (agent 43-D).
 *
 * Structural clone of tweakfa.com's calculators band — `<section
 * class="hp-calc" id="tools">` plus its trailing `.seam` sibling (mirror
 * index.html lines 407–455) — carrying PC MAX's three frame-generation
 * workflows in the card slots instead of the three calculators.
 *
 * Every visual comes from the ported tf-home.css (.hp-calc, .hp-head,
 * .hp-cgrid, .hp-ccard with its per-card `--a` rgb accent var, .hp-wm
 * watermark, .hp-ico badge, .hp-t, .hp-foot, .hp-nums/.hp-num, .btn/.btn-p,
 * .seam, .kicker) — no Tailwind utilities, no new CSS. Scroll reveal is the
 * shared system: `className="rv"` (+ the mirror's .06/.14/.22s stagger) is
 * observed by the single <RevealGate/> in tf/reveal.tsx.
 *
 * "use client" exists ONLY because the content flows through useLanguage()
 * (the site-wide locale context — the same contract as every other section;
 * a true server component cannot read it). The component itself ships zero
 * state/effects/handlers. The mirror's b[data-to] count-up is deliberately
 * NOT ported: only one stat is numeric ("3"), and the mirror's own engine
 * renders non-numeric b values as static text — so everything here is
 * static, exactly like the mirror degrades.
 */

/* The mirror's bottleneck-calculator icon (chip body + pins) — card 1,
 * OptiScaler. Rendered twice per card exactly like the mirror: a 1.4
 * stroke `.hp-wm` watermark and the 1.8 stroke `.hp-ico` badge. */
function OptiIcon({ className, sw }: { className?: string; sw: number }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={sw}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="6" y="6" width="12" height="12" rx="1.5" />
      <path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3" />
    </svg>
  );
}

/* The mirror's RAM icon (module + pin row) — card 2, AI Optical Flow. */
function FlowIcon({ className, sw }: { className?: string; sw: number }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={sw}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="2.5" y="6.5" width="19" height="9" rx="1.5" />
      <rect x="6.2" y="9.1" width="3.6" height="3.6" rx="0.6" />
      <rect x="14.2" y="9.1" width="3.6" height="3.6" rx="0.6" />
      <path d="M5.2 15.5v2.6M8 15.5v2.6M10.8 15.5v2.6M13.6 15.5v2.6M16.4 15.5v2.6M19.2 15.5v2.6" />
    </svg>
  );
}

/* The mirror's PSU icon (fan enclosure + hub + 4 blades) — card 3,
 * Streamline. */
function StreamIcon({ className, sw }: { className?: string; sw: number }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={sw}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3.5" y="3.5" width="17" height="17" rx="2" />
      <circle cx="12" cy="12" r="6.6" />
      <circle cx="12" cy="12" r="1.5" />
      <path d="M13 10.2C14 8.6 13.9 6.9 12.6 5.5" transform="rotate(0 12 12)" />
      <path d="M13 10.2C14 8.6 13.9 6.9 12.6 5.5" transform="rotate(90 12 12)" />
      <path d="M13 10.2C14 8.6 13.9 6.9 12.6 5.5" transform="rotate(180 12 12)" />
      <path d="M13 10.2C14 8.6 13.9 6.9 12.6 5.5" transform="rotate(270 12 12)" />
    </svg>
  );
}

/* Per-card accent — the rgb triple behind rgba(var(--a),…) tints — plus
 * the mirror's .06s/.14s/.22s reveal stagger, as one inline style
 * (custom property needs the CSSProperties cast). */
function cardVars(accent: string, delay: string): CSSProperties {
  return { "--a": accent, transitionDelay: delay } as CSSProperties;
}

export function HpCalc() {
  const { t } = useLanguage();

  /* The three frame-generation workflows. The dictionary types cards as a
   * union (only Streamline carries the hardware `warning`), so the guard
   * below narrows with `in` — the same pattern multi-frame.tsx uses. */
  const [opti, flow, streamline] = t.multiframe.cards;

  return (
    <>
      <section className="hp-calc" id="tools">
        <div className="wrap">
          <div className="hp-head rv dn">
            <div>
              <span className="kicker">{t.tw.calc.kicker}</span>
              <h2>{t.tw.calc.title}</h2>
            </div>
          </div>

          <div className="hp-cgrid">
            {/* Card 1 — OptiScaler (success accent, .06s stagger). */}
            <article className="hp-ccard rv" style={cardVars("31,191,156", ".06s")}>
              <OptiIcon className="hp-wm" sw={1.4} />
              <h3>
                <span className="hp-ico">
                  <OptiIcon sw={1.8} />
                </span>
                <span className="hp-t">{opti.name}</span>
              </h3>
              <p>{opti.tagline}</p>
              <div className="hp-foot">
                <a className="btn btn-p" href="#download">
                  {t.tw.calc.cta}
                </a>
                <div className="hp-nums">
                  <div className="hp-num">
                    <b>3</b>
                    <span>{t.tw.calc.stats.families}</span>
                  </div>
                  <div className="hp-num">
                    <b>DLSS·FSR·XeSS</b>
                    <span>{t.tw.calc.stats.supported}</span>
                  </div>
                </div>
              </div>
            </article>

            {/* Card 2 — AI Optical Flow (cyan accent, .14s stagger). */}
            <article className="hp-ccard rv" style={cardVars("111,208,255", ".14s")}>
              <FlowIcon className="hp-wm" sw={1.4} />
              <h3>
                <span className="hp-ico">
                  <FlowIcon sw={1.7} />
                </span>
                <span className="hp-t">{flow.name}</span>
              </h3>
              <p>{flow.tagline}</p>
              <div className="hp-foot">
                <a className="btn btn-p" href="#download">
                  {t.tw.calc.cta}
                </a>
                <div className="hp-nums">
                  <div className="hp-num">
                    <b>RTX 20–50</b>
                    <span>{t.tw.calc.stats.rtxGenerations}</span>
                  </div>
                </div>
              </div>
            </article>

            {/* Card 3 — Streamline (gold accent, .22s stagger). The
                hardware guard rides along as a plain .hp-num stat in the
                warning token — honest, and the mirror's own slot shape. */}
            <article className="hp-ccard rv" style={cardVars("254,219,41", ".22s")}>
              <StreamIcon className="hp-wm" sw={1.4} />
              <h3>
                <span className="hp-ico">
                  <StreamIcon sw={1.7} />
                </span>
                <span className="hp-t">{streamline.name}</span>
              </h3>
              <p>{streamline.tagline}</p>
              <div className="hp-foot">
                <a className="btn btn-p" href="#download">
                  {t.tw.calc.cta}
                </a>
                <div className="hp-nums">
                  <div className="hp-num">
                    <b>RTX 40 / 50</b>
                    <span>{t.tw.calc.stats.requires}</span>
                  </div>
                  {"warning" in streamline && (
                    <div className="hp-num">
                      <b style={{ color: "var(--gc-warning)" }}>
                        {streamline.warning}
                      </b>
                    </div>
                  )}
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* Trailing seam — a sibling AFTER the closing section tag, exactly
          like the mirror (index.html line 455). */}
      <div className="seam" aria-hidden="true" />
    </>
  );
}
