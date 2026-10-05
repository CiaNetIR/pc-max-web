import { NextResponse } from "next/server";

/**
 * GET /api — public service info for the PC MAX landing API.
 * JSON only; no versions, env or stack details are exposed. Non-GET methods
 * are rejected by Next with 405 (only GET is exported).
 */
export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "pc-max-landing",
    endpoints: [
      "/api/release",
      "/api/changelog",
      "/api/stats",
      "/api/download",
      "/api/waitlist",
      "/api/analytics",
    ],
  });
}
