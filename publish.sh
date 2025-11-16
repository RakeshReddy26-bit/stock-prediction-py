#!/usr/bin/env zsh
set -euo pipefail

# Run from the stock_project folder created by the rsync step.
# Usage: chmod +x publish.sh && ./publish.sh

# Ensure we're in the script directory
cd "$(dirname "$0")"

# Create .gitignore if missing
if [ ! -f .gitignore ]; then
  cat > .gitignore <<'EOF'
# Python
__pycache__/
*.py[cod]
*.pyo
*.pyd
*.sqlite3

# Env
.env
.venv/
env/
venv/
.envrc

# Data & models
models/
*.h5
*.keras
*.pkl
*.joblib
data/
*.csv

# OS
.DS_Store

# Node (UI)
node_modules/
dist/
build/

# VSCode
.vscode/
EOF
  echo "Created .gitignore"
else
  echo ".gitignore already exists"
fi

# Create a minimal README if absent
if [ ! -f README.md ]; then
  cat > README.md <<'MD'
# stock-prediction-py

This repository contains the stock prediction microservice and UI.
- API: `src/api`
- Models: stored outside git (large artifacts excluded)
- UI: `ui/`

See `requirements.txt` for Python dependencies.
MD
  echo "Created README.md"
else
  echo "README.md already exists"
fi

# Initialize git repo if needed
if [ ! -d .git ]; then
  git init -b main
  echo "Initialized git repository on branch main"
else
  echo "Git repository already initialized"
fi

# Safety: ensure no large model files are present
if compgen -G "*.h5" > /dev/null || compgen -G "*.pkl" > /dev/null; then
  echo "Warning: Found large artifact files (*.h5, *.pkl) in the folder. They will be included if present."
  echo "If you want them excluded, remove/move them before running this script."
fi

# Add and commit
git add .
# If there is nothing to commit, skip
if git diff --cached --quiet; then
  echo "Nothing to commit"
else
  git commit -m "Initial import of stock-prediction project (clean history)"
  echo "Committed files"
fi

# Add remote (SSH). Replace with HTTPS if you prefer.
REMOTE_SSH="git@github.com:RakeshReddy26-bit/stock-prediction-py.git"
if git remote get-url origin >/dev/null 2>&1; then
  echo "Remote 'origin' already exists: $(git remote get-url origin)"
else
  git remote add origin "$REMOTE_SSH"
  echo "Added remote origin -> $REMOTE_SSH"
fi

# Push
echo "Pushing to origin main (may prompt for SSH passphrase)"
# Ensure current branch is main
if [ "$(git rev-parse --abbrev-ref HEAD)" != "main" ]; then
  git branch -M main
fi

git push -u origin main

echo "Push complete. Check https://github.com/RakeshReddy26-bit/stock-prediction-py"
