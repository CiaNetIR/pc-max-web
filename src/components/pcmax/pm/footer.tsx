"use client";

import { useState } from "react";
import { ArrowUp } from "lucide-react";
import Image from "next/image";
import { useLanguage } from "@/components/pcmax/language-context";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { asset } from "@/lib/gh-pages";

type LegalDialog = "privacy" | "terms";

/*
 * Task 44 — the premium PC MAX footer. Minimal and calm: a brand column
 * (mark + tagline + platform chips) beside three quiet link columns,
 * then a hairline bar with the legal disclosures, the rights line and a
 * back-to-top control. All geometry, material and motion come from
 * premium.css §11 (pm-ftr / pm-ftr-grid / pm-ftr-col / pm-ftr-plat /
 * pm-ftr-bar / pm-ftr-legal / pm-ftr-tag / pm-top) — this file only owns
 * structure, content and the legal Dialog mechanics.
 *
 * "use client" stays for the two real interactions: the locale
 * dictionary (useLanguage) and the legal disclosure dialogs — the Radix
 * pattern ported verbatim from the shipped footer (controlled Dialog +
 * privacy/terms state), restyled onto the pm classes.
 *
 * Every link is real: the Product column jumps to this document's
 * sections (#tools / #show / #benchmarks / #faq), Community keeps the
 * real external channels, Support keeps the real mailboxes (labels stay
 * LTR inside the FA document), and privacy/terms open the disclosure
 * dialogs.
 */

export function Footer() {
  const { t } = useLanguage();
  const year = new Date().getFullYear();
  const [dialog, setDialog] = useState<LegalDialog | null>(null);

  /* Legal disclosure triggers styled to sit exactly on the .pm-ftr-legal
   * anchor contract (premium.css styles `a` only): ink-dim text that
   * warms on hover, crimson focus ring. The utilities are needed because
   * a <button> never matches the `a` selectors. */
  const legalBtn =
    "cursor-pointer p-0 text-[color:var(--pm-ink-dim)] transition-colors duration-[160ms] hover:text-[color:var(--pm-ink)] focus-visible:outline-2 focus-visible:outline-[#ff8a80] focus-visible:outline-offset-2 focus-visible:rounded-[4px]";

  return (
    <footer className="pm-ftr">
      {/* container — mirrors .pm-sect-in (1168px rail) so the footer
          aligns with every section above it */}
      <div className="mx-auto w-full max-w-[1168px] px-4 sm:px-6 lg:px-8">
        <div className="pm-ftr-grid">
          {/* brand column — mark + tagline + platform fact chips (all
              documented on-page claims, no new statements) */}
          <div>
            <a className="pm-brand" href="#top" aria-label="PC MAX">
              <Image
                src={asset("/brand/pcmax-logo-96.webp")}
                width={30}
                height={30}
                alt=""
              />
              <span>
                PC&nbsp;<b>MAX</b>
              </span>
            </a>
            <p className="pm-ftr-tag">{t.footer.tagline}</p>
            <div className="pm-ftr-plat">
              {t.footer.platformItems.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          </div>

          {/* Product — in-page jumps to the sections the navbar tracks */}
          <div className="pm-ftr-col">
            <h3>{t.footer.product}</h3>
            <a href="#tools">{t.tw.footerNav.frame}</a>
            <a href="#show">{t.tw.footerNav.profiles}</a>
            <a href="#benchmarks">{t.tw.footerNav.benchmarks}</a>
            <a href="#faq">{t.nav.faq}</a>
          </div>

          {/* Community — real external channels (v2.8 hrefs preserved) */}
          <div className="pm-ftr-col">
            <h3>{t.footer.community}</h3>
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
          </div>

          {/* Support — real mailboxes; labels stay LTR inside the FA
              document */}
          <div className="pm-ftr-col">
            <h3>{t.footer.support}</h3>
            {t.footer.supportLinks.map((link) => (
              <a key={link.href} href={link.href}>
                <span dir="ltr">{link.label}</span>
              </a>
            ))}
          </div>
        </div>

        {/* bottom bar — legal group | rights · made-for | back-to-top,
            with the independence disclaimer taking a full row when the
            bar wraps on mobile */}
        <div className="pm-ftr-bar">
          <div className="pm-ftr-legal">
            <button
              type="button"
              onClick={() => setDialog("privacy")}
              className={legalBtn}
            >
              {t.footer.privacy}
            </button>
            <span aria-hidden="true" className="select-none">
              ·
            </span>
            <button
              type="button"
              onClick={() => setDialog("terms")}
              className={legalBtn}
            >
              {t.footer.terms}
            </button>
          </div>

          <span>
            {t.footer.rights.replace("{year}", String(year))}
            <span aria-hidden="true"> · </span>
            {t.footer.madeFor}
          </span>

          {/* back-to-top — real crawlable #top anchor; html
              scroll-behavior (with its reduced-motion override) does the
              smooth scrolling. ArrowUp is symmetric, so the RTL mirror
              rule on .pm-top svg is a no-op here. */}
          <a className="pm-top" href="#top" aria-label={t.common.backToTop}>
            <ArrowUp className="h-4 w-4" aria-hidden="true" />
          </a>

          <p className="basis-full">{t.footer.disclaimer}</p>
        </div>
      </div>

      {/* Legal dialogs — mechanics ported verbatim from the shipped
          footer (controlled — no trigger element needed); the content
          panel keeps the shadcn dialog defaults with a premium surface
          tint. */}
      <Dialog
        open={dialog !== null}
        onOpenChange={(open) => setDialog(open ? dialog : null)}
      >
        <DialogContent className="max-w-lg border-[#242429] bg-[#141419]">
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
