#!/usr/bin/env bash
set -euo pipefail

# Verbose wrapper to run the auto split script with tracing and write a log file.
# Use this when you saw no output; it captures stdout/stderr and command tracing.

LOG_DIR="$HOME/splits"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/split-run-$(date +%Y%m%d%H%M%S).log"

echo "Logging split run to: $LOG_FILE"

# Basic preflight checks
echo "=== Preflight checks ===" | tee -a "$LOG_FILE"
echo "UID: $(id -u)  USER: $(id -un)" | tee -a "$LOG_FILE"
echo "Shell: $SHELL" | tee -a "$LOG_FILE"

echo -n "Checking scripts are present: " | tee -a "$LOG_FILE"
if [[ -x ./scripts/run-split-auto.sh ]]; then
  echo "ok (executable)" | tee -a "$LOG_FILE"
else
  echo "missing or not executable" | tee -a "$LOG_FILE"
  ls -l ./scripts | tee -a "$LOG_FILE"
fi

echo -n "Checking git-filter-repo availability: " | tee -a "$LOG_FILE"
if command -v git-filter-repo >/dev/null 2>&1; then
  echo "ok ($(command -v git-filter-repo))" | tee -a "$LOG_FILE"
else
  echo "not found" | tee -a "$LOG_FILE"
fi

echo -n "Checking git status (should be clean): " | tee -a "$LOG_FILE"
git status --porcelain 2>&1 | tee -a "$LOG_FILE" || true

echo "=== Running auto script with tracing ===" | tee -a "$LOG_FILE"
# Ensure helper scripts are executable and normalize CRLF line endings
for s in ./scripts/*.sh; do
  if [[ -f "$s" ]]; then
    chmod +x "$s" || true
    if sed -n '1p' "$s" | grep -q "\r" 2>/dev/null; then
      sed -i '' -e 's/\r$//' "$s" 2>/dev/null || sed -i -e 's/\r$//' "$s" 2>/dev/null || true
    fi
  fi
done
# Run with bash -x and capture both stdout and stderr to log file and terminal
bash -x ./scripts/run-split-auto.sh 2>&1 | tee -a "$LOG_FILE"

echo "=== Done. Log saved to $LOG_FILE" | tee -a "$LOG_FILE"
