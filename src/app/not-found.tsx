import Link from "next/link";
import { cookies } from "next/headers";
import { IS_STATIC_EXPORT } from "@/lib/gh-pages";
import { dictionary } from "@/components/pcmax/i18n/dictionary";
import { ArrowLeft } from "lucide-react";

/**
 * Branded 404 — renders inside the root layout (fonts/theme/SEO intact).
 * Locale comes from the same `pcmax-lang` cookie the layout reads, so the
 * page speaks the visitor's language with zero client JS.
 */
export default async function NotFound() {
  /* Static GitHub Pages flavor: one prerendered 404 document (EN). The SSR
   * flavor reads the locale cookie as before. */
  let locale: "en" | "fa" = "en";
  if (!IS_STATIC_EXPORT) {
    const cookieStore = await cookies();
    if (cookieStore.get("pcmax-lang")?.value === "fa") locale = "fa";
  }
  const t = dictionary[locale].error404;

  return (
    <main className="relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden px-4 text-center">
      {/* ambient */}
      <div className="absolute inset-0 bg-grid [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,black,transparent)]" aria-hidden="true" />
      <div className="absolute start-1/2 top-1/2 h-[360px] w-[720px] max-w-none -translate-x-1/2 -translate-y-1/2 rounded-full bg-crimson/[0.1] blur-[130px]" aria-hidden="true" />

      <div className="relative">
        <p
          aria-hidden="true"
          className="font-display text-[clamp(7rem,22vw,16rem)] font-extrabold leading-none tracking-tighter text-transparent [-webkit-text-stroke:2px_var(--border)]"
        >
          404
        </p>

        <h1 className="font-display -mt-4 text-3xl font-extrabold tracking-tight text-foreground sm:text-5xl">
          {t.title}
        </h1>
        <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-muted-foreground">{t.sub}</p>

        <Link
          href="/"
          className="mt-10 inline-flex h-13 items-center gap-2.5 rounded-xl bg-crimson px-7 text-sm font-bold uppercase tracking-wider text-white shadow-lg shadow-crimson/25 transition-colors hover:bg-crimson-bright dark:bg-crimson-bright dark:hover:bg-[#ff4a3e]"
        >
          <ArrowLeft className="h-5 w-5 rtl:rotate-180" />
          {t.cta}
        </Link>
      </div>
    </main>
  );
}
