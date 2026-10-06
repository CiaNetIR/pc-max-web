"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { dictionary, type Dictionary, type Locale } from "./i18n/dictionary";
import { IS_STATIC_EXPORT, BASE_PATH } from "@/lib/gh-pages";
import { getLocaleMeta } from "@/lib/seo";

type LanguageContextValue = {
  locale: Locale;
  dir: "ltr" | "rtl";
  isRTL: boolean;
  t: Dictionary;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
  /* Static flavor only (audit 29-a): the URL of the OTHER language's real
   * document — `/fa` from the EN page, `/` from the FA page. The navbar
   * toggle renders as a real crawlable <a href> to it (the SSR flavor keeps
   * the in-place client toggle; null there). */
  alternateHref: string | null;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

const STORAGE_KEY = "pcmax-lang";
const COOKIE_KEY = "pcmax-lang";
const LOCALE_EVENT = "pcmax:locale";

/* The <html lang> attribute is the single source of truth (set server-side
   from the pcmax-lang cookie, so no hydration flash). */
function subscribe(onChange: () => void) {
  window.addEventListener(LOCALE_EVENT, onChange);
  return () => window.removeEventListener(LOCALE_EVENT, onChange);
}

function getSnapshot(): Locale {
  return document.documentElement.lang === "fa" ? "fa" : "en";
}

/* Which REAL document is this (static flavor, audit 29-a)? `/fa` (the
 * prerendered Persian route) or `/` (EN canonical). Read as an external
 * store — subscribe to popstate, re-read on demand — so there is no
 * setState-in-effect and no hydration mismatch (the server snapshot is
 * per-instance and document-aware — see getServerFaDoc below;
 * history.replaceState doesn't fire popstate, so the /fa consolidation
 * effect below dispatches it manually). */
function subscribePath(onChange: () => void) {
  window.addEventListener("popstate", onChange);
  return () => window.removeEventListener("popstate", onChange);
}

function getFaDocumentSnapshot(): boolean {
  if (typeof window === "undefined") return false;
  const path = window.location.pathname.replace(/\/+$/, "");
  return path === `${BASE_PATH}/fa`;
}

export function LanguageProvider({
  children,
  initialLocale = "en",
}: {
  children: ReactNode;
  initialLocale?: Locale;
}) {
  const getServerSnapshot = useCallback(() => initialLocale, [initialLocale]);

  const locale = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  /* Static flavor only (audit 29-a — the /fa architecture).
   *
   * BUGFIX (Task 31): the store's server snapshot used the module-level
   * EN-document assumption, so the PRERENDERED /fa document shipped with
   * alternateHref="/fa" — a self-referential "English" toggle in the raw
   * HTML (crawlers + no-JS visitors saw a dead link; only post-hydration
   * did the href flip to "/"). The layout knows which document it is
   * rendering (initialLocale — the same prop that bakes <html lang>), so
   * the per-instance server snapshot below returns the true document: the
   * prerendered /fa HTML now carries href="/" from the first byte AND
   * hydration reads the same value the server rendered (no store swap, no
   * re-render). The SSR/dev flavor is unaffected — alternateHref stays
   * null there regardless of the store's value. */
  const getServerFaDoc = useCallback(() => initialLocale === "fa", [initialLocale]);

  const onFaDocument = useSyncExternalStore(
    subscribePath,
    getFaDocumentSnapshot,
    getServerFaDoc
  );

  const alternateHref = IS_STATIC_EXPORT ? (onFaDocument ? `${BASE_PATH}/` : `${BASE_PATH}/fa`) : null;

  const setLocale = useCallback((next: Locale) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
      document.cookie = `${COOKIE_KEY}=${next}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    } catch {
      /* storage unavailable — in-memory only */
    }
    document.documentElement.lang = next;
    document.documentElement.dir = next === "fa" ? "rtl" : "ltr";
    /* Keep the tab in sync with the active locale (Task 28-a/A7): the SSR
     * document carries the server locale's title/description — a client-side
     * toggle swaps them so the tab/branding never shows the wrong language. */
    const meta = getLocaleMeta(next);
    document.title = meta.title;
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute("content", meta.description);
    window.dispatchEvent(new Event(LOCALE_EVENT));
  }, []);

  const toggleLocale = useCallback(() => {
    setLocale(document.documentElement.lang === "fa" ? "en" : "fa");
  }, [setLocale]);

  /* Static GitHub Pages flavor only. Two real documents exist now — `/`
   * (EN canonical) and `/fa` (Persian):
   *  - On `/`: restore the visitor's locale right after hydration (a
   *    `?lang=fa|en` URL param wins and is CONSOLIDATED onto /fa via
   *    history.replaceState — legacy share-links stop advertising a URL
   *    that serves the EN document), then the stored preference. Runs
   *    post-hydration as a plain state update — no hydration mismatch.
   *  - On `/fa`: the document IS Persian — never flip it back client-side
   *    (the toggle is a link to `/` instead). The SSR flavor resolves the
   *    locale server-side and skips all of this. */
  useEffect(() => {
    if (!IS_STATIC_EXPORT) return;
    const path = window.location.pathname.replace(/\/+$/, "");
    if (path === `${BASE_PATH}/fa`) return;
    try {
      const param = new URLSearchParams(window.location.search).get("lang");
      const stored = window.localStorage.getItem(STORAGE_KEY);
      const next =
        param === "fa" || param === "en"
          ? param
          : stored === "fa" || stored === "en"
            ? stored
            : null;
      if (next && next !== document.documentElement.lang) {
        setLocale(next);
        /* Legacy `?lang=fa` on the EN document → the real /fa URL (no search
         * param, no duplicate signal). A reload then serves the true Persian
         * prerender. replaceState fires no popstate — dispatch it so the
         * path store (and alternateHref) follow. */
        if (next === "fa" && param === "fa") {
          window.history.replaceState(null, "", `${BASE_PATH}/fa`);
          window.dispatchEvent(new Event("popstate"));
        }
      }
    } catch {
      /* storage unavailable — stay on the prerendered locale */
    }
  }, [setLocale]);

  /* Stable identity: the value changes ONLY when the locale actually
   * changes. Unrelated parent re-renders (e.g. theme toggles) reuse the
   * same object, so no useLanguage consumer re-renders — and nothing
   * below the provider (hero GPU canvas included) is needlessly torn
   * down. A locale switch re-renders consumers in place (React reconciles
   * the same tree — no remount). */
  const value = useMemo<LanguageContextValue>(
    () => ({
      locale,
      dir: locale === "fa" ? "rtl" : "ltr",
      isRTL: locale === "fa",
      t: dictionary[locale],
      setLocale,
      toggleLocale,
      alternateHref,
    }),
    [locale, setLocale, toggleLocale, alternateHref]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
