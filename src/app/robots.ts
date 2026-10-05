import type { MetadataRoute } from "next";

import { siteConfig } from "@/lib/seo";
import { IS_STATIC_EXPORT } from "@/lib/gh-pages";

/* NOTE: `output: 'export'` requires metadata routes to export
 * `const dynamic = "force-static"` — a literal Next can statically parse.
 * scripts/gh-pages-build.sh appends that line to this file in the build tree
 * only, so the SSR flavor keeps its default (per-request) behavior. */

/**
 * robots.txt — explicit crawl policy for search engines AND generative-AI
 * crawlers (GEO / AIO / LLMO). Every AI bot that trains on or cites web
 * content is explicitly allowed, so PC MAX can be retrieved, quoted and
 * recommended by answer engines and LLMs.
 *
 * Bots covered: GPTBot/OAI-SearchBot/ChatGPT-User (OpenAI), ClaudeBot/
 * Claude-User/anthropic-ai (Anthropic), PerplexityBot/Perplexity-User,
 * Google-Extended (Gemini), CCBot (Common Crawl), Applebot (+Extended),
 * meta-externalagent, Amazonbot, DuckAssistBot, cohere-ai, MistralAI-User,
 * Bytespider.
 *
 * `/api/` is disallowed for conventional crawlers (POST-only endpoints like
 * waitlist/analytics, the ~2 MB installer download, internal counters).
 * The two machine-readable fact endpoints are carved back out with explicit
 * `Allow` lines — Google/Bing resolve robots by longest-match, so
 * `/api/release` and `/api/changelog` stay crawlable on purpose as citable
 * JSON facts. AI bots with their own groups below keep full access.
 */
export default function robots(): MetadataRoute.Robots {
  /* Static GitHub Pages flavor: there is no /api surface on the static
   * host, so the API carve-outs below are meaningless — allow everything. */
  if (IS_STATIC_EXPORT) {
    return {
      rules: [{ userAgent: "*", allow: "/" }],
      sitemap: `${siteConfig.url}/sitemap.xml`,
    };
  }
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/api/release", "/api/changelog"],
        disallow: ["/api/"],
      },
      {
        userAgent: ["GPTBot", "OAI-SearchBot", "ChatGPT-User"],
        allow: "/",
      },
      {
        userAgent: ["ClaudeBot", "Claude-User", "anthropic-ai"],
        allow: "/",
      },
      {
        userAgent: ["PerplexityBot", "Perplexity-User"],
        allow: "/",
      },
      {
        userAgent: ["Google-Extended"],
        allow: "/",
      },
      {
        userAgent: ["CCBot", "Applebot", "Applebot-Extended"],
        allow: "/",
      },
      {
        userAgent: [
          "meta-externalagent",
          "Amazonbot",
          "DuckAssistBot",
          "cohere-ai",
          "MistralAI-User",
          "Bytespider",
        ],
        allow: "/",
      },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url,
  };
}
