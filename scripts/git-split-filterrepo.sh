#!/usr/bin/env bash
set -euo pipefail

# Safe helper to create a history-preserving split of subpaths using git-filter-repo.
# This script does NOT push anything by default. Run locally from the repo root.
# Requirements: git, git-filter-repo (pip install git-filter-repo) and a clean working tree.

usage() {
  cat <<EOF
Usage: $0 --target <name> --paths <path1,path2,...> [--out-dir <tmp-dir>] [--remote <git-url>] \ 
          [--branch <branch>]

Example: $0 --target rewash-app --paths frontend,backend --remote git@github.com:you/rewash-app.git

This will:
  - clone the current repo into a temporary folder
  - run git-filter-repo to keep only the given paths
  - leave the filtered repo in the temp folder
  - if --remote is provided, you will be prompted to push the branch

WARNING: This script rewrites history inside the temporary clone only. It does not alter your main repo.
EOF
}

TARGET=""
PATHS=""
OUTDIR=""
REMOTE=""
BRANCH="main"
PATH_RENAMES=()

while [[ $# -gt 0 ]]; do
  case "$1" in
    --target) TARGET="$2"; shift 2;;
    --paths) PATHS="$2"; shift 2;;
    --out-dir) OUTDIR="$2"; shift 2;;
    --remote) REMOTE="$2"; shift 2;;
    --branch) BRANCH="$2"; shift 2;;
    --path-rename) PATH_RENAMES+=("$2"); shift 2;;
    -h|--help) usage; exit 0;;
    *) echo "Unknown arg: $1"; usage; exit 1;;
  esac
done

if [[ -z "$TARGET" || -z "$PATHS" ]]; then
  echo "Missing required args."; usage; exit 1
fi

if ! command -v git >/dev/null 2>&1; then
  echo "git not found in PATH"; exit 1
fi

if ! command -v git-filter-repo >/dev/null 2>&1; then
  echo "git-filter-repo not found. Install via: pip install git-filter-repo"; exit 1
fi

# ensure working tree is clean
if [[ -n "$(git status --porcelain)" ]]; then
  echo "Working tree not clean. Please commit or stash changes before running this script."; exit 1
fi

ROOT="$(pwd)"
TMP_PARENT="${OUTDIR:-${ROOT}/.git-splits}"
mkdir -p "$TMP_PARENT"
DEST_DIR="$TMP_PARENT/${TARGET}-split-$(date +%Y%m%d%H%M%S)"

echo "Cloning repository into: $DEST_DIR"
git clone --no-hardlinks "$ROOT" "$DEST_DIR"

cd "$DEST_DIR"

echo "Running git-filter-repo to keep paths: $PATHS"

# build --path arguments
IFS=',' read -r -a PATH_ARR <<< "$PATHS"
FILTER_ARGS=()
for p in "${PATH_ARR[@]}"; do
  FILTER_ARGS+=(--path "$p")
done

RENAME_ARGS=()
for rn in "${PATH_RENAMES[@]}"; do
  # each rn should be in format source/:dest/
  RENAME_ARGS+=(--path-rename "$rn")
done

echo "Filter args: ${FILTER_ARGS[*]}"
if [[ ${#RENAME_ARGS[@]} -gt 0 ]]; then
  echo "Path-rename args: ${RENAME_ARGS[*]}"
fi

# run filter-repo with optional path-rename
git filter-repo "${FILTER_ARGS[@]}" "${RENAME_ARGS[@]}" --force

echo "Filter finished. Remaining top-level paths:" 
ls -1

echo "Repository with filtered history is ready at: $DEST_DIR"

if [[ -n "$REMOTE" ]]; then
  read -p "Add remote '$REMOTE' to this repo and push branch '$BRANCH'? (y/N) " yn
  if [[ "$yn" =~ ^[Yy] ]]; then
    git remote remove origin 2>/dev/null || true
    git remote add origin "$REMOTE"
    git push -u origin HEAD:$BRANCH
    echo "Pushed to $REMOTE ($BRANCH)"
  else
    echo "Skipping push. To push later, run inside $DEST_DIR: git remote add origin <url> && git push -u origin HEAD:$BRANCH"
  fi
fi

echo "Done. Inspect $DEST_DIR, run tests/builds, then optionally create the new repository on your hosting provider and push the branch there."
