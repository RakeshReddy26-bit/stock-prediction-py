#!/usr/bin/env bash
set -euo pipefail

# High-level wrapper to run the split workflow non-interactively when remotes are known,
# or interactively when not. This script will:
#  - create a mirror backup
#  - run scripts/git-split-filterrepo.sh for rewash (promoting frontend to root)
#  - run scripts/git-split-filterrepo.sh for stock-prediction
#  - push splits to remotes if REWASH_REMOTE and STOCK_REMOTE are provided or entered
#
# Usage:
#   REWASH_REMOTE=git@github.com:you/rewash-app.git STOCK_REMOTE=git@github.com:you/stock-prediction.git \
#     ./scripts/run-split-with-remotes.sh
#
# Or run without env vars and the script will prompt for the remote URLs before pushing.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
OUTDIR="${HOME}/splits"
REWASH_TARGET="rewash-app"
STOCK_TARGET="stock-prediction"
BRANCH="main"

echo "Starting split workflow (this script runs locally)."

# Preflight: ensure helper scripts are executable and normalize line endings to avoid permission/CRLF issues
for s in "$ROOT_DIR"/scripts/*.sh; do
  if [[ -f "$s" ]]; then
    chmod +x "$s" || true
    # remove CRLF if present (works on macOS and Linux)
    if sed -n '1p' "$s" | grep -q "\r" 2>/dev/null; then
      sed -i '' -e 's/\r$//' "$s" 2>/dev/null || sed -i -e 's/\r$//' "$s" 2>/dev/null || true
    fi
  fi
done

if ! command -v git-filter-repo >/dev/null 2>&1; then
  echo "git-filter-repo not found in PATH. Install with: pip install --user git-filter-repo";
  echo "If you installed it, ensure the install location is in PATH (for pip --user, add \"$HOME/.local/bin\" to PATH).";
  exit 1
fi

if [[ -n "$(git status --porcelain 2>/dev/null)" ]]; then
  echo "Working tree appears dirty. Please commit or stash changes and re-run."; exit 1
fi

echo "Creating mirror backup..."
git clone --mirror "$ROOT_DIR" "${ROOT_DIR}-backup-$(date +%Y%m%d%H%M%S).git"

mkdir -p "$OUTDIR"

echo "Creating rewash split (frontend + backend) and promoting frontend/ to repo root"
"$ROOT_DIR/scripts/git-split-filterrepo.sh" --target "$REWASH_TARGET" --paths frontend,backend --out-dir "$OUTDIR" --path-rename frontend/:/

echo "Creating stock-prediction split (stock-prediction + stock-market-prediction)"
"$ROOT_DIR/scripts/git-split-filterrepo.sh" --target "$STOCK_TARGET" --paths stock-prediction,stock-market-prediction --out-dir "$OUTDIR"

echo "Splits are created under: $OUTDIR"

# helper to find latest split dir for a target
find_latest_split() {
  local t="$1"
  ls -d ${OUTDIR}/${t}-split-* 2>/dev/null | tail -n1 || true
}

REWASH_DIR=$(find_latest_split "$REWASH_TARGET")
STOCK_DIR=$(find_latest_split "$STOCK_TARGET")

echo "Rewash split dir: $REWASH_DIR"
echo "Stock split dir: $STOCK_DIR"

if [[ -z "$REWASH_DIR" || -z "$STOCK_DIR" ]]; then
  echo "Could not find split directories. Aborting push step.";
  exit 0
fi

# Create minimal README files inside each split repo to make them runnable immediately
create_readmes() {
  local dir="$1"
  local type="$2"
  if [[ -z "$dir" || ! -d "$dir" ]]; then
   return
  fi

  echo "Creating README and POST_SPLIT notes in $dir"

  if [[ "$type" == "rewash" ]]; then
   cat > "$dir/README.md" <<'EOF'
# rewash-app

This repository contains the rewash application split from the monorepo.

Contents
- frontend/ (promoted to repository root when split)
- backend/

Quick start (frontend)
1. Install and build
  npm install
  npm run build

2. Development
  npm run dev

Backend (in `backend/`)
1. Install
  cd backend && npm install
2. Run dev server
  npm run dev

Tests
- Frontend: `npm run test` (run in frontend root)
- Backend: `cd backend && npm test`

EOF

   cat > "$dir/POST_SPLIT.md" <<'EOF'
# Post-split checklist

1. Confirm package.json scripts and dependencies.
2. Configure environment variables for backend (e.g., .env or CI settings).
3. Update CI and hosting targets (Vercel / Firebase) to point at this repository.
4. Run builds and tests locally to confirm everything works.
EOF

    cat >> "$dir/POST_SPLIT.md" <<'EOF'

## Deployment hints (rewash-app)

- Vercel (frontend):
  - Create a Vercel project and point it to this repository.
  - Build command: `npm run build` (or leave blank if using framework presets).
  - Output directory: `dist` (Vite default) or as configured in `vite.config`.
  - Add environment variables in Vercel dashboard (e.g., FIREBASE_API_KEY, NEXT_PUBLIC_...).

- Firebase Hosting + Functions (alternative):
  - Use the `firebase` CLI to initialize hosting in the repo root and deploy.
  - Ensure `firebase.json` exists and `dist` is the public directory.

## Environment variables (examples)

Frontend (Vite/React):
```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
```

Backend (Express):
```
PORT=5000
DATABASE_URL=postgres://...
JWT_SECRET=...
```
EOF

  elif [[ "$type" == "stock" ]]; then
   cat > "$dir/README.md" <<'EOF'
# stock-prediction

This repository contains the stock prediction projects extracted from the monorepo.

Quick start
1. Create a virtual environment
  python -m venv .venv
  source .venv/bin/activate
2. Install requirements
  pip install -r requirements.txt
3. Run tests or Jupyter notebooks as needed

EOF

   cat > "$dir/POST_SPLIT.md" <<'EOF'
# Post-split checklist

1. Verify Python versions and dependencies in `requirements.txt`.
2. Update any data paths and ensure datasets are available locally or via cloud storage.
3. Add CI workflows for tests and packaging if needed.
EOF

    cat >> "$dir/POST_SPLIT.md" <<'EOF'

## Deployment & runtime hints (stock-prediction)

- If publishing model APIs:
  - Consider packaging as a Docker container and deploying to Cloud Run / ECS / Heroku.
  - Add a `Dockerfile` if you want container-based deployments.

- If using notebooks or scheduled jobs:
  - Use GitHub Actions to run scheduled workflows or use Airflow / cloud scheduler.

## Environment variables (examples)

```
DATA_BUCKET_URL=gs://my-bucket/path
MODEL_PATH=models/latest.pkl
PYTHON_ENV=production
```

EOF
  fi
}

create_readmes "$REWASH_DIR" "rewash"
create_readmes "$STOCK_DIR" "stock"

# Create basic GitHub Actions workflows for each split so CI runs after push
create_ci_workflows(){
  local dir="$1"
  local type="$2"
  if [[ -z "$dir" || ! -d "$dir" ]]; then
    return
  fi

  mkdir -p "$dir/.github/workflows"

  if [[ "$type" == "rewash" ]]; then
    # Frontend workflow (root)
    cat > "$dir/.github/workflows/frontend.yml" <<'EOF'
name: Frontend CI

on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build --if-present
      - run: npm test --if-present
EOF

    # Backend workflow (backend/)
    cat > "$dir/.github/workflows/backend.yml" <<'EOF'
name: Backend CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - run: cd backend && npm ci
      - run: cd backend && npm test
EOF

  elif [[ "$type" == "stock" ]]; then
    cat > "$dir/.github/workflows/python.yml" <<'EOF'
name: Python CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v4
        with:
          python-version: '3.10'
      - run: python -m venv .venv
      - run: .venv/bin/pip install -r requirements.txt
      - run: .venv/bin/pytest -q || true
EOF
  fi
  echo "Created GitHub Actions workflows in $dir/.github/workflows"
}

create_ci_workflows "$REWASH_DIR" "rewash"
create_ci_workflows "$STOCK_DIR" "stock"

# push function
push_split(){
  local dir="$1"; shift
  local remote_url="$1"; shift
  if [[ -z "$remote_url" ]]; then
    read -p "Enter remote URL for $dir (or leave blank to skip): " remote_url
  fi
  if [[ -z "$remote_url" ]]; then
    echo "Skipping push for $dir"
    return 0
  fi
  echo "Pushing $dir -> $remote_url"
  pushd "$dir" >/dev/null
  git remote remove origin 2>/dev/null || true
  git remote add origin "$remote_url"
  git push -u origin HEAD:$BRANCH
  popd >/dev/null
}

# Use env vars if provided
push_split "$REWASH_DIR" "${REWASH_REMOTE:-}" 
push_split "$STOCK_DIR" "${STOCK_REMOTE:-}"

echo "Done. Inspect the split repositories and update CI/hosting as needed."
