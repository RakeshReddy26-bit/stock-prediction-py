#!/usr/bin/env bash
set -euo pipefail

# Deploy the Rewash frontend to Vercel using the Vercel CLI.
# Run this locally from the split repo (frontend at repo root after promotion)
# Requirements: npm install -g vercel, logged in (vercel login)

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <path-to-split-rewash-dir> [--prod]"
  exit 1
fi

REPO_DIR="$1"
PROD=false
if [[ "${2:-}" == "--prod" ]]; then
  PROD=true
fi

if [[ ! -d "$REPO_DIR" ]]; then
  echo "Directory not found: $REPO_DIR"; exit 1
fi

pushd "$REPO_DIR" >/dev/null
echo "Installing frontend dependencies..."
npm ci

echo "Building frontend..."
npm run build

if [[ "$PROD" == true ]]; then
  echo "Deploying to Vercel (production)..."
  vercel --prod
else
  echo "Deploying to Vercel (preview)..."
  vercel
fi

popd >/dev/null
echo "Vercel deploy finished. Check the output above for the deployment URL."
