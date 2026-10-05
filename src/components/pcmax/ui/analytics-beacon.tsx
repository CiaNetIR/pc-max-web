"use client";

import { useEffect } from "react";

import { IS_STATIC_EXPORT } from "@/lib/gh-pages";

/**
 * First-party, aggregate-only page-view beacon.
 * Fires once per browser session (sessionStorage guard) to /api/analytics.
 * No identifiers are collected — see footer privacy policy.
 */
export function AnalyticsBeacon() {
  useEffect(() => {
    /* Static GitHub Pages flavor: no /api/analytics exists on the static
     * host — never even queue a beacon (avoids a guaranteed 404). */
    if (IS_STATIC_EXPORT) return;
    try {
      if (sessionStorage.getItem("pcmax-pv")) return;
      sessionStorage.setItem("pcmax-pv", "1");

      const payload = JSON.stringify({
        type: "pageview",
        meta: typeof location !== "undefined" ? location.pathname : "/",
      });

      if (typeof navigator !== "undefined" && navigator.sendBeacon) {
        const queued = navigator.sendBeacon(
          "/api/analytics",
          new Blob([payload], { type: "application/json" })
        );
        if (queued) return;
      }
      /* Fallback: no sendBeacon, or the beacon queue rejected the payload. */
      fetch("/api/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: true,
      }).catch(() => {
        /* analytics must never surface an error */
      });
    } catch {
      /* analytics must never break the page */
    }
  }, []);

  return null;
}
