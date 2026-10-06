"use client";

import Image from "next/image";
import { useState } from "react";
import { ChevronUp } from "lucide-react";
import { useLanguage } from "@/components/pcmax/language-context";
import { WindowsIcon } from "@/components/pcmax/icons";
import { asset } from "@/lib/gh-pages";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type LegalDialog = "privacy" | "terms";

export function Footer() {
  const { t } = useLanguage();
  const year = new Date().getFullYear();
  const [dialog, setDialog] = useState<LegalDialog | null>(null);

  /* Section 46 — trimmed to the nav set: Features · How it works ·
   * Benchmarks · FAQ (deep-link anchors for the rest live in the page).
   * Real <a href="#…"> anchors (audit 29-a D7 fix) — crawlable in-page
   * links; CSS scroll-behavior + scroll-mt-24 handle smoothness and the
   * sticky-header offset, including the reduced-motion override. */
  const productLinks = [
    { id: "features", label: t.nav.features },
    { id: "install", label: t.nav.install },
    { id: "benchmarks", label: t.nav.benchmarks },
    { id: "faq", label: t.nav.faq },
  ];

  /* One landmark for the whole link grid, labelled from the existing
   * dictionary group titles (no new UI strings invented for it). */
  const columnsLabel = [
    t.footer.product,
    t.footer.community,
    t.footer.support,
    t.footer.legal,
  ].join(" · ");

  return (
    /* TweakFa footer (Task 42 §3): open 96px of air above (no top
     * hairline — the .fbar owns the footer's single rule), everything
     * inside the shared site container. */
    <footer className="relative mt-auto bg-transparent pt-24 pb-5">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Back to top — .toTop centers itself (margin-inline auto) and
         * carries the gentle toTopHint nudge on its svg (globals). The
         * #top anchor + html scroll-behavior do the smooth scrolling with
         * the reduced-motion override — zero JS, real crawlable link. */}
        <a href="#top" className="toTop" aria-label={t.common.backToTop}>
          <ChevronUp size={26} strokeWidth={2.2} aria-hidden="true" />
        </a>

        {/* 4-column link grid — .fcols (globals) styles the titles
         * (13px/700 @70%) and the link rows (14px / lh 2.2 → #ededef on
         * hover); collapses to 2 columns ≤900px. */}
        <nav aria-label={columnsLabel}>
          <div className="fcols">
            {/* Product */}
            <div>
              <h3>{t.footer.product}</h3>
              <ul>
                {productLinks.map((link) => (
                  <li key={link.id}>
                    <a href={`#${link.id}`}>{link.label}</a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Community — same hrefs/target/rel as v2.8 */}
            <div>
              <h3>{t.footer.community}</h3>
              <ul>
                {t.footer.communityLinks.map((link) => (
                  <li key={link.href}>
                    <a href={link.href} target="_blank" rel="noopener noreferrer">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support — mailto addresses stay LTR inside the FA document */}
            <div>
              <h3>{t.footer.support}</h3>
              <ul>
                {t.footer.supportLinks.map((link) => (
                  <li key={link.href}>
                    <a href={link.href}>
                      <span dir="ltr">{link.label}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal — disclosure buttons (dialogs below), kept from v2.8;
             * button restyled to sit exactly on the .fcols a contract
             * (globals only styles anchors, so the look is mirrored here). */}
            <div>
              <h3>{t.footer.legal}</h3>
              <ul>
                <li>
                  <button
                    type="button"
                    onClick={() => setDialog("privacy")}
                    className="block w-full cursor-pointer text-start text-sm leading-[2.2] text-muted-foreground transition-colors duration-[180ms] hover:text-foreground"
                  >
                    {t.footer.privacy}
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setDialog("terms")}
                    className="block w-full cursor-pointer text-start text-sm leading-[2.2] text-muted-foreground transition-colors duration-[180ms] hover:text-foreground"
                  >
                    {t.footer.terms}
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </nav>

        {/* .fbar — hairline-top grid `1fr auto 1fr`
         * (© + disclaimer | breathing brand emblem | platform facts),
         * stacked + centered ≤900px (globals). */}
        <div className="fbar">
          {/* TweakFa .fmeta stack: © line over the fine-print disclaimer. */}
          <div className="fmeta text-[12.5px] leading-relaxed text-[#7a7a85]">
            <p>{t.footer.rights.replace("{year}", String(year))}</p>
            <p className="max-w-[46ch]">{t.footer.disclaimer}</p>
          </div>

          {/* The emblem moment — real anchor to #top (CSS scroll-behavior
           * + its reduced-motion override); the visible wordmark is the
           * accessible name, the circular WebP mark (Task 34) is
           * decorative and breathes via .emblem (globals, 3.4s). */}
          <a href="#top" className="flex flex-col items-center gap-1.5">
            <Image
              src={asset("/brand/pcmax-logo-96.webp")}
              alt=""
              width={36}
              height={36}
              aria-hidden="true"
              className="emblem h-9 w-9 object-contain"
            />
            <span
              dir="ltr"
              className="font-display text-[17px] font-bold text-foreground"
            >
              PC&nbsp;<span className="text-crimson">MAX</span>
            </span>
            <span className="text-[12.5px] leading-snug text-[#7a7a85]">
              {t.footer.tagline}
            </span>
          </a>

          {/* Trust-badge slot — the site ships no third-party badges
           * (no VirusTotal-style data exists to keep), so the verifiable
           * platform facts from the dictionary stand in. Plain block +
           * text-end (logical) so the ≤900px centering from globals
           * (unlayered, beats utilities) wins on stacked phones. */}
          <div className="text-end text-[12.5px] leading-relaxed text-[#7a7a85]">
            <p>
              <WindowsIcon
                className="me-1.5 inline align-[-2px] text-sm text-crimson/70"
                aria-hidden="true"
              />
              {t.footer.madeFor}
            </p>
            <p className="mt-1">
              {t.footer.platformItems.map((item, index) => (
                <span key={item}>
                  {index > 0 && (
                    <span
                      aria-hidden="true"
                      className="mx-1.5 text-crimson/50"
                    >
                      ·
                    </span>
                  )}
                  <span>{item}</span>
                </span>
              ))}
            </p>
          </div>
        </div>
      </div>

      {/* Legal dialogs (controlled — no trigger needed) — v2.8 mechanics
       * kept verbatim; only the footer around them was restyled. */}
      <Dialog
        open={dialog !== null}
        onOpenChange={(open) => setDialog(open ? dialog : null)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {dialog === "terms" ? t.footer.terms : t.footer.privacy}
            </DialogTitle>
            <DialogDescription className="text-sm leading-relaxed text-muted-foreground">
              {dialog === "terms" ? t.footer.termsBody : t.footer.privacyBody}
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </footer>
  );
}
