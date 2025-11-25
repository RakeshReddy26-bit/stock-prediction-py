# Stock Prediction API

Quick startup (repo root)

- Create + activate venv
  - python3 -m venv .venv
  - source .venv/bin/activate

- Install deps (recommended)
  - pip install -r requirements.txt
  - pip install fastapi "uvicorn[standard]" joblib yfinance

Train (local)
- python train_multi_stock.py
- Outputs: models/*.joblib and reports/training_<timestamp>.json

Predict (CLI)
- ./predict.py --ticker AAPL
- Example: ./predict.py --ticker AAPL --period 60d --model models/AAPL_rf.joblib

Run API (dev)
- Foreground (debug):
  - uvicorn api.predict:app --host 127.0.0.1 --port 8000 --reload
- Background (logs):
  - nohup uvicorn api.predict:app --host 127.0.0.1 --port 8000 > uvicorn.log 2>&1 &

Endpoints
- Health: GET /health
  - curl -sS http://127.0.0.1:8000/health | jq .
- Predict: GET /predict?ticker=AAPL
  - curl -sS "http://127.0.0.1:8000/predict?ticker=AAPL" | jq .

Process & logs
- Show uvicorn process:
  - ps aux | grep uvicorn | grep -v grep
- Show listening port:
  - lsof -iTCP:8000 -sTCP:LISTEN -P -n
- Tail logs:
  - tail -F uvicorn.log
- Stop server:
  - pkill -f "uvicorn api.predict:app" || kill <PID>

Notes
- The API normalizes MultiIndex / ticker-suffixed columns (e.g. `Close_AAPL`) to `Close` before feature engineering.
- Pydantic warning for `model_path` has been silenced with `model_config = {'protected_namespaces': ()}` in the response model.
- For production, run uvicorn behind nginx, use a process manager (systemd/launchd) and rotate logs.
