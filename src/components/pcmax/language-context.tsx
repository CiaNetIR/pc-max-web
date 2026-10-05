"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { dictionary, type Dictionary, type Locale } from "./i18n/dictionary";

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
    window.dispatchEvent(new Event(LOCALE_EVENT));
  }, []);

  const toggleLocale = useCallback(() => {
    setLocale(document.documentElement.lang === "fa" ? "en" : "fa");
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
