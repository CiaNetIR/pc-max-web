# Changelog

All notable changes to **PC MAX Web** — the official PC MAX website — are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project
adheres to [Semantic Versioning](https://semver.org/).

## [1.2.3] — 2026-10-05

Lighthouse-driven quality pass (mobile, Moto G Power / Slow 4G baseline): performance
assets, WCAG contrast to 100, and a real client-side cache layer for repeat visits.

### Added — service worker (static flavor only): repeat-visit cache
- GitHub Pages serves every asset with `Cache-Control: max-age=600` (Lighthouse:
  "use efficient cache lifetimes", 821 KiB re-downloaded per revisit). The new
  `public/sw.js` installs proper immutable-asset semantics:
  `/_next/static/**` → cache-first (content-hashed, permanently valid);
  `/games|brand|fonts/**` → stale-while-revalidate; navigations → network-first
  with offline fallback; `/releases/**` (the 2.2 MB installer) never cached.
- Registered by `sw-register.tsx` after the window `load` event, **only** when
  `IS_STATIC_EXPORT` (the SSR/dev flavor never registers it). Bump `VERSION`
  in `sw.js` whenever public assets change so old caches drop on activate.
- Verified locally: full offline page load (12 sections render with the network
  off), 28 entries cached (16 chunks + 6 games + 2 logos + document/manifest/
  icons), installer always network-only.
- Fixed a subtle first-draft bug during verification: `staleWhileRevalidate`
  cloned the response *after* `caches.open()` resolved — by then the consumer
  had started reading the body, `response.clone()` threw "body already used"
  silently and the cache never filled. Clones are now taken synchronously
  before the response is handed to `respondWith`.

### Changed — image diet: −341 KiB (~38 % of page weight)
- All eight `<Image>` assets converted to WebP via the new one-shot
  `scripts/optimize-images.ts` (sharp, single encode): six game key-arts
  ~68–90 KB JPEG → 43–63 KB WebP; hero-emblem logo (the mobile LCP element)
  62.7 KB → **11.4 KB** (−82 %); navbar/footer logo 11.8 KB → 3.1 KB.
- `src/app/icon.png` 163.7 KB → 61.0 KB and `apple-icon.png` 28.2 KB → 11.2 KB
  (palette-compressed in place). Manifest icons stay PNG (spec-safe) — only
  page-load `<Image>` references moved to `.webp`; the JSON-LD logo stays PNG
  for scrapers.

### Fixed — accessibility (Lighthouse a11y 95 → 100 target)
- **Contrast**: every text-bearing `text-muted-foreground/70|80|60` and
  `text-crimson/70|80` raised to full token contrast (footer platform chips,
  disclaimer, made-for line, changelog dates/meta, showcase footnote/workflow
  status, social-proof caption, install-flow counter, section eyebrows/numerals).
- **Profiles comparison cards**: the inactive card dimmed its whole subtree via
  `opacity: .55` × per-item `.6` × `text-foreground/80` ≈ 2:1 effective
  contrast. Inactive state now recedes via scale + losing its accent skin
  (gradient/border/glow/ACTIVE pill) — text stays at full WCAG contrast.
- **Color tokens**: light-mode amber `#d4a504` (2.2:1) → `#a16207` (4.9:1);
  segmented-control active label and the ACTIVE pill now use theme-aware
  accent classes instead of raw brand fills as text color.
- **Heading order**: mock-dashboard game-card titles `h5` → `h3` (was the only
  h2→h5 skip on the page; heading sequence is now strictly descending).

### Investigated, deliberately not changed
- **Legacy JavaScript (14 KiB)**: the flagged polyfills (`Array.prototype.at`,
  `flat`, `Object.fromEntries`, …) are bundled *inside* third-party libraries,
  not injected by Next. An explicit `browserslist` was A/B-tested and made the
  bundle **22 KiB larger** (Next 16/Turbopack already compiles to a modern
  baseline) — removed; patching the dependency would be fragile for ~1.5 % of
  transfer.
- **Render-blocking CSS (300 ms)** and GitHub Pages' 10-minute TTL are
  platform constraints; the service worker above addresses the repeat-visit
  half of the TTL problem.
- **Non-composited animations**: remaining items are user-triggered (accordion
  height, theme cross-fade) or decorative SVG paint (flow arrows), all disabled
  under `prefers-reduced-motion`.

## [1.2.2] — 2026-10-05

### Fixed — critical: blank page while scrolling on slow mobile connections
- **Symptom**: on mobile the hero rendered, but scrolling showed a blank page —
  every section below the fold was invisible until JavaScript finished
  downloading, hydrating and running its IntersectionObservers (a window of
  many seconds on slow networks — notably GitHub Pages/Fastly routing).
- **Root cause**: all 106 scroll-reveal elements ship `style="opacity:0;…"`
  in the static HTML (framer-motion `whileInView`/mount initials). Content
  visibility was effectively JS-gated — no progressive enhancement.
- **Fix — progressive-enhancement gate**: while `<html>` lacks the
  `.hydrated` class, `globals.css` force-shows any inline-hidden reveal
  target (`opacity/transform/filter`, `!important` over inline styles).
  The new `HydrationMarker` client component adds `.hydrated` the moment
  React mounts, handing visibility control back to framer-motion; its
  cleanup removes the class again if React ever unmounts (runtime error →
  content stays readable). Selector precision: `[style*="opacity:0;"]` +
  `[style$="opacity:0"]` match only true hidden initials — designed partial
  opacities (0.4/0.6) are untouched, collapsed Radix panels stay collapsed
  via their `height:0`.
- Covered failure modes: slow network / long pre-hydration window, stalled
  or failed JS, no-JS visitors, runtime error unmounting React.
- Verified live: with every JS chunk blocked, all 11 section headings render
  visible across the full 15.7k-px page; with JS on, reveals fire exactly as
  before (zero permanently stuck sections), 12/12 images, zero console/page
  errors, both flavors unaffected otherwise.

## [1.2.1] — 2026-10-05

### Fixed — critical: images did not load on the GitHub Pages build
- **Every user-visible image 404'd on the live Pages site** (navbar/footer/hero/
  download-CTA logos and all six game key-arts). Root cause: `next/image` with
  `images.unoptimized` — mandatory for `output: 'export'` — does **not** apply
  `basePath` to the `src` prop (unlike `<Link>`, metadata URLs and the `/_next`
  asset prefix), so all eight references emitted root-absolute URLs
  (`/brand/…`, `/games/…`) that 404 under `/pc-max-web`.
- Added a shared `asset()` helper to `src/lib/gh-pages.ts` (identity in the SSR
  flavor — that build stays byte-identical) and routed every `<Image src>`
  through it (navbar, footer, hero, download-CTA, app-showcase `gameFiles`);
  `manifest.ts` now uses the same helper instead of a local duplicate.
- Verified on the live deployment: 12/12 images load across desktop/mobile and
  EN/FA, zero console/page errors, zero failed network requests; the SSR/dev
  flavor still serves images through the `/_next/image` optimizer as before.

## [1.2.0] — 2026-10-05

### Added — the website now lives on GitHub Pages
- **Live static mirror at <https://dlsdt.github.io/pc-max-web/>** — the full site
  (both languages, 3D hero, every section) exported as a static build from the
  same codebase (`output: 'export'` + `basePath: '/pc-max-web'`).
- `scripts/gh-pages-build.sh` — one command builds the static export in an
  isolated copy (the dev project and its dev server are never touched): it
  strips the API/middleware surface, recreates a deterministic seeded SQLite
  at build time (release, changelog and stats are baked in), rewrites
  `llms.txt`/`llms-full.txt`/`security.txt` URLs to the Pages deployment, and
  emits `out/`.
- **CI auto-deploy** (`.github/workflows/deploy-pages.yml`): every push to
  `main` rebuilds and republishes the GitHub Pages site automatically — no
  manual step, ever.
- `release.sh` now attaches the installer artifact (`public/releases/*.exe`)
  as a Release asset on every version.

### Changed — static-flavor behavior (byte-identical SSR flavor)
- Download buttons on the static build link directly to the deployed installer
  artifact (`/pc-max-web/releases/…`) instead of `/api/download`, which doesn't
  exist on a static host; the SSR flavor keeps the streaming/counting route.
- The waitlist card on the static build explains the limitation and links to
  the GitHub releases instead of POSTing to a nonexistent endpoint; the
  analytics beacon is disabled there.
- SEO base URLs (canonical, hreflang, OG/Twitter images, sitemap, robots,
  JSON-LD `downloadUrl`) resolve to the Pages origin in the static build and
  stay on `pcmax.app` in the SSR build.
- Persian on the static build: the page prerenders in English (the canonical
  document) and restores the visitor's chosen locale — `?lang=fa` links or the
  stored preference — right after hydration, with no hydration mismatch.
- All root-absolute asset references are now base-path aware (manifest
  `id`/`start_url`/icons, the 3D canvas brand font, font preloads), no-ops in
  the SSR flavor.

## [1.1.0] — 2026-10-05

### Performance — the site was "very slow and laggy"; this release attacks every layer
- **GPU scene render cost cut dramatically** (the dominant per-frame cost):
  - Postprocessing `multisampling` 4× → 0 (4× fragment work on every pass removed;
    the soft materials + bloom mask the aliasing it was fixing).
  - DPR caps 2.0/1.6 → 1.5/1.35 (desktop/tablet) — up to ~56% fewer pixels rasterized
    on retina-class displays.
  - **Adaptive DPR**: the hero's manual render loop now measures real frame cost (EMA)
    and self-tunes the pixel ratio down a ladder (cap → 1.25 → 1.0) on sustained
    slowness and back up on sustained fastness — the scene degrades gracefully on
    weak GPUs instead of lagging. Applied through r3f's `setDpr` with composer
    render-target resize sync; hysteresis-locked so it never oscillates.
  - Canvas `antialias: false` (the composer bypasses the default framebuffer — the
    canvas AA flag was pure config waste).
  - Shadow filtering set explicitly to plain PCF (removes the three.js 0.186
    PCFSoftShadowMap deprecation warning; identical output).
- **The ~862 KB three.js chunk no longer competes with first paint**: the GPU scene's
  dynamic import now starts only when the browser reports itself idle after hydration
  (`requestIdleCallback`, 1.1 s worst-case timeout, Safari timer fallback). Verified:
  chunk requests begin ~1 s after `load`, FCP/hydration untouched; phones still
  download zero WebGL code.
- **Constellation canvas at ~30 fps** (rAF ticks that arrive sooner than 33 ms are
  skipped — the slow star-field drift is visually identical), DPR capped at 1.5,
  per-frame color-string allocations eliminated (pre-baked theme palettes, ~5 alpha
  buckets, strokes batched per bucket), `hypot` → `sqrt` in the hot path.
- **Client fetch waterfall eliminated**: download-cta and social-proof are now server
  components that query Prisma directly and seed their client halves as props —
  `/api/release`, `/api/changelog` and `/api/stats` are no longer requested by the
  browser at all (verified: zero API XHRs after load; release data present in the
  SSR HTML). The API routes remain for the download button and external consumers.
- **Font diet**: Vazirmatn no longer force-preloaded on English first paint
  (usage-gated via `[dir=rtl]` stacks + unicode-range; EN verified to download zero
  Persian fonts); FA-only local cuts get correctly-typed CORS preloads on FA only;
  `color-scheme: light dark` meta added.
- **Static asset diet**: deleted verified-unreferenced `brand/pcmax-logo.png` (836 KB),
  `brand/pcmax-emblem.jpg`, `fonts/estedad-vf.woff2` (118 KB), `logo.svg`.
- **Navbar chrome**: scroll handler does zero work unless the threshold is crossed
  (ref-guarded boolean flip), always-on `backdrop-blur` surfaces replaced with solid
  `bg-card/80` (each blurred pill was a persistent composite layer), IO-based
  scroll-spy with proper cleanup, timer-leak fix on unmount.
- **Dead CSS removed**: the marquee keyframe block (orphaned since the game-library
  deletion) is gone; added a documented `.cv-auto` (content-visibility) utility for
  future opt-in.
- **Motion hygiene verified**: every `whileInView` carries `viewport={{ once: true }}`
  (no re-animation on scroll-back); the profiles meter's dead width-animation
  replaced with plain CSS (pixel-identical); mobile CTA bar observer gets a proper
  rootMargin instead of a late threshold.

### Accessibility
- Dark-mode crimson small-text contrast lifted to ≈5.5:1 (`--color-crimson(-bright)`
  → `#ff2d3d` in `.dark` only; light theme untouched) with a fill-guard so solid
  crimson fills keep the canonical brand hue; reported by the 18-j audit, fixed here.

### SEO
- robots.txt now explicitly allows `/api/release` + `/api/changelog` (real content
  endpoints) while disallowing the rest of `/api/`; manifest gains `id: "/"`;
  JSON-LD `SoftwareApplication` now carries the live version number (async db read);
  llms.txt/llms-full.txt fact-sync pass; feature list for SEO now includes group items.

### Infrastructure / tooling (sandbox hardening)
- Tailwind 4 content scanning pinned to explicit sources
  (`@import "tailwindcss" source(none)` + `@source "../../src/**/*.{ts,tsx,mdx}"`)
  so the scanner never stats non-source trees — on degraded FUSE mounts a stray
  `<dir>/.git` probe could wedge the postcss worker and hang the whole page compile
  (diagnosed via `/proc/<pid>/syscall` + process-memory path extraction).
- tsconfig include scoped to real source roots; ESLint ignores hardened
  (`tool-results/`, `upload/`, `.poison/`).

### Notes
- tsc `--noEmit` clean project-wide; ESLint clean on every changed file; verified
  E2E on port 3002 (desktop dark/light EN, FA RTL, mobile 390 FA: zero canvases,
  zero horizontal overflow, SSR release data, working FAQ accordion, theme toggle,
  real `/api/download` href).

## [1.0.0] — 2026-10-05

### Added — the site
- Complete landing experience: 3D GPU hero → app showcase (product dashboard) → what-is →
  install flow → features → multi-frame → profiles → system safety → benchmarks →
  social proof → FAQ → download CTA.
- Bilingual English/Persian with full RTL, cookie + `?lang=fa` switching, Persian
  typography (Vazirmatn / Ariobarzan / Estedad) and bidi-isolated numerals.
- Real-time 3D GPU hero (React Three Fiber): inertia/damping motion physics, layered
  contact shadows, theme-aware lighting rigs, PC MAX LED backplate, and a desktop-only
  animated constellation with a protected quiet zone around the headline.
- Interactive product dashboard tabs (Home / Multi-Frame / Optimized Windows / Settings)
  mirroring the real desktop app, including the Windows tuning surface and snapshot rows.
- Live release pipeline: `/api/download` streams the real installer with SHA-256 +
  atomic counters (HEAD never counts), `/api/release`, `/api/changelog`, `/api/stats`,
  `/api/waitlist`, `/api/analytics` — all rate-limited and hardened (405/413/429,
  path-traversal guard, cache headers).
- Mobile conversion bar (appears past hero, dismissible, safe-area aware).
- SEO stack: SSR-everything, JSON-LD, OpenGraph, sitemap, robots, manifest,
  `llms.txt` / `llms-full.txt` for LLM crawlers.
- Dark & light themes with `prefers-reduced-motion` neutralization across all motion.

### Fixed — 10-agent debug & fact-sync pass (2026-10-04)
- All marketing copy synchronized with the real product facts (github.com/DLSDT/pc-max):
  7-step install with sign-in, real profile names, 235 CI tests, transaction/rollback
  safety, honest stats — ~66 EN + ~75 FA strings rewritten.
- Runtime had been serving a stale compiled `dictionary.js` shadowing `dictionary.ts`
  (webpack resolves `.js` first) — the shadow artifacts were eliminated repo-wide.
- 3D scene correctness: camera tier rig never re-applying across the 1024px boundary,
  shadow-map size swap being a silent no-op (three.js 0.186 semantics), context-loss
  clock discontinuity (one giant first delta), duplicate brand-font fetches per mount.
- Accordion open/close animations (missing Radix keyframes), manifest icon sizes,
  animated-counter SSR values, mobile menu a11y (Escape/resize close, focus trap).
- Dead code removed: 7 unreachable section components + old constellation stack.

### Notes
- The installer artifact (`public/releases/PCMAX-Setup-2.4.1-x64.exe`) ships in-repo so
  the download endpoint works out of the box.
- Seeded release/changelog history lives in `prisma/seed.ts`.
