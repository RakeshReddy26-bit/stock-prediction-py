# ReWash Cleanup & Separation Guide

Goal: remove ReWash-specific branding from the active codebase, move legacy ReWash project and build artifacts into timestamped backups, and verify the stock-market project is independent. This guide reproduces the actions already performed and provides exact copy-paste commands, expected outputs, a checklist, and error recovery instructions.

Work performed (summary):
- Created backup branch `backup/rewash-before-clean-<timestamp>`
- Moved `projects/rewash` → `backups/rewash-backup-<timestamp>` (git tracked rename)
- Moved `build/`, `dist/`, and `.venv/` (if present) into `backups/` with timestamped names
- Updated `.gitignore` to ignore build artifacts and venvs
- Replaced ReWash-specific strings in active source: image host and discount code
- Added a Vitest unit test to validate image URLs: `frontend/__tests__/validateCatalog.test.ts`

IMPORTANT: All destructive operations were avoided. Large artifacts and legacy project code were moved into `backups/` and committed so you can inspect or restore them.

Commands (copy-paste ready)

1) Create a backup branch (optional if already done):

```bash
git checkout -b backup/rewash-before-clean-$(date +%Y%m%d-%H%M%S)
```

Expected output: new branch created (no other output required). Verify with:

```bash
git branch --show-current
# -> backup/rewash-before-clean-20251103-063250 (example)
```

2) Move legacy project and build artifacts into `backups/` (safe, reversible):

```bash
mkdir -p backups
git mv projects/rewash backups/rewash-backup-$(date +%Y%m%d-%H%M%S) || mv projects/rewash backups/rewash-backup-$(date +%Y%m%d-%H%M%S)
git add -A
git commit -m "Move projects/rewash to backups/rewash-backup-$(date +%Y%m%d-%H%M%S)"

# Move build and dist if present
git mv build backups/build-backup-$(date +%Y%m%d-%H%M%S) || mv build backups/build-backup-$(date +%Y%m%d-%H%M%S)
git commit -m "Move build to backups/build-backup-$(date +%Y%m%d-%H%M%S)" || true

git mv dist backups/dist-backup-$(date +%Y%m%d-%H%M%S) || mv dist backups/dist-backup-$(date +%Y%m%d-%H%M%S)
git commit -m "Move dist to backups/dist-backup-$(date +%Y%m%d-%H%M%S)" || true

# If you have a checked-in virtualenv, move it too (careful: can be very large)
git mv .venv backups/venv-backup-$(date +%Y%m%d-%H%M%S) || mv .venv backups/venv-backup-$(date +%Y%m%d-%H%M%S)
git commit -m "Move .venv to backups/venv-backup-$(date +%Y%m%d-%H%M%S)" || true
```

Expected output: git reports moved/renamed files and commits are created. If `git mv` fails (untracked files), fallback `mv` will move them but you'll need to `git add` the backups and `git rm -r` the originals if they were tracked.

3) Update `.gitignore` (prevent future commits of build artifacts and venvs):

```bash
# Add to .gitignore
printf "\nbuild/\n.dist/\n.venv/\nvenv/\nbackups/\n__pycache__/\n*.pyc\n" >> .gitignore
git add .gitignore
git commit -m "Update .gitignore to ignore build, venvs and backups"
```

Expected output: `.gitignore` staged and committed.

4) Replace ReWash-specific strings in active source

The replacements performed in this cleanup were:
- `ai-generated-images.rewash.com` -> `images.example.com`
- `REWASH10` -> `APP10`

Run these exact commands (performed earlier):

```bash
perl -pi -e 's/ai-generated-images.rewash.com/images.example.com/g' frontend/src/data/clothingCatalog.ts && \
perl -pi -e 's/ai-generated-images.rewash.com/images.example.com/g' src/data/clothingCatalog.ts 2>/dev/null || true && \
perl -pi -e 's/REWASH10/APP10/g' frontend/src/store/cartStore.ts && \
perl -pi -e 's/REWASH10/APP10/g' src/store/cartStore.ts 2>/dev/null || true && \
git add frontend/src/data/clothingCatalog.ts frontend/src/store/cartStore.ts || true && \
git commit -m "Replace ReWash-specific assets and codes (image host + discount code)" || true
```

Expected output: commit message `Replace ReWash-specific assets and codes (image host + discount code)` and changed files listed. The script used `|| true` on some operations to be resilient when files are absent.

5) Verify with unit tests (Vitest)

Run the frontend tests (we added a small check for `validateCatalogImages()`):

```bash
npm -C frontend run test
```

Expected output (example snippet):

```
✓ __tests__/validateCatalog.test.ts (1 test)
✓ src/data/clothingCatalog.test.ts (1 test)
✓ src/__tests__/cart-integration.test.ts (6 tests)
Test Files 3 passed | 1 skipped (4)
Tests 8 passed | 4 skipped (12)
```

If you see a failing test referencing `REWASH10`, update the test to use `APP10` (we already did this). The unit test we added asserts `validateCatalogImages() === true`.

6) TypeScript check

Note: Running `npx tsc --noEmit` at the repository root will attempt to type-check the entire monorepo and can surface unrelated type errors (missing type files, imports, or cross-package TS config). To focus on the frontend-only check use:

```bash
npx tsc -p frontend/tsconfig.json --noEmit
```

Expected outcome: Ideally no errors. If you see many unrelated errors (missing modules, implicit any, etc.), either:
- run only the tests (Vitest) which already passed for the edited files; or
- incrementally fix type errors in the components listed by tsc.

7) Commit and push (publish your cleanup)

```bash
git push origin HEAD
```

Expected output: branch updates pushed. If you created a new backup branch earlier, push that branch instead of `main` if you prefer to open a PR.

Checklist (mark when done):
- [x] Create backup branch
- [x] Move legacy `projects/rewash` into `backups/` (git tracked)
- [x] Move `build/`, `dist/`, and `.venv` into `backups/`
- [x] Update `.gitignore`
- [x] Replace image domain and discount code in active source
- [x] Add unit test and run frontend tests (Vitest)
- [ ] Push commits to remote (recommended for review)
- [ ] Optionally: remove legacy backups from git history (only if you want to shrink repo size — *warning*: this rewrites history)

Error recovery & rollbacks

- To restore files moved into `backups/rewash-backup-<ts>` into their original location (undo the move):

```bash
git mv backups/rewash-backup-<ts> projects/rewash
git commit -m "Restore projects/rewash from backup"
```

- To undo the last commit (local only):

```bash
git reset --soft HEAD~1  # keep changes staged
git reset --hard HEAD~1  # discard changes completely (use carefully)
```

- To remove a replacement you made (replace APP10 back to REWASH10):

```bash
perl -pi -e 's/APP10/REWASH10/g' frontend/src/store/cartStore.ts
git add frontend/src/store/cartStore.ts
git commit -m "Revert discount code replacement"
```

Notes & verification

- The stock project `stock-market-prediction` (and `projects/stock-prediction`) contains no occurrences of the string `rewash` as of this cleanup.
- We intentionally preserved all legacy copies and build artifacts in `backups/` rather than deleting them.
- If you want me to remove `rewash` from documentation files or rewrite .env entries, confirm which files should be updated (some contain credentials or production settings and were left untouched).

If you want, I can:
- Push the local commits to `origin` (ask me to push or confirm the remote branch name).
- Perform a history rewrite to remove large backups from git history (this is destructive and requires coordination).
- Make the stock project fully independent (add Dockerfile, CI, or separate repo scaffold).

---
Generated: 2025-11-03
