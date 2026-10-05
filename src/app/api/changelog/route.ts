import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * GET /api/changelog — version history grouped newest-first.
 * Response: { releases: [{ version, channel, releasedAt, entries: [{ tag, text }] }] }
 * Empty tables → { releases: [] } (collection semantics; no 404, no crash).
 * Public near-static content → short shared-cache window.
 */
export async function GET() {
  try {
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

    // Group entries per version once (O(E)); entries stay in `sort` order
    // within each version because that is the query's secondary ordering.
    const byVersion = new Map<string, { tag: string; text: string }[]>();
    for (const entry of entries) {
      const group = byVersion.get(entry.version);
      if (group) {
        group.push({ tag: entry.tag, text: entry.text });
      } else {
        byVersion.set(entry.version, [{ tag: entry.tag, text: entry.text }]);
      }
    }

    return NextResponse.json(
      {
        releases: releases.map((release) => ({
          version: release.version,
          channel: release.channel,
          releasedAt: release.releasedAt.toISOString(),
          entries: byVersion.get(release.version) ?? [],
        })),
      },
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } }
    );
  } catch {
    return NextResponse.json({ error: "changelog unavailable" }, { status: 503 });
  }
}
