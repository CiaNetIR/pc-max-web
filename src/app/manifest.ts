import type { MetadataRoute } from "next";

import { siteConfig } from "@/lib/seo";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteConfig.name,
    short_name: siteConfig.shortName,
    description: siteConfig.description,
    start_url: "/",
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
        src: "/brand/pcmax-logo-96.png",
        sizes: "96x96",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/brand/pcmax-logo-256.png",
        sizes: "256x256",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/brand/pcmax-logo-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
