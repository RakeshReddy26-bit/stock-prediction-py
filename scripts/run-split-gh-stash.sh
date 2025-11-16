#!/usr/bin/env bash
set -euo pipefail

# Create GitHub repos using `gh`, then run the safe stash -> split flow and push the splits.
# Usage: run locally from repo root. Requires `gh` authenticated and `git-filter-repo` installed.

LOG_DIR="$HOME/splits"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/run-split-gh-$(date +%Y%m%d%H%M%S).log"

echo "Logging run to: $LOG_FILE"

if ! command -v gh >/dev/null 2>&1; then
  echo "gh (GitHub CLI) is required. Install from https://cli.github.com/"; exit 1
fi

# determine authenticated gh user
GH_USER=""
GH_USER=$(gh api user --jq .login 2>/dev/null || true)
if [[ -z "$GH_USER" ]]; then
  read -p "Enter GitHub user/org name to create repos under: " GH_USER
fi

REWASH_REPO="rewash.in"
STOCK_REPO="stock-market-production"

echo "Will create or reuse repos: ${GH_USER}/${REWASH_REPO} and ${GH_USER}/${STOCK_REPO}" | tee -a "$LOG_FILE"

# create repos if they don't exist
for repo in "$REWASH_REPO" "$STOCK_REPO"; do
  if gh repo view "${GH_USER}/${repo}" >/dev/null 2>&1; then
    echo "Repo already exists: ${GH_USER}/${repo}" | tee -a "$LOG_FILE"
  else
    echo "Creating repo: ${GH_USER}/${repo}" | tee -a "$LOG_FILE"
    gh repo create "${GH_USER}/${repo}" --public --confirm 2>&1 | tee -a "$LOG_FILE"
  fi
done

REWASH_REMOTE="git@github.com:${GH_USER}/${REWASH_REPO}.git"
STOCK_REMOTE="git@github.com:${GH_USER}/${STOCK_REPO}.git"

echo "Using remotes:" | tee -a "$LOG_FILE"
echo "  REWASH_REMOTE=${REWASH_REMOTE}" | tee -a "$LOG_FILE"
echo "  STOCK_REMOTE=${STOCK_REMOTE}" | tee -a "$LOG_FILE"

# safe stash flow (similar to run-split-auto-stash.sh) but runs run-split-with-remotes with tracing
TIMESTAMP=$(date +%Y%m%d%H%M%S)
STASH_NAME="pre-split-${TIMESTAMP}"

CHANGES=$(git status --porcelain || true)
if [[ -z "$CHANGES" ]]; then
  echo "Working tree clean — running split with GH-created remotes" | tee -a "$LOG_FILE"
  bash -x -c "REWASH_REMOTE=${REWASH_REMOTE} STOCK_REMOTE=${STOCK_REMOTE} ./scripts/run-split-with-remotes.sh" 2>&1 | tee -a "$LOG_FILE"
  exit 0
fi

echo "Uncommitted changes detected; stashing as: $STASH_NAME" | tee -a "$LOG_FILE"
git stash push -m "$STASH_NAME" | tee -a "$LOG_FILE"
STASH_REF=$(git stash list | head -n1 | awk -F: '{print $1}' || true)
echo "Created stash: ${STASH_REF}" | tee -a "$LOG_FILE"

echo "Running split with GH-created remotes (tracing)" | tee -a "$LOG_FILE"
set +e
bash -x -c "REWASH_REMOTE=${REWASH_REMOTE} STOCK_REMOTE=${STOCK_REMOTE} ./scripts/run-split-with-remotes.sh" 2>&1 | tee -a "$LOG_FILE"
RC=$?
set -e

echo "Split script finished with exit code $RC" | tee -a "$LOG_FILE"

read -p "Restore (pop) your stash now? (y/N) " yn
if [[ "$yn" =~ ^[Yy] ]]; then
  echo "Popping stash ${STASH_REF}" | tee -a "$LOG_FILE"
  git stash pop --index 2>&1 | tee -a "$LOG_FILE" || true
  echo "Stash popped. If there were merge conflicts, resolve them and continue." | tee -a "$LOG_FILE"
else
  echo "Keeping stash saved. Use 'git stash list' to inspect or 'git stash pop' later." | tee -a "$LOG_FILE"
fi

echo "Log saved to: $LOG_FILE"
exit $RC
