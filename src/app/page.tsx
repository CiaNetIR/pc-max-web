import { Navbar } from "@/components/pcmax/navbar";
import { Hero } from "@/components/pcmax/hero/hero";
import { WhatIsPcMax } from "@/components/pcmax/sections/what-is";
import { MultiFrame } from "@/components/pcmax/sections/multi-frame";
import { InstallFlow } from "@/components/pcmax/sections/install-flow";
import { AppShowcase } from "@/components/pcmax/sections/app-showcase";
import { Profiles } from "@/components/pcmax/sections/profiles";
import { SystemSafety } from "@/components/pcmax/sections/system-safety";
import { Benchmarks } from "@/components/pcmax/sections/benchmarks";
import { SocialProof } from "@/components/pcmax/sections/social-proof";
import { Features } from "@/components/pcmax/sections/features";
import { Faq } from "@/components/pcmax/sections/faq";
import { DownloadCta } from "@/components/pcmax/sections/download-cta";
import { MobileCtaBar } from "@/components/pcmax/sections/mobile-cta-bar";
import { Footer } from "@/components/pcmax/footer";
import { LazySection } from "@/components/pcmax/ui/lazy-section";
import { AnalyticsBeacon } from "@/components/pcmax/ui/analytics-beacon";
import { MotionProvider } from "@/components/pcmax/ui/motion";

/*
 * Apple-style single-page flow — one idea per view, all sections
 * server-rendered (SEO-safe, no placeholder gating; animation only is
 * deferred via whileInView triggers inside each section).
 *
 * Story order (Section 32): see the product → what it is → how it works
 * → the three disciplines → frame generation → profiles → safety →
 * proof (benchmarks / trust) → details (FAQ) → download.
 */
export default function Home() {
  return (
    <MotionProvider>
      <div className="relative min-h-screen overflow-x-clip">
        <AnalyticsBeacon />
        <Navbar />
        {/* id="main-content" — target of the layout's skip-to-content link (a11y / SXO) */}
        <main id="main-content">
          <Hero />
          <LazySection anchor="showcase">
            <AppShowcase />
          </LazySection>
          <LazySection anchor="what-is">
            <WhatIsPcMax />
          </LazySection>
          <LazySection anchor="install">
            <InstallFlow />
          </LazySection>
          <LazySection anchor="features">
            <Features />
          </LazySection>
          <LazySection anchor="multiframe">
            <MultiFrame />
          </LazySection>
          <LazySection anchor="profiles">
            <Profiles />
          </LazySection>
          <LazySection anchor="safety">
            <SystemSafety />
          </LazySection>
          <LazySection anchor="benchmarks">
            <Benchmarks />
          </LazySection>
          <LazySection anchor="community">
            <SocialProof />
          </LazySection>
          <LazySection anchor="faq">
            <Faq />
          </LazySection>
          <LazySection anchor="download">
            <DownloadCta />
          </LazySection>
        </main>
        {/* Phones-only fixed conversion bar — mounted at page level so it
            survives section state; hides itself near the download section. */}
        <MobileCtaBar />
        <Footer />
      </div>
    </MotionProvider>
  );
}
