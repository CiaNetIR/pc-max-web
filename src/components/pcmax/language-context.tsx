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
import { IS_STATIC_EXPORT } from "@/lib/gh-pages";
import { getLocaleMeta } from "@/lib/seo";

type LanguageContextValue = {
  locale: Locale;
  dir: "ltr" | "rtl";
  isRTL: boolean;
  t: Dictionary;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
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

export function LanguageProvider({
  children,
  initialLocale = "en",
}: {
  children: ReactNode;
  initialLocale?: Locale;
}) {
  const getServerSnapshot = useCallback(() => initialLocale, [initialLocale]);

  const locale = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

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

  /* Static GitHub Pages flavor only: the single prerendered document is EN
   * (no proxy/cookie SSR on a static host). Restore the visitor's locale
   * right after hydration — a `?lang=fa|en` URL param wins (shareable links
   * keep working), then the stored preference. Runs post-hydration as a
   * plain state update, so there is no hydration mismatch. The SSR flavor
   * resolves the locale server-side and skips this entirely. */
  useEffect(() => {
    if (!IS_STATIC_EXPORT) return;
    try {
      const param = new URLSearchParams(window.location.search).get("lang");
      const stored = window.localStorage.getItem(STORAGE_KEY);
      const next =
        param === "fa" || param === "en"
          ? param
          : stored === "fa" || stored === "en"
            ? stored
            : null;
      if (next && next !== document.documentElement.lang) setLocale(next);
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
    }),
    [locale, setLocale, toggleLocale]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
