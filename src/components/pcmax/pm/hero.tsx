"use client";

import { Fragment, type CSSProperties } from "react";
import Image from "next/image";
import { Check } from "lucide-react";
import { useLanguage } from "@/components/pcmax/language-context";
import { DownloadIcon } from "@/components/pcmax/icons";
import { useLatestAppRelease } from "@/hooks/use-app-release";
import { asset } from "@/lib/gh-pages";
import { Motif } from "./motif";
import { cn } from "@/lib/utils";

/*
 * Task 44 — the Product-Centric Hero.
 *
 * Direction chosen after weighing three: (A) centered copy + window
 * below — reads landing-page, product competes with nothing; (B) split
 * composition — copy column + a LAYERED product visual built from real
 * DOM panels; (C) full-bleed product stage with overlaid copy —
 * cinematic but legibility/RTL-hostile. B wins: it states the value in
 * the first two seconds, SHOWS the product, and keeps the CTA
 * unmissable — the three jobs the old carousel hero failed.
 *
 * The visual is not a screenshot: three depth planes — System Overview
 * (back), Game Profile (the app surface, middle), Optimization Complete
 * (front) — compose the product story detect → profile → optimize →
 * safe. Every row restates a documented product behavior (Rust-engine
 * GPU detection, server-synced catalogue, snapshot-first); the stage is
 * aria-hidden and captioned "Interface preview — illustrative", the
 * established honest-preview pattern (hero.stage).
 *
 * Motion (all transform/opacity, all fx-on-gated — reduced-motion and
 * no-JS get the plain static hero): calm background (static gradients)
 * → stage enters with depth (200ms) → headline words rise in a 80ms
 * stagger sweep → sub → CTAs → trust → platform line. Idle: the two
 * outer planes float ±4-5px on desynced 10.3s/12.1s loops, the status
 * dot breathes, the GPU row carries a slow detection scan. Total
 * entrance ≤ 0.9s; nothing loops until the sweep is done.
 */

/* One headline line split into word-reveal masks (globals.css .w/.wi
 * contract, fx-on gated): words rise out of overflow masks with a
 * per-word --wd delay. `base` continues the stagger across lines so the
 * headline reads as one sweep. The split spans are aria-hidden while
 * the accessible string rides the h1's aria-label. */
function WordLine({
  text,
  base = 0,
  accent,
}: {
  text: string;
  base?: number;
  accent?: boolean;
}) {
  const words = text.split(" ").filter(Boolean);
  return (
    <span className="block" aria-hidden="true">
      {words.map((word, i) => (
        <Fragment key={`${word}-${i}`}>
          {i > 0 && " "}
          <span className="w">
            <span
              className={cn("wi", accent && "pm-accent")}
              style={{ "--wd": `${base + i * 80}ms` } as CSSProperties}
            >
              {word}
            </span>
          </span>
        </Fragment>
      ))}
    </span>
  );
}

export function Hero() {
  const { t } = useLanguage();
  const { release } = useLatestAppRelease();

  /* Kicker — live release version (real data, SSR baseline + live
   * upgrade); without a version the "· v{version}" tail is stripped. */
  const version = release?.version;
  const kicker = version
    ? t.hero.kicker.replace("{version}", version)
    : t.hero.kicker.split("·")[0].trim();

  /* Headline — three confident lines; the closing sentence carries the
   * single crimson accent (EN & FA both split on ". "). */
  const rest = t.hero.title2.split(". ");
  const l2 = rest[0] ?? t.hero.title2;
  const l3 = rest.length > 1 ? rest[1] : null;

  /* Word-reveal stagger bases — one sweep across the three lines. */
  const b1 = 140;
  const b2 = b1 + t.hero.title1.split(" ").filter(Boolean).length * 80;
  const b3 = b2 + l2.split(" ").filter(Boolean).length * 80;

  const p = t.pm.hero;

  return (
    <section id="top" className="pm-hero" aria-labelledby="pm-hero-title">
      <div className="pm-hero-bg" aria-hidden="true" />
      <div className="pm-sect-in">
        <div className="pm-hero-grid">
          {/* ── copy column (flattens into the grid ≤680px so the stage
              can slot between CTAs and trust — see premium.css) ── */}
          <div className="pm-copy">
            <div className="pm-rise pm-c-kick" style={{ "--rd": "60ms" } as CSSProperties}>
              <span className="pm-kicker">
                <Motif />
                {kicker}
              </span>
            </div>

            <h1
              id="pm-hero-title"
              className="pm-h1 pm-c-h1"
              aria-label={`${t.hero.title1} ${t.hero.title2}`}
            >
              <WordLine text={t.hero.title1} base={b1} />
              <WordLine text={l2} base={b2} />
              {l3 && <WordLine text={l3} base={b3} accent />}
            </h1>

            <p
              className="pm-sub pm-rise pm-c-sub"
              style={{ "--rd": "480ms" } as CSSProperties}
            >
              {t.hero.sub}
            </p>

            <div
              className="pm-cta-row pm-rise pm-c-cta"
              style={{ "--rd": "600ms" } as CSSProperties}
            >
              <a href="#download" className="pm-btn">
                <DownloadIcon className="h-[18px] w-[18px]" aria-hidden="true" />
                {t.hero.primary}
              </a>
              <a href="#show" className="pm-btn pm-btn-g">
                {t.hero.secondary}
              </a>
            </div>

            {/* Trust chips — documented claims (snapshot / rollback / no
                injection / no telemetry), each check-marked. */}
            <ul
              className="pm-trust pm-rise pm-c-trust"
              style={{ "--rd": "700ms" } as CSSProperties}
              aria-label={t.hero.stage.caption}
            >
              {t.hero.bullets.map((b) => (
                <li key={b} className="pm-trust-chip">
                  <Check className="h-3.5 w-3.5" strokeWidth={2.6} aria-hidden="true" />
                  {b}
                </li>
              ))}
            </ul>

            <p
              className="pm-platform pm-rise pm-c-plat"
              style={{ "--rd": "800ms" } as CSSProperties}
            >
              {t.hero.trustLine.split("·").map((part, i, arr) => (
                <Fragment key={i}>
                  <span>{part.trim()}</span>
                  {i < arr.length - 1 && <span className="pm-sep" aria-hidden="true" />}
                </Fragment>
              ))}
            </p>
          </div>

          {/* ── product stage — layered interface mock ───────────── */}
          <div
            className="pm-rise-dim pm-hero-stage"
            style={{ "--rd": "200ms" } as CSSProperties}
          >
            <div className="pm-stage" aria-hidden="true">
              {/* floating inspector — System Overview (top-END) */}
              <div className="pm-sys">
                <div className="pm-float-a">
                  <div className="pm-panel">
                    <div className="pm-ph">
                      <span className="pm-dot" />
                      <span className="pm-ph-title">{p.sysTitle}</span>
                      <span className="pm-ph-chip">{p.sysSynced}</span>
                    </div>
                    <div className="pm-row pm-scanrow">
                      <span className="pm-row-k">{p.sysGpu}</span>
                      <span className="pm-row-v">{p.sysGpuValue}</span>
                    </div>
                    <div className="pm-row pm-sys-extra">
                      <span className="pm-row-k">{p.sysCatalogue}</span>
                      <span className="pm-row-v">{p.sysCatalogueValue}</span>
                    </div>
                    <div className="pm-row pm-sys-extra">
                      <span className="pm-row-k">{p.sysSnapshot}</span>
                      <span className="pm-row-v">{p.sysSnapshotValue}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* the app surface — Game Profile */}
              <div className="pm-profwrap">
                <div className="pm-float-b">
                  <div className="pm-panel">
                    <div className="pm-ph">
                      <div className="pm-ph-main">
                        <Image
                          src={asset("/brand/pcmax-logo-96.webp")}
                          alt=""
                          width={20}
                          height={20}
                          className="rounded-[5px]"
                        />
                        <span className="pm-ph-title">{p.profTitle}</span>
                        <span className="pm-ph-chip">{p.profChip}</span>
                      </div>
                    </div>
                    <div className="pm-opts">
                      {t.pm.show.profileNames.map((name, i) => (
                        <div
                          key={name}
                          className="pm-opt-item"
                          data-on={i === 0 ? "1" : undefined}
                        >
                          <span className="pm-opt-radio" />
                          <span className="truncate">{name}</span>
                          {i === t.pm.show.profileNames.length - 1 && (
                            <span className="pm-newbadge">{t.pm.show.badgeNew}</span>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="pm-apply">
                      <span className="pm-apply-brand">
                        <Motif size={11} />
                        PC&nbsp;MAX
                      </span>
                      <span className="pm-apply-btn">{p.profApply}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* floating toast — Optimization Complete (bottom-START) */}
              <div className="pm-opt">
                <div className="pm-float-a">
                  <div className="pm-panel">
                    <div className="pm-done">
                      <div className="pm-done-ring">
                        <Check className="h-[18px] w-[18px]" strokeWidth={2.6} />
                      </div>
                      <div className="min-w-0">
                        <div className="pm-done-title">{p.optTitle}</div>
                        <div className="pm-done-meta">{p.optRollback}</div>
                        <div className="pm-done-chips">
                          <span className="pm-done-chip">{p.optTelemetry}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* the honest framing — visible text, never aria-hidden */}
            <p className="pm-stagecap">
              <span className="pm-dot" aria-hidden="true" />
              {p.preview} — {p.illustrative}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
