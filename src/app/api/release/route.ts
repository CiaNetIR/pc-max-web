import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { readFile, stat } from "fs/promises";
import path from "path";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * GET /api/release — live release metadata from the database + the REAL
 * artifact on disk (size + sha256 are measured, never hardcoded).
 * 404 when no release exists (empty DB), 503 only on storage errors.
 * Public near-static fact sheet → short shared-cache window.
 */

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

type LatestRelease = {
  version: string;
  channel: string;
  fileName: string;
  releasedAt: Date;
  downloads: number;
};

export async function GET() {
  let release: LatestRelease | null = null;
  try {
    release = await db.release.findFirst({
      orderBy: { releasedAt: "desc" },
      select: {
        version: true,
        channel: true,
        fileName: true,
        releasedAt: true,
        downloads: true,
      },
    });
  } catch {
    return NextResponse.json({ error: "release unavailable" }, { status: 503 });
  }
  if (!release) {
    return NextResponse.json({ error: "release not found" }, { status: 404 });
  }

  let size = "—";
  const sha256 = await fileChecksum(release.fileName);
  if (sha256) {
    try {
      const filePath = path.join(process.cwd(), "public", "releases", release.fileName);
      size = formatBytes((await stat(filePath)).size);
    } catch {
      /* artifact missing — size stays em-dash */
    }
  }

  return NextResponse.json(
    {
      product: "PC MAX",
      version: release.version,
      channel: release.channel,
      size,
      platform: "windows",
      architecture: "x64",
      releasedAt: release.releasedAt.toISOString(),
      checksum: sha256 ? `sha256:${sha256.slice(0, 16)}…${sha256.slice(-8)}` : null,
      downloads: release.downloads,
    },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } }
  );
}
