#!/usr/bin/env bash
set -euo pipefail

# setup_env.sh - Create reproducible Python venv and validate environment
# Requirements: Python 3.10+ available as `python3`

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VENV_DIR="$PROJECT_ROOT/.venv"
REQ_FILE="$PROJECT_ROOT/requirements.txt"
PY_MIN="3.10"

color() { printf "\033[%sm%s\033[0m\n" "$1" "$2"; }
info() { color "36" "$1"; }
ok() { color "32" "$1"; }
warn() { color "33" "$1"; }
err() { color "31" "$1"; }

verlte() { [  "$1" = "$2" ] || [  "$(printf '%s\n' "$1" "$2" | sort -V | head -n1)" = "$1" ]; }

check_python() {
  info "Checking Python version..."
  if ! command -v python3 >/dev/null 2>&1; then
    err "python3 not found. Please install Python ${PY_MIN}+"; exit 1
  fi
  PY_VER=$(python3 -c 'import sys;print("%d.%d"%sys.version_info[:2])')
  if ! verlte "$PY_MIN" "$PY_VER"; then
    err "Python ${PY_MIN}+ required, found ${PY_VER}"; exit 1
  fi
  ok "Using Python ${PY_VER}"
}

create_venv() {
  info "Creating virtual environment at ${VENV_DIR}..."
  python3 -m venv "$VENV_DIR"
  # shellcheck disable=SC1091
  source "$VENV_DIR/bin/activate"
  python -m pip install --upgrade pip wheel setuptools
}

install_deps() {
  info "Installing pinned dependencies from requirements.txt..."
  if [ ! -f "$REQ_FILE" ]; then err "requirements.txt not found at $REQ_FILE"; exit 1; fi
  pip install -r "$REQ_FILE"
}

validate_tf() {
  info "Validating TensorFlow import..."
  python - <<'PY'
import sys
try:
    import tensorflow as tf
    print("TF version:", tf.__version__)
    print("Python:", sys.version.split()[0])
except Exception as e:
    print("TF import failed:", e)
    raise
PY
}

summary() {
  ok "Environment ready at $VENV_DIR"
  echo "To activate: source $VENV_DIR/bin/activate"
}

main() {
  check_python
  create_venv
  install_deps
  validate_tf || { warn "TensorFlow validation failed. If on Apple Silicon, consider 'tensorflow-macos'/'tensorflow-metal'."; }
  summary
}

main "$@"
