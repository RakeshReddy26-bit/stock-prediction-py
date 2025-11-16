#!/usr/bin/env bash
set -euo pipefail

# One-shot wrapper that runs the git-filter-repo split created by
# scripts/git-split-filterrepo.sh and optionally pushes the resulting
# filtered repositories to the remotes you provide.
#
# Run this locally from the monorepo root.
# Usage (example):
#   GITHUB_USER=youruser ./scripts/split-and-push.sh \
#     --rewash-repo rewash-app --stock-repo stock-prediction \
#     [--promote-frontend]
#
# The script will:
#  - run the existing scripts/git-split-filterrepo.sh for each target
#  - prompt before pushing; does not force-push the main repo

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

REWASH_REPO_NAME="rewash-app"
STOCK_REPO_NAME="stock-prediction"
OUTDIR="${HOME}/splits"
GITHUB_USER=""
PROMOTE_FRONTEND=false
BRANCH="main"

usage(){
  cat <<EOF
Usage: $0 [--github-user <user>] [--rewash-repo <name>] [--stock-repo <name>] [--out-dir <path>] [--promote-frontend]

Environment:
  GITHUB_USER can also be provided as env var instead of --github-user.

Example:
  GITHUB_USER=youruser $0 --rewash-repo rewash-app --stock-repo stock-prediction --promote-frontend
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --github-user) GITHUB_USER="$2"; shift 2;;
    --rewash-repo) REWASH_REPO_NAME="$2"; shift 2;;
    --stock-repo) STOCK_REPO_NAME="$2"; shift 2;;
    --out-dir) OUTDIR="$2"; shift 2;;
    --promote-frontend) PROMOTE_FRONTEND=true; shift 1;;
    -h|--help) usage; exit 0;;
    *) echo "Unknown arg: $1"; usage; exit 1;;
  esac
done

GITHUB_USER="${GITHUB_USER:-${GITHUB_USER}}"
if [[ -z "$GITHUB_USER" ]]; then
  echo "Please set GITHUB_USER either via --github-user or the GITHUB_USER env var."; exit 1
fi

if ! command -v ./scripts/git-split-filterrepo.sh >/dev/null 2>&1; then
  if [[ ! -f "$ROOT_DIR/scripts/git-split-filterrepo.sh" ]]; then
    echo "Expected helper script at scripts/git-split-filterrepo.sh. Please ensure it exists."; exit 1
  fi
fi

mkdir -p "$OUTDIR"

do_split(){
  local target="$1"; shift
  local paths="$1"; shift
  echo "\n=== Creating split for '$target' keeping paths: $paths ===\n"
  "$ROOT_DIR/scripts/git-split-filterrepo.sh" --target "$target" --paths "$paths" --out-dir "$OUTDIR"
  echo "Created split(s) in: $OUTDIR"
}

push_if_confirm(){
  local split_dir_glob="$1"; shift
  local remote_name="$1"; shift
  local remote_url="$1"; shift

  # find the most recent matching folder
  local dir
  dir=$(ls -d ${OUTDIR}/${split_dir_glob} 2>/dev/null | tail -n1 || true)
  if [[ -z "$dir" || ! -d "$dir" ]]; then
    echo "Cannot find split directory for pattern ${split_dir_glob} under ${OUTDIR}"; return 1
  fi

  echo "\nInspect split repository: $dir"
  echo "To inspect, run: cd '$dir' && ls -la"

  read -p "Push this split repo to remote '$remote_url'? (y/N) " yn
  if [[ "$yn" =~ ^[Yy] ]]; then
    pushd "$dir" >/dev/null
    git remote remove origin 2>/dev/null || true
    git remote add origin "$remote_url"
    echo "Pushing to $remote_url (branch: $BRANCH). This will create the branch on the remote if it doesn't exist." 
    git push -u origin HEAD:$BRANCH
    popd >/dev/null
    echo "Pushed $dir -> $remote_url"
  else
    echo "Skipping push for $dir"
  fi
}

# 1) Create rewash split (frontend + backend)
do_split "$REWASH_REPO_NAME" "frontend,backend"

# optional: promote frontend to repo root
if [[ "$PROMOTE_FRONTEND" == true ]]; then
  echo "\nPromoting frontend/ to repo root inside the split (history-preserving)."
  # find the split dir
  dir=$(ls -d ${OUTDIR}/${REWASH_REPO_NAME}-split-* 2>/dev/null | tail -n1 || true)
  if [[ -n "$dir" && -d "$dir" ]]; then
    pushd "$dir" >/dev/null
    echo "Running path-rename: frontend/:/"
    git filter-repo --path-rename frontend/:/ --force
    popd >/dev/null
    echo "Promotion complete. Inspect $dir"
  else
    echo "Could not find split directory to promote frontend.";
  fi
fi

# 2) Create stock-prediction split
do_split "$STOCK_REPO_NAME" "stock-prediction,stock-market-prediction"

echo "\nAll splits created under: $OUTDIR"

# Ask for remote URLs and push if the user wants
read -p "Do you want me to prompt and push the rewash split to a remote now? (y/N) " PUSH_REWASH
if [[ "$PUSH_REWASH" =~ ^[Yy] ]]; then
  read -p "Enter full Git remote URL for rewash (e.g. git@github.com:USER/${REWASH_REPO_NAME}.git): " REWASH_REMOTE
  push_if_confirm "${REWASH_REPO_NAME}-split-*" "origin" "$REWASH_REMOTE"
fi

read -p "Do you want me to prompt and push the stock split to a remote now? (y/N) " PUSH_STOCK
if [[ "$PUSH_STOCK" =~ ^[Yy] ]]; then
  read -p "Enter full Git remote URL for stock repo (e.g. git@github.com:USER/${STOCK_REPO_NAME}.git): " STOCK_REMOTE
  push_if_confirm "${STOCK_REPO_NAME}-split-*" "origin" "$STOCK_REMOTE"
fi

echo "\nDone. After pushing, update CI/hosting and environment variables for the new repos."
