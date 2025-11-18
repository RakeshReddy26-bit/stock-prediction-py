#!/usr/bin/env python3
import argparse
import json
import os
import sys
from typing import List, Optional, Dict

import numpy as np
import pandas as pd
from sklearn.preprocessing import MinMaxScaler

try:
    import yfinance as yf
    import tensorflow as tf
    from tensorflow.keras.models import load_model
except Exception as e:
    print(json.dumps({"ok": False, "error": f"imports failed: {e}"}))
    sys.exit(1)

LOOKBACK = 60

MODELS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), 'models'))
LEGACY_MODEL_CANDIDATES: List[str] = [
    os.path.abspath(os.path.join(MODELS_DIR, 'lstm_stock_model.h5')),
]


def load_latest_bundle(ticker: str) -> Optional[Dict]:
    if not os.path.isdir(MODELS_DIR):
        return None
    candidates = [f for f in os.listdir(MODELS_DIR) if f.startswith(f"model_{ticker}_") and f.endswith('.pkl')]
    if not candidates:
        return None
    latest = sorted(candidates)[-1]
    with open(os.path.join(MODELS_DIR, latest)) as f:
        return json.load(f)


def get_model_path(ticker: str) -> Optional[str]:
    # Prefer new bundle-based .keras model
    bundle = load_latest_bundle(ticker)
    if bundle and os.path.exists(bundle.get('model_path', '')):
        return bundle['model_path']
    # Fallback to legacy .h5 paths
    for p in LEGACY_MODEL_CANDIDATES:
        if p and os.path.exists(p):
            return p
    return None


def create_sequences(data: np.ndarray, lookback: int) -> np.ndarray:
    X = []
    for i in range(lookback, len(data)):
        X.append(data[i - lookback:i, 0])
    return np.array(X)


def predict_next(close_series: pd.Series, ticker: str):
    if len(close_series) < LOOKBACK:
        raise RuntimeError(f'Need at least {LOOKBACK} data points, got {len(close_series)}')

    scaler = MinMaxScaler(feature_range=(0, 1))
    values = close_series.values.reshape(-1, 1)
    scaled = scaler.fit_transform(values)

    # Build last window
    last_window = scaled[-LOOKBACK:].reshape(1, LOOKBACK, 1)

    # Load model
    model_path = get_model_path(ticker)
    if not model_path:
        raise RuntimeError('LSTM model file not found. Train a model (bundle .keras) or provide lstm_stock_model.h5')

    model = load_model(model_path)

    # Predict next
    next_scaled = model.predict(last_window, verbose=0)
    next_price = scaler.inverse_transform(next_scaled)[0][0]

    return float(values[-1][0]), float(next_price)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--ticker', default='AAPL')
    parser.add_argument('--period', default='6mo')
    parser.add_argument('--interval', default='1d')
    args = parser.parse_args()

    try:
        df = yf.download(args.ticker, period=args.period, interval=args.interval, progress=False, auto_adjust=True)
        if df.empty or 'Close' not in df.columns:
            raise RuntimeError('No data returned from yfinance')

        last_close, next_pred = predict_next(df['Close'], ticker=str(args.ticker).upper())
        out = {
            'ok': True,
            'ticker': str(args.ticker).upper(),
            'period': args.period,
            'interval': args.interval,
            'last_close': last_close,
            'prediction_next': next_pred,
            'as_of': df.index[-1].strftime('%Y-%m-%d')
        }
        print(json.dumps(out))
    except Exception as e:
        print(json.dumps({"ok": False, "error": str(e)}))
        sys.exit(2)


if __name__ == '__main__':
    main()
