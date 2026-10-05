import { NextResponse, type NextRequest } from "next/server";

/**
 * Locale routing for the bilingual single-page site.
 *
 * PC MAX is one route (`/`) serving EN + FA via the `pcmax-lang` cookie.
 * Cookie-only switching is invisible to crawlers and AIs, so we expose the
 * Persian document as a real, crawlable URL: `/?lang=fa`.
 *
 *  - `?lang=fa|en` sets the locale cookie for this request AND the response
 *    (so the server render, hydration and the next visit all agree).
 *  - A custom `x-pcmax-lang` request header carries the param into the
 *    server components (belt and braces with the cookie).
 *  - EN stays canonical at `/`; `?lang=fa` self-canonicals via layout
 *    generateMetadata and is referenced by hreflang + sitemap alternates.
 */
const COOKIE_KEY = "pcmax-lang";
const HEADER_KEY = "x-pcmax-lang";
const ONE_YEAR = 60 * 60 * 24 * 365;

export default function proxy(request: NextRequest) {
  const lang = request.nextUrl.searchParams.get("lang");
  if (lang !== "fa" && lang !== "en") {
    return NextResponse.next();
  }

  // 1) Make the locale visible to this request's server render.
  request.cookies.set(COOKIE_KEY, lang);
  const headers = new Headers(request.headers);
  headers.set(HEADER_KEY, lang);

  // 2) Forward the modified request + persist the cookie for future visits.
  const response = NextResponse.next({ request: { headers } });
  response.cookies.set(COOKIE_KEY, lang, {
    path: "/",
    maxAge: ONE_YEAR,
    sameSite: "lax",
  });
  return response;
}

export const config = {
  // Only the single page document — not /api, static assets or metadata files.
  matcher: ["/"],
};
