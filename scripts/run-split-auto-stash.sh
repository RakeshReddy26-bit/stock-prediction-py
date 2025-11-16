#!/usr/bin/env bash
set -euo pipefail

# Safe wrapper: if working tree is dirty, stash changes, run the verbose split
# script, then offer to pop the stash back. Run locally from repo root.

TIMESTAMP=$(date +%Y%m%d%H%M%S)
STASH_NAME="pre-split-${TIMESTAMP}"

echo "Checking for uncommitted changes..."
CHANGES=$(git status --porcelain || true)
if [[ -z "$CHANGES" ]]; then
  echo "Working tree clean — running split directly."
  ./scripts/run-split-auto-verbose.sh
  exit 0
fi

echo "Uncommitted changes detected; creating stash: $STASH_NAME"
git stash push -m "$STASH_NAME"
STASH_REF=$(git stash list | head -n1 | awk -F: '{print $1}') || true
echo "Created stash: ${STASH_REF}" 

echo "Running split (verbose) with stashed changes..."
set +e
./scripts/run-split-auto-verbose.sh
RC=$?
set -e

echo "Split script finished with exit code $RC"

read -p "Restore (pop) your stash now? (y/N) " yn
if [[ "$yn" =~ ^[Yy] ]]; then
  echo "Popping stash $STASH_REF"
  git stash pop --index || true
  echo "Stash popped. If there were merge conflicts, resolve them and continue."
else
  echo "Keeping stash saved. See 'git stash list' to inspect or pop later." 
fi

exit $RC
