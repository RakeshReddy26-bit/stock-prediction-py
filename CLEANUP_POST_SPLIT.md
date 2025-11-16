# Cleanup & migration checklist after splitting the monorepo

This checklist helps you safely clean up the original monorepo after you've verified the split repositories (rewash-app and stock-prediction). Do NOT run deletions until you've confirmed the new repos work and backups exist.

1) VERIFY SPLITS
- Inspect split folders under `~/splits/` and run smoke tests (builds/tests) there. Confirm both repos build and tests pass.
- Make sure you've pushed the split repos to GitHub and CI passed (optional but recommended).

2) BACKUP ORIGINAL REPO
- Create an extra full clone or mirror before removing anything:
```
cd ..
git clone --mirror myusersite myusersite-pre-split-backup.git
```

3) IDENTIFY CANDIDATE FILES/FOLDERS TO REMOVE OR ARCHIVE
Common top-level files that are often duplicated or moved into splits:
- `frontend/` (moved into rewash-app)
- `backend/` (moved into rewash-app or kept)
- `stock-prediction/`, `stock-market-prediction/`
- `package.json` (root) — only remove if not used for other tooling
- `README.md`, `tsconfig.json`, `vite.config.*`, `firebase.json` (consider archiving)

Recommendation: rather than deleting, move them to an `archive/` folder with a timestamped name. Example:
```
mkdir -p archive/post-split-$(date +%Y%m%d%H%M%S)
git mv frontend archive/post-split-*/ || mv frontend archive/post-split-*/
```

4) CLEANUP STEPS (SAFE)
- Update the root `README.md` to point to new repositories and describe the split.
- If the root `package.json` is only a wrapper for monorepo scripts, update or remove it. Replace with a short note redirecting to the new repos.
- Remove CI workflows that now belong to split repos: inspect `.github/workflows/` and either delete or keep archived copies.

5) OPTIONAL AUTOMATED CLEANUP SCRIPT
- Use `scripts/cleanup/identify-remove.sh` to list candidate entries and optionally remove/move them. The script is interactive and will NOT delete without confirmation.

6) POST-CLEANUP
- Run `git status` and `git diff` to inspect changes.
- Commit the cleanup to a separate branch (e.g., `cleanup/post-split`) so it's reversible:
```
git checkout -b cleanup/post-split
git add -A
git commit -m "chore: cleanup monorepo after split"
git push origin cleanup/post-split
```

If you want, I can prepare a PR branch with the suggested cleanup changes (file moves, README updates) after you confirm which files to archive/remove.
