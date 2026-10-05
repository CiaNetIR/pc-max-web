#!/usr/bin/env bash
# PC MAX Web — GitHub Pages static-export builder.
#
# Produces a fully static mirror of the website (./out) deployable to GitHub
# Pages at https://dlsdt.github.io/pc-max-web.
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

PAGES_URL="https://dlsdt.github.io/pc-max-web"
REPO_URL="https://github.com/DLSDT/pc-max-web"
INSTALLER="PCMAX-Setup-2.4.1-x64.exe"

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
    -e "s#https://pcmax\.app/api/download#${PAGES_URL}/releases/${INSTALLER}#g" \
    -e "s#https://pcmax\.app/api/release#${REPO_URL}/releases#g" \
    -e "s#https://pcmax\.app/api/changelog#${REPO_URL}/releases#g" \
    -e "s#https://pcmax\.app#${PAGES_URL}#g" \
    "$f"
done

echo "▸ building the static export (output:'export', basePath '/pc-max-web')"
export GH_PAGES_BUILD=1
export NEXT_PUBLIC_STATIC_EXPORT=1
export NEXT_TELEMETRY_DISABLED=1
./node_modules/.bin/next build

echo "✓ static site ready: $WORK/out"
[[ -f "$WORK/out/index.html" ]] || { echo "ERROR: out/index.html missing" >&2; exit 1; }
du -sh "$WORK/out"
