Git LFS Policy (recommended)

Purpose
- Keep large model artifacts out of normal git history to avoid repository bloat and GitHub push failures.
- Track model files with Git LFS and keep source/code in git.

What to track
- Example file types: *.h5, *.keras, *.pt, *.ckpt, *.onnx
- Do NOT commit local virtualenvs (.venv*, venv) or site-packages.

How to enable (per-machine)
1) Install Git LFS (macOS): brew install git-lfs
2) Enable LFS for the repo: git lfs install
3) Track file types: git lfs track '*.h5' '*.keras' '*.pt' '*.ckpt' '*.onnx'

Notes
- All contributors who push LFS-tracked files must have git-lfs installed.
- Converting existing history to LFS requires a history rewrite (use git-lfs migrate or git-filter-repo); coordinate with the team before doing that.
