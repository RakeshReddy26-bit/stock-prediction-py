# Splitting this monorepo into history-preserving repos

This document describes two safe ways to split the monorepo into separate repositories while preserving history.

High-level choices
- git-filter-repo (recommended): Rewrites history to keep only specified paths. Fast, precise, and ideal when you need to keep multiple subpaths together (e.g., `frontend/` + `backend/`). Requires you to run commands locally.
- git subtree split (alternative): Works for splitting a single subdirectory and pushing it to a new repo. Simpler but less flexible when you want to combine multiple folders with their histories.

Preparations (run locally)
1. Backup your repository (important):

```bash
# make a bare mirror backup
git clone --mirror . ../myusersite-backup.git

# or a full clone copy
cd ..
cp -a myusersite myusersite-backup-copy
```

2. Install git-filter-repo (if you choose that approach):

```bash
# recommended via pip
pip install git-filter-repo
# or see https://github.com/newren/git-filter-repo for platform-specific installs
```

Paths we recommend splitting

- Rewash app:
  - `frontend/`
  - `backend/`
  - optionally include `README.md`, `package.json`, `tsconfig.json` if they are relevant

- Stock prediction app:
  - `stock-prediction/`
  - `stock-market-prediction/`
  - `requirements.txt`, `README.md` as needed

Recommended approach (git-filter-repo) — preserves history for multiple folders together

1. From the repo root, run the helper script added at `scripts/git-split-filterrepo.sh` (example):

```bash
# create rewash-app split keeping frontend and backend
./scripts/git-split-filterrepo.sh --target rewash-app --paths frontend,backend --out-dir ~/splits

# create stock-prediction split keeping both stock-related folders
./scripts/git-split-filterrepo.sh --target stock-prediction --paths stock-prediction,stock-market-prediction --out-dir ~/splits
```

2. Inspect the generated folders (e.g., `~/splits/rewash-app-split-YYYYMMDDHHMMSS`). Run `ls -la`, `npm install`, run builds/tests there.

3. Create a new remote repository on GitHub/GitLab (e.g., `rewash-app`) and push from inside the split folder:

```bash
# inside the split folder
git remote add origin git@github.com:youruser/rewash-app.git
git push -u origin main
```

Alternative: git subtree (single-folder splits)

```bash
# split frontend only into branch
git subtree split -P frontend -b split-frontend
# add new remote (created on hosting) and push
git remote add rewash-frontend git@github.com:youruser/rewash-frontend.git
git push rewash-frontend split-frontend:main
```

Notes and tips
- Always make backups before rewriting history.
- After pushing the new repositories, update any CI/CD or hosting configuration (Vercel, Firebase) to point at the new repos.
- If you want the new repositories to have the frontend code at the repository root (not inside a `frontend/` folder), you can either run additional `git filter-repo --path-rename frontend/:/` operations or move files inside the split repo and commit — prefer `--path-rename` during filter-repo run for history-preserving renames.
- If you want me to produce commands to rename paths inside the filtered repo automatically, tell me which layout you prefer (keep `frontend/` + `backend/` directories or promote them to repo root).

Next steps I can do for you
- Produce a one-shot command set tailored to your GitHub account and repository names (I can generate exact commands; you'll run them locally).
- Modify the script to path-rename (promote frontend to root) if desired.
- Provide a post-split checklist (update package.json, CI, README, env vars) and minimal README for each new repo.