"use client";

import type { CSSProperties } from "react";
import { useLanguage } from "@/components/pcmax/language-context";
import { DownloadIcon } from "@/components/pcmax/icons";
import { Motif } from "./motif";

/*
 * Task 44 — Install: "From download to optimized, in seven steps."
 *
 * A compact editorial strip, not a wizard: the verified seven-step
 * pipeline as numbered tiles (t.install.steps — the single source of
 * truth the old install journey also renders), zero-padded technical
 * counters, one rv2 sweep with a small per-tile stagger.
 *
 * Seven tiles would leave a lopsided 1×3 tail row in the 4-column grid,
 * so the eighth tile closes the sequence the natural way — a download
 * CTA tile. Same geometry as a step (one .pm-step, same padding), but
 * carrying the crimson "data-on" treatment (tint + hairline, premium.css
 * §6 pattern) so it reads as the destination of the sequence, not an
 * eighth step. Its strings are real download-card facts (t.cta.button /
 * t.cta.meta); no step content is invented.
 */
export function InstallStrip() {
  const { t } = useLanguage();
  const steps = t.install.steps;

  return (
    <section id="install" className="pm-sect" aria-labelledby="pm-install-title">
      <div className="pm-sect-in">
        {/* ── header ── */}
        <div className="rv2">
          <div className="pm-kicker">
            <Motif />
            {t.install.eyebrow}
          </div>
          <h2 id="pm-install-title" className="pm-h2">
            {t.install.title}
          </h2>
          <p className="pm-lead">{t.install.desc}</p>
        </div>

        {/* ── the seven steps + the tile they lead to ── */}
        <ol className="pm-steps">
          {steps.map((step, i) => (
            <li
              key={step.title}
              className="pm-step rv2"
              style={{ "--rd": `${i * 60}ms` } as CSSProperties}
            >
              <div className="pm-step-n">{String(i + 1).padStart(2, "0")}</div>
              <h3 className="pm-step-t">{step.title}</h3>
              <p className="pm-step-d">{step.desc}</p>
            </li>
          ))}

          {/* the closing tile — the download CTA (crimson data-on
              treatment, identical geometry) */}
          <li
            className="pm-step rv2 flex flex-col"
            style={
              {
                "--rd": `${steps.length * 60}ms`,
                background:
                  "linear-gradient(180deg, rgba(229, 9, 20, 0.09), rgba(229, 9, 20, 0.045))",
                boxShadow: "inset 0 0 0 1px rgba(229, 9, 20, 0.34)",
              } as CSSProperties
            }
          >
            <div className="pm-step-n">
              <Motif size={12} />
            </div>
            <div className="mt-4 flex flex-1 items-center">
              <a href="#download" className="pm-btn pm-btn-sm w-full">
                <DownloadIcon className="h-4 w-4" aria-hidden="true" />
                {t.cta.button}
              </a>
            </div>
            <p className="pm-step-d">{t.cta.meta}</p>
          </li>
        </ol>
      </div>
    </section>
  );
}
