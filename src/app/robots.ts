import type { MetadataRoute } from "next";

import { siteConfig } from "@/lib/seo";

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
 * The `/api/release` and `/api/changelog` JSON endpoints stay crawlable on
 * purpose — machine-readable facts AI systems can cite directly.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
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
        userAgent: ["Google-Extended", "Googlebot"],
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
