"use client";

import Image from "next/image";
import { useState } from "react";
import { Bug, Mail, MessageCircle, Send } from "lucide-react";
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

/** Icons for the community column, ordered like dictionary footer.communityLinks
 * (Discord, Telegram — dead X/YouTube profiles removed, audit 29-b D7). */
const communityIcons = [MessageCircle, Send] as const;

/** Icons for the support column, ordered like dictionary footer.supportLinks. */
const supportIcons = [Mail, Bug] as const;

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

  return (
    /* Footer (reference .ftr): transparent over the flat page canvas,
     * single hairline top edge, quiet 13.5px muted text. */
    <footer className="relative mt-auto border-t border-border bg-transparent text-[13.5px] text-muted-foreground">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
          {/* Brand — real anchor to #top (CSS scroll-behavior + its own
              reduced-motion override), mirroring the navbar brand link;
              the visible wordmark is the accessible name, logo decorative. */}
          <div>
            <a href="#top" className="group flex items-center gap-2.5">
              {/* Circular transparent WebP emblem (Task 34) — no tile, no glow;
                  the hover-scale now lives on the image itself. */}
              <Image
                src={asset("/brand/pcmax-logo-96.webp")}
                alt=""
                width={36}
                height={36}
                className="h-9 w-9 shrink-0 object-contain transition-transform duration-300 group-hover:scale-105"
              />
              <span
                dir="ltr"
                className="font-display text-[17px] font-bold tracking-wide text-foreground"
              >
                PC&nbsp;<span className="text-crimson">MAX</span>
              </span>
            </a>
            <p className="mt-4 max-w-sm leading-relaxed">{t.footer.tagline}</p>
            <p className="mt-4 flex items-center gap-2 text-xs font-medium">
              <WindowsIcon className="text-sm text-crimson/70" />
              {t.footer.madeFor}
            </p>
            <p className="type-eyebrow mt-5 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[10px] uppercase">
              {t.footer.platformItems.map((item, index) => (
                <span key={item} className="flex items-center gap-2">
                  {index > 0 && (
                    <span aria-hidden="true" className="text-crimson/50">
                      ·
                    </span>
                  )}
                  <span>{item}</span>
                </span>
              ))}
            </p>
          </div>

          {/* Product */}
          <nav aria-label={t.footer.product}>
            <h3 className="type-eyebrow mb-4 text-[11px] font-bold uppercase text-muted-foreground">
              {t.footer.product}
            </h3>
            <ul className="space-y-2.5">
              {productLinks.map((link) => (
                <li key={link.id}>
                  <a
                    href={`#${link.id}`}
                    className="press py-1.5 text-foreground/70 transition-colors hover:text-crimson"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Community */}
          <div>
            <h3 className="type-eyebrow mb-4 text-[11px] font-bold uppercase text-muted-foreground">
              {t.footer.community}
            </h3>
            <ul className="space-y-2.5">
              {t.footer.communityLinks.map((link, index) => {
                const Icon = communityIcons[index] ?? MessageCircle;
                return (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group press inline-flex items-center gap-2.5 py-1.5 text-foreground/70 transition-colors hover:text-crimson"
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border/70 bg-card/60 text-crimson/80 transition-colors group-hover:border-crimson/40">
                        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                      </span>
                      {link.label}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Support + Legal */}
          <div>
            <h3 className="type-eyebrow mb-4 text-[11px] font-bold uppercase text-muted-foreground">
              {t.footer.support}
            </h3>
            <ul className="space-y-2.5">
              {t.footer.supportLinks.map((link, index) => {
                const Icon = supportIcons[index] ?? Mail;
                return (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      className="group press inline-flex items-center gap-2.5 py-1.5 text-foreground/70 transition-colors hover:text-crimson"
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border/70 bg-card/60 text-crimson/80 transition-colors group-hover:border-crimson/40">
                        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                      </span>
                      <span dir="ltr">{link.label}</span>
                    </a>
                  </li>
                );
              })}
            </ul>

            <div className="mt-7 border-t border-border/60 pt-5">
              <h4 className="type-eyebrow mb-3 text-[11px] font-bold uppercase text-muted-foreground">
                {t.footer.legal}
              </h4>
              <ul className="space-y-2.5">
                <li>
                  <button
                    type="button"
                    onClick={() => setDialog("privacy")}
                    className="press py-1.5 text-foreground/70 transition-colors hover:text-crimson"
                  >
                    {t.footer.privacy}
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setDialog("terms")}
                    className="press py-1.5 text-foreground/70 transition-colors hover:text-crimson"
                  >
                    {t.footer.terms}
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 border-t border-border/60 pt-6">
          <p className="text-xs leading-relaxed text-muted-foreground">
            {t.footer.disclaimer}
          </p>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs font-medium text-muted-foreground">
              {t.footer.rights.replace("{year}", String(year))}
            </p>
            {/* Status pill removed — there is no status page behind the claim
                (audit 29-b D12: unverifiable trust signal). */}
          </div>
        </div>
      </div>

      {/* Legal dialogs (controlled — no trigger needed) */}
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
