# Stock Prediction Microservice

## Quick Start

1. Create and activate venv, then install deps
2. Train a model

```
python stock_market_prediction.py train --ticker SAMPLE
```

3. Predict

```
python stock_market_prediction.py predict --ticker SAMPLE --days 30
```

4. Evaluate

```
python stock_market_prediction.py evaluate --ticker SAMPLE
```

## API

- Start server:

```
uvicorn src.api.main:app --host 0.0.0.0 --port 8000
```

- POST /api/v1/predict
  Body: {"ticker":"AAPL","days":30}

- GET /api/v1/health

- GET /api/v1/models/info?ticker=AAPL

## Docker

```
docker compose up --build
```
