import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const ALLOWED = new Set(["pageview", "section_view", "download"]);
const MAX_META = 120;
const MAX_BODY_BYTES = 2048;

/* ---- tiny in-memory per-IP rate limiter (beacon abuse guard) ---- */
const RATE_LIMIT = 30; // events per IP…
const RATE_WINDOW_MS = 60_000; // …per minute
const hits = new Map<string, number[]>();
let lastSweep = 0;

function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const first = forwarded?.split(",")[0]?.trim();
  if (first) return first;
  return request.headers.get("x-real-ip")?.trim() || "local";
}

/** true when the IP exceeded the window. Old entries are swept so the Map
 * cannot grow without bound (local memory only — nothing is persisted). */
function rateLimited(ip: string): boolean {
  const now = Date.now();
  if (now - lastSweep > RATE_WINDOW_MS) {
    lastSweep = now;
    for (const [key, times] of hits) {
      if (times.every((t) => now - t >= RATE_WINDOW_MS)) hits.delete(key);
    }
  }
  const times = (hits.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  if (times.length >= RATE_LIMIT) {
    hits.set(ip, times);
    return true;
  }
  times.push(now);
  hits.set(ip, times);
  return false;
}

/**
 * POST /api/analytics — first-party, aggregate-only event beacon.
 * Body: { type: string, meta?: string } — no PII is ever accepted: the only
 * stored meta is a short client-chosen string (path / version label); IP is
 * used solely for the in-memory rate window and never persisted.
 *
 * Fire-and-forget contract: storage failures are logged server-side and the
 * beacon still receives 202 — the client never retries and never surfaces an
 * error because of analytics.
 */
export async function POST(request: Request) {
  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "payload too large" }, { status: 413 });
  }
  if (rateLimited(clientIp(request))) {
    return NextResponse.json({ error: "too many requests" }, { status: 429 });
  }

  const raw = await request.text().catch(() => "");
  if (raw.length > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "payload too large" }, { status: 413 });
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "malformed json" }, { status: 400 });
  }
  const body = (typeof parsed === "object" && parsed !== null ? parsed : {}) as {
    type?: unknown;
    meta?: unknown;
  };

  const type = typeof body.type === "string" ? body.type : "";
  if (!ALLOWED.has(type)) {
    return NextResponse.json({ error: "unknown event" }, { status: 400 });
  }

  const meta = typeof body.meta === "string" ? body.meta.slice(0, MAX_META) : null;

  try {
    await db.eventLog.create({ data: { type, meta } });
  } catch (err) {
    console.error("[analytics] event insert failed:", err);
  }

  return NextResponse.json({ ok: true }, { status: 202 });
}
