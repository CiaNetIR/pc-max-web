"use client";

import { useSyncExternalStore } from "react";
import {
  KNOWN_LATEST,
  resolveLatestAppRelease,
  type AppRelease,
} from "@/lib/app-release";

/*
 * useLatestAppRelease — one shared, live view of the newest PC MAX app
 * release (Task 32).
 *
 * SSR / first paint: the hand-verified KNOWN_LATEST snapshot (real data,
 * baked at build). After hydration the FIRST subscriber kicks off a single
 * API resolve (sessionStorage-cached — see lib/app-release.ts) and every
 * consumer on the page (hero kicker, VER chip, download chips) re-renders
 * with the live value if the app repo has shipped something newer.
 *
 * getServerSnapshot returns a module-level STABLE object so the hydration
 * render matches the server HTML byte-for-byte — the store only mutates
 * after the client-side resolve notifies its listeners.
 */

type ReleaseState = {
  /** "baseline" — KNOWN_LATEST (SSR/no-JS); "live" — API-resolved;
   *  "error" — API unreachable, still showing the real baseline. */
  status: "baseline" | "live" | "error";
  release: AppRelease;
};

const INITIAL_STATE: ReleaseState = { status: "baseline", release: KNOWN_LATEST };

let state: ReleaseState = INITIAL_STATE;
let started = false;
const listeners = new Set<() => void>();

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  if (!started) {
    started = true;
    resolveLatestAppRelease().then((release) => {
      state = release
        ? { status: "live", release }
        : { status: "error", release: KNOWN_LATEST };
      for (const listener of listeners) listener();
    });
  }
  return () => {
    listeners.delete(onChange);
  };
}

const getSnapshot = (): ReleaseState => state;

export function useLatestAppRelease(): ReleaseState {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
