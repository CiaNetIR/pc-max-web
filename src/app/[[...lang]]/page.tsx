import { notFound } from "next/navigation";
import { Navbar } from "@/components/pcmax/navbar";
import { HeroSlideshow } from "@/components/pcmax/tf/hero-slideshow";
import { ShowSec } from "@/components/pcmax/tf/show-sec";
import { UvSec } from "@/components/pcmax/tf/uv-sec";
import { HpSoon } from "@/components/pcmax/tf/hp-soon";
import { HpCalc } from "@/components/pcmax/tf/hp-calc";
import { HpNew } from "@/components/pcmax/tf/hp-new";
import { Faq } from "@/components/pcmax/sections/faq";
import { DownloadCta } from "@/components/pcmax/sections/download-cta";
import { MobileCtaBar } from "@/components/pcmax/sections/mobile-cta-bar";
import { Footer } from "@/components/pcmax/footer";
import { RevealGate } from "@/components/pcmax/tf/reveal";
import { AnalyticsBeacon } from "@/components/pcmax/ui/analytics-beacon";
import type { Locale } from "@/components/pcmax/i18n/dictionary";

/*
 * The optional catch-all root segment `[[...lang]]` (audit 29-a — the /fa
 * architecture): `/` renders the canonical EN document, `/fa` renders the
 * real Persian document (html lang=fa dir=rtl baked by the ROOT layout at
 * build time). Any other segment (`/xyz`) is a branded 404. Static export:
 * generateStaticParams prerenders exactly these two.
 */
export function generateStaticParams() {
  return [{ lang: [] }, { lang: ["fa"] }];
}

/*
 * Task 43 "Exact Clone" — the page is now a structural port of the
 * owner's uploaded tweakfa.com homepage mirror (tweakfa-site.zip):
 *
 *   header (sticky blur + dropdown groups + mpanel)
 *   → hero hs          [4-slide deck carousel: app / frame gen / profiles /
 *                        benchmarks — pill tabs + arrows + caption swap +
 *                        per-slide accent glow + 7.3s auto-dwell]
 *   → show-sec         [product showcase: ticks + framed console art]
 *   → uv-sec           [before/after: real bench numbers, 6 game tabs,
 *                        5.3s auto-dwell]
 *   → hp-soon          [PC MAX Pro coming-soon strip]
 *   → hp-calc          [the 3 frame-gen workflow cards]
 *   → hp-new           [guides: explore card + FAQ card]
 *   → faq              [kept — real answers, details pattern]
 *   → download-cta     [kept — real release data, shcard]
 *   → footer           [tweakfa fcols/fbar + global wordmark]
 *
 * Retired sections (content absorbed, nothing invented): game-ticker
 * (titles live in the uv game tabs), what-is/pipeline (hero lead + show
 * ticks + FAQ), multiframe (hp-calc), profiles (hero slide 3 + ticks),
 * safety (show ticks + FAQ), benchmarks (uv-sec), social-proof (FAQ +
 * download card), install-flow journey (hp-new card), app-showcase
 * console (show-sec art), SectorHud + ScrollProgress (no tweakfa
 * equivalent).
 */
export default async function Home({
  params,
}: {
  params: Promise<{ lang?: string[] }>;
}) {
  const { lang } = await params;
  /* Unknown segments 404 (branded) — only `/` and `/fa` are real documents. */
  if (lang && lang.length > 0 && lang[0] !== "fa") notFound();

  const locale: Locale = lang && lang[0] === "fa" ? "fa" : "en";

  return (
    <div className="relative min-h-screen overflow-x-clip">
      <AnalyticsBeacon />
      {/* tweakfa scroll-reveal engine — rv-on/.in (reduced-motion: inert) */}
      <RevealGate />
      <Navbar />
      {/* id="main-content" — target of the layout's skip-to-content link */}
      <main id="main-content">
        <HeroSlideshow />
        <ShowSec locale={locale} />
        <UvSec />
        <HpSoon locale={locale} />
        <HpCalc />
        <HpNew />
        <Faq />
        <DownloadCta />
      </main>
      {/* Phones-only fixed conversion bar — mounted at page level so it
          survives section state; hides itself near the download section. */}
      <MobileCtaBar />
      <Footer />
    </div>
  );
}
