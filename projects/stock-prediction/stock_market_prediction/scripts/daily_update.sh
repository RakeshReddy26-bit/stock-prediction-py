#!/usr/bin/env bash
set -euo pipefail

# Config
dir="$(cd "$(dirname "$0")/.." && pwd)"
cd "$dir"

TICKERS=${TICKERS:-"AAPL MSFT"}
DAYS_OLD=${DAYS_OLD:-7}

now=$(date +%s)
mkdir -p models data/raw

for t in $TICKERS; do
  latest=$(ls -1 models/model_${t}_*.pkl 2>/dev/null | sort | tail -n 1 || true)
  retrain=true
  if [[ -n "$latest" ]]; then
    ts=$(basename "$latest" | sed -E 's/model_[A-Z]+_([0-9]{14}).pkl/\1/')
    dt=$(date -j -f '%Y%m%d%H%M%S' "$ts" +%s 2>/dev/null || date -d "$ts" +%s 2>/dev/null || echo $now)
    age_days=$(( (now - dt) / 86400 ))
    if [[ $age_days -lt $DAYS_OLD ]]; then
      retrain=false
    fi
  fi
  if $retrain; then
    echo "Fetching latest data for $t and retraining..."
  # Fetch last 2 years of real data and validate
  START=$(date -v-2y +%Y-%m-%d 2>/dev/null || date -d '2 years ago' +%F)
  END=$(date +%Y-%m-%d)
  ./.venv/bin/python - <<PY || true
from generate_sample_data import generate_training_data
try:
  print('Generating training data for', '$t')
  p = generate_training_data('$t', '$START', '$END')
  print('Saved CSV:', p)
except Exception as e:
  print('Data generation failed:', e)
PY
    ./.venv/bin/python stock_market_prediction.py train --ticker "$t" || true
  else
    echo "Model for $t is fresh (< ${DAYS_OLD}d). Skipping retrain."
  fi
  echo "Predicting next 30 days for $t..."
  ./.venv/bin/python stock_market_prediction.py predict --ticker "$t" --days 30 || true
done
