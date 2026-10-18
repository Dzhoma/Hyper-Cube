#!/usr/bin/env bash
# Assembles the static site into dist/ for GitHub Pages.
set -euo pipefail
cd "$(dirname "$0")/.."

rm -rf dist
mkdir -p dist

cp index.html dist/
cp -r css dist/css
cp -r js dist/js

# Optional syntax check when Node.js is available.
if command -v node >/dev/null 2>&1; then
  for f in dist/js/*.js; do
    node --check "$f"
  done
fi

echo "Build complete: dist/"
