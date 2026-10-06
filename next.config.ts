import type { NextConfig } from "next";

/*
 * Two build flavors, one codebase:
 *  - default: the SSR standalone build (dev server + production server).
 *  - GH_PAGES_BUILD=1 (set by scripts/gh-pages-build.sh): a fully static
 *    export for GitHub Pages under the /pc-max-web base path. The api routes
 *    and middleware are stripped from that build tree by the script, the
 *    database is recreated deterministically from prisma/seed.ts at build
 *    time, and public-asset URLs are base-path aware (see src/lib/gh-pages.ts).
 */
const isGhPages = process.env.GH_PAGES_BUILD === "1";

const nextConfig: NextConfig = {
  ...(isGhPages
    ? {
        output: "export" as const,
        basePath: "/pc-max-web",
        /* No image optimizer exists in a static export; every next/image is
         * already local (srcs are auto base-path prefixed by Next). */
        images: { unoptimized: true },
      }
    : { output: "standalone" as const }),
  /* Type errors FAIL the build (audit 29-c): tsc --noEmit has been clean
   * since v2.1.1 and the CI check job guards it — silently ignoring
   * type errors in a production build is unacceptable. */
  typescript: {
    ignoreBuildErrors: false,
  },
  /* StrictMode on (audit 29-c): every effect-heavy component was audited;
   * the one real casualty (AnimatedCounter's started-flag) is fixed. */
  reactStrictMode: true,
  poweredByHeader: false,
};

export default nextConfig;
