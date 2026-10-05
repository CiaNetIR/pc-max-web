import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { readFile, stat } from "fs/promises";
import path from "path";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * GET /api/download — serves the actual installer artifact from disk,
 * increments the live download counter atomically and returns the real
 * sha256 in a response header. The button in the CTA points here, so a
 * click is a real download.
 *
 * HEAD mirrors the response headers (type / length / disposition) but does
 * NOT touch the counter or the event log — crawlers and link checkers probe
 * with HEAD and must never inflate the download number.
 */

const RELEASES_DIR = path.join(process.cwd(), "public", "releases");

type LatestRelease = { id: string; fileName: string; version: string };

async function latestRelease(): Promise<LatestRelease | null> {
  return db.release.findFirst({
    orderBy: { releasedAt: "desc" },
    select: { id: true, fileName: true, version: true },
  });
}

/** Resolve a db-stored fileName inside RELEASES_DIR — rejects absolute paths
 * and any `..` traversal so a poisoned row can never escape the folder. */
function resolveArtifact(fileName: string): string | null {
  const resolved = path.resolve(RELEASES_DIR, fileName);
  return resolved.startsWith(RELEASES_DIR + path.sep) ? resolved : null;
}

/** Header-safe ASCII filename (db values must never inject CR/LF or quotes). */
function asciiFileName(fileName: string): string {
  const safe = fileName
    .replace(/["\\\r\n]/g, "")
    .replace(/[^\x20-\x7E]/g, "")
    .trim();
  return safe.length > 0 ? safe : "pcmax-setup.exe";
}

export async function GET() {
  let release: LatestRelease | null = null;
  try {
    release = await latestRelease();
  } catch {
    return NextResponse.json({ error: "download unavailable" }, { status: 503 });
  }
  if (!release) {
    return NextResponse.json({ error: "no release available" }, { status: 404 });
  }

  const filePath = resolveArtifact(release.fileName);
  if (!filePath) {
    return NextResponse.json({ error: "artifact not found" }, { status: 404 });
  }

  const buf = await readFile(filePath).catch(() => null);
  if (!buf) {
    return NextResponse.json({ error: "artifact not found" }, { status: 404 });
  }
  const sha256 = createHash("sha256").update(buf).digest("hex");

  // Atomic in-database increment (single UPDATE … downloads = downloads + 1) —
  // never read-modify-write, so concurrent downloads cannot lose counts.
  // Counter/logging failures must not block the actual file transfer.
  await db.release
    .update({ where: { id: release.id }, data: { downloads: { increment: 1 } } })
    .catch((err) => console.error("[download] counter increment failed:", err));
  await db.eventLog
    .create({ data: { type: "download", meta: release.version } })
    .catch((err) => console.error("[download] event log failed:", err));

  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="${asciiFileName(release.fileName)}"`,
      "Content-Length": String(buf.byteLength),
      "X-Checksum-Sha256": sha256,
      // never cached — every hit must pass through the counter
      "Cache-Control": "no-store",
    },
  });
}

export async function HEAD() {
  const release = await latestRelease().catch(() => null);
  if (!release) {
    return new NextResponse(null, { status: 404 });
  }

  const filePath = resolveArtifact(release.fileName);
  if (!filePath) {
    return new NextResponse(null, { status: 404 });
  }

  const size = await stat(filePath)
    .then((s) => s.size)
    .catch(() => null);
  if (size === null) {
    return new NextResponse(null, { status: 404 });
  }

  return new NextResponse(null, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="${asciiFileName(release.fileName)}"`,
      "Content-Length": String(size),
      "Cache-Control": "no-store",
    },
  });
}
