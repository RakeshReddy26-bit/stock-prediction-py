from __future__ import annotations
import os
from typing import Dict, Tuple, List

import numpy as np
import pandas as pd
import joblib

from ..core import _load_data, MODELS_DIR, _rsi

try:
    from statsmodels.tsa.arima.model import ARIMA
except Exception:
    ARIMA = None

ARIMA_DIR = os.path.join(MODELS_DIR, 'arima')
os.makedirs(ARIMA_DIR, exist_ok=True)


def _bundle_path(ticker: str) -> str:
    return os.path.join(ARIMA_DIR, f"arima_{ticker.upper()}.pkl")


def _grid_orders(max_p: int = 3, max_d: int = 2, max_q: int = 3) -> List[Tuple[int,int,int]]:
    out = []
    for p in range(0, max_p+1):
        for d in range(0, max_d+1):
            for q in range(0, max_q+1):
                if p==d==q==0:
                    continue
                out.append((p,d,q))
    return out


def train_stock_arima(ticker: str) -> str:
    if ARIMA is None:
        raise RuntimeError('statsmodels not installed')
    df = _load_data(ticker, period='5y')
    y = df['Close'].astype(float)
    # simple grid search on last 20% as validation
    split = int(len(y) * 0.8)
    y_tr, y_va = y.iloc[:split], y.iloc[split:]
    best_aic = np.inf
    best_order = None
    for order in _grid_orders():
        try:
            m = ARIMA(y_tr, order=order)
            res = m.fit(method_kwargs={"warn_convergence": False})
            if res.aic < best_aic:
                best_aic = res.aic
                best_order = order
        except Exception:
            continue
    if best_order is None:
        best_order = (1,1,1)
    model = ARIMA(y, order=best_order).fit(method_kwargs={"warn_convergence": False})
    ts = pd.Timestamp.utcnow().strftime('%Y%m%d%H%M%S')
    bundle = {
        'ticker': ticker.upper(),
        'created_at': ts,
        'order': best_order,
        'params': model.params,
    }
    path_latest = _bundle_path(ticker)
    path_versioned = os.path.join(ARIMA_DIR, f"arima_{ticker.upper()}_{ts}.pkl")
    joblib.dump(bundle, path_versioned)
    joblib.dump(bundle, path_latest)
    return path_versioned


def predict_stock_arima(ticker: str, days: int = 30) -> Dict:
    if ARIMA is None:
        raise RuntimeError('statsmodels not installed')
    path = _bundle_path(ticker)
    df = _load_data(ticker, period='5y')
    y = df['Close'].astype(float)
    if not os.path.exists(path):
        train_stock_arima(ticker)
    bundle = joblib.load(path)
    order = tuple(bundle.get('order', (1,1,1)))

    model = ARIMA(y, order=order).fit(method_kwargs={"warn_convergence": False})
    fc = model.get_forecast(steps=days)
    mean = fc.predicted_mean.to_list()
    conf = fc.conf_int(alpha=0.05)
    intervals = conf.values.tolist()

    sma5 = df['Close'].rolling(5).mean().iloc[-1]
    sma20 = df['Close'].rolling(20).mean().iloc[-1]
    rsi14 = _rsi(df['Close'], 14).iloc[-1]

    # derive a simple confidence metric from model residual variance
    resid = model.resid
    rmse = float(np.sqrt(np.mean(np.square(resid)))) if len(resid) else 0.0
    confidence = float(np.clip(1.0 - (rmse / (np.mean(df['Close']) or 1)), 0, 1))

    return {
        'ticker': ticker.upper(),
        'predictions': [float(x) for x in mean],
        'intervals': [[float(lo), float(hi)] for lo, hi in intervals],
        'confidence': confidence,
        'model_version': f"arima_v1_{bundle.get('created_at')}",
        'timestamp': pd.Timestamp.utcnow().isoformat(),
        'as_of': df.index[-1].isoformat(),
        'last_close': float(df['Close'].iloc[-1]),
        'sma5': float(sma5) if pd.notna(sma5) else None,
        'sma20': float(sma20) if pd.notna(sma20) else None,
        'rsi14': float(rsi14) if pd.notna(rsi14) else None,
    }


def evaluate_stock_arima(ticker: str) -> Dict:
    if ARIMA is None:
        raise RuntimeError('statsmodels not installed')
    df = _load_data(ticker, period='5y')
    y = df['Close'].astype(float)
    n = len(y)
    if n < 200:
        raise RuntimeError('Insufficient data for ARIMA evaluation')
    split = int(n * 0.8)
    y_tr, y_te = y.iloc[:split], y.iloc[split:]
    # load or search order
    path = _bundle_path(ticker)
    if os.path.exists(path):
        bundle = joblib.load(path)
        order = tuple(bundle.get('order', (1,1,1)))
    else:
        order = (1,1,1)
    try:
        model = ARIMA(y_tr, order=order).fit(method_kwargs={"warn_convergence": False})
    except Exception:
        model = ARIMA(y_tr, order=(1,1,1)).fit(method_kwargs={"warn_convergence": False})
    fc = model.get_forecast(steps=len(y_te))
    y_hat = fc.predicted_mean.values
    from sklearn.metrics import mean_squared_error, mean_absolute_error
    rmse = float(np.sqrt(mean_squared_error(y_te.values, y_hat)))
    mae = float(mean_absolute_error(y_te.values, y_hat))
    acc = float(np.mean(np.sign(np.diff(y_te.values)) == np.sign(np.diff(y_hat)))) if len(y_te) > 1 else 0.0
    # baselines
    y_naive = y_te.shift(1).fillna(method='bfill').values
    y_sma5 = y.rolling(5).mean().shift(1).iloc[split:].fillna(method='bfill').values
    def _m(y_true, yp):
        return { 'rmse': float(np.sqrt(mean_squared_error(y_true, yp))), 'mae': float(mean_absolute_error(y_true, yp)) }
    out = {
        'ticker': ticker.upper(),
        'test_metrics': {'rmse': rmse, 'mae': mae, 'accuracy': acc},
        'baseline': { 'naive': _m(y_te.values, y_naive), 'sma5': _m(y_te.values, y_sma5) },
        'trained_on': None,
        'timestamp': pd.Timestamp.utcnow().isoformat(),
    }
    return out
