/**
 * GitHub Pages static-export flavor.
 *
 * The website ships as TWO flavors from one codebase:
 *
 *  1. SSR flavor (default — dev + standalone production): the full app with
 *     `/api/*` route handlers, Prisma at request time, proxy-based locale
 *     routing and the streaming/counting download endpoint.
 *
 *  2. Static flavor — a fully static mirror published to GitHub Pages at
 *     https://cianetir.github.io/pc-max-web (built by `scripts/gh-pages-build.sh`
 *     with `output: 'export'` + `basePath: '/pc-max-web'`).
 *
 * `NEXT_PUBLIC_STATIC_EXPORT=1` is set at BUILD time by the script, so the
 * value is inlined into both the server prerender and the client bundle and
 * resolves statically with zero runtime cost in either flavor. Everything
 * below is `false`/`""` in the SSR flavor — the site behaves byte-identically
 * to before unless the static build is explicitly requested.
 */

/** True only inside the GitHub Pages static build. */
export const IS_STATIC_EXPORT = process.env.NEXT_PUBLIC_STATIC_EXPORT === "1";

/**
 * URL path prefix under which the GitHub Pages build is served
 * (`""` in the SSR flavor — every `${BASE_PATH}/…` concatenation below is a
 * no-op there).
 */
export const BASE_PATH = IS_STATIC_EXPORT ? "/pc-max-web" : "";

/**
 * Prefix a public-asset path with the deployment base path.
 *
 * `next/image` with `images.unoptimized` (mandatory for `output: 'export'`)
 * does NOT apply `basePath` to the `src` prop — unlike `<Link>`, metadata
 * URLs and the `/_next` asset prefix — so every `<Image src="/…" />` /
 * background-asset reference must be routed through this helper. In the SSR
 * flavor `BASE_PATH === ""` and the path is returned byte-identically.
 */
export function asset(path: string): string {
  return `${BASE_PATH}${path}`;
}

/** Public origin of the GitHub Pages deployment (no trailing slash). */
export const PAGES_URL = "https://cianetir.github.io/pc-max-web";

/** The GitHub repository backing the site. */
export const GITHUB_REPO_URL = "https://github.com/CiaNetIR/pc-max-web";

/** The PC MAX APPLICATION repository — the real download source (Task 32).
 * CANONICAL OWNER: CiaNetIR (the repo was transferred there from DLSDT
 * on 2026-10-06 — old DLSDT links still work via GitHub's 301 redirects).
 * Releases live at github.com/CiaNetIR/pc-max/releases; the download
 * buttons resolve the newest tag live via lib/app-release.ts. */
export const APP_REPO_URL = "https://github.com/CiaNetIR/pc-max";

/**
 * Filename of the local demo artifact — kept ONLY as the /api/download
 * route's fallback (SSR-flavor legacy compat; external consumers may still
 * hit the route). The user-facing download flow points at the REAL app
 * releases on github.com/CiaNetIR/pc-max — see lib/app-release.ts.
 */
export const INSTALLER_FILE = "PCMAX-Setup-2.4.1-x64.exe";

/**
 * Download href LEGACY — the old local-artifact flow. Kept for the SSR
 * flavor's /api/download counting route only; every user-facing download
 * button now resolves the newest GitHub release via lib/app-release.ts
 * (no-JS href fallback: APP_RELEASES_URL from that module).
 */
export function installerHref(fileName: string = INSTALLER_FILE): string {
  return IS_STATIC_EXPORT ? `${BASE_PATH}/releases/${fileName}` : "/api/download";
}
