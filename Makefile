.PHONY: dev api build run docker-up docker-down backtest

PY?=python

dev:
	$(PY) -m uvicorn src.api.main:app --reload --host 0.0.0.0 --port 8000

api:
	uvicorn src.api.main:app --host 0.0.0.0 --port 8000

build:
	docker build -t stock-prediction-api:latest .

run: build
	docker run --rm -p 8000:8000 stock-prediction-api:latest

docker-up:
	docker compose up --build

docker-down:
	docker compose down

backtest:
	$(PY) stock_market_prediction.py --mode backtest --ticker SAMPLE
