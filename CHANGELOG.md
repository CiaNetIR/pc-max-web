# Changelog

All notable changes to **PC MAX Web** — the official PC MAX website — are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project
adheres to [Semantic Versioning](https://semver.org/).

## [2.4.3] — 2026-10-07

**The showcase tabs now auto-rotate** — owner request: the four panels
(Dashboard / Multi-Frame / Optimized Windows / Settings) under
«The console for your PC.» swap every **1.5 s**, turning the static
preview into the "live tabs" the copy promises.

### Added — auto-rotation with a full accessibility contract
- **1.5 s heartbeat** (`AUTOPLAY_MS`): the active tab advances
  dashboard → multiframe → windows → settings → … with the existing
  fade+rise slide swap; on phones the pill strip auto-scrolls to keep
  the active tab revealed.
- **Pause conditions (WCAG 2.2.2 + APG carousel pattern)**: rotation
  pauses while the region is *hovered* or *focused* (reading time),
  while the section is *off-screen* (one IntersectionObserver on the
  stable tabpanel anchor) and while the document tab is hidden.
- **Manual control wins**: any tab click, roving-tabindex arrow/Home/End
  key, thumbnail pick or mock-button interaction hands control to the
  visitor for good — an explicit **pause/play toggle** (lucid Pause/Play,
  EN+FA labels, 44 px effective hit area) sits by the interface-preview
  caption and re-arms rotation on demand.
- **prefers-reduced-motion never starts it** — implemented via
  `useSyncExternalStore` (SSR snapshot `false`, hydration-safe, reacts
  to live OS-setting changes); the toggle hides for those visitors
  instead of shipping a dead control. (framer's `useReducedMotion`
  reads the media query synchronously on first client render — safe for
  animation props, unsafe for structure — so it was not used here.)
- New dictionary keys `showcase.pauseAuto` / `showcase.resumeAuto`
  (EN + FA); `sw.js` VERSION → v2.4.3.

## [2.4.2] — 2026-10-06

**The download card now shows the REAL SHA-256 of the real installer** —
Task 35 (external UI/UX audit round: verify trust recommendations against
the live site, implement only what is honest and missing).

### Added — verifiable checksum, measured from the real artifact
- Downloaded the actual `PC.MAX_0.4.16_x64-setup.exe` (7,727,490 bytes)
  from the app repo's GitHub Releases and computed its SHA-256 locally:
  `09d8ca43…d7e2b28` — no fabricated hash, ever again.
- New **VerifyRow** under the download button: shield-labeled
  «Verify this download / راستی‌آزمایی این دانلود», the full 64-char
  hash (select-all code block), a Copy button with toast feedback (honest
  fallback message when the clipboard is denied), the exact artifact
  filename, and the PowerShell `Get-FileHash` comparison hint (EN + FA).
- **Version-pinned by design**: the row renders ONLY while the download
  serves exactly the release the hash was measured from — the GitHub API
  exposes no hashes, so the moment the live resolver knows a NEWER tag the
  row quietly disappears instead of showing a different file's hash
  (verified end-to-end with a seeded v9.9.9 cache). The SourceRow still
  links the release page for any version.
- `AppRelease.sha256?` added to the resolver contract (only the
  hand-verified KNOWN_LATEST baseline carries it); llms-full.txt's
  "Verifiable downloads" fact now cites the measured hash + size + method.

### Changed — numeric polish from the audit
- `tabular-nums` on the social-proof stat tiles (digits stay optically
  steady during the count-up) and the benchmark headline tiles.

### Audit outcome — recommendations already satisfied by Tasks 29–34
- Benefit-first hero + trust line + verifiable chips ✓ (v2.2.0), real
  `<a>` nav/menu-trigger semantics ✓ (v2.2.1), header download CTA ✓,
  user-level bilingual FAQ incl. free/rollback/offline/GPU ✓, benchmarks
  with before/after bars + methodology + illustrative disclosure ✓,
  contrast ≥ 4.5:1 (muted-foreground ≈ 8.2:1) ✓, mobile safe-area CTA ✓,
  prefers-reduced-motion ✓, /fa real document + hreflang + sitemap ✓,
  no-JS prerendered content ✓, `ignoreBuildErrors` off + strict mode ✓.
- Explicitly NOT implemented, with reasons: VirusTotal badge (no real
  scan exists — would be a fabricated trust claim; hash + .sig + GitHub
  release page is the honest equivalent), "real app screenshot" hero
  (the app repo ships no screenshots — fabricating one would fake the
  product; Ghost stays per explicit owner request), full token/palette
  swap (the Guardian token system already covers the audit's proposal —
  a lateral re-skin is forbidden redesign churn).

## [2.4.1] — 2026-10-06

**The red box around the logo is gone and every browser-rendered image is
WebP** — Task 34 (user feedback: "all images should be WebP for fast
loading, and there's still a red box around the top-left logo").

### Fixed — no more red frame around the brand logo
- Root cause: the navbar/footer logo sat inside a **red gradient tile +
  red glow shadow** (`from-[#ff3b30] to-[#e50914]` + crimson box-shadow) —
  read as a red box framing the logo. Both tiles are removed.
- `pcmax-logo-96.webp` regenerated as a **circular transparent emblem**
  (alpha-channel WebP cropped to the ring artwork, VLM-verified clean) —
  the logo now floats directly on the bar like a badge; the footer keeps
  its hover-scale on the image itself. Nothing frames it anywhere.
- New `pcmax-logo-256.webp` (13.5 KB) replaces the PNG in the branded
  404 page template — that page's only image is WebP now too.

### Changed — WebP everywhere the browser actually renders
- Audit: hero (Ghost) + all six gallery key arts were already WebP
  (Task 33); the logo is WebP with alpha now; the 404 logo is WebP.
  **Every `<img>` rendered on the page is WebP** — verified in the network
  log on EN, FA, mobile and the static Pages flavor (0 non-WebP).
- Flat-color brand PNGs palette-optimized losslessly: logo-256
  62.7→31.8 KB, logo-96 11.8→6.4 KB, maskable 121.8→60.6 KB.
- `favicon.ico` / `icon.png` / `apple-icon.png` / `og.png` / manifest
  icons stay PNG/ICO on purpose — platform requirements (favicon + Apple
  touch icon compatibility, og:image crawler support, PWA install);
  none of them render inside the page.

### Removed — 2.2 MB of dead deploy weight
- `public/releases/PCMAX-Setup-2.4.1-x64.exe` deleted: a fabricated-version
  artifact superseded by the real GitHub-Releases resolver (Task 32).
  Deploy size drops 5.4 MB → **3.2 MB** (−40%).
- Dead plumbing cleaned: `INSTALLER_FILE` + `installerHref()` (zero call
  sites) removed from `lib/gh-pages.ts`; `/api/download` now permanently
  **redirects to the app repo's `releases/latest`** (legacy links still
  land on a real download; GET counts an anonymous event, HEAD does not);
  `prisma/seed.ts` decoupled; build-script installer sed + SW
  `/releases` never-cache rule dropped; README download story corrected.

## [2.4.0] — 2026-10-06

**Every image on the site now carries a character gamers instantly
recognize** — Task 33 (user feedback: "use famous, well-known characters
everywhere — including Ghost").

### Changed — famous-character key art across the site
- **Hero stage: Ghost.** The framed app-window stage above the fold now
  shows Call of Duty's masked operator — skull-pattern mask, pitch-black
  backdrop, the single most requested character — served as the existing
  responsive trio (`ghost` 840/672/480 WebP, exact 16:10 crop).
- **Gallery lineup re-cast with icons.** Elden Ring, Alan Wake 2 and
  Baldur's Gate 3 key arts are replaced by **God of War** (Kratos vs
  Thor), **The Witcher 3** (Geralt facing the Leshen) and **Red Dead
  Redemption 2** (Arthur Morgan chiaroscuro portrait). Cyberpunk 2077,
  GTA V and Black Myth: Wukong stay (benchmark/dashboard cross-references
  intact) but their art now leads with the character — Johnny Silverhand
  close-up, the official trio cover, the Destined One with his staff.
- **Honest attribution.** The showcase footnote now states that characters
  and key art belong to their respective publishers (EN + FA) — the art is
  illustrative, not affiliated.
- 21 new WebP assets (7 arts × 3 widths, 641 KB total) generated one-shot
  from pristine downloads by `scripts/character-keyart.ts` (VLM-reviewed
  candidates; the obsolete git-history variant script is retired).
  Gallery game names/genres updated in both dictionaries; dashboard mock
  metadata (Cyberpunk/Wukong) and the illustrative benchmark rows are
  untouched.

## [2.3.0] — 2026-10-06

**Real GitHub-release downloads + a gamer-recognizable hero + the red focus
box gone** — Task 32 (user feedback round), plus an urgent URL migration:
both repositories were transferred to the **CiaNetIR** account mid-task
(old `DLSDT` links still work through GitHub's 301 redirects).

### Added — downloads now resolve the newest real release live
- Every download surface (premium-card button, mobile CTA bar,
  install-flow link) resolves the **newest release of
  `github.com/CiaNetIR/pc-max`** through the GitHub REST API and hands the
  browser the direct `x64-setup.exe` URL; the anchor `href` stays the
  releases page (truth for no-JS, crawlers and modified clicks).
  `src/lib/app-release.ts` owns the resolution: sessionStorage cache
  (10 min) + in-flight memo — one request per page view — 6 s timeout,
  graceful fallback to the releases page on any failure.
- `useLatestAppRelease()` (`src/hooks/use-app-release.ts`): version, size
  and release date render a **hand-verified baseline (v0.4.16 · 7.37 MB ·
  2026-09-06)** with the SSR HTML and upgrade live after hydration — the
  hero kicker, the VER stage chip and the download chips can never drift
  from the shipped product again.
- Lazy changelog: "What's new" now loads the **real release list** from the
  app repository on first open (skeleton → per-release notes + "View on
  GitHub" links to each tag); nothing is fetched at render time.
- "Official release" provenance row (`github.com/CiaNetIR/pc-max`) +
  Source chip replacing the local-artifact SHA-256 verify row — the honest
  trust signal for a remote artifact is where it ships from.

### Fixed — the "red square around the profile"
- Focus rings are now **neutral white** (`--ring: rgba(255,255,255,0.6)`);
  crimson stays reserved for emphasis (CTAs, active states, metrics). The
  old `#ff3b30` outline read as an error/selection box.
- New `TapFocusRelease` (root layout): pointer clicks/taps (click
  `detail > 0`) blur the activated control **only when a `:focus-visible`
  ring is showing** — no persistent box on profile cards, tabs, summaries
  or links after touch, while keyboard focus rings are fully preserved
  (WCAG 2.4.7).
- Stale marketing data: the site advertised **v2.4.1** (the retired local
  demo artifact) while the real app ships **v0.4.16**. The UI now shows
  real, live values; the fabricated SHA-256/PowerShell verify copy and the
  false "every release publishes its SHA-256 checksum" safety card were
  replaced with verifiable GitHub-Releases facts (installer + `.sig`
  signature per release).

### Added — hero key art gamers recognize
- GTA V's **Los Santos at dusk** (the IAA-building skyline, verified via
  vision-model review of candidates — the most instantly recognizable
  vista across CS2/GTA candidates, and the only one matching the dark
  premium brand) replaces the generic cyberpunk artwork inside the
  app-window stage. Hand-rolled srcSet like the gallery:
  `gtav-city-480/672/840.webp` (16.6 / 27.6 / 39.2 KB) — the stage chip
  SHA-256 became **GITHUB ✓**, and the VER chip shows the live version.

### Changed — repository migration (DLSDT → CiaNetIR)
- Discovered mid-task: `github.com/DLSDT/pc-max` 301 → `CiaNetIR/pc-max`
  and `dlsdt.github.io/pc-max-web` now **404s** — the live Pages site is
  `cianetir.github.io/pc-max-web`. All self-referential URLs updated from
  the single `PAGES_URL`/`GITHUB_REPO_URL` constants: canonical, hreflang,
  OG/Twitter, sitemap, robots, JSON-LD (`downloadUrl`/`installUrl` → the
  app repo's releases page, new `codeRepository`, `softwareVersion:
  0.4.16`), README, workflow comments, llms.txt / llms-full.txt, the git
  remote, and `gh-pages-build.sh`.
- `DownloadCta` server wrapper slimmed to a pass-through (no DB query, no
  local checksum at render time); `/api/release`, `/api/changelog` and
  `/api/download` stay untouched for external consumers, and the retired
  demo installer is no longer attached to web-repo GitHub Releases.
- `llms.txt` / `llms-full.txt` now cite the real download source and the
  current release instead of the retired local artifact.

## [2.2.1] — 2026-10-06

**Crawlable navigation + a dead language-toggle link fixed** — the final gap
from the Task 29/30 product audit (D7) and one regression found while
verifying it live (Task 31).

### Fixed — the /fa document's "English" toggle was a self-link in raw HTML
- The **prerendered Persian document shipped with
  `href="/pc-max-web/fa"` on its "English" toggle** — a link to itself.
  Browsers self-corrected one frame after hydration (the path store
  re-read `location.pathname`), but **crawlers and no-JS visitors saw a
  dead "English" link** — exactly the audience the v2.2.0 crawlable-`/fa`
  work was for. Root cause: the document store's server snapshot assumed
  the EN document unconditionally. It is now per-instance and
  document-aware (`initialLocale` — the same prop that bakes
  `<html lang="fa">`), so the raw HTML carries `href="/"` from the first
  byte and hydration reads the same value the server rendered (no store
  swap, no re-render). Verified in the exported `out/fa/index.html` and
  live after deploy.

### Changed — section navigation is now real crawlable anchors (audit D7)
- **Navbar, footer, hero CTAs, scroll-hint and the community artifact
  pills are `<a href="#…">` links** instead of `<button onClick>`
  scroll-helpers: the in-page anchor graph is crawlable, middle-click /
  copy-link / no-JS navigation all work, the hash lands in the URL, and
  the browser Back button behaves natively. Smooth scrolling, the
  96px sticky-header offset (`scroll-mt-24`) and the
  `prefers-reduced-motion` override all come from CSS — ~30 lines of
  per-component JS scroll handlers were deleted. The mobile menu keeps a
  single `onClick` to close the panel; the native anchor navigation still
  runs beneath it (verified: hash, 96px landing, menu close, repeat
  same-hash clicks re-scroll).

## [2.2.0] — 2026-10-06

**Product-level audit: truth, SEO and a crawlable Persian web** — a
three-specialist review team (SEO engineer, product/conversion strategist,
frontend architect) audited the live v2.1.1 site end-to-end (Task 29/30).
This release removes every fabricated or unverifiable claim, makes the
Persian page a real indexable document, halves the codebase and hardens
the build pipeline.

### Added — a real Persian document at `/fa`
- **`/fa` is now a genuine, crawlable, self-canonical Persian document**
  (previously `/?lang=fa` served the byte-identical EN HTML — Persian was
  invisible to every search engine). Implemented with an optional
  catch-all root segment `src/app/[[...lang]]/` — the one construction
  where the ROOT layout can bake `<html lang="fa" dir="rtl">` at build
  time. Reciprocal hreflang (en → `/`, fa → `/fa`, x-default → `/`),
  Persian JSON-LD, sitemap entry, IRANYekanX font preloads; the language
  toggle in the static flavor is a real `<a>` link between the two
  documents; legacy `?lang=fa` links consolidate onto `/fa` via
  history.replaceState.
- **"Verify this download" row** in the download card: the full real
  SHA-256 of the shipped installer (9cdcde91…b8e41f — computed from the
  actual artifact), a copy button with toast, and the exact PowerShell
  re-check command (`Get-FileHash … -Algorithm SHA256`).
- **CI quality gate**: a `check` job (typecheck + lint) now runs before
  every deploy; `typescript.ignoreBuildErrors` is REMOVED from
  next.config (tsc has been clean — the build can no longer silently
  ignore type errors). `reactStrictMode` on (the one StrictMode casualty,
  AnimatedCounter's started-flag, is fixed); `poweredByHeader` off.
- **Bilingual branded 404** (self-contained dark page served by GitHub
  Pages) — the exported Next 404 previously rendered as a bare unstyled
  `<html>`.

### Changed — hero is benefit-first and honest
- Headline "More FPS. / Better frames. Full control." («فریم بیشتر.
  تصویر بهتر. کنترل کامل.») + category eyebrow "PC optimization for
  Windows · v2.4.1" + trust line "Windows 10 & 11 · x64 · Free" + four
  trust badges (snapshot / rollback / no game injection / no telemetry).
- The hero stage is labeled **Preview** (was "LIVE"): the fake FPS/GPU/
  PING telemetry chips were replaced with static verifiable facts
  (VER 2.4.1 · WIN 10/11 · SHA-256 ✓) and an explicit caption.

### Removed — fabricated claims (the no-fake-data rule)
- Fake "LIVE" hero badge + FPS 142 / GPU 61°C / PING 4.2ms chips.
- "Clean on VirusTotal — 0 detections across 72 engines" trust card
  (generic homepage link, unverifiable) → replaced by the real
  checksum-verification card.
- "Code-signed builds" / "signed NSIS installer" claims (no signing
  infrastructure exists) → neutral wording.
- "56 optimization profiles shipped" + "14 games in the launch
  catalogue" + duplicate "34% average FPS gain" social tiles — replaced
  by DB-derived facts (293K+ downloads across releases, 3 stable
  releases, 470 automated tests, 0 telemetry).
- Misleading live pill "293,668 downloads served from this site" (the
  static mirror serves none) — one canonical number presentation.
- Dead social links (x.com/pcmaxapp → 404, youtube.com/@pcmaxapp → 404)
  from the footer, sameAs and Twitter card metadata.
- "All systems operational" footer pill (no status page behind it).
- The squatted `pcmax.app` canonical domain (a live third-party payment
  site!) — canonical/OG/JSON-LD now self-canonical at the Pages URL in
  both flavors; llms.txt / llms-full.txt rewritten to verifiable facts
  (real URLs, no dead profiles, no invented security claims).
- "Zero telemetry — nothing phones home" overclaim rescoped to the
  honest scope (no analytics/trackers in the desktop app; optimization
  runs offline).

### Changed — information architecture
- Product showcase moved above "what is PC MAX" (see the app before
  reading about it); what-is + features merged into one "What PC MAX
  does" section; safety hoisted above benchmarks (trust before proof);
  per-game benchmark rows labeled as illustrative with the documented
  methodology (+34%, median-of-3, 1440p, RTX 4070) surfaced next to them.
- Install-section CTA is now a direct download link (was the 4th
  scroll-CTA); install step 4 clarifies the free account's purpose;
  showcase disclaimer hoisted next to the tabs; Persian dates render in
  the Persian calendar with Latin digits (site digit policy).

### Removed — dead code (48% of src/, ~7,050 LOC)
- Retired WebGL hero trio (`gpu-scene`/`gpu-model`/
  `constellation-background`, 1,923 LOC), 43 unused shadcn/ui components
  (kept: button, input, toast, toaster, dialog), `use-mobile`,
  `tailwind.config.ts` (never loaded by Tailwind v4), `LazySection`
  pass-through, ThemeProvider/next-themes wrapper, ~85 LOC of dead CSS,
  3 dead dictionary leaves, unused `pcmax-logo-256.webp`.
- **56 of 70 runtime dependencies removed** (70 → 14: three.js stack,
  dnd-kit, MDX editor, TanStack Query/Table, recharts, 24 unused Radix
  packages, …) — install weight down ~350 MB, CI installs faster.
- Fixed the corrupted `bg-grid [mask-image…]` class on the 404/error
  pages (the decorative grid rendered as nothing) + physical glow
  centering in RTL.

### Fixed — build pipeline
- Static export now runs `next build` **through bun** (Node ≥ 24 breaks
  the export with the workUnitAsyncStorage invariant — a time bomb for
  every future CI runner).
- Release constants single-sourced: `prisma/seed.ts` and the Pages build
  script import `APP_VERSION`/`INSTALLER_FILE` from `src/lib/gh-pages.ts`;
  eslint `no-unused-vars` re-enabled as an error after the purge.

## [2.1.1] — 2026-10-06

**Multi-agent professional audit fixes** — a four-specialist review team
(visual design director, UX expert, UI engineer, responsive/RTL expert)
audited the live v2.1.0 site and surfaced 35+ findings; this release ships
the critical/major/minor fixes (Task 28).

### Fixed — critical
- **Download card clipped its own prices** (`download-cta.client.tsx`): the
  EditionPicker's bare `grid gap-2.5` implicit auto track sized rows to
  min-content (~588px), so the Free price and the Pro waitlist CTA rendered
  outside the card where `.shcard__in`'s `overflow:hidden` silently clipped
  them — invisible on phones AND 1024–1279px, partially cut even at 1920px.
  `grid-cols-1` (minmax(0,1fr)) fixes it everywhere (D1).
- **Frosted-glass blur stripped from the header/HUD chips**: Lightning CSS
  deduped the manual `-webkit-backdrop-filter` pair down to the prefixed
  form alone, which Blink/Gecko drop — the signature sticky header rendered
  as a flat black veil. Unprefixed-only declarations now survive the
  compile (A1).
- **`/api/download` dead-404 on an empty/unreachable DB** while the page
  still showed confident release chips: the route now falls back to the
  known installer artifact on disk (no counter) — the primary CTA is never
  a dead link (C2).

### Fixed — major
- **Card hover-lift dead on 19/44 cards**: framer-motion settles an inline
  `transform: none` that out-ranked `.gc-card:hover`'s transform. The lift
  now rides the independent `translate` property — verified lifting under a
  real mouse hover (A2).
- **Ambient glows fully off-screen in RTL** (showcase + download): the
  `start-1/2` + physical `-translate-x-1/2` combo never flips in RTL and
  pushed the glows ~820px off-canvas in FA. Physical `left-1/2` centering
  restores them (measured centerOffset 0px) (D2).
- **Persian prose rhythm 1.556 where the reference runs 1.9–2.05**: Tailwind
  size utilities' own line-heights beat the base body value. Unlayered
  `html[lang="fa"]` rules now pin p/li/summary at 1.9, FA h2 at weight 800
  and `.type-title` at 1.45 (A3).
- **Hero advertised v1.2.5 for three releases** while the download card
  ships 2.4.1: the kicker now interpolates `{version}` from a single
  `APP_VERSION` constant that lives next to `INSTALLER_FILE` — the marketed
  version can never drift from the artifact again (C1/B4).
- **FAQ answers snapped open**: `interpolate-size: allow-keywords` +
  `::details-content` height transition (0.28s) animate the disclosure where
  supported; other engines keep the native snap (B3).
- **"Dead feeling" (حس مرده) — mid-page had zero persistent motion across
  8/12 sections**: distributed quiet ambient life — icon chips breathe
  (gc-breathe ×3 phases), ambient washes pulse (gc-glow-pulse), install
  counter circles carry a staggered ring pulse (steps-ambient, replacing
  ~110 lines of dead `.gc-steps` choreography CSS) (A4/B2/D8).
- **EN toggle kept the Persian `<title>`**: `setLocale` now swaps
  `document.title` + meta description from the same locale metadata the SSR
  document uses (A7).

### Fixed — minor / polish
- Kicker reshaped to the reference's flat **notched tag** (clip-path
  polygon, no dot/border) — 14+ kickers now match tweakfa's signature
  geometry (A8); card radius tightened to the reference's 16px (A9);
  mid-section density raised (py-24/28, page 14,237→14,090px) (A10).
- Consolidated the near-duplicate reds (#ff6b61→#ff8a80, #ff5a50→#ff3b30)
  and renamed the lying `*-violet*` tokens/classes to `*-crimson*`; stale
  violet-era comments rewritten (A5/A11).
- Touch targets: showcase tabs wired to the existing 44px coarse-pointer
  rule via the `showcase-tab` class; changelog summary + Pro ghost pill +
  benchmarks view-all ≥44px; footer links 26→38px (D3/D4).
- `.shcard__sheen` sweep mirrored in RTL via `inset-inline-start`; the
  trust-card `ArrowUpRight` glyph mirrors in FA and nudges toward the
  reading direction (D5/D6).
- ARIA: the profiles "tablist" is now a real `radiogroup/radio`, the
  profile card buttons carry a concise `aria-label` instead of a 60-word
  accessible name, the waitlist field's accessible name is a real label
  (was the placeholder), the showcase slide title is an h3 (was a second
  h2) (B7/B8/C3/C4).
- i18n: `«بدون نیاز به Rebuild»` translated (×3); FA digits unified to
  Latin (Poppins-digits policy — 41 conversions) so versions/metrics/
  OS tokens stop mixing three digit systems; changelog dates localize
  (fa-IR); the "0 downloads" live pill hides until there is something to
  show; changelog empty state renders a real message (B6/B11/C5/C6/C7).
- `font-black` (900 — no such face) on the shcard title → `font-extrabold`
  (A6); gallery alt drops the English "— key art" suffix on FA (C9);
  removed 4 dead dictionary leaves (`hero.gpuAlt`, `showcase.settings.theme`,
  `common.themeLight/themeDark`) (C10).

## [2.1.0] — 2026-10-06

**Red Edition + the TweakFa type system** — per user request
("۹۹.۹۹٪ شبیه این بشه بجز رنگش که باید همون تم قرمز مشکی بمونه…
از فونتش بگیر تا همه چیز شبیهش بشه"): the Guardian structure stays
byte-identical, the violet palette is swapped back to the classic PC-Max
**crimson/black** brand, and the site now ships the exact **TweakFa font
pair** — self-hosted `IRANYekanX` (Persian, 5 weights) + `Poppins` (Latin,
3 weights) with the signature *Poppins-digits-inside-Persian* unicode-range
trick.

### Changed — fonts (layout.tsx, globals.css)
- **IRANYekanX** (400/500/600/700/800) + **Poppins** (400/600/700 latin +
  Regular/SemiBold/Bold digit subsets) downloaded from tweakfa.com
  phoenix-landing/fonts into `public/fonts/` (11 woff2 files, ~135 KB).
- `@font-face` injected via a hoisted `<style href="pcmax-local-fonts"
  precedence="font-face">` — BASE_PATH-interpolated so both the SSR and the
  static GitHub-Pages flavors resolve `/fonts/…` (fixes the raw-`<style>`
  -in-`<html>` hydration error the old Ariobarzan path would have hit).
- The TweakFa signature move: Poppins DIGITS (U+0030-0039) declared under
  the `'IRANYekanX'` family — Latin digits inside Persian text render in
  Poppins, every other glyph in IRANYekanX.
- Font stacks: EN = `--font-sans/--font-display: "Poppins"` (was Sora +
  system body); `html[dir="rtl"]` = `"IRANYekanX"` (was Vazirmatn).
  `next/font/google` (Sora + Vazirmatn) and the Ariobarzan drop-in
  contract are removed — zero external font requests.
- Per-locale above-the-fold preloads (EN: 3 Poppins cuts ≈27 KB; FA SSR:
  IRANYekanX Regular/Bold/ExtraBold). `.gc-stat`/`.gc-step` numerals
  pinned to Poppins + sans fallback (Persian digits still render Yekan).

### Changed — color (globals.css + 5 components)
- Violet → the classic crimson/black theme on every Guardian role:
  brand fill `#e50914` (buttons/pills/selection/logo box), text/vivid
  `#ff3b30` (Task-25-approved hue, 5.7:1 on #08080a), deep stop `#c1121f`,
  kicker text `#ff8a80`, `--accent rgba(229,9,20,.16)`, `--ring #ff3b30`.
- Full-bleed swaps: bgfx top glow, kicker pill, `.gc-btn-primary`,
  `.gc-frame`, `.text-glow-crimson` ramp, `.glow-crimson`, `.tick-violet`,
  `.btn-convex` legacy ramp, `stNum` step animation, the `.shcard` family
  (conic orbit now gold→**crimson**→teal, drifting glows, breathing mark),
  `details.gc-q[open]` border, slim scrollbar.
- Hardcoded component hexes re-pinned: navbar/footer logo box
  `from-[#ff5a50] to-[#e50914]`, showcase active tab `bg-[#e50914]`,
  shcard "PC MAX" label gradient `via-[#ff3b30]`.
- Gold #fedb29 / teal #1fbf9c / warning #e08a09 accents unchanged — the
  red/gold/teal triad on near-black keeps the Guardian premium feel.

### Maintenance
- Service-worker cache `v2.0.0` → `v2.1.0` (repeat visitors drop the
  violet CSS/font cache). package.json → 2.1.0.

## [2.0.0] — 2026-10-06

The **Guardian redesign** — the whole visual language rebuilt after the TweakFa
"Phoenix Guardian" landing (tweakfa.com/guardian), per user request
("وب سایت شبیه این بشه"). Dark-only violet/gold/teal gaming aesthetic; the
light theme, the crimson palette, and the WebGL hero are retired.

### Changed — design system (globals.css)
- **Dark-only**: `:root`/`.dark` carry identical Guardian values (#08080a base /
  #121216 surface / #1b1b21 elevated). next-themes is pinned with
  `forcedTheme="dark"`, `<html class="dark">` is set server-side, and the theme
  toggle is removed. Viewport `color-scheme: dark`, single theme-color #08080a.
- **Violet ramp on the legacy crimson names** — 165 `text-crimson` /
  `bg-crimson/10` / `border-crimson/25` call-sites re-skin automatically
  (#a98cff text ≈7:1 / #8b5cff / #6734ff; solid fills pinned to #6734ff for
  6:1 white labels). Gold #fedb29 and teal #1fbf9c join as premium/success
  accents; warning #e08a00 for caveats.
- New Guardian utilities: `.bgfx` (fixed 64px grid + violet top glow, mounted
  once), `.kicker`/`-gold`/`-teal` pills, `.gc-sect` hairline separators,
  `.gc-btn-primary/-gold/-ghost`, `.gc-card`, `.gc-frame`, `.gc-hud-chip`,
  `.gc-hdr` sticky blur, `.word/.wi` hero word-reveal, `.media-sheen` sweep,
  `.tick/-gold/-violet`, `.gc-stat`, `.gc-steps/.gc-step` counters, the full
  `.shcard` premium-card family (conic orbit border, drifting glows, sheen,
  breathing mark, staggered perks), hud-drift floats, and hand-rolled
  `details[open]` helpers (Tailwind 4 here does not emit `group-open:` —
  found by browser verification and fixed with `.gc-q/.gc-glyph/.gc-chevron`).

### Changed — sections
- **Navbar**: sticky blurred 68px bar (reference .hdr), violet-gradient brand
  box, plain nav links with scroll-spy, violet CTA; theme toggle + scroll
  progress bar removed; all a11y logic kept (focus trap, Escape, scroll lock).
- **Hero**: centered kicker pill → word-reveal headline (per-word `--wd`
  stagger, title2 in violet gradient) → lead → tick bullets → violet/ghost
  CTAs → framed app-window stage with game art, LIVE chip and three drifting
  HUD stat chips. The ~860KB three.js GPU scene and canvas constellation are
  retired (never imported on any viewport — pure CSS/SVG life instead).
- **App showcase** → reference feature slider: pill tabs (violet active) +
  text/media slide grid, media in `.gc-frame media-sheen` panels with HUD
  overlays. Game key-arts keep the Task-24 responsive srcSet (sizes updated to
  the new panel width). App-window chrome mocks folded into frame panels.
- **What-is**: connector-spine timeline (the v1.2.5 "line crossing" bug
  surface) structurally removed — 5 numbered gc-cards, gold outcome node.
- **Install flow**: the 280vh scroll-hijack cinematic rail is replaced by the
  reference steps grid — 7 CSS-counter circles (01–07) with icon chips,
  staggered whileInView entrance, download CTA.
- **FAQ**: Radix accordion → reference 2-col grid of native `<details>` cards
  (SSR/no-JS safe, plus→cross flip + violet border on open, CSS-only).
- **Download** → the reference premium card (shcard): animated conic gradient
  border, drifting glows, sheen sweep, breathing 3-bar mark, staggered perk
  feathers, gold download button; edition rows, changelog disclosure and
  waitlist kept; all /api/download logic untouched.
- **Features / Multi-frame / Profiles / Safety / Benchmarks / Voices**:
  re-skinned to gc-cards, tri-color tick rotation, accent pills (violet/teal/
  gold), teal Sora stat numerals, gold caveat callout, voices grid.
- **Footer / mobile CTA bar**: hairline top, violet brand box, blurred
  floating CTA card (behavior unchanged).

### Kept (non-visual)
- i18n EN/FA (RTL) with logical CSS throughout, SEO metadata + JSON-LD,
  static GitHub-Pages export (basePath, asset()), service worker (bumped to
  v2.0.0 so repeat visitors drop the old crimson cache), analytics beacon,
  API routes, all section anchors and the skip-link.

### Verified
- `tsc --noEmit` 0 · `eslint` clean · dev SSR 200 (EN + `?lang=fa`).
- Browser golden path: word-reveal lands (EN+FA), tab switching, gallery
  thumb swap with responsive srcSet intact, FAQ open-state (border + glyph
  rotation — fixed after finding `group-open:` never compiled), 7 install
  counters, shcard `.in` perks stagger, navbar CTA smooth-scroll, language
  toggle both directions, 412px mobile with zero horizontal overflow, VLM
  review of hero/showcase/shcard/install/mobile/RTL screenshots — no
  strikethrough lines, no pink tint, no dead zones.

## [1.2.5] — 2026-10-05

Persian-language design review follow-up ("a line crosses these items — bug;
white turned pink; the site feels dead"). All three traced to real defects and
fixed, plus one site-wide animation bug discovered on the way.

### Fixed — reveal animations never fired near screen edges (site-wide)
- Every `whileInView` viewport margin was written as a single value
  (`margin: "-80px"` → rootMargin shrinks ALL four sides). On a 412px phone
  the effective IntersectionObserver root is only ~212–332px wide, so any
  animated element within ~40–100px of the LEFT/RIGHT edge sat outside the
  root forever — `isIntersecting` never turned true and the element stayed at
  its initial `opacity: 0` / `scale: 0`. All 26 usages now use vertical-only
  margins (`"0px 0px -Npx 0px"`), which preserves the reveal-early intent
  while including edge elements. Swept the whole page after a full scroll:
  zero stuck-invisible elements remain.
- In the same section, `initial={{ scale: 0 }}` collapsed the element's
  IntersectionObserver rect to a zero-area point — Chrome reports
  `isIntersecting: false` for it, so those nodes could never reveal even in
  mid-screen. Initials are now non-degenerate (0.55 / 0.08 / 0.06) with the
  same spring targets.

### Fixed — "What is PC MAX" timeline (the line + the pink)
- The only timeline element that actually animated was the continuous
  scroll-drawn spine (`useScroll`, immune to the IO bug): a full-height hot
  line crossing all five cards — with the node chips and connectors
  permanently invisible around it, it read as a strikethrough bug. The spine
  is replaced by short per-gap connector segments (crimson 35%→10%) that
  spring in with the scroll; the frosted-glass node chips now pop in, and
  the destination node carries a soft infinite pulse ring (skipped for
  reduced-motion users).
- Dark-mode crimson text tokens lifted to `#ff2d3d` (hue 353°) read as
  PINK, not crimson. Re-lifted to `#ff3b30` (hue 3°, true red) at the same
  luminance — still 5.7:1 on `#070707`, so the 4.5:1 pass is kept. Hardcoded
  dark hover pinks in error/not-found follow it.

## [1.2.4] — 2026-10-05

Lighthouse follow-up: responsive image delivery. The remaining flagged finding
("Improve image delivery", 123 KiB est. savings) is resolved — plus a desktop win
the report couldn't see.

### Changed — responsive game key-arts (srcset)
- The static Pages export runs `next/image` with `unoptimized`, which emits a
  bare `src` and **no srcset** — every device downloaded the full 840px key-art
  even when the gallery card renders at ~380 CSS px (Lighthouse's Moto G Power
  @ DPR 1.75 needs 662 device px). The six gallery cards are now plain `<img>`
  with a hand-rolled srcSet, and the dashboard mock's 92px thumbnails use the
  small variant directly instead of the full master.
- New WebP variants, single-encoded from the git-tracked JPEG originals by
  `scripts/responsive-images.ts` (no generation loss on the existing masters):
  `480w` (~20–30 KiB) and `672w` (~31–48 KiB) alongside the 840px masters
  (~43–64 KiB). `sizes` mirrors the real grid — 1-col mobile `calc(100vw - 2rem)`,
  2-col capped at `27.5rem`, and the 3-col desktop card is a constant ~285px
  inside the `max-w-4xl` block (not `33vw` — the grid is narrower than the
  section shell).
- Verified end-to-end (local static build, agent-browser): mobile 412px picks
  `480w` for all six cards, desktop 1280/DPR-1 picks `480w`, DPR-2 desktop
  resolves to `672w` (candidate 572), high-DPR phones keep the 840px master.
  Zero broken images, no horizontal overflow, all 12 sections render through a
  full scroll.
- Byte deltas per device class: mobile −54% (55.5 → 25.7 KiB avg), DPR-1.75
  mobile & DPR-2 desktop −26% (55.5 → 41.1 KiB avg), thumbnails −58%
  (55.5 → ~23 KiB).
- Service-worker cache version bumped `v1.2.3 → v1.2.4` (public/ assets
  changed); new variant URLs are picked up by the `/games/**` SWR bucket.

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
