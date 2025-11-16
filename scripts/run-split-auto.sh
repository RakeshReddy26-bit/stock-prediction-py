#!/usr/bin/env bash
set -euo pipefail

# Auto-run split + push script (pre-filled remotes)
#
# Assumptions made by this script:
# - GitHub username/organization: RakeshReddy26-bit
# - Rewash repo name: rewash.in
# - Stock repo name: stock-market-production
#
# If you want different names, edit the REMOTE variables below before running.

REPO_USER="RakeshReddy26-bit"
REWASH_REPO="rewash.in"
STOCK_REPO="stock-market-production"

REWASH_REMOTE="git@github.com:${REPO_USER}/${REWASH_REPO}.git"
STOCK_REMOTE="git@github.com:${REPO_USER}/${STOCK_REPO}.git"

echo "This script will run the split and push to the following remotes:" 
echo "  Rewash: $REWASH_REMOTE"
echo "  Stock:  $STOCK_REMOTE"

read -p "Continue and run the split (this runs locally and will prompt for credentials if needed)? (y/N) " yn
if [[ ! "$yn" =~ ^[Yy] ]]; then
  echo "Aborted by user."; exit 1
fi

# Ensure helper scripts are executable and normalize CRLF line endings before running
for s in ./scripts/*.sh; do
  if [[ -f "$s" ]]; then
    chmod +x "$s" || true
    # remove CRLF if present
    if sed -n '1p' "$s" | grep -q "\r" 2>/dev/null; then
      sed -i '' -e 's/\r$//' "$s" 2>/dev/null || sed -i -e 's/\r$//' "$s" 2>/dev/null || true
    fi
  fi
done

# Run the split helper script with remotes
REWASH_REMOTE="$REWASH_REMOTE" STOCK_REMOTE="$STOCK_REMOTE" ./scripts/run-split-with-remotes.sh

echo "All done. Inspect ~/splits/ for the generated splits and check the push logs above." 
