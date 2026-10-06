import type { Metadata, Viewport } from "next";
import { cookies, headers } from "next/headers";
import { LanguageProvider } from "@/components/pcmax/language-context";
import { HydrationMarker } from "@/components/pcmax/hydration-marker";
import { ServiceWorkerRegister } from "@/components/pcmax/sw-register";
import { TapFocusRelease } from "@/components/pcmax/tap-focus-release";
import { JsonLd } from "@/components/seo/json-ld";
import { getLocaleMeta, siteConfig } from "@/lib/seo";
import { dictionary, type Locale } from "@/components/pcmax/i18n/dictionary";
import { IS_STATIC_EXPORT, BASE_PATH } from "@/lib/gh-pages";
import { Toaster } from "@/components/ui/toaster";
import "../globals.css";

/* ---------------------------------------------------------------------
 * The TweakFa font pair, self-hosted (downloaded from tweakfa.com
 * phoenix-landing/fonts, woff2 only):
 *   IRANYekanX — Persian face, 5 weights (400/500/600/700/800)
 *   Poppins    — Latin face (400/600/700) + digit subsets
 *
 * The signature TweakFa move: Poppins DIGITS (U+0030-0039) are declared
 * UNDER the 'IRANYekanX' family with a unicode-range, so Latin digits
 * inside Persian text render in Poppins while every other glyph renders
 * in IRANYekanX — byte-identical to the reference site's typography.
 *
 * @font-face lives in an injected <style> (not globals.css) because CSS
 * url() refs to /public are NOT basePath-prefixed in the static export —
 * the injected tag interpolates BASE_PATH explicitly (the proven pattern
 * from the old Ariobarzan contract). font-display:swap throughout.
 * ------------------------------------------------------------------- */
type LocalFace = { family: string; file: string; weight: number; range?: string };

const LOCAL_FACES: LocalFace[] = [
  { family: "IRANYekanX", file: "IRANYekanX-Regular.woff2", weight: 400 },
  { family: "IRANYekanX", file: "IRANYekanX-Medium.woff2", weight: 500 },
  { family: "IRANYekanX", file: "IRANYekanX-DemiBold.woff2", weight: 600 },
  { family: "IRANYekanX", file: "IRANYekanX-Bold.woff2", weight: 700 },
  { family: "IRANYekanX", file: "IRANYekanX-ExtraBold.woff2", weight: 800 },
  /* digits AFTER the base faces — later declaration wins for U+0030-0039 */
  { family: "IRANYekanX", file: "Poppins-Regular.digits.woff2", weight: 400, range: "U+0030-0039" },
  { family: "IRANYekanX", file: "Poppins-Regular.digits.woff2", weight: 500, range: "U+0030-0039" },
  { family: "IRANYekanX", file: "Poppins-SemiBold.digits.woff2", weight: 600, range: "U+0030-0039" },
  { family: "IRANYekanX", file: "Poppins-Bold.digits.woff2", weight: 700, range: "U+0030-0039" },
  { family: "IRANYekanX", file: "Poppins-Bold.digits.woff2", weight: 800, range: "U+0030-0039" },
  { family: "Poppins", file: "Poppins-Regular.latin.woff2", weight: 400 },
  { family: "Poppins", file: "Poppins-SemiBold.latin.woff2", weight: 600 },
  { family: "Poppins", file: "Poppins-Bold.latin.woff2", weight: 700 },
];

const localFontFace = LOCAL_FACES.map((f) => {
  const range = f.range ? `unicode-range:${f.range};` : "";
  return `@font-face{font-family:'${f.family}';font-weight:${f.weight};src:url('${BASE_PATH}/fonts/${f.file}') format('woff2');${range}font-display:swap;}`;
}).join("");

/* Above-the-fold preloads per locale (tiny subsets): EN paints Poppins
 * (canonical document), FA paints IRANYekanX (a real prerendered /fa
 * document since the [[...lang]] route — both flavors). */
const FONT_PRELOADS: Record<Locale, string[]> = {
  en: ["Poppins-Regular.latin.woff2", "Poppins-SemiBold.latin.woff2", "Poppins-Bold.latin.woff2"],
  fa: ["IRANYekanX-Regular.woff2", "IRANYekanX-Bold.woff2", "IRANYekanX-ExtraBold.woff2"],
};

/* Route params for the optional catch-all root segment `[[...lang]]`:
 * `undefined`/`[]` → `/` (EN canonical), `["fa"]` → `/fa` (Persian). */
type LangRouteParams = Promise<{ lang?: string[] }>;

/**
 * Locale resolution order (audit 29-a — the /fa architecture):
 *  1. ROUTE SEGMENT — `/fa` is a real, crawlable, self-canonical Persian
 *     document (prerendered in the static export via generateStaticParams,
 *     SSR'd in dev). This is the ONLY construction where the ROOT layout
 *     itself can bake `<html lang dir>` at build time.
 *  2. `x-pcmax-lang` request header — set by proxy from the `?lang=` URL
 *     param (legacy share-links; the client later consolidates them onto
 *     /fa via history.replaceState)
 *  3. `pcmax-lang` cookie — set by the in-page language toggle (SSR flavor)
 *  4. English default (the canonical document)
 */
async function resolveLocale(routeLang?: string[]): Promise<Locale> {
  /* The route segment wins over everything — /fa IS the Persian document
   * in both flavors (checked BEFORE the static short-circuit so the
   * prerendered /fa page bakes lang=fa dir=rtl). */
  if (routeLang?.[0] === "fa") return "fa";
  /* Static GitHub Pages flavor, `/` document: exactly ONE canonical EN
   * page is prerendered and no request exists to read headers/cookies
   * from. Persian visitors get their locale restored client-side right
   * after hydration (see language-context.tsx) — or land on /fa directly. */
  if (IS_STATIC_EXPORT) return "en";
  const headerStore = await headers();
  const fromParam = headerStore.get("x-pcmax-lang");
  if (fromParam === "fa" || fromParam === "en") return fromParam;
  const cookieStore = await cookies();
  return cookieStore.get("pcmax-lang")?.value === "fa" ? "fa" : "en";
}

/**
 * Locale-aware metadata. EN is the canonical document at `/`; the Persian
 * variant self-canonicals at `/fa` (a real prerendered document since the
 * [[...lang]] route). hreflang + x-default tell every engine (and AI
 * crawler) that this one page serves two language documents.
 */
export async function generateMetadata({
  params,
}: {
  params: LangRouteParams;
}): Promise<Metadata> {
  const { lang } = await params;
  const locale = await resolveLocale(lang);
  const meta = getLocaleMeta(locale);
  const isFa = locale === "fa";

  return {
    metadataBase: new URL(siteConfig.url),
    title: {
      default: meta.title,
      template: "%s | PC MAX",
    },
    description: meta.description,
    keywords: [...siteConfig.keywords],
    authors: [{ name: "PC MAX Team", url: siteConfig.url }],
    creator: "PC MAX",
    publisher: "PC MAX",
    applicationName: siteConfig.name,
    category: "utilities",
    alternates: {
      /* NOTE: Next auto-applies basePath to metadata-resolved URLs
       * (canonical/hreflang/og) in the static flavor — values here must stay
       * ROOT-relative ("/", "/fa") or they get double-prefixed. The FA
       * document is a real prerendered route since the [[...lang]] segment:
       * en → / (canonical), fa → /fa, x-default → /. */
      canonical: meta.path,
      languages: {
        en: "/",
        fa: "/fa",
        "x-default": "/",
      },
    },
    openGraph: {
      type: "website",
      locale: meta.ogLocale,
      alternateLocale: isFa ? ["en_US"] : ["fa_IR"],
      url: meta.path,
      siteName: siteConfig.name,
      title: meta.ogTitle,
      description: meta.description,
      images: [
        {
          url: siteConfig.ogImage,
          width: 1200,
          height: 630,
          alt: isFa
            ? "پی‌سی‌مکس — پلتفرم بهینه‌سازی بازی روی ویندوز"
            : "PC MAX — Windows Gaming Optimization Platform",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      /* site/creator handles dropped (audit 29-b D7): @pcmaxapp is a 404
       * profile — card metadata should not reference a dead account. */
      title: meta.ogTitle,
      description: meta.description,
      images: [
        {
          url: siteConfig.ogImage,
          alt: isFa
            ? "پی‌سی‌مکس — پلتفرم بهینه‌سازی بازی روی ویندوز"
            : "PC MAX — Windows Gaming Optimization Platform",
        },
      ],
    },
    // Icons come from file conventions: src/app/icon.png + src/app/apple-icon.png
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
      },
    },
  };
}

export const viewport: Viewport = {
  /* Dark-only since the Guardian redesign (Task 26) — the light theme no
   * longer exists; a single dark theme-color keeps the UA chrome matched. */
  themeColor: "#08080a",
  width: "device-width",
  initialScale: 1,
  /* Emits <meta name="color-scheme" content="dark"> — native scrollbars,
   * form controls and the canvas background render dark from the first
   * frame with no flash. :root/.dark in globals.css are identical values. */
  colorScheme: "dark",
};

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: LangRouteParams;
}>) {
  const { lang } = await params;
  const locale = await resolveLocale(lang);
  const dir = locale === "fa" ? "rtl" : "ltr";

  return (
    /* Fonts are self-hosted and resolved by family name ('Poppins' LTR /
     * 'IRANYekanX' RTL — see globals.css @theme + html[dir="rtl"] stacks);
     * no next/font variables are needed on <html> anymore. */
    <html
      lang={locale}
      dir={dir}
      suppressHydrationWarning
      /* `dark` is pinned server-side so the very first paint already
       * renders the Guardian dark palette; :root/.dark in globals.css carry
       * identical values (dark-only site since the Task 26 redesign). */
      className="dark"
    >
      {/* The TweakFa font pair — @font-face with BASE_PATH-aware urls so
          both the SSR and static flavors resolve /fonts correctly.
          href+precedence let React hoist this <style> into <head> (a raw
          <style> inside <html> is invalid HTML + a hydration error). */}
      <style
        href="pcmax-local-fonts"
        precedence="font-face"
        dangerouslySetInnerHTML={{ __html: localFontFace }}
      />
      {/* Above-the-fold preloads for the active locale (tiny woff2 cuts,
          CORS-mode so the preload matches the font fetch). */}
      {FONT_PRELOADS[locale].map((file) => (
        <link
          key={file}
          rel="preload"
          href={`${BASE_PATH}/fonts/${file}`}
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      ))}
      <body className="antialiased bg-background text-foreground min-h-screen flex flex-col">
        {/* Progressive enhancement: flags React as mounted — pairs with the
            `html:not(.hydrated)` override at the end of globals.css so the
            pre-hydration (slow-JS / no-JS) page never renders blank. */}
        <HydrationMarker />
        {/* Pointer taps must not leave a focus box painted on cards/menu
            items (Task 32) — keyboard focus rings are preserved. */}
        <TapFocusRelease />
        {/* Static-flavor-only service worker (repeat-visit cache layer —
            SSR/dev never registers it). Loaded after window load. */}
        <ServiceWorkerRegister />
        {/* Skip link — first focusable element, a11y + keyboard users (SXO) */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:start-4 focus:z-[200] focus:rounded-full focus:bg-crimson focus:px-5 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-white focus:shadow-lg focus:outline-none"
        >
          {dictionary[locale].common.skipToContent}
        </a>
        {/* Dark theme is pinned via html class="dark" + the color-scheme
            viewport meta — the next-themes wrapper was retired with the
            audit 29-c purge (dark-only site, zero useTheme consumers). */}
        <LanguageProvider initialLocale={locale}>{children}</LanguageProvider>
        <JsonLd locale={locale} />
        <Toaster />
      </body>
    </html>
  );
}
