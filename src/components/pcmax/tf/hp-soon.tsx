/*
 * hp-soon — Task 43 "Exact Clone" (impl-agent-43-C)
 *
 * Port of tweakfa.com's "coming soon" strip
 * (`<section class="hp-soon">` … `</section>` + its trailing `.seam`).
 *
 * Seam placement copied EXACTLY from the mirror: there is NO seam between
 * uv-sec and this section (uv-sec's bottom padding is the only gap — the
 * mirror's index.html has nothing between the two `</section>`s), and ONE
 * seam after it, before hp-calc. That seam is part of this file's output.
 *
 * SERVER component — the strip reveals as a whole (.rv on .hp-soon-in);
 * everything else is pure CSS from tf-home.css (.hp-soon-in's dashed
 * cyan border, .hp-soon-ic tile, .soon-chip).
 *
 * Content = the Pro edition dictionary entry (name / tagline / badge) —
 * the honest "Coming soon" tease, mirroring tweakfa's Phoenix Boost row.
 *
 * Locale arrives as a prop (JsonLd/layout convention — server components
 * can't call the client useLanguage() hook):   <HpSoon locale={locale} />
 */

import { dictionary, type Locale } from "@/components/pcmax/i18n/dictionary";

export function HpSoon({ locale }: { locale: Locale }) {
  const pro = dictionary[locale].cta.editions.pro;

  return (
    <>
      <section className="hp-soon">
        <div className="wrap">
          <div className="hp-soon-in rv">
            <span className="hp-soon-ic" aria-hidden="true">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.6}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M2 12h4l2-7 4 14 3-9 1.5 2H22" />
              </svg>
            </span>
            <div className="hp-soon-tx">
              <h3>{pro.name}</h3>
              <p>{pro.tagline}</p>
            </div>
            <span className="soon-chip">{pro.badge}</span>
          </div>
        </div>
      </section>
      <div className="seam" aria-hidden="true" />
    </>
  );
}
