import type { ReactNode } from "react";

import {
  getFeatureList,
  getLocaleMeta,
  siteConfig,
} from "@/lib/seo";
import { dictionary, type Locale } from "@/components/pcmax/i18n/dictionary";
import { db } from "@/lib/db";

/**
 * Schema.org structured data for PC MAX — one connected @graph.
 *
 * Entity strategy: Organization is the graph root (logo, sameAs social
 * profiles, contact point, knowsAbout) so search engines, answer engines and
 * LLMs can resolve "PC MAX" as a single, verifiable brand entity. WebSite,
 * WebPage, SoftwareApplication, FAQPage and HowTo all reference it by @id.
 *
 * Locale-aware: the FA document (`/?lang=fa`) ships Persian FAQ/HowTo text
 * and fa-IR language tags; the EN canonical ships English. Both mirror the
 * on-page copy verbatim (pulled from the same dictionary the UI renders).
 *
 * Pure render, no hooks or browser APIs. Async only to read the live
 * release version from the database (same source as /api/release), so
 * `softwareVersion` can never drift from the shipped product; on any DB
 * error the field is simply omitted instead of failing the page.
 */
async function getSoftwareVersion(): Promise<string | null> {
  try {
    const latest = await db.release.findFirst({
      orderBy: { releasedAt: "desc" },
      select: { version: true },
    });
    return latest?.version ?? null;
  } catch {
    return null;
  }
}

export async function JsonLd({ locale = "en" }: { locale?: Locale }): Promise<ReactNode> {
  const meta = getLocaleMeta(locale);
  const dict = dictionary[locale];
  const pageUrl = `${siteConfig.url}${meta.path === "/" ? "" : meta.path}`;
  const softwareVersion = await getSoftwareVersion();

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      /* ------------------------------------------------ Organization */
      {
        "@type": "Organization",
        "@id": `${siteConfig.url}/#organization`,
        name: siteConfig.name,
        alternateName: ["PCMAX"],
        url: siteConfig.url,
        logo: {
          "@type": "ImageObject",
          "@id": `${siteConfig.url}/#logo`,
          url: `${siteConfig.url}${siteConfig.logo}`,
          width: 256,
          height: 256,
          caption: "PC MAX logo",
        },
        image: { "@id": `${siteConfig.url}/#logo` },
        description: siteConfig.longDescription,
        slogan: siteConfig.slogan,
        email: siteConfig.contact.support,
        knowsAbout: [...siteConfig.knowsAbout],
        /* Knowledge Graph + AI entity-resolution signals — keep byte-identical
         * with the live profiles (entity consistency across the web). */
        sameAs: [...siteConfig.sameAs],
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "customer support",
          email: siteConfig.contact.support,
          availableLanguage: ["English", "Persian"],
          url: siteConfig.social.discord,
        },
      },

      /* ---------------------------------------------------- WebSite */
      {
        "@type": "WebSite",
        "@id": `${siteConfig.url}/#website`,
        name: siteConfig.name,
        url: siteConfig.url,
        description: siteConfig.description,
        publisher: { "@id": `${siteConfig.url}/#organization` },
        inLanguage: meta.inLanguage,
      },

      /* --------------------------------------------------- WebPage */
      {
        "@type": "WebPage",
        "@id": `${pageUrl}#webpage`,
        url: pageUrl,
        name: meta.title,
        description: meta.description,
        isPartOf: { "@id": `${siteConfig.url}/#website` },
        about: [
          { "@id": `${siteConfig.url}/#software` },
          { "@id": `${siteConfig.url}/#organization` },
        ],
        primaryImageOfPage: {
          "@type": "ImageObject",
          "@id": `${siteConfig.url}/#ogimage`,
          url: `${siteConfig.url}${siteConfig.ogImage}`,
          width: 1200,
          height: 630,
        },
        inLanguage: meta.inLanguage,
        /* Voice / Assistant: the headline + intro answer is the speakable unit */
        speakable: {
          "@type": "SpeakableSpecification",
          cssSelector: ["#top h1", "#what-is h2", "#what-is p"],
        },
      },

      /* ----------------------------------------- SoftwareApplication */
      {
        "@type": "SoftwareApplication",
        "@id": `${siteConfig.url}/#software`,
        name: siteConfig.name,
        applicationCategory: [...siteConfig.app.applicationCategory],
        operatingSystem: siteConfig.app.operatingSystem,
        description: meta.description,
        inLanguage: meta.inLanguage,
        publisher: { "@id": `${siteConfig.url}/#organization` },
        brand: { "@id": `${siteConfig.url}/#organization` },
        isAccessibleForFree: true,
        downloadUrl: `${siteConfig.url}/api/download`,
        installUrl: `${siteConfig.url}/api/download`,
        fileSize: siteConfig.app.diskSpace,
        softwareRequirements: siteConfig.app.requirements,
        featureList: getFeatureList(locale),
        softwareVersion: softwareVersion ?? undefined,
        screenshot: `${siteConfig.url}${siteConfig.ogImage}`,
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
          availability: "https://schema.org/InStock",
        },
      },

      /* -------------------------------------------- HowTo (install) */
      {
        "@type": "HowTo",
        "@id": `${pageUrl}#howto`,
        name: dict.install.title,
        description: dict.install.desc,
        inLanguage: meta.inLanguage,
        isPartOf: { "@id": `${pageUrl}#webpage` },
        step: dict.install.steps.map((step, index) => ({
          "@type": "HowToStep",
          position: index + 1,
          name: step.title,
          text: step.desc,
        })),
      },

      /* ------------------------------------------ FAQ (answer-ready) */
      {
        /* Rich results + answer engines: mirrors the on-page FAQ verbatim */
        "@type": "FAQPage",
        "@id": `${pageUrl}#faq`,
        inLanguage: meta.inLanguage,
        isPartOf: { "@id": `${pageUrl}#webpage` },
        mainEntity: [...dict.faq.core, ...dict.faq.full].map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.a,
          },
        })),
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export default JsonLd;
