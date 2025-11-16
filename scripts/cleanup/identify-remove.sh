#!/usr/bin/env bash
set -euo pipefail

# Interactive helper that lists common top-level paths that are likely moved to new repos
# and offers to move them to an archive folder under `archive/post-split-<timestamp>`.

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ARCHIVE_DIR="$ROOT_DIR/archive/post-split-$(date +%Y%m%d%H%M%S)"

echo "Running identify/remove helper from: $ROOT_DIR"
cd "$ROOT_DIR"

CANDIDATES=(frontend backend stock-prediction stock-market-prediction package.json README.md firebase.json vite.config.js tsconfig.json)

echo "The script will propose moving these top-level entries to: $ARCHIVE_DIR"
echo "Candidates:"
for c in "${CANDIDATES[@]}"; do
  printf ' - %s\n' "$c"
done

read -p "Continue and show which of these exist in the repo? (y/N) " CONT
if [[ ! "$CONT" =~ ^[Yy] ]]; then
  echo "Aborting."; exit 0
fi

mkdir -p "$ARCHIVE_DIR"

for p in "${CANDIDATES[@]}"; do
  if [[ -e "$p" ]]; then
    echo "Found: $p"
    read -p "Move $p -> $ARCHIVE_DIR/? (y/N) " yn
    if [[ "$yn" =~ ^[Yy] ]]; then
      git mv "$p" "$ARCHIVE_DIR/" 2>/dev/null || mv "$p" "$ARCHIVE_DIR/"
      echo "Moved $p -> $ARCHIVE_DIR/"
    else
      echo "Skipped $p"
    fi
  fi
done

echo "Archive complete at: $ARCHIVE_DIR"
echo "Review changes, run tests, then commit if everything looks good."
