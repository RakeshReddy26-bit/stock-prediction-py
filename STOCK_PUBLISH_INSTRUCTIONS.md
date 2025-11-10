# How to publish the stock-prediction project to GitHub (quick import)

This repository contains a helper script to quickly publish the `stock-prediction` (or
`stock-market-prediction`) folder to GitHub as a new repository without preserving history.

When to use
- You want the files on GitHub now and don't need previous commit history preserved.

Prerequisites
- `gh` (GitHub CLI) installed and authenticated (run `gh auth login`).
- `git` and `rsync` available on your machine.

Quick steps
1. From the monorepo root run (replace `<GH_USER>` and folder name if needed):

```bash
chmod +x ./scripts/publish_stock_quick.sh
./scripts/publish_stock_quick.sh --folder stock-prediction --repo <GH_USER>/stock-prediction
```

2. The script will create the GitHub repo (if it doesn't exist), copy the folder into a
   temporary git repo, commit, and push to `main`.

3. After the script completes, visit `https://github.com/<GH_USER>/stock-prediction` to verify.

History-preserving alternative
- If you want to preserve git history from the monorepo for the stock project, use the
  `./scripts/run-split-gh-stash.sh` helper instead (requires `git-filter-repo` and `gh`).

Notes
- This quick script intentionally does not preserve history. Use the split scripts when history
  is important.
