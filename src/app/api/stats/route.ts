import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * GET /api/stats — aggregate, anonymous numbers for the social-proof strip.
 * Response: { downloads, waitlist, releases }
 * Short shared-cache window: fresh enough for the live badge, cheap for bots.
 */
export async function GET() {
  try {
    const [agg, waitlist, releases] = await Promise.all([
      db.release.aggregate({ _sum: { downloads: true } }),
      db.waitlistSubscriber.count(),
      db.release.count(),
    ]);

    return NextResponse.json(
      { downloads: agg._sum.downloads ?? 0, waitlist, releases },
      { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" } }
    );
  } catch {
    return NextResponse.json({ error: "stats unavailable" }, { status: 503 });
  }
}
