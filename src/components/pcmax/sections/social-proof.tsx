import { cache } from "react";
import { db } from "@/lib/db";
import { SocialProofClient, type StatsResponse } from "./social-proof.client";

/*
 * Server wrapper (SSR data owner) for the social-proof strip.
 *
 * The section used to fetch /api/stats on hydration just to light up the
 * live-downloads pill — a HTML → JS → fetch → render waterfall on every
 * visit. The same anonymous aggregates (downloads sum / waitlist count /
 * release count — query and shape mirror the /api/stats route exactly) are
 * now computed here at render time and passed as props, so the real number
 * ships inside the initial HTML (SEO + no-JS see it, AnimatedCounter's
 * SSR-final-value behavior is untouched and still shows real numbers).
 *
 * On any DB failure we pass null — the client hides the live pill, exactly
 * what the old fetch-catch did (the page can never 500 because of this).
 * The route itself stays untouched and keeps serving external consumers.
 */

/* Request-scoped memoization: one aggregate round-trip per render even if
 * the section is ever rendered twice; no cross-request caching, so
 * page-level caching (ISR `revalidate`) stays the page owner's decision. */
const getStats = cache(async (): Promise<StatsResponse | null> => {
  try {
    const [agg, waitlist, releases] = await Promise.all([
      db.release.aggregate({ _sum: { downloads: true } }),
      db.waitlistSubscriber.count(),
      db.release.count(),
    ]);

    return { downloads: agg._sum.downloads ?? 0, waitlist, releases };
  } catch {
    /* DB unavailable — pill stays hidden, static strip still renders */
    return null;
  }
});

export async function SocialProof(): Promise<React.ReactElement> {
  const stats = await getStats();
  return <SocialProofClient stats={stats} />;
}
