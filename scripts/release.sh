#!/usr/bin/env bash
# PC MAX Web — release helper
#
# Bumps the version in package.json, commits, tags, pushes, and creates a
# GitHub Release with the matching CHANGELOG.md section as release notes.
#
# Usage:
#   ./scripts/release.sh 1.1.0 "Multi-Frame polish + light-mode shadows"
#
# Requirements:
#   - git, python3, curl
#   - a remote named "origin" (a token embedded in the remote URL is used
#     automatically), or GH_TOKEN exported in the environment.
set -euo pipefail

VERSION="${1:?Usage: ./scripts/release.sh <version> \"<summary>\"  (e.g. 1.1.0 \"Polish pass\")}"
SUMMARY="${2:?Usage: ./scripts/release.sh <version> \"<summary>\"}"
case "$VERSION" in v*) VERSION="${VERSION#v}" ;; esac
TAG="v${VERSION}"

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

# ── 1. bump package.json ────────────────────────────────────────────────────
python3 - "$VERSION" <<'PY'
import json, sys
with open("package.json") as f:
    pkg = json.load(f)
pkg["version"] = sys.argv[1]
with open("package.json", "w") as f:
    json.dump(pkg, f, indent=2)
    f.write("\n")
print(f"package.json → {sys.argv[1]}")
PY

# ── 2. commit + tag + push ──────────────────────────────────────────────────
git add package.json
git commit -m "release: ${TAG} — ${SUMMARY}"
git tag -a "${TAG}" -m "PC MAX Web ${TAG} — ${SUMMARY}"
git push origin HEAD --tags
echo "pushed ${TAG}"

# ── 3. GitHub Release (best effort) ─────────────────────────────────────────
TOKEN="${GH_TOKEN:-$(git remote get-url origin 2>/dev/null | sed -n 's#.*://\([^@]*\)@.*#\1#p' || true)}"
REMOTE_PATH="$(git remote get-url origin 2>/dev/null | sed -n 's#.*github.com[:/]##; s#\.git$##p' || true)"

if [[ -z "${TOKEN}" || -z "${REMOTE_PATH}" ]]; then
  echo "NOTE: no token found (set GH_TOKEN) — tag pushed, GitHub Release skipped."
  exit 0
fi

python3 - "${TAG}" "${SUMMARY}" <<'PY' > /tmp/pcmax-release-body.json
import json, re, sys
tag, summary = sys.argv[1], sys.argv[2]
body = ""
try:
    text = open("CHANGELOG.md").read()
    m = re.search(rf"^## \[{re.escape(tag.lstrip('v'))}\][^\n]*\n(.*?)(?=^## |\Z)", text, re.M | re.S)
    if m:
        body = m.group(1).strip()
except FileNotFoundError:
    pass
if not body:
    body = summary
print(json.dumps({"tag_name": tag, "name": f"PC MAX Web {tag}", "body": body}))
PY

HTTP_CODE="$(curl -s -o /tmp/pcmax-release-resp.json -w '%{http_code}' -X POST \
  -H "Authorization: token ${TOKEN}" \
  -H "Accept: application/vnd.github+json" \
  -d @/tmp/pcmax-release-body.json \
  "https://api.github.com/repos/${REMOTE_PATH}/releases")"

if [[ "${HTTP_CODE}" == "201" ]]; then
  echo "GitHub Release created: https://github.com/${REMOTE_PATH}/releases/tag/${TAG}"
else
  echo "GitHub Release failed (HTTP ${HTTP_CODE}):"
  cat /tmp/pcmax-release-resp.json
  exit 1
fi

# ── 4. installer artifact — RETIRED (Task 32) ──────────────────────────────
# The website no longer ships installers: downloads resolve the newest
# release of the APP repository (github.com/CiaNetIR/pc-max) live. The old
# local demo artifact (public/releases/*.exe) stays on disk only as the
# /api/download route's legacy fallback and is NOT attached to web releases.
