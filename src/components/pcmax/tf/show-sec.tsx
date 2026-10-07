/*
 * show-sec — Task 43 "Exact Clone" (impl-agent-43-C)
 *
 * Structural port of tweakfa.com's homepage showcase section
 * (upload/tweakfa-site-extracted/.../tweakfa.com/index.html —
 * `<section class="show-sec">` … `</section>` plus its trailing `.seam`,
 * which the mirror places between this section and uv-sec).
 *
 * Every class is byte-faithful to the mirror and styled by
 * src/app/tf-home.css (.show-sec, .show-glow, .wrap.show-in, .sglyph,
 * .kicker, .ticks, .btn.btn-g, .ign > .inner, .seam) — no Tailwind
 * utilities, no new CSS.
 *
 * SERVER component (no interactivity): the only motion is the scroll-reveal
 * stagger (`.rv` + the mirror's inline transitionDelays — the shared
 * <RevealGate/> in tf/reveal.tsx owns rv-on/.in) and the ambient
 * .show-glow, which is pure CSS.
 *
 * Locale arrives as a prop (the JsonLd/layout convention — server
 * components can't call the client useLanguage() hook):
 *
 *     const locale: Locale = lang?.[0] === "fa" ? "fa" : "en";
 *     <ShowSec locale={locale} />
 */

import { asset } from "@/lib/gh-pages";
import { dictionary, type Locale } from "@/components/pcmax/i18n/dictionary";
import { LitOnce } from "@/components/pcmax/tf/lit-once";

/* The mirror's reveal stagger across the four ticks (.2 → .47s). */
const TICK_DELAYS = [".2s", ".29s", ".38s", ".47s"] as const;

export function ShowSec({ locale }: { locale: Locale }) {
  const t = dictionary[locale];

  return (
    <>
      <section className="show-sec" id="show">
        {/* the mirror's secIO one-shot: #ign gains .lit on entry (conic
            border sweep) — LitOnce is the client twin of that observer */}
        <LitOnce targetId="ign" />
        <div className="show-glow" aria-hidden="true" />
        <div className="wrap show-in">
          <div>
            <svg
              className="sglyph rv"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x={2} y={4} width={20} height={14} rx={2} />
              <path d="M8 21h8M12 18v3" />
            </svg>
            <div style={{ margin: "12px 0 0" }} className="rv">
              <span className="kicker">{t.showcase.eyebrow}</span>
            </div>
            <h2 className="rv" style={{ transitionDelay: ".08s" }}>
              {t.showcase.title}
            </h2>
            <ul className="ticks">
              {t.tw.show.ticks.map((tick, i) => (
                <li key={tick} className="rv" style={{ transitionDelay: TICK_DELAYS[i] }}>
                  <svg
                    width={18}
                    height={18}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.4}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="m5 13 4 4L19 7" />
                  </svg>
                  {tick}
                </li>
              ))}
            </ul>
            <a className="btn btn-g rv" style={{ transitionDelay: ".56s" }} href="#guides">
              {t.tw.show.btn}
            </a>
          </div>
          <div>
            <div className="ign rv" id="ign">
              <div className="inner">
                {/* Plain <img> — mirror parity (tf-home.css owns the sizing
                    and the radial mask). Attributes carry the TRUE file
                    dimensions (1220×760) so the pre-load aspect-ratio
                    reservation matches the final box exactly (zero CLS). */}
                <img
                  src={asset("/tf/show-console.webp")}
                  alt={t.tw.show.alt}
                  loading="lazy"
                  decoding="async"
                  width={1220}
                  height={760}
                />
              </div>
            </div>
            {/* PC MAX addition (the mirror has none): the console artwork is
                illustrative, so the hero's honest stage caption rides under
                the frame — same .uv-note treatment as the benchmark
                disclosure line. */}
            <p className="uv-note" style={{ textAlign: "center", marginTop: "14px" }}>
              {t.hero.stage.caption}
            </p>
          </div>
        </div>
      </section>
      <div className="seam" aria-hidden="true" />
    </>
  );
}
