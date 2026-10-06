#!/usr/bin/env bash
# PC MAX Web — GitHub Pages static-export builder.
#
# Produces a fully static mirror of the website (./out) deployable to GitHub
# Pages at https://cianetir.github.io/pc-max-web.
#
# Usage:
#   bash scripts/gh-pages-build.sh              → build inside an isolated copy
#                                                 at /tmp/pc-max-ghpages (the
#                                                 live project + dev server are
#                                                 never touched)
#   bash scripts/gh-pages-build.sh --in-place   → transform & build the CURRENT
#                                                 checkout (CI only — refuses to
#                                                 run on the dev sandbox)
#
# Pipeline:
#   1. copy the project (source only) into an isolated workdir
#   2. strip the static-incompatible surface: src/app/api (route handlers)
#      and src/proxy.ts (middleware) — unsupported by output:'export'
#   3. recreate a deterministic SQLite DB from prisma/schema.prisma +
#      prisma/seed.ts, so release/changelog/stats are baked at build time
#   4. rewrite public/llms*.txt + security.txt URLs to the Pages deployment
#   5. `next build` with GH_PAGES_BUILD=1 (output:'export', basePath) → out/
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SRC_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
IN_PLACE=0
[[ "${1:-}" == "--in-place" ]] && IN_PLACE=1

PAGES_URL="https://cianetir.github.io/pc-max-web"
REPO_URL="https://github.com/CiaNetIR/pc-max-web"

if [[ $IN_PLACE -eq 1 ]]; then
  if [[ "$SRC_ROOT" == "/home/z/my-project" && "${CI:-}" != "true" ]]; then
    echo "REFUSING: --in-place on the live dev sandbox would delete src/app/api + src/proxy.ts." >&2
    echo "Run without --in-place (isolated copy mode) instead." >&2
    exit 1
  fi
  WORK="$SRC_ROOT"
else
  WORK="/tmp/pc-max-ghpages"
  echo "▸ preparing isolated build copy at $WORK"
  rm -rf "$WORK"
  mkdir -p "$WORK"
  rsync -a \
    --exclude node_modules \
    --exclude .next --exclude .next-ghpages --exclude out \
    --exclude .git \
    --exclude '*.log' \
    --exclude db --exclude .env --exclude '.env.*' \
    --exclude docs --exclude tool-results --exclude upload --exclude download \
    --exclude mini-services --exclude examples --exclude tests --exclude skills \
    --exclude .zscripts --exclude agent-ctx --exclude worklog.md \
    --exclude Caddyfile --exclude prompt --exclude 'local-*' \
    "$SRC_ROOT"/ "$WORK"/
  echo "▸ copying node_modules (isolated copy — the dev server's tree is never touched)"
  cp -a "$SRC_ROOT/node_modules" "$WORK/node_modules"
fi

cd "$WORK"

echo "▸ stripping static-incompatible routes (src/app/api + src/proxy.ts)"
rm -rf src/app/api src/proxy.ts

echo "▸ opting metadata routes into force-static (static-export requirement)"
# Next statically parses route segment config — the literal is appended to the
# BUILD TREE only (the SSR flavor keeps its default per-request behavior).
for f in src/app/manifest.ts src/app/robots.ts src/app/sitemap.ts; do
  [[ -f "$f" ]] || continue
  printf '\n/* appended by scripts/gh-pages-build.sh — required for output:%sexport */\nexport const dynamic = "force-static";\n' "'" >> "$f"
done

echo "▸ recreating the deterministic build database (schema + seed)"
export DATABASE_URL="file:$WORK/db/ghpages-build.db"
mkdir -p db
./node_modules/.bin/prisma generate >/dev/null
./node_modules/.bin/prisma db push --skip-generate --accept-data-loss >/dev/null
bun prisma/seed.ts

echo "▸ rewriting public text-file URLs to the Pages deployment"
for f in public/llms.txt public/llms-full.txt public/.well-known/security.txt; do
  [[ -f "$f" ]] || continue
  sed -i \
    -e "s#https://pcmax\.app/api/release#${REPO_URL}/releases#g" \
    -e "s#https://pcmax\.app/api/changelog#${REPO_URL}/releases#g" \
    -e "s#https://pcmax\.app#${PAGES_URL}#g" \
    "$f"
done

echo "▸ building the static export (output:'export', basePath '/pc-max-web')"
export GH_PAGES_BUILD=1
export NEXT_PUBLIC_STATIC_EXPORT=1
export NEXT_TELEMETRY_DISABLED=1
# Run next build THROUGH BUN (audit 29-a D3): `next build` (export) fails
# under Node >= 24 at /_global-error (workUnitAsyncStorage invariant) on this
# tree — the bun runtime is what CI already proved; pinning it here makes
# local + future-runner builds deterministic.
bun ./node_modules/.bin/next build

echo "▸ promoting the Persian document to /fa/ (GitHub Pages path)"
# out/fa.html is the prerendered [[...lang]] fa route; /fa.html serves at /fa
# via extensionless resolution, but /fa/ (trailing slash) would 404 — move it
# into its own directory so BOTH forms resolve.
if [[ -f "$WORK/out/fa.html" ]]; then
  mkdir -p "$WORK/out/fa"
  mv "$WORK/out/fa.html" "$WORK/out/fa/index.html"
else
  echo "ERROR: out/fa.html missing — the /fa route did not export" >&2
  exit 1
fi

echo "▸ writing the branded 404 page"
# The exported Next 404 (/_not-found) renders OUTSIDE the [[...lang]] root
# layout — a bare <html> with no fonts/dark (POC regression, audit 29-a).
# GitHub Pages serves out/404.html for unknown paths, so ship a fully
# self-contained branded page instead (bilingual, dark, zero deps).
cat > "$WORK/out/404.html" <<'HTML404'
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>404 · PC MAX</title>
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body {
    margin: 0; min-height: 100svh; display: flex; align-items: center; justify-content: center;
    background: #08080a; color: #e7e7ea;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    text-align: center; padding: 2rem;
  }
  .wrap { max-width: 30rem; }
  img { width: 56px; height: 56px; margin-inline-end: .6rem; }
  .code { font-size: 4rem; font-weight: 800; letter-spacing: .04em; color: #ff3b30; margin: 1.2rem 0 .2rem; }
  h1 { font-size: 1.15rem; margin: .4rem 0; color: #e7e7ea; }
  p { color: #9b9ba3; font-size: .95rem; line-height: 1.8; margin: .2rem 0 1.6rem; }
  a.btn {
    display: inline-block; padding: .8rem 1.6rem; border-radius: .75rem;
    background: #ff3b30; color: #fff; font-weight: 700; text-decoration: none;
  }
  a.ghost { color: #9b9ba3; margin-inline-start: 1rem; text-decoration: none; font-size: .9rem; }
  a.ghost:hover { color: #e7e7ea; }
</style>
</head>
<body>
  <main class="wrap">
    <img src="/pc-max-web/brand/pcmax-logo-256.webp" alt="PC MAX logo" width="56" height="56">
    <div class="code">404</div>
    <h1>Lost in optimization.</h1>
    <p>The page you&rsquo;re looking for doesn&rsquo;t exist.<br>صفحه‌ای که دنبالش بودید وجود ندارد.</p>
    <a class="btn" href="/pc-max-web/">Back to home</a>
    <a class="ghost" href="/pc-max-web/fa/">فارسی</a>
  </main>
</body>
</html>
HTML404

# Next also emits _not-found.html with the same bare markup — overwrite it
# with the branded page so every 404 surface is consistent.
[[ -f "$WORK/out/_not-found.html" ]] && cp "$WORK/out/404.html" "$WORK/out/_not-found.html"

echo "✓ static site ready: $WORK/out"
[[ -f "$WORK/out/index.html" ]] || { echo "ERROR: out/index.html missing" >&2; exit 1; }
[[ -f "$WORK/out/fa/index.html" ]] || { echo "ERROR: out/fa/index.html missing" >&2; exit 1; }
du -sh "$WORK/out"
