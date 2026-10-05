import type { Metadata, Viewport } from "next";
import { cookies, headers } from "next/headers";
import fs from "node:fs";
import path from "node:path";
import { Sora, Vazirmatn } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { LanguageProvider } from "@/components/pcmax/language-context";
import { JsonLd } from "@/components/seo/json-ld";
import { getLocaleMeta, siteConfig } from "@/lib/seo";
import { dictionary, type Locale } from "@/components/pcmax/i18n/dictionary";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  display: "swap",
  /* Preloaded (default): the ONLY webfont that renders above the fold on
   * the canonical EN document (h1/headings via --font-display). On FA it
   * rides along (~34 KB, preloaded but rarely paints a glyph — the navbar
   * wordmark is an image and the RTL display stack resolves Latin through
   * Vazirmatn's latin subset first); next/font preload links are emitted at
   * build time, so per-locale switching is impossible — EN wins the tie. */
});

const vazirmatn = Vazirmatn({
  subsets: ["arabic"],
  variable: "--font-vazirmatn",
  display: "swap",
  /* FA-only above the fold — NEVER preloaded (was: default preload forced
   * the 46 KB arabic cut onto every EN first paint, verified in the network
   * log; EN renders zero Persian glyphs). Loading is fully usage-gated two
   * ways: globals.css wires --font-vazirmatn into font stacks ONLY under
   * html[dir="rtl"], and every @font-face carries a subset unicode-range —
   * so the file is fetched exactly when RTL Persian text is styled, at
   * stylesheet-resolution time (font-display:swap covers the gap; the
   * metric-matched "Vazirmatn Fallback" face keeps CLS at zero). subsets
   * is ignored while preload:false but kept as the correct default if
   * preload is ever re-enabled. */
  preload: false,
});

/* ---------------------------------------------------------------------
 * Ariobarzan — local Persian typeface (designer: Saeid Poonki, source:
 * spacedesign.ir — commercial font, must be purchased).
 *
 * Drop-in contract: place the purchased files in `public/fonts/` as
 *   ariobarzan-regular.woff2  (body text, weight 400)
 *   ariobarzan-bold.woff2     (display/titles, weight 700)
 * (.woff / .ttf variants are auto-detected too; convert with any
 *  ttf→woff2 tool — e.g. `fonttools ttLib.woff2 compress`.)
 *
 * The files are detected once at module scope (cached — never per-request;
 * zero fs cost on the hot path) — the <style> below is injected ONLY when
 * they exist, so the site never fires a 404 font request. Vazirmatn stays
 * as the interim fallback until then. font-display: swap keeps Persian
 * text paintable while the local file streams in. Arabic-script
 * unicode-range keeps Latin text on the system stack in both directions.
 * ------------------------------------------------------------------- */
const ARIOBARZAN_DIR = path.join(process.cwd(), "public", "fonts");
const ARIOBARZAN_RANGE =
  "U+0600-06FF, U+0750-077F, U+08A0-08FF, U+FB50-FDFF, U+FE70-FEFF, U+200C-200F, U+2010-2011";

function findAriobarzan(base: string): { file: string; format: string } | null {
  for (const [ext, format] of [
    ["woff2", "woff2"],
    ["woff", "woff"],
    ["ttf", "truetype"],
  ] as const) {
    const file = `${base}.${ext}`;
    if (fs.existsSync(path.join(ARIOBARZAN_DIR, file))) return { file, format };
  }
  return null;
}

const ariobarzanRegular = findAriobarzan("ariobarzan-regular");
const ariobarzanBold = findAriobarzan("ariobarzan-bold");
/* "full" = regular + bold present → body text may use it too (readable
 * 400 weight). "display-only" = just the Bold cut → titles only, body
 * text stays on Vazirmatn so long-form Persian is never forced bold. */
const ariobarzanMode =
  ariobarzanRegular && ariobarzanBold ? "full" : ariobarzanBold ? "display-only" : null;

const ariobarzanFontFace = [ariobarzanRegular, ariobarzanBold]
  .flatMap((face, i) =>
    face
      ? [
          "@font-face{",
          `font-family:'Ariobarzan';`,
          `src:url('/fonts/${face.file}') format('${face.format}');`,
          `font-weight:${i === 0 ? 400 : 700};`,
          "font-style:normal;",
          "font-display:swap;",
          `unicode-range:${ARIOBARZAN_RANGE};`,
          "}",
        ].join("")
      : []
  )
  .join("");

/* MIME for the <link rel="preload"> hints below (font preloads must carry
 * the exact type so the browser can skip incompatible cuts, and must be
 * CORS-mode — crossOrigin — or the preload misses and the font fetches twice). */
const ARIOBARZAN_MIME: Record<string, string> = {
  woff2: "font/woff2",
  woff: "font/woff",
  ttf: "font/ttf",
};
/* FA-first-paint preloads for the local cut(s): Bold always (display/titles
 * are the above-the-fold unit), Regular only in "full" mode (body text).
 * EN never references these URLs — the @font-face unicode-range plus the
 * [dir="rtl"]-gated font stacks keep them fully dormant in LTR. */
const ariobarzanPreload =
  ariobarzanMode && ariobarzanBold
    ? [
        ariobarzanBold,
        ...(ariobarzanMode === "full" && ariobarzanRegular ? [ariobarzanRegular] : []),
      ]
    : [];

/**
 * Locale resolution order:
 *  1. `x-pcmax-lang` request header — set by proxy from the `?lang=` URL param
 *     (makes `/?lang=fa` a real, crawlable Persian document)
 *  2. `pcmax-lang` cookie — set by the in-page language toggle
 *  3. English default (the canonical document)
 */
async function resolveLocale(): Promise<Locale> {
  const headerStore = await headers();
  const fromParam = headerStore.get("x-pcmax-lang");
  if (fromParam === "fa" || fromParam === "en") return fromParam;
  const cookieStore = await cookies();
  return cookieStore.get("pcmax-lang")?.value === "fa" ? "fa" : "en";
}

/**
 * Locale-aware metadata. EN is the canonical document at `/`; the Persian
 * variant self-canonicals at `/?lang=fa`. hreflang + x-default tell every
 * engine (and AI crawler) that this one page serves two language documents.
 */
export async function generateMetadata(): Promise<Metadata> {
  const locale = await resolveLocale();
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
      canonical: meta.path,
      languages: {
        en: "/",
        fa: "/?lang=fa",
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
      site: siteConfig.twitterHandle,
      creator: siteConfig.twitterHandle,
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
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f7f7" },
    { media: "(prefers-color-scheme: dark)", color: "#070707" },
  ],
  width: "device-width",
  initialScale: 1,
  /* Emits <meta name="color-scheme" content="light dark"> — tells the UA
   * up-front (before globals.css parses) that this document supports both
   * schemes, so native scrollbars/form controls + the canvas background
   * render in the active scheme with no flash. The CSS-level color-scheme
   * (html/.dark in globals.css) stays the per-theme source of truth. */
  colorScheme: "light dark",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await resolveLocale();
  const dir = locale === "fa" ? "rtl" : "ltr";

  return (
    // CRITICAL: font variables live on <html> so Tailwind 4's @theme (:root)
    // can resolve var(--font-sora)/var(--font-vazirmatn). Body text uses the
    // native system stack (SF Pro / Segoe UI) — Apple-style, zero download.
    <html
      lang={locale}
      dir={dir}
      data-ariobarzan={ariobarzanMode ?? undefined}
      suppressHydrationWarning
      className={`${sora.variable} ${vazirmatn.variable}`}
    >
      {/* Local Ariobarzan @font-face — injected only when the purchased
          files exist in public/fonts (see the contract above). */}
      {ariobarzanMode && <style dangerouslySetInnerHTML={{ __html: ariobarzanFontFace }} />}
      {/* FA-only critical-font preloads (same files as the @font-face
          above, so EN requests nothing and FA skips the CSS+glyph round
          trip for the display cut). React hoists these into <head>. */}
      {locale === "fa" &&
        ariobarzanPreload.map((face) => (
          <link
            key={face.file}
            rel="preload"
            href={`/fonts/${face.file}`}
            as="font"
            type={ARIOBARZAN_MIME[face.format]}
            crossOrigin="anonymous"
          />
        ))}
      <body className="antialiased bg-background text-foreground min-h-screen flex flex-col">
        {/* Skip link — first focusable element, a11y + keyboard users (SXO) */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:start-4 focus:z-[200] focus:rounded-full focus:bg-crimson focus:px-5 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-white focus:shadow-lg focus:outline-none"
        >
          {dictionary[locale].common.skipToContent}
        </a>
        <ThemeProvider>
          <LanguageProvider initialLocale={locale}>{children}</LanguageProvider>
        </ThemeProvider>
        <JsonLd locale={locale} />
        <Toaster />
      </body>
    </html>
  );
}
