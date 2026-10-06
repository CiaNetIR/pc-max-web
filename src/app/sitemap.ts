import type { MetadataRoute } from "next";

import { db } from "@/lib/db";
import { siteConfig } from "@/lib/seo";

/* NOTE: `output: 'export'` requires metadata routes to export
 * `const dynamic = "force-static"` — a literal Next can statically parse.
 * scripts/gh-pages-build.sh appends that line to this file in the build tree
 * only, so the SSR flavor keeps its default (per-request) behavior. */

/**
 * sitemap.xml — bilingual site (audit 29-a: /fa is a REAL prerendered
 * route since the [[...lang]] segment — no more `?lang=fa` duplicate that
 * served the EN document).
 *
 *  - EN document `/` (canonical, priority 1)
 *  - FA document `/fa` (self-canonical Persian variant, priority 0.9)
 *  - Both entries carry xhtml:link hreflang alternates (+ x-default → /)
 *    so every engine discovers the language pair from a single crawl.
 *
 * `lastModified` is the REAL latest-release date from the database — a
 * trustworthy signal that only changes when a release actually ships
 * (dynamic `new Date()` on every request would train crawlers to ignore it).
 */
const FALLBACK_LASTMOD = new Date("2025-11-18");

async function getLastModified(): Promise<Date> {
  try {
    const latest = await db.release.findFirst({
      orderBy: { releasedAt: "desc" },
      select: { releasedAt: true },
    });
    return latest?.releasedAt ?? FALLBACK_LASTMOD;
  } catch {
    return FALLBACK_LASTMOD;
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = await getLastModified();
  const languages = {
    en: `${siteConfig.url}/`,
    fa: `${siteConfig.url}/fa`,
    "x-default": `${siteConfig.url}/`,
  };

  return [
    {
      url: languages.en,
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
      alternates: { languages },
    },
    {
      url: languages.fa,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.9,
      alternates: { languages },
    },
  ];
}
