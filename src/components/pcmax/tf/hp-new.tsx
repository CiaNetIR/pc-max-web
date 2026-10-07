"use client";

import { useLanguage } from "@/components/pcmax/language-context";
import { asset } from "@/lib/gh-pages";

/*
 * hp-new — Task 43 "Exact Clone" (agent 43-D).
 *
 * Structural clone of tweakfa.com's guides band — `<section class="hp-new">`
 * plus its trailing `.seam` sibling (mirror index.html lines 458–479) — with
 * PC MAX's guides/answers content: the video tile points at the on-page app
 * showcase (#show) and the posts card routes to the FAQ (#faq). The mirror's
 * section carries no id; `id="guides"` is added for the Task 43 anchor
 * contract (footer column 2 + page composition).
 *
 * All visuals come from the ported tf-home.css (.hp-new, .hp-head, .hp-more,
 * .hp-ngrid, .hp-video with .hp-play/.hp-vcap/.hp-ytchip, .hp-posts,
 * .btn/.btn-g, .seam, .kicker) — no Tailwind utilities, no new CSS. The
 * reveal is the shared system: `className="rv"` + the mirror's .06s/.1s
 * stagger, observed by the single <RevealGate/> in tf/reveal.tsx.
 *
 * "use client" exists ONLY because the content flows through useLanguage()
 * (the site-wide locale context — same contract as every other section).
 * The component itself ships zero state/effects/handlers: the hp-video tile
 * is a plain anchor, the play glyph is pure CSS, the image is a real
 * lazy-loaded <img> with intrinsic 640×360 exactly like the mirror
 * (@next/next/no-img-element is disabled project-wide).
 */

export function HpNew() {
  const { t } = useLanguage();

  return (
    <>
      <section className="hp-new" id="guides">
        <div className="wrap">
          <div className="hp-head rv dn">
            <div>
              <span className="kicker">{t.tw.news.kicker}</span>
              <h2>{t.tw.news.title}</h2>
            </div>
            {/* hp-more — the mirror's chevron svg verbatim (2.4 stroke). */}
            <a className="hp-more" href="#faq">
              {t.tw.news.more}{" "}
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.4}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M15 6 9 12l6 6" />
              </svg>
            </a>
          </div>

          <div className="hp-ngrid">
            {/* Video tile — 16/9 anchor card over the ported news still.
                The h3 inside the .hp-vcap span (and the span parents) are
                the mirror's own nesting — kept byte-faithful — and the h3
                gives the link its accessible name. */}
            <a
              className="hp-video rv"
              href="#show"
              style={{ transitionDelay: ".06s" }}
            >
              <img
                src={asset("/tf/news-explore.webp")}
                alt={t.tw.news.videoTitle}
                width={640}
                height={360}
                loading="lazy"
              />
              <span className="hp-play" aria-hidden="true" />
              <span className="hp-vcap">
                <h3>{t.tw.news.videoTitle}</h3>
                <span className="hp-ytchip">{t.tw.news.videoChip}</span>
              </span>
            </a>

            {/* Posts card — the mirror's heading + paragraph + ghost
                button stack. */}
            <div className="hp-posts rv" style={{ transitionDelay: ".1s" }}>
              <h3>{t.tw.news.postsTitle}</h3>
              <p>{t.tw.news.postsDesc}</p>
              <a className="btn btn-g" href="#faq">
                {t.tw.news.postsBtn}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Trailing seam — a sibling AFTER the closing section tag, exactly
          like the mirror (index.html line 479). */}
      <div className="seam" aria-hidden="true" />
    </>
  );
}
