#!/bin/zsh
# Set up a clean ARM64 Conda env on Apple Silicon and install project deps via conda-forge
# Usage: scripts/setup_arm_env.sh <env_name>

set -euo pipefail

ENV_NAME=${1:-stock-arm}

# Ensure Miniforge (ARM64) is installed and initialized
if ! command -v conda >/dev/null 2>&1; then
  echo "Conda not found. Please install Miniforge3 for ARM64 from:\nhttps://github.com/conda-forge/miniforge/releases"
  exit 1
fi

# Make sure conda-forge is the top channel
conda config --add channels conda-forge || true
conda config --set channel_priority strict

# Create env if missing
if ! conda env list | grep -q "^${ENV_NAME}\s"; then
  conda create -y -n "${ENV_NAME}" python=3.10
fi

# Activate and install core deps
source "$(conda info --base)/etc/profile.d/conda.sh"
conda activate "${ENV_NAME}"

# Prefer mamba if available for speed
if conda list -n base mamba >/dev/null 2>&1; then
  INSTALLER=mamba
else
  INSTALLER=conda
fi

$INSTALLER install -y -c conda-forge \
  pandas numpy scikit-learn xgboost llvm-openmp \
  matplotlib seaborn requests \
  pytest flake8 mypy pandas-stubs types-requests

python -c "import platform; print('Python arch:', platform.machine())"
echo "Environment '${ENV_NAME}' ready. Activate with: conda activate ${ENV_NAME}"
echo "Run: PYTHONPATH=src python -m src.pipeline --ticker AAPL --model xgboost"
