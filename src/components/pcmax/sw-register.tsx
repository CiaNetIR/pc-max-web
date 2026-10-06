"use client";

import { useEffect } from "react";
import { IS_STATIC_EXPORT, BASE_PATH } from "@/lib/gh-pages";

/* ─────────────────────────────────────────────────────────────────────
 * Service-worker registration — static (GitHub Pages) flavor only.
 *
 * `IS_STATIC_EXPORT` is inlined at build time (false in the SSR/dev
 * flavor → this component is a permanent no-op there). Registration runs
 * after the window `load` event so it never competes with hydration,
 * first paint or the LCP image; any failure is swallowed — the site is
 * fully functional without the worker, it only loses the repeat-visit
 * cache (GitHub Pages' own TTL is 10 minutes).
 * ───────────────────────────────────────────────────────────────────── */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!IS_STATIC_EXPORT) return;
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;

    const register = () => {
      navigator.serviceWorker.register(`${BASE_PATH}/sw.js`).catch(() => {
        /* registration failure must never surface to the user */
      });
    };

    if (document.readyState === "complete") {
      register();
      return;
    }
    window.addEventListener("load", register, { once: true });
    return () => window.removeEventListener("load", register);
  }, []);

  return null;
}
