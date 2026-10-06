import { notFound } from "next/navigation";
import { Navbar } from "@/components/pcmax/navbar";
import { Hero } from "@/components/pcmax/hero/hero";
import { AppShowcase } from "@/components/pcmax/sections/app-showcase";
import { WhatIsPcMax } from "@/components/pcmax/sections/what-is";
import { MultiFrame } from "@/components/pcmax/sections/multi-frame";
import { Profiles } from "@/components/pcmax/sections/profiles";
import { SystemSafety } from "@/components/pcmax/sections/system-safety";
import { Benchmarks } from "@/components/pcmax/sections/benchmarks";
import { SocialProof } from "@/components/pcmax/sections/social-proof";
import { InstallFlow } from "@/components/pcmax/sections/install-flow";
import { Faq } from "@/components/pcmax/sections/faq";
import { DownloadCta } from "@/components/pcmax/sections/download-cta";
import { MobileCtaBar } from "@/components/pcmax/sections/mobile-cta-bar";
import { Footer } from "@/components/pcmax/footer";
import { AnalyticsBeacon } from "@/components/pcmax/ui/analytics-beacon";
import { MotionProvider } from "@/components/pcmax/ui/motion";
import { GamingCursor } from "@/components/pcmax/gaming-cursor";
import { ScrollProgress } from "@/components/pcmax/scroll-progress";
import { SpotlightCards } from "@/components/pcmax/spotlight-cards";
import { GameTicker } from "@/components/pcmax/game-ticker";

/*
 * The optional catch-all root segment `[[...lang]]` (audit 29-a — the /fa
 * architecture): `/` renders the canonical EN document, `/fa` renders the
 * real Persian document (html lang=fa dir=rtl baked by the ROOT layout at
 * build time — the one construction where that is possible). Any other
 * segment (`/xyz`) is a branded 404, never a soft-duplicate of the home
 * page. Static export: generateStaticParams prerenders exactly these two.
 */
export function generateStaticParams() {
  return [{ lang: [] }, { lang: ["fa"] }];
}

/*
 * Product flow (IA reorder + merge, audit 29-b — targets ~20-30% less
 * cognitive load without losing information):
 *
 *   hero (benefit-first + trust line/badges)
 *   → product showcase            [see the app BEFORE reading about it]
 *   → what PC MAX does            [pipeline + Detect/Optimize/Protect merged
 *                                  — one concept, one section]
 *   → frame generation            [the flagship capability]
 *   → profiles
 *   → safety                      [hoisted above proof — trust before claims]
 *   → benchmarks                  [evidence AFTER safety]
 *   → community / verification    [numbers you can check yourself]
 *   → install steps
 *   → FAQ
 *   → the premium download card
 *
 * `.bgfx` mounts the fixed grid + crimson top-glow background ONCE (z-0,
 * pointer-events-none); every section sits above it (z-1 via .gc-sect's
 * stacking in globals.css — sections are position:relative).
 */
export default async function Home({
  params,
}: {
  params: Promise<{ lang?: string[] }>;
}) {
  const { lang } = await params;
  /* Unknown segments 404 (branded) — only `/` and `/fa` are real documents. */
  if (lang && lang.length > 0 && lang[0] !== "fa") notFound();

  return (
    <MotionProvider>
      <div className="relative min-h-screen overflow-x-clip">
        <AnalyticsBeacon />
        {/* Motion pass (Task 38): scroll progress bar, gaming reticle
            cursor and card spotlight — all pointer-driven, reduced-motion
            and touch safe (each component self-gates). */}
        <ScrollProgress />
        <GamingCursor />
        <SpotlightCards />
        {/* Fixed background fx — 64px grid (radial-masked) + crimson glow */}
        <div className="bgfx" aria-hidden="true" />
        <Navbar />
        {/* id="main-content" — target of the layout's skip-to-content link (a11y / SXO) */}
        <main id="main-content" className="relative z-[1]">
          <Hero />
          {/* recognized-titles ticker — the real library names on an
              infinite (reduced-motion: static) marquee strip */}
          <GameTicker />
          <AppShowcase />
          <WhatIsPcMax />
          <MultiFrame />
          <Profiles />
          <SystemSafety />
          <Benchmarks />
          <SocialProof />
          <InstallFlow />
          <Faq />
          <DownloadCta />
        </main>
        {/* Phones-only fixed conversion bar — mounted at page level so it
            survives section state; hides itself near the download section. */}
        <MobileCtaBar />
        <Footer />
      </div>
    </MotionProvider>
  );
}
