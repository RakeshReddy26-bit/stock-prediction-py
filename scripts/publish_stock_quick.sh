#!/usr/bin/env bash
set -euo pipefail

# Quick-publish the stock prediction folder to GitHub (no history preservation).
# Usage: run from repo root. Requires: gh (GitHub CLI) installed & authenticated.
# Example: ./scripts/publish_stock_quick.sh --folder stock-prediction --repo myuser/stock-prediction

usage() {
  cat <<EOF
Usage: $0 --folder <local-folder> --repo <gh-user/repo> [--private]

This will create a new GitHub repo (or reuse if exists), copy the folder contents into a temporary
git repo, commit, and push to the new remote as the initial import (no prior history preserved).

Requires: gh (GitHub CLI) and git installed. Run 'gh auth login' if not authenticated.
EOF
}

FOLDER=""
REPO=""
PRIVATE=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --folder) FOLDER="$2"; shift 2;;
    --repo) REPO="$2"; shift 2;;
    --private) PRIVATE=true; shift 1;;
    -h|--help) usage; exit 0;;
    *) echo "Unknown arg: $1"; usage; exit 1;;
  esac
done

if [[ -z "$FOLDER" || -z "$REPO" ]]; then
  usage
  exit 1
fi

if ! command -v gh >/dev/null 2>&1; then
  echo "gh (GitHub CLI) is required. Install from https://cli.github.com/" >&2
  exit 1
fi
if ! command -v git >/dev/null 2>&1; then
  echo "git is required" >&2
  exit 1
fi

if [[ ! -d "$FOLDER" ]]; then
  echo "Folder not found: $FOLDER" >&2
  exit 1
fi

OWNER_REPO="$REPO"
if gh repo view "$OWNER_REPO" >/dev/null 2>&1; then
  echo "Repo already exists: $OWNER_REPO" >&2
else
  echo "Creating repo: $OWNER_REPO"
  if $PRIVATE; then
    gh repo create "$OWNER_REPO" --private --confirm
  else
    gh repo create "$OWNER_REPO" --public --confirm
  fi
fi

TMPDIR=$(mktemp -d -t stock-publish-XXXX)
echo "Preparing temporary repo at: $TMPDIR"

# Copy contents
rsync -a --exclude .git "$FOLDER/" "$TMPDIR/"

pushd "$TMPDIR" >/dev/null
git init
git add .
git commit -m "Initial import of $FOLDER"
git branch -M main
git remote add origin git@github.com:${OWNER_REPO}.git
echo "Pushing to git@github.com:${OWNER_REPO}.git"
git push -u origin main
popd >/dev/null

echo "Publish complete. Temporary repo at: $TMPDIR (you can remove it)"
echo "Visit: https://github.com/${OWNER_REPO}"

exit 0
