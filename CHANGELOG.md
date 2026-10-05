# Changelog

All notable changes to **PC MAX Web** — the official PC MAX website — are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project
adheres to [Semantic Versioning](https://semver.org/).

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
