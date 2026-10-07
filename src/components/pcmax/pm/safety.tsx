"use client";

import type { CSSProperties } from "react";
import {
  ArchiveRestore,
  Camera,
  FileCheck,
  Lock,
  ShieldCheck,
  Undo2,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { useLanguage } from "@/components/pcmax/language-context";
import { cn } from "@/lib/utils";
import { Motif } from "./motif";

/*
 * Task 44 — Safety: "Tuned hard. Reversible, always."
 *
 * Editorial split, not a card wall. The LEFT column argues — kicker,
 * title, lead, then three hardening rows (the snapshot transaction, what
 * runs inside it, the allowlist that guards both sides) and the four
 * real CI test counts. The RIGHT panel shows the mechanism: the snapshot
 * transaction as a four-step timeline. Every string is a dictionary
 * claim (safety.backup / safety.optimizer) — nothing is invented here.
 *
 * State-free by design: only useLanguage plus the page-level rv2 reveal
 * engine. premium.css §8 owns every visual; the only Tailwind below is
 * spacing, the right panel's padding and one RTL icon flip.
 */

/* Timeline step icons — one per t.safety.backup.steps entry. The rollback
 * arrow is the one directional glyph, so it mirrors in RTL (physical
 * direction flips, the story does not). */
const STEP_ICONS: { Icon: LucideIcon; rtlFlip: boolean }[] = [
  { Icon: Camera, rtlFlip: false },
  { Icon: Zap, rtlFlip: false },
  { Icon: Undo2, rtlFlip: true },
  { Icon: ArchiveRestore, rtlFlip: false },
];

export function Safety() {
  const { t } = useLanguage();

  /* Hardening rows — the three load-bearing safety claims, in order:
   * the snapshot-before-change transaction, what the Rust engine does
   * inside it, and the package allowlist enforced on both sides. */
  const hardRows: { icon: LucideIcon; text: string }[] = [
    { icon: ShieldCheck, text: t.safety.backup.desc },
    { icon: Lock, text: t.safety.optimizer.desc },
    { icon: FileCheck, text: t.safety.optimizer.note },
  ];

  return (
    <section id="safety" className="pm-sect" aria-labelledby="pm-safety-title">
      <div className="pm-sect-in">
        <div className="pm-safe-grid">
          {/* ── LEFT — the argument ── */}
          <div>
            <div className="rv2">
              <div className="pm-kicker">
                <Motif />
                {t.safety.eyebrow}
              </div>
              <h2 id="pm-safety-title" className="pm-h2">
                {t.safety.title}
              </h2>
              <p className="pm-lead">{t.safety.desc}</p>
            </div>

            <ul className="pm-hard rv2" style={{ "--rd": "80ms" } as CSSProperties}>
              {hardRows.map(({ icon: Icon, text }) => (
                <li key={text} className="pm-hard-row">
                  <Icon className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
                  <span>{text}</span>
                </li>
              ))}
            </ul>

            {/* the four real test counts — measured CI coverage, not
                marketing numbers */}
            <div className="pm-stats rv2" style={{ "--rd": "160ms" } as CSSProperties}>
              {t.safety.optimizer.stats.map((stat) => (
                <div key={stat.label} className="pm-stat">
                  <div className="pm-stat-v">
                    {stat.value}
                    {stat.suffix}
                  </div>
                  <div className="pm-stat-l">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── RIGHT — the mechanism: the snapshot transaction ── */}
          <div
            className="pm-card rv2 p-[clamp(20px,3vw,30px)]"
            style={{ "--rd": "120ms" } as CSSProperties}
          >
            <p className="pm-tlabel">{t.safety.backup.eyebrow}</p>
            <h3 className="pm-h3 mt-2">{t.safety.backup.title}</h3>

            <ol className="pm-tl mt-5">
              {t.safety.backup.steps.map((step, i) => {
                const { Icon, rtlFlip } = STEP_ICONS[i] ?? STEP_ICONS[0];
                return (
                  <li
                    key={step.title}
                    className="pm-tl-item rv2"
                    style={{ "--rd": `${180 + i * 60}ms` } as CSSProperties}
                  >
                    <span className="pm-tl-dot" aria-hidden="true">
                      <Icon
                        className={cn("h-3.5 w-3.5", rtlFlip && "rtl:-scale-x-100")}
                        strokeWidth={2.4}
                      />
                    </span>
                    <h4 className="pm-tl-t">{step.title}</h4>
                    <p className="pm-tl-d">{step.desc}</p>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
