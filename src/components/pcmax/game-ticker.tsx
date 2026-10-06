"use client";

import { useLanguage } from "@/components/pcmax/language-context";

/* ─────────────────────────────────────────────────────────────────────
 * GameTicker — the infinite marquee strip of the library's REAL title
 * list (t.library.games — the same names the Dashboard media panel and
 * the library badges show; nothing invented). Sits between the hero and
 * the showcase as a "recognized titles" ticker: hairline borders,
 * edge-fade masks, crimson separator dots, font-mono uppercase HUD vibe.
 *
 * Behavior contract:
 *   • seamless loop — each item carries its own trailing margin, so the
 *     track is exactly 2× one copy and translateX(-50%) lands on the
 *     twin pixel (flex gap would drift by half a gap per loop);
 *   • RTL — html[dir=rtl] reverses the animation direction (items flow
 *     right→left, matching the reading direction);
 *   • hover pauses the strip (reading time, WCAG 2.2.2 spirit);
 *   • prefers-reduced-motion — no animation at all: the strip wraps into
 *     a static centered row (all titles readable, no mask);
 *   • aria-hidden — the moving text is hostile to screen readers and
 *     the same titles are fully exposed in the Dashboard/library DOM.
 * ───────────────────────────────────────────────────────────────────── */

export function GameTicker() {
  const { t } = useLanguage();
  /* two copies — the loop's source and its pixel-twin */
  const items = [...t.library.games, ...t.library.games];

  return (
    <div aria-hidden="true" className="gc-ticker">
      <div className="gc-ticker-track">
        {items.map((game, i) => (
          <span key={`${game.name}-${i}`} className="gc-ticker-item">
            <span className="gc-ticker-dot" />
            <span className="gc-ticker-name">{game.name}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
