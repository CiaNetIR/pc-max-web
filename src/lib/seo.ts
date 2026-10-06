/**
 * Central site + brand-entity configuration for PC MAX.
 *
 * Single source of truth consumed by:
 *  - layout generateMetadata (locale-aware titles, canonical, hreflang, OG/Twitter)
 *  - JSON-LD structured data (Organization / WebSite / WebPage / SoftwareApplication / FAQ / HowTo)
 *  - robots.txt, sitemap.xml, manifest.webmanifest
 *  - public/llms.txt + llms-full.txt are kept in sync with these facts by hand
 *
 * Entity rule: every fact below (name, urls, social profiles, email, category)
 * must stay byte-identical everywhere it appears on the web. Consistency is
 * what lets Google's Knowledge Graph and LLMs resolve "PC MAX" as one entity.
 */
import { dictionary, type Locale } from "@/components/pcmax/i18n/dictionary";
import { PAGES_URL } from "@/lib/gh-pages";

export interface SiteConfig {
  name: string;
  shortName: string;
  description: string;
  longDescription: string;
  url: string;
  ogImage: string;
  keywords: readonly string[];
  /* Brand entity — sameAs links (social profiles) feed Knowledge Graph + AI entity resolution */
  social: {
    discord: string;
    telegram: string;
  };
  sameAs: readonly string[];
  contact: {
    support: string;
    bugs: string;
  };
  logo: string;
  logoMaskable: string;
  slogan: string;
  knowsAbout: readonly string[];
  app: {
    operatingSystem: string;
    applicationCategory: readonly string[];
    requirements: string;
    diskSpace: string;
    isFree: true;
  };
}

export const siteConfig: SiteConfig = {
  name: "PC MAX",
  shortName: "PC MAX",
  description:
    "PC MAX intelligently optimizes Windows, installs advanced frame-generation workflows, and prepares your games for maximum performance.",
  longDescription:
    "PC MAX installs and manages multi-frame generation pipelines built on OptiScaler and AI Optical Flow, bringing DLSS-class upscaling and frame multiplication to virtually any GPU. It also fine-tunes Windows for gaming with safe, reversible optimizations, while keeping full backups of every change so your system can be restored in a single click.",
  /* Self-canonical at the GitHub Pages URL in BOTH flavors (audit 29-a
   * D2): the previously claimed https://pcmax.app is a live third-party
   * squatter page — pointing canonical/OG/JSON-LD at a URL we don't control
   * is an entity-integrity + deindexing risk. When a real brand domain is
   * acquired, repoint this ONE constant and everything follows. */
  url: PAGES_URL,
  ogImage: "/og.png",
  /* Social surface — only channels that actually resolve (audit 29-b D7:
   * x.com/pcmaxapp and youtube.com/@pcmaxapp are hard-404s; advertising
   * dead profiles as community channels damages trust and pollutes the
   * Organization entity). Re-add them in sameAs + footer when they exist. */
  social: {
    discord: "https://discord.gg/pcmax",
    telegram: "https://t.me/pcmaxapp",
  },
  sameAs: [
    "https://discord.gg/pcmax",
    "https://t.me/pcmaxapp",
  ],
  contact: {
    support: "support@pcmax.io",
    bugs: "bugs@pcmax.io",
  },
  logo: "/brand/pcmax-logo-256.png",
  logoMaskable: "/brand/pcmax-logo-maskable.png",
  slogan: "Your PC. Optimized.",
  keywords: [
    "windows optimization",
    "frame generation",
    "optiscaler",
    "AI optical flow",
    "DLSS",
    "gaming performance",
    "RTX",
    "PC gaming",
    "fps boost",
    "windows 11 gaming",
  ],
  knowsAbout: [
    "Windows optimization",
    "PC gaming performance",
    "Frame generation",
    "OptiScaler",
    "NVIDIA DLSS",
    "AMD FSR",
    "Intel XeSS",
    "AI Optical Flow",
    "Streamline framework",
    "NVIDIA RTX graphics cards",
    "FPS optimization",
    "Windows 11 gaming tweaks",
  ],
  app: {
    operatingSystem: "Windows 10, Windows 11",
    applicationCategory: ["UtilitiesApplication", "GameApplication"],
    requirements: "Windows 10 or 11 (64-bit), 4 GB RAM minimum (8 GB recommended), DirectX 12 compatible GPU",
    diskSpace: "220MB",
    isFree: true,
  },
};

/* ------------------------------------------------------------------ */
/* Locale-aware metadata                                               */
/* ------------------------------------------------------------------ */

export interface LocaleMeta {
  locale: Locale;
  /** <title> + og:title (EN canonical / FA variant) */
  title: string;
  ogTitle: string;
  /** meta description — pulled from the live dictionary so it never drifts from on-page copy */
  description: string;
  /** og:locale */
  ogLocale: string;
  /** schema.org inLanguage */
  inLanguage: string;
  /** canonical path of this locale's document */
  path: string;
}

export function getLocaleMeta(locale: Locale): LocaleMeta {
  if (locale === "fa") {
    return {
      locale: "fa",
      /* CTR/keyword-aware copy (audit 29-a): covers the highest-volume
       * Persian queries — بهینه‌سازی ویندوز / بازی / افزایش FPS. */
      title: "پی‌سی‌مکس | بهینه‌سازی ویندوز برای بازی و افزایش FPS",
      ogTitle: "پی‌سی‌مکس — رایانه‌ی شما. بهینه‌سازی‌شده.",
      description:
        "پی‌سی‌مکس ویندوز را برای بازی بهینه می‌کند؛ فریم‌جنریشن (OptiScaler، DLSS، FSR) متناسب با کارت گرافیک شما نصب می‌کند و همه‌ی تغییرها با یک کلیک قابل بازگشت‌اند — رایگان، بدون تله‌متری.",
      ogLocale: "fa_IR",
      inLanguage: "fa-IR",
      path: "/fa",
    };
  }
  return {
    locale: "en",
    title: "PC MAX — Free Windows Gaming Optimizer & FPS Booster",
    ogTitle: "PC MAX — Your PC. Optimized.",
    description:
      "Free Windows gaming optimizer: per-game profiles, OptiScaler/DLSS/FSR frame generation, and fully reversible tweaks with one-click rollback.",
    ogLocale: "en_US",
    inLanguage: "en",
    path: "/",
  };
}

/**
 * Feature list for SoftwareApplication.featureList (locale-aware).
 *
 * Mirrors the on-page Features section exactly — the three group titles
 * ("Detect / Optimize / Protect") plus every item line under them — so the
 * structured data always matches the visible copy (Google's consistency
 * requirement) while staying descriptive enough to be useful on its own.
 */
export function getFeatureList(locale: Locale): string[] {
  return dictionary[locale].features.groups.flatMap((group) => [
    group.title,
    ...group.items,
  ]);
}
