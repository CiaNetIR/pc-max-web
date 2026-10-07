"use client";

import { useState } from "react";
import { useLanguage } from "@/components/pcmax/language-context";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type LegalDialog = "privacy" | "terms";

/*
 * Footer — Task 43 "Exact Clone" (agent 43-D): REWRITTEN onto tweakfa.com's
 * footer DOM (mirror index.html lines 501–512).
 *
 *   <footer>
 *     <a class="toTop" …chevron-up svg…>            — real #top anchor
 *     <div class="wrap">
 *       <div class="fcols">  4 × (h3 + block links) </div>
 *       <div class="fbar">   copy | company-meta | global-wordmark
 *     </div>
 *   </footer>
 *
 * All geometry/material/motion comes from the ported tf-home.css (footer,
 * .toTop with its toTopHint nudge, .fcols 4-col → 2-col collapse, .fbar
 * 1fr auto 1fr hairline row, .copy, .fmeta) — no Tailwind utilities on the
 * mirror's hooks. "use client" stays for the two real interactions: the
 * locale dictionary (useLanguage) and the legal disclosure dialogs.
 *
 * Content — every link is real: columns 1–2 are in-page anchors on this
 * document (#show/#download/#tools/#benchmarks/#guides/#faq), column 3
 * keeps v2.8's actual community + support hrefs (Discord, Telegram, both
 * support mailboxes — mailto labels stay LTR inside the FA document), and
 * column 4 keeps v2.8's privacy/terms Dialog mechanism exactly (buttons on
 * the .fcols a contract — tf-home.css styles anchors only).
 *
 * Deliberately dropped from the Task 42 footer (mirror-exact fbar is 3
 * cells): the breathing emblem anchor + tagline, the madeFor/platformItems
 * badge cell and its WindowsIcon. The platform facts already live on-page
 * (hero trust strip / system-safety), and the independence disclaimer takes
 * the company-meta slot.
 */

export function Footer() {
  const { t } = useLanguage();
  const year = new Date().getFullYear();
  const [dialog, setDialog] = useState<LegalDialog | null>(null);

  return (
    <footer>
      {/* toTop — real crawlable #top anchor; html scroll-behavior (with the
          reduced-motion override) does the smooth scrolling. data-totop is
          the mirror's JS hook, kept byte-faithful (inert without it); the
          svg is the mirror's verbatim 26×26 / 2.2-stroke chevron-up. */}
      <a
        className="toTop"
        href="#top"
        data-totop
        aria-label={t.common.backToTop}
      >
        <svg
          width="26"
          height="26"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="m18 15-6-6-6 6" />
        </svg>
      </a>

      <div className="wrap">
        {/* 4-column link grid — plain divs of h3 + block anchors, exactly
            the mirror's shape (no list wrapper). */}
        <div className="fcols">
          {/* Products */}
          <div>
            <h3>{t.tw.footerNav.products}</h3>
            <a href="#show">{t.tw.nav.app}</a>
            <a href="#download">{t.nav.download}</a>
          </div>

          {/* Features */}
          <div>
            <h3>{t.tw.footerNav.tools}</h3>
            <a href="#tools">{t.tw.footerNav.frame}</a>
            <a href="#benchmarks">{t.tw.footerNav.benchmarks}</a>
            <a href="#guides">{t.tw.footerNav.guides}</a>
            <a href="#faq">{t.nav.faq}</a>
          </div>

          {/* PC MAX — real channels (v2.8 hrefs/target/rel preserved;
              mailto labels stay LTR inside the FA document). */}
          <div>
            <h3>{t.tw.footerNav.brand}</h3>
            {t.footer.communityLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                {link.label}
              </a>
            ))}
            {t.footer.supportLinks.map((link) => (
              <a key={link.href} href={link.href}>
                <span dir="ltr">{link.label}</span>
              </a>
            ))}
          </div>

          {/* Legal — disclosure buttons (dialogs below) on the .fcols a
              contract; utilities only, since tf-home.css styles anchors. */}
          <div>
            <h3>{t.footer.legal}</h3>
            <button
              type="button"
              onClick={() => setDialog("privacy")}
              className="block w-full cursor-pointer text-start text-sm leading-[2.2] text-muted-foreground transition-colors duration-[180ms] hover:text-foreground"
            >
              {t.footer.privacy}
            </button>
            <button
              type="button"
              onClick={() => setDialog("terms")}
              className="block w-full cursor-pointer text-start text-sm leading-[2.2] text-muted-foreground transition-colors duration-[180ms] hover:text-foreground"
            >
              {t.footer.terms}
            </button>
          </div>
        </div>

        {/* .fbar — the mirror's 3-cell hairline row. */}
        <div className="fbar">
          <div className="fmeta">
            <span className="copy">
              {t.footer.rights.replace("{year}", String(year))}
            </span>
          </div>
          {/* company-meta — the independence disclaimer, PC MAX's honest
              equivalent of the mirror's "Operated by …" line. */}
          <div className="company-meta">{t.footer.disclaimer}</div>
          {/* global-wordmark — the mirror's exact inline style (Poppins 800
              display word; aria-label mirrors the visible text). */}
          <div
            className="global-wordmark"
            aria-label="PC MAX"
            style={{
              font: "800 clamp(30px,6vw,72px)/1.2 'Poppins',sans-serif",
              letterSpacing: ".08em",
              color: "inherit",
            }}
          >
            PC MAX
          </div>
        </div>
      </div>

      {/* Legal dialogs — v2.8 mechanics kept verbatim (controlled — no
          trigger needed); only the footer around them was restructured. */}
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
