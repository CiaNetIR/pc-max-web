import type { MetadataRoute } from "next";

import { siteConfig } from "@/lib/seo";
import { BASE_PATH } from "@/lib/gh-pages";

/* NOTE: `output: 'export'` requires metadata routes to export
 * `const dynamic = "force-static"` — a literal Next can statically parse.
 * scripts/gh-pages-build.sh appends that line to this file in the build tree
 * only, so the SSR flavor keeps its default (per-request) behavior. */

export default function manifest(): MetadataRoute.Manifest {
  /* Prefix local URLs with the GitHub Pages base path in the static flavor
   * ("" in the SSR flavor — byte-identical manifest). */
  const asset = (p: string) => `${BASE_PATH}${p}`;
  return {
    name: siteConfig.name,
    short_name: siteConfig.shortName,
    description: siteConfig.description,
    /* Stable PWA identity — survives URL/scheme changes */
    id: asset("/"),
    start_url: asset("/"),
    display: "standalone",
    background_color: "#070707",
    theme_color: "#C1121F",
    lang: "en",
    dir: "auto",
    categories: ["utilities", "productivity", "games"],
    /* Every icon below declares its REAL pixel size — verified against the
     * actual PNG headers (browsers scale; they don't crop lies):
     *   /brand/pcmax-logo-96.png         → 96×96   (16 KB)
     *   /brand/pcmax-logo-256.png        → 256×256 (64 KB)
     *   /icon.png (src/app convention)   → 512×512
     *   /brand/pcmax-logo-maskable.png   → 512×512 (124 KB, safe-zone padding)
     * NOTE: /brand/pcmax-logo.png (1161×1161, 836 KB) is intentionally NOT
     * referenced — oversized and non-square-declarable. */
    icons: [
      {
        src: asset("/brand/pcmax-logo-96.png"),
        sizes: "96x96",
        type: "image/png",
        purpose: "any",
      },
      {
        src: asset("/brand/pcmax-logo-256.png"),
        sizes: "256x256",
        type: "image/png",
        purpose: "any",
      },
      {
        src: asset("/icon.png"),
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: asset("/brand/pcmax-logo-maskable.png"),
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
