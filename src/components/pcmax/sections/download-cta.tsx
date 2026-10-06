import { DownloadCtaClient } from "./download-cta.client";

/*
 * Server wrapper for the download CTA (Task 32 rewrite).
 *
 * History: this wrapper used to query Prisma at render time (release row
 * + local-artifact size/checksum + changelog groups) and seed the client
 * section via props. The PC MAX installer is now distributed from the app
 * repository's GitHub Releases (github.com/CiaNetIR/pc-max), so:
 *
 *   - version / size / released date come from lib/app-release.ts — a
 *     hand-verified baseline that paints with SSR/no-JS HTML and is
 *     upgraded LIVE from the GitHub API after hydration (one shared
 *     request per page view, sessionStorage-cached);
 *   - the changelog panel resolves the real release list lazily on first
 *     open (details/toggle), not at render time;
 *   - the SHA-256 verify row is gone — a hash of the old local demo
 *     artifact would be actively misleading next to the real download.
 *
 * Nothing here needs server data anymore, so the wrapper is a plain
 * pass-through; the /api/release, /api/changelog and /api/download routes
 * are untouched for external consumers.
 */
export function DownloadCta(): React.ReactElement {
  return <DownloadCtaClient />;
}
