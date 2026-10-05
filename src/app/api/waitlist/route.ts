import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MAX_EMAIL = 254;
const MAX_BODY_BYTES = 2048;

/* ---- per-IP rate limit: 10 submissions / hour, in-memory ---- */
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60 * 60 * 1000;
const hits = new Map<string, number[]>();
let lastSweep = 0;

function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const first = forwarded?.split(",")[0]?.trim();
  if (first) return first;
  return request.headers.get("x-real-ip")?.trim() || "local";
}

/** true when the IP exceeded the window; sweeps expired entries. */
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
 * POST /api/waitlist — beta newsletter capture.
 * Body: { email: string } → 201 { ok: true, status: "created" }
 *                          200 { ok: true, status: "duplicate" }
 *
 * "duplicate" is deliberately a 2xx: the CTA renders a friendly
 * already-subscribed card from `status`, so a repeat submit is a success —
 * not a client error (see download-cta.tsx WaitlistCard).
 * The unique constraint does the dedup atomically: Prisma P2002 (also on the
 * concurrent double-submit race) resolves to "duplicate", never a 500.
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
  const body = (typeof parsed === "object" && parsed !== null ? parsed : {}) as { email?: unknown };
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

  if (!email || email.length > MAX_EMAIL || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "invalid email" }, { status: 400 });
  }

  // Fast path: an explicit lookup keeps the (common) duplicate submit out of
  // the error log — the unique constraint below still guards the race.
  const existing = await db.waitlistSubscriber
    .findUnique({ where: { email } })
    .catch(() => null);
  if (existing) {
    return NextResponse.json({ ok: true, status: "duplicate" });
  }

  try {
    await db.waitlistSubscriber.create({ data: { email } });
  } catch (err) {
    if ((err as { code?: string }).code === "P2002") {
      return NextResponse.json({ ok: true, status: "duplicate" });
    }
    console.error("[waitlist] insert failed:", err);
    return NextResponse.json({ error: "waitlist unavailable" }, { status: 503 });
  }

  // Best-effort aggregate event — never fails the subscription.
  await db.eventLog
    .create({ data: { type: "waitlist" } })
    .catch((err) => console.error("[waitlist] event log failed:", err));

  return NextResponse.json({ ok: true, status: "created" }, { status: 201 });
}
