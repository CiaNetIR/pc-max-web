/**
 * PC MAX app releases — the REAL download source (Task 32).
 *
 * The installer is distributed from the application repository
 * (github.com/CiaNetIR/pc-max — canonical owner since the 2026-10-06
 * transfer from DLSDT; old DLSDT URLs 301-redirect), NOT from this
 * website's /releases folder. Release asset names embed the version
 * (PC.MAX_0.4.16_x64-setup.exe), so GitHub's static
 * `releases/latest/download/<asset>` shortcut cannot be used — the latest
 * release must be resolved through the REST API:
 *
 *   GET https://api.github.com/repos/CiaNetIR/pc-max/releases/latest
 *   → assets[] → pick the Windows x64 setup .exe → browser_download_url
 *
 * Everything here is client-safe (no window access at module scope) and
 * degrades gracefully:
 *   - KNOWN_LATEST is the hand-verified current release (2026-09-06) —
 *     it paints with SSR/no-JS and is REAL data, never a fabrication.
 *   - resolveLatestAppRelease() upgrades it live from the API (CORS-open,
 *     unauthenticated 60 req/h/IP) with a sessionStorage cache + in-flight
 *     memo so a whole page view costs at most ONE request.
 *   - On any failure the caller falls back to the releases page URL,
 *     which always serves the newest build.
 */

import { APP_REPO_URL } from "./gh-pages";

/** The app repository's releases page — always the newest tag. */
export const APP_RELEASES_URL = `${APP_REPO_URL}/releases/latest`;

export type AppRelease = {
  /** Release version without the leading "v" — "0.4.16". */
  version: string;
  /** Direct installer download (GitHub redirect to the real asset). */
  url: string;
  /** Release tag with the leading "v" — "v0.4.16". */
  tag: string;
  /** Installer file name — "PC.MAX_0.4.16_x64-setup.exe". */
  fileName: string;
  /** Human-formatted installer size — "7.37 MB". */
  size: string;
  /** ISO publish date. */
  releasedAt: string;
  /** Plain-text release notes (trimmed). */
  notes: string;
  /** SHA-256 of the installer artifact — REAL, measured locally from the
   *  published release asset (Task 35). Only the hand-verified baseline
   *  carries it: the GitHub API exposes no hashes, so live-resolved
   *  releases leave it undefined and the UI falls back to the release
   *  page. Consumers must treat it as pinned to THIS release's version. */
  sha256?: string;
};

/** Hand-verified snapshot of the latest release (update on each app ship).
 * Measured live from github.com/CiaNetIR/pc-max/releases (2026-09-06):
 * tag v0.4.16, asset PC.MAX_0.4.16_x64-setup.exe, 7,727,490 bytes (7.37 MB).
 * The sha256 below was computed locally from the downloaded release asset
 * on 2026-10-06 (Task 35) — verify with Get-FileHash in PowerShell. */
export const KNOWN_LATEST: AppRelease = {
  version: "0.4.16",
  url: "https://github.com/CiaNetIR/pc-max/releases/download/v0.4.16/PC.MAX_0.4.16_x64-setup.exe",
  tag: "v0.4.16",
  fileName: "PC.MAX_0.4.16_x64-setup.exe",
  size: "7.37 MB",
  releasedAt: "2026-09-06T13:14:00.000Z",
  notes: "Windows installer for 0.4.16. The .sig is the auto-updater signature.",
  sha256: "09d8ca4322162ca15c344f0f58dc4cc42eaaa5afa283cfdaece6039bdd7e2b28",
};

const LATEST_API = "https://api.github.com/repos/CiaNetIR/pc-max/releases/latest";
const LIST_API = "https://api.github.com/repos/CiaNetIR/pc-max/releases?per_page=10";
const CACHE_KEY = "pcmax-app-release";
const LIST_CACHE_KEY = "pcmax-app-releases";
const CACHE_TTL = 10 * 60 * 1000;
const LIST_CACHE_TTL = 30 * 60 * 1000;
const FETCH_TIMEOUT = 6000;

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${bytes} B`;
}

/* GitHub API asset shape (only the fields we consume). */
type GhAsset = { name: string; size: number; browser_download_url: string };
type GhRelease = {
  tag_name: string;
  published_at: string;
  body: string | null;
  assets: GhAsset[];
};

/** The Windows installer asset: an .exe that is NOT the updater signature
 * (.sig). Ties are broken toward x64 setup builds. */
function pickInstallerAsset(assets: GhAsset[]): GhAsset | null {
  const exes = assets.filter((a) => a.name.toLowerCase().endsWith(".exe"));
  if (exes.length === 0) return null;
  return (
    exes.find((a) => /x64/i.test(a.name) && /setup/i.test(a.name)) ?? exes[0]
  );
}

function toAppRelease(release: GhRelease): AppRelease | null {
  const asset = pickInstallerAsset(release.assets ?? []);
  if (!asset) return null;
  const notes = (release.body ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return {
    version: release.tag_name.replace(/^v/, ""),
    url: asset.browser_download_url,
    tag: release.tag_name,
    fileName: asset.name,
    size: formatBytes(asset.size),
    releasedAt: release.published_at,
    notes,
  };
}

function readCache(key: string): { data: unknown; expires: number } | null {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { data: unknown; expires: number };
    if (Date.now() > parsed.expires) {
      sessionStorage.removeItem(key);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(key: string, data: unknown, ttl: number): void {
  try {
    sessionStorage.setItem(key, JSON.stringify({ data, expires: Date.now() + ttl }));
  } catch {
    /* storage unavailable (private mode) — every resolve is a fresh fetch */
  }
}

async function ghFetch(url: string): Promise<GhRelease | GhRelease[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/vnd.github+json" },
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`GitHub API ${res.status}`);
    return (await res.json()) as GhRelease;
  } finally {
    clearTimeout(timer);
  }
}

/* In-flight memos — concurrent callers (hero chip + download button +
 * mobile bar all resolving on one page view) share a single request. */
let latestInflight: Promise<AppRelease | null> | null = null;
let listInflight: Promise<AppRelease[] | null> | null = null;

/**
 * Latest release, API-live when possible. Cached in sessionStorage for
 * CACHE_TTL; resolves null on any failure so callers can fall back.
 */
export function resolveLatestAppRelease(): Promise<AppRelease | null> {
  const cached = readCache(CACHE_KEY);
  if (cached && (cached.data as AppRelease)?.url) {
    return Promise.resolve(cached.data as AppRelease);
  }
  if (latestInflight) return latestInflight;
  latestInflight = ghFetch(LATEST_API)
    .then((release) => {
      const app = toAppRelease(release as GhRelease);
      if (app) writeCache(CACHE_KEY, app, CACHE_TTL);
      return app;
    })
    .catch(() => null)
    .finally(() => {
      latestInflight = null;
    });
  return latestInflight;
}

/**
 * Recent releases (newest first) for the changelog panel. Cached with a
 * longer TTL; resolves null on failure.
 */
export function resolveAppReleases(): Promise<AppRelease[] | null> {
  const cached = readCache(LIST_CACHE_KEY);
  if (Array.isArray(cached?.data)) {
    return Promise.resolve((cached as { data: AppRelease[] }).data);
  }
  if (listInflight) return listInflight;
  listInflight = ghFetch(LIST_API)
    .then((releases) => {
      const apps = (releases as GhRelease[])
        .map(toAppRelease)
        .filter((r): r is AppRelease => r !== null);
      if (apps.length > 0) writeCache(LIST_CACHE_KEY, apps, LIST_CACHE_TTL);
      return apps.length > 0 ? apps : null;
    })
    .catch(() => null)
    .finally(() => {
      listInflight = null;
    });
  return listInflight;
}
