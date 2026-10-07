"use client";

import { useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { Download, Info } from "lucide-react";
import { useLanguage } from "@/components/pcmax/language-context";
import { Motif } from "./motif";

/*
 * Task 44 — the frame-generation workflow selector (section #tools).
 *
 * Replaces the old card grid with a master/detail selector: LEFT is a
 * radiogroup of the three workflows (OptiScaler / AI Optical Flow /
 * Streamline PC MAX) with roving tabindex + direction-aware arrow keys;
 * RIGHT is a keyed `.pm-fg-detail` card that swaps with the pm-panel-in
 * sweep and is announced politely (aria-live) so screen-reader users
 * hear that the selection changed the panel.
 *
 * Below the grid: a four-tile stats strip. Every value is a documented
 * fact restated from the FAQ (DLSS/FSR/XeSS = 3 scaler families; any
 * DirectX 12 GPU benefits from Windows optimization; AI Optical Flow
 * needs RTX 20+; Streamline needs RTX 40/50) — labeled with the
 * t.tw.calc.stats keys. The GPU-aware installer note
 * (t.pm.fg.gpuAware) rides under the selector.
 *
 * No auto-rotation, no scroll hijacking; the only motion is the CSS
 * panel swap (transform/opacity, null'd under prefers-reduced-motion).
 */

export function FrameGen() {
  const { t, isRTL } = useLanguage();
  const cards = t.multiframe.cards;
  const [sel, setSel] = useState(0);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);

  /* Radiogroup keyboard — Up/Down follow the physical list, Left/Right
   * are direction-aware (swapped in RTL), Home/End jump to the ends.
   * Selection follows focus (standard radio behavior). */
  const onItemKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    const n = cards.length;
    let target: number;
    if (e.key === "Home") {
      target = 0;
    } else if (e.key === "End") {
      target = n - 1;
    } else {
      let d = 0;
      if (e.key === "ArrowDown") d = 1;
      else if (e.key === "ArrowUp") d = -1;
      else if (e.key === "ArrowRight") d = isRTL ? -1 : 1;
      else if (e.key === "ArrowLeft") d = isRTL ? 1 : -1;
      else return;
      target = (sel + d + n) % n;
    }
    e.preventDefault();
    setSel(target);
    itemRefs.current[target]?.focus();
  };

  const card = cards[sel];
  const tech = t.multiframe.tech.entries[sel];

  /* Documented facts (FAQ): 3 scaler families (DLSS/FSR/XeSS) · any
   * DirectX 12 GPU benefits from Windows optimization · AI Optical
   * Flow needs RTX 20+ · Streamline requires RTX 40/50 hardware. */
  const stats: Array<{ v: string; l: string }> = [
    { v: "3", l: t.tw.calc.stats.families },
    { v: "DX12", l: t.tw.calc.stats.supported },
    { v: "RTX 20+", l: t.tw.calc.stats.rtxGenerations },
    { v: "RTX 40/50", l: t.tw.calc.stats.requires },
  ];

  return (
    <section id="tools" className="pm-sect" aria-labelledby="pm-tools-title">
      <div className="pm-sect-in">
        {/* ── section header ── */}
        <div className="rv2">
          <span className="pm-kicker">
            <Motif />
            {t.multiframe.eyebrow}
          </span>
          <h2 id="pm-tools-title" className="pm-h2 mt-4">
            {t.multiframe.title}
          </h2>
          <p className="pm-lead">{t.multiframe.desc}</p>
        </div>

        {/* ── selector + detail ── */}
        <div className="rv2 mt-10" style={{ "--rd": "80ms" } as CSSProperties}>
          <div className="pm-fg-grid">
            <div>
              <div className="pm-fg-list" role="radiogroup" aria-label={t.pm.fg.choose}>
                {cards.map((c, i) => (
                  <button
                    key={c.name}
                    type="button"
                    role="radio"
                    aria-checked={i === sel}
                    tabIndex={i === sel ? 0 : -1}
                    className="pm-fg-item"
                    data-on={i === sel ? "1" : undefined}
                    ref={(el) => {
                      itemRefs.current[i] = el;
                    }}
                    onClick={() => setSel(i)}
                    onKeyDown={onItemKey}
                  >
                    <span className="pm-fg-num" aria-hidden="true">{`0${i + 1}`}</span>
                    <span className="min-w-0 flex-1">
                      <span className="pm-fg-name block">{c.name}</span>
                      <span className="pm-fg-tag block">{c.tagline}</span>
                    </span>
                  </button>
                ))}
              </div>
              <p className="pm-avg-note m-0 mt-3">
                <Info className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
                {t.pm.fg.gpuAware}
              </p>
            </div>

            {/* stable live region wrapping the keyed card — the swap is
                announced without remounting the region itself */}
            <div aria-live="polite">
              <article className="pm-card pm-fg-detail" key={sel} data-anim="1">
                <h3 className="pm-h3">{card.name}</h3>
                <p className="pm-fg-tag">{card.tagline}</p>
                <div className="pm-badges">
                  {card.badges ? (
                    card.badges.map((b) => (
                      <span key={b} className="pm-badge">{b}</span>
                    ))
                  ) : (
                    <span className="pm-badge" data-st="warn">{card.warning}</span>
                  )}
                </div>
                <ul className="pm-ul mt-4">
                  {card.bullets.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
                <h4 className="pm-tlabel mt-6">{t.multiframe.tech.title}</h4>
                <ul className="pm-ul mt-2">
                  {tech.details.map((d) => (
                    <li key={d}>{d}</li>
                  ))}
                </ul>
                <div className="mt-6">
                  <span className="pm-tlabel">{t.multiframe.compatibility}</span>
                  <p className="m-0 mt-1 text-[12px] leading-relaxed text-[var(--pm-ink-faint)]">
                    {t.multiframe.note}
                  </p>
                  <a href="#download" className="pm-btn pm-btn-sm mt-5">
                    <Download className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
                    {t.pm.fg.installWith}
                  </a>
                </div>
              </article>
            </div>
          </div>
        </div>

        {/* ── documented-facts strip ── */}
        <dl className="pm-stats rv2" style={{ "--rd": "160ms" } as CSSProperties}>
          {stats.map((s) => (
            <div key={s.l} className="pm-stat">
              <dt className="pm-stat-v">{s.v}</dt>
              <dd className="pm-stat-l">{s.l}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
