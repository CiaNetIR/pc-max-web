import { cache } from "react";
import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { db } from "@/lib/db";
import {
  DownloadCtaClient,
  type ChangelogGroup,
  type DataState,
  type ReleaseInfo,
} from "./download-cta.client";

/*
 * Server wrapper (SSR data owner) for the download CTA.
 *
 * The section used to be a client component that fired two fetches on
 * hydration (/api/release + /api/changelog) — a HTML → JS → fetch → render
 * waterfall on every visit. The same data is now queried directly here at
 * render time and handed to <DownloadCtaClient> as props, so the version,
 * size, checksum and changelog paint with the initial HTML (SEO + no-JS
 * safe). The API routes stay untouched: the download button still hits
 * /api/download and external consumers keep /api/release + /api/changelog.
 *
 * Query/shape mirror the API routes exactly (same orderBy/select/grouping,
 * same size + sha256 measurement from the real artifact on disk), and every
 * failure degrades to the exact same fallbacks the old client fetch-catch
 * paths produced — the page can never 500 because of this section.
 */

/* Last-known release — used when the DB or storage is unavailable at render
 * time (identical to the old client-side fetch fallback), so the conversion
 * section never degrades to a bare error line. Update on release. */
const FALLBACK_RELEASE: ReleaseInfo = {
  version: "2.4.1",
  size: "2.1 MB",
  channel: "stable",
  releasedAt: "2025-11-18T10:00:00.000Z",
  checksum: null,
};

/* Mirrors /api/release's formatting (kept byte-identical so the SSR chips
 * match what the route would have answered). */
function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${bytes} B`;
}

let checksumCache: { file: string; sha256: string } | null = null;

async function fileChecksum(fileName: string): Promise<string | null> {
  if (checksumCache?.file === fileName) return checksumCache.sha256;
  try {
    const filePath = path.join(process.cwd(), "public", "releases", fileName);
    const buf = await readFile(filePath);
    const sha256 = createHash("sha256").update(buf).digest("hex");
    checksumCache = { file: fileName, sha256 };
    return sha256;
  } catch {
    return null;
  }
}

type LatestReleaseRow = {
  version: string;
  channel: string;
  fileName: string;
  releasedAt: Date;
};

async function fetchLatestRelease(): Promise<ReleaseInfo | null> {
  /* findFirst desc-releasedAt + measured size/checksum — same as the route;
   * null (empty DB) maps to the 404 branch → fallback release + error pill. */
  const release = await db.release.findFirst({
    orderBy: { releasedAt: "desc" },
    select: {
      version: true,
      channel: true,
      fileName: true,
      releasedAt: true,
    },
  });
  if (!release) return null;

  const { version, channel, fileName } = release satisfies LatestReleaseRow;
  let size = "—";
  const sha256 = await fileChecksum(fileName);
  if (sha256) {
    try {
      const filePath = path.join(process.cwd(), "public", "releases", fileName);
      size = formatBytes((await stat(filePath)).size);
    } catch {
      /* artifact missing — size stays em-dash */
    }
  }

  return {
    version,
    channel,
    size,
    releasedAt: release.releasedAt.toISOString(),
    checksum: sha256 ? `sha256:${sha256.slice(0, 16)}…${sha256.slice(-8)}` : null,
  };
}

async function fetchChangelogGroups(): Promise<ChangelogGroup[]> {
  /* Same queries + grouping as /api/changelog (entries keep their `sort`
   * order inside each version via the secondary orderBy). Empty tables are
   * a valid "ready" state with an empty list — not an error. */
  const [releases, entries] = await Promise.all([
    db.release.findMany({
      orderBy: { releasedAt: "desc" },
      select: { version: true, channel: true, releasedAt: true },
    }),
    db.changelogEntry.findMany({
      orderBy: [{ version: "desc" }, { sort: "asc" }],
      select: { version: true, tag: true, text: true },
    }),
  ]);

  const byVersion = new Map<string, { tag: string; text: string }[]>();
  for (const entry of entries) {
    const group = byVersion.get(entry.version);
    if (group) {
      group.push({ tag: entry.tag, text: entry.text });
    } else {
      byVersion.set(entry.version, [{ tag: entry.tag, text: entry.text }]);
    }
  }

  return releases.map((release) => ({
    version: release.version,
    channel: release.channel,
    releasedAt: release.releasedAt.toISOString(),
    entries: byVersion.get(release.version) ?? [],
  }));
}

/* Request-scoped memoization: one DB round-trip per render even if the
 * section is ever rendered twice; no cross-request caching, so page-level
 * caching (ISR `revalidate`) stays the page owner's decision. */
const getLatestRelease = cache(fetchLatestRelease);
const getChangelogGroups = cache(fetchChangelogGroups);

type ReleasePayload = { release: ReleaseInfo; releaseState: DataState };
type ChangelogPayload = { changelog: ChangelogGroup[]; changelogState: DataState };

export async function DownloadCta(): Promise<React.ReactElement> {
  /* Release + changelog in parallel; each failure path degrades exactly
   * like the old client fetch-catch did (fallback release + "error" pill /
   * changelog error line). The page itself keeps rendering regardless. */
  const [releasePayload, changelogPayload] = await Promise.all([
    getLatestRelease()
      .then((data): ReleasePayload => (data ? { release: data, releaseState: "ready" } : { release: FALLBACK_RELEASE, releaseState: "error" }))
      .catch((): ReleasePayload => ({ release: FALLBACK_RELEASE, releaseState: "error" })),
    getChangelogGroups()
      .then((groups): ChangelogPayload => ({ changelog: groups, changelogState: "ready" }))
      .catch((): ChangelogPayload => ({ changelog: [], changelogState: "error" })),
  ]);

  return <DownloadCtaClient {...releasePayload} {...changelogPayload} />;
}
