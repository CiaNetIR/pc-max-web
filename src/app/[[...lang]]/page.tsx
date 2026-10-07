import { notFound } from "next/navigation";
import { Navbar } from "@/components/pcmax/pm/navbar";
import { Footer } from "@/components/pcmax/pm/footer";
import { Hero } from "@/components/pcmax/pm/hero";
import { Showcase } from "@/components/pcmax/pm/showcase";
import { FrameGen } from "@/components/pcmax/pm/framegen";
import { Benchmarks } from "@/components/pcmax/pm/benchmarks";
import { Safety } from "@/components/pcmax/pm/safety";
import { InstallStrip } from "@/components/pcmax/pm/install-strip";
import { RevealGate2 } from "@/components/pcmax/pm/reveal";
import { Faq } from "@/components/pcmax/sections/faq";
import { DownloadCta } from "@/components/pcmax/sections/download-cta";
import { MobileCtaBar } from "@/components/pcmax/sections/mobile-cta-bar";
import { AnalyticsBeacon } from "@/components/pcmax/ui/analytics-beacon";
import { Motif } from "@/components/pcmax/pm/motif";
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
 * Task 44 "Premium Product" — the homepage composition:
 *
 *   header            [premium navbar: brand | product/features/benchmarks/
 *                      faq | lang + download — tight on scroll, mnav ≤900px]
 *   → hero #top       [product-centric hero: 3-line value prop + trust
 *                      chips + layered interface mock (sys inspector /
 *                      game profile surface / completion toast)]
 *   → showcase #show  [the console: 5-tab product window (dashboard /
 *                      frame gen / profiles / windows / settings) with
 *                      morph-pill tab strip — DOM-built, labelled preview]
 *   → framegen #tools [the 3 frame-generation workflows as an interactive
 *                      radiogroup selector + documented-fact stat strip]
 *   → benchmarks      [game selector → before/after readout + animated
 *     #benchmarks      bars + measured +34% headline + honest notes]
 *   → safety #safety  [editorial split: the transaction story timeline +
 *                      real test counts + hardening rows]
 *   → install         [7 verified steps + CTA tile, compact strip]
 *     #install
 *   → faq             [kept — real answers, native details pattern]
 *   → download-cta    [kept — real release data, verify row, waitlist]
 *   → footer          [premium minimal: brand/links/legal dialogs/bar]
 *
 * Retired in 44 (content absorbed, nothing invented): the Task-43 tweakfa
 * clone layer (hero-slideshow / show-sec / uv-sec / hp-soon / hp-calc /
 * hp-new + tf-home.css) — benchmarks data now lives in the interactive
 * #benchmarks section, frame-gen workflows in #tools, Pro/premium in the
 * download card's edition picker, guides in the FAQ. FAQ + DownloadCta +
 * MobileCtaBar are carried over untouched (globals.css keeps serving them).
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
  void locale; // sections read the locale from the language context

  return (
    <div className="relative min-h-screen overflow-x-clip">
      <AnalyticsBeacon />
      {/* Task 44 premium reveal engine — rv2/.in (reduced-motion: inert) */}
      <RevealGate2 />
      <Navbar />
      {/* id="main-content" — target of the layout's skip-to-content link */}
      <main id="main-content">
        <Hero />
        <Showcase />
        <FrameGen />
        <Benchmarks />
        <Safety />
        <InstallStrip />
        {/* motif divider at the pm→legacy boundary (install → FAQ) */}
        <div className="pm-sect-in pm-div" aria-hidden="true">
          <Motif size={12} />
        </div>
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
