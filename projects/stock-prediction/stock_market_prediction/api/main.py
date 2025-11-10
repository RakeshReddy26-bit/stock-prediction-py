from __future__ import annotations
import os
import json
from typing import Optional, Dict

import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sklearn.preprocessing import MinMaxScaler

try:
    import yfinance as yf
    from tensorflow.keras.models import load_model
except Exception as e:
    # Defer import errors to request time to return a clear message
    yf = None
    load_model = None


LOOKBACK = 60
ROOT_DIR = os.path.dirname(os.path.dirname(__file__))
MODELS_DIR = os.path.join(ROOT_DIR, 'models')

app = FastAPI(title="Stock Prediction Service", version="0.1.0")

# Optional CORS (comma-separated origins via env var; defaults to allow all in dev)
cors_env = os.getenv("API_CORS_ORIGINS", "*")
origins = [o.strip() for o in cors_env.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins != ["*"] else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Simple in-memory cache of loaded models/scalers by model_path
MODEL_CACHE: Dict[str, Dict] = {}


class PredictIn(BaseModel):
    ticker: str = Field(..., min_length=1, max_length=10)
    period: str = Field(default="6mo")
    interval: str = Field(default="1d")


def load_latest_bundle(ticker: str) -> Optional[Dict]:
    if not os.path.isdir(MODELS_DIR):
        return None
    candidates = [f for f in os.listdir(MODELS_DIR) if f.startswith(f"model_{ticker}_") and f.endswith('.pkl')]
    if not candidates:
        return None
    latest = sorted(candidates)[-1]
    with open(os.path.join(MODELS_DIR, latest)) as f:
        return json.load(f)


def get_model_and_scaler(ticker: str) -> Dict:
    bundle = load_latest_bundle(ticker)
    if not bundle:
        # Legacy fallback
        legacy = os.path.join(ROOT_DIR, 'lstm_stock_model.h5')
        if os.path.exists(legacy):
            key = legacy
            if key not in MODEL_CACHE:
                MODEL_CACHE[key] = {
                    'model': load_model(legacy),
                    'scaler_min_': None,
                    'scaler_scale_': None,
                }
            return MODEL_CACHE[key]
        raise HTTPException(status_code=404, detail=f"No model bundle found for {ticker}")

    model_path = bundle.get('model_path')
    if not model_path or not os.path.exists(model_path):
        raise HTTPException(status_code=404, detail=f"Model file missing for {ticker}")

    if model_path not in MODEL_CACHE:
        MODEL_CACHE[model_path] = {
            'model': load_model(model_path),
            'scaler_min_': np.array(bundle['scaler_min_']),
            'scaler_scale_': np.array(bundle['scaler_scale_']),
            'bundle': bundle,
        }
    return MODEL_CACHE[model_path]


def predict_next_close(ticker: str, period: str, interval: str) -> Dict:
    if yf is None or load_model is None:
        raise HTTPException(status_code=500, detail="Missing ML dependencies. Install tensorflow, yfinance.")

    # Try yfinance first unless explicitly using SAMPLE/local
    df = pd.DataFrame()
    if ticker.upper() != 'SAMPLE':
        try:
            df = yf.download(ticker, period=period, interval=interval, progress=False, auto_adjust=True)
        except Exception as e:
            # Continue to local CSV fallback below
            df = pd.DataFrame()

    if df.empty or 'Close' not in df.columns:
        # Local CSV fallback
        local_csv = os.path.join(ROOT_DIR, 'stock_data.csv')
        if not os.path.exists(local_csv):
            raise HTTPException(status_code=404, detail="No data returned from yfinance and no local CSV available")
        try:
            df = pd.read_csv(local_csv, index_col='Date', parse_dates=True)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Local CSV read failed: {e}")
    if df.empty or 'Close' not in df.columns:
        raise HTTPException(status_code=404, detail="No valid Close data available")

    cache = get_model_and_scaler(ticker)
    values = df['Close'].astype(float).values.reshape(-1, 1)
    if len(values) < LOOKBACK:
        raise HTTPException(status_code=400, detail=f"Need at least {LOOKBACK} closes; got {len(values)}")

    scaler = MinMaxScaler(feature_range=(0, 1))
    if cache.get('scaler_min_') is not None and cache.get('scaler_scale_') is not None:
        # Restore scaler from bundle
        scaler.min_ = cache['scaler_min_']
        scaler.scale_ = cache['scaler_scale_']
        scaled = scaler.transform(values)
    else:
        scaled = scaler.fit_transform(values)

    last_window = scaled[-LOOKBACK:].reshape(1, LOOKBACK, 1)
    next_scaled = cache['model'].predict(last_window, verbose=0)
    next_price = float(scaler.inverse_transform(next_scaled)[0][0])
    last_close = float(values[-1][0])

    out = {
        'ticker': ticker,
        'last_close': last_close,
        'prediction_next': next_price,
        'as_of': df.index[-1].strftime('%Y-%m-%d'),
    }
    bundle = cache.get('bundle')
    if bundle:
        out['model_version'] = bundle.get('hash')
    return out


@app.get('/health')
def health():
    return {
        'ok': True,
        'models_cached': len(MODEL_CACHE),
    }


@app.get('/models/latest')
def models_latest(ticker: str = Query(..., min_length=1, max_length=10)):
    b = load_latest_bundle(ticker.upper())
    if not b:
        raise HTTPException(status_code=404, detail=f"No model for ticker {ticker}")
    # Do not expose scaler arrays directly to keep response small
    return {k: v for k, v in b.items() if k not in ('scaler_min_', 'scaler_scale_')}


@app.post('/predict')
def predict(inp: PredictIn):
    return predict_next_close(inp.ticker.upper(), inp.period, inp.interval)
