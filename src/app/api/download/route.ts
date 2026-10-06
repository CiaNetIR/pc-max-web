import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { APP_RELEASES_URL } from "@/lib/app-release";

export const dynamic = "force-dynamic";

/**
 * GET /api/download — legacy entry point (Task 34).
 *
 * The user-facing download flow resolves the newest GitHub release
 * client-side (src/lib/app-release.ts); this route no longer streams a
 * local artifact (the demo .exe was removed from public/releases). It now
 * permanently redirects to the app repository's releases page so any old
 * external link still lands on a REAL download, and the click is counted
 * as an anonymous aggregate event (best effort — never blocks the hop).
 *
 * HEAD mirrors the redirect WITHOUT counting — crawlers and link checkers
 * probe with HEAD and must never inflate the download number.
 */

export async function GET() {
  await db.eventLog
    .create({ data: { type: "download", meta: "legacy-redirect" } })
    .catch(() => null);
  return NextResponse.redirect(APP_RELEASES_URL, 307);
}

export async function HEAD() {
  return NextResponse.redirect(APP_RELEASES_URL, 307);
}
