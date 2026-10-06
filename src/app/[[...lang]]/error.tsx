"use client";

import { useEffect } from "react";
import { dictionary } from "@/components/pcmax/i18n/dictionary";
import type { Locale } from "@/components/pcmax/i18n/dictionary";
import { RotateCcw } from "lucide-react";

/**
 * Branded segment error boundary. Renders inside the root layout, so it
 * picks up the current locale from <html lang> after hydration.
 */
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const locale: Locale =
    typeof document !== "undefined" && document.documentElement.lang === "fa" ? "fa" : "en";
  const t = dictionary[locale].errorPage;

  useEffect(() => {
    // surface the error for dev diagnostics without breaking the UI
    console.error("[pcmax] segment error:", error?.digest ?? error?.message);
  }, [error]);

  return (
    <main className="relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden px-4 text-center">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,black,transparent)]" aria-hidden="true" />
      <div className="absolute left-1/2 top-1/2 h-[360px] w-[720px] max-w-none -translate-x-1/2 -translate-y-1/2 rounded-full bg-crimson/[0.1] blur-[130px]" aria-hidden="true" />

      <div className="relative">
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-5xl">
          {t.title}
        </h1>
        <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-muted-foreground">{t.sub}</p>
        {/* Digest — the stable error id Next assigns; safe to display in
            production (no raw error.message ever reaches the UI). */}
        {error.digest ? (
          <p className="mt-3 select-all font-mono text-xs tracking-wide text-muted-foreground">
            {error.digest}
          </p>
        ) : null}

        <button
          type="button"
          onClick={reset}
          className="mt-10 inline-flex h-13 items-center gap-2.5 rounded-xl bg-crimson px-7 text-sm font-bold uppercase tracking-wider text-white shadow-lg shadow-crimson/25 transition-colors hover:bg-crimson-bright dark:bg-crimson-bright dark:hover:bg-[#ff4a3e]"
        >
          <RotateCcw className="h-5 w-5" />
          {t.retry}
        </button>
      </div>
    </main>
  );
}
