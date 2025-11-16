"""
Stock Market Prediction CLI
Adds train|predict|evaluate commands using RandomForest with technical indicators.
Legacy LSTM functionality remains available via quick scripts and API.
"""

from __future__ import annotations
import argparse
import hashlib
import json
import os
import time
from dataclasses import dataclass
from datetime import datetime
from typing import Dict, Tuple, Optional

import numpy as np
import pandas as pd
from sklearn.preprocessing import MinMaxScaler
from sklearn.model_selection import TimeSeriesSplit
from sklearn.metrics import mean_squared_error, mean_absolute_error
from tensorflow.keras.models import Sequential, load_model
from tensorflow.keras.layers import LSTM, Dropout, Dense
from tensorflow.keras.optimizers import Adam

try:
    import yfinance as yf
except Exception:
    yf = None

# ----------------------------- Config ---------------------------------
LOOKBACK = 60
DEFAULT_EPOCHS = int(os.getenv("EPOCHS", "5"))  # keep quick by default
BATCH_SIZE = 32
MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")
REPORTS_DIR = os.path.join(os.path.dirname(__file__), "reports")
os.makedirs(MODELS_DIR, exist_ok=True)
os.makedirs(REPORTS_DIR, exist_ok=True)

# --------------------------- Utilities --------------------------------

def read_dataset(ticker: Optional[str], start: Optional[str], end: Optional[str]) -> pd.DataFrame:
    """Load price data. If yfinance available and dates provided, fetch; else read local CSV 'stock_data.csv'."""
    if yf and ticker and start and end:
        df = yf.download(ticker, start=start, end=end, progress=False, auto_adjust=True)
        if df.empty:
            raise RuntimeError("No data from yfinance")
        return df
    # fallback to local CSV
    csv_path = os.path.join(os.path.dirname(__file__), "stock_data.csv")
    if not os.path.exists(csv_path):
        raise FileNotFoundError("stock_data.csv not found. Generate with generate_sample_data.py or provide dates.")
    return pd.read_csv(csv_path, index_col="Date", parse_dates=True)


def create_sequences(arr: np.ndarray, lookback: int = LOOKBACK) -> Tuple[np.ndarray, np.ndarray]:
    # Guard: not enough samples to form a single window
    if len(arr) <= lookback:
        return np.empty((0, lookback, 1)), np.empty((0,))
    X, y = [], []
    for i in range(lookback, len(arr)):
        X.append(arr[i - lookback:i, 0])
        y.append(arr[i, 0])
    X = np.array(X)
    y = np.array(y)
    X = X.reshape((X.shape[0], X.shape[1], 1))
    return X, y


def build_lstm(input_steps: int = LOOKBACK) -> Sequential:
    model = Sequential([
        LSTM(50, return_sequences=True, input_shape=(input_steps, 1)),
        Dropout(0.2),
        LSTM(50, return_sequences=True),
        Dropout(0.2),
        LSTM(50),
        Dropout(0.2),
        Dense(1)
    ])
    model.compile(optimizer=Adam(learning_rate=0.001), loss='mean_squared_error', metrics=['mae'])
    return model


def baseline_sma(close: np.ndarray, window: int = 5) -> np.ndarray:
    s = pd.Series(close.flatten())
    sma = s.rolling(window=window).mean().shift(1)  # predict next by previous SMA
    # align to y indices (skip initial lookback)
    return sma.values


def save_artifacts(ticker: str, scaler: MinMaxScaler, model: Sequential) -> Dict:
    ts = datetime.utcnow().strftime("%Y%m%d%H%M%S")
    # Save model in native Keras format
    model_path = os.path.join(MODELS_DIR, f"lstm_{ticker}_{ts}.keras")
    model.save(model_path)
    # Hash model file
    with open(model_path, 'rb') as f:
        h = hashlib.sha256(f.read()).hexdigest()[:12]
    bundle = {
        "ticker": ticker,
        "model_path": model_path,
        "scaler_min_": scaler.min_.tolist(),
        "scaler_scale_": scaler.scale_.tolist(),
        "created_at": ts,
        "hash": h,
    }
    # Persist bundle json alongside
    bundle_path = os.path.join(MODELS_DIR, f"model_{ticker}_{ts}_{h}.pkl")
    # Use json for portability; filename follows .pkl naming as requested
    with open(bundle_path, "w") as f:
        json.dump(bundle, f)
    bundle["bundle_path"] = bundle_path
    return bundle


def load_latest_bundle(ticker: str) -> Dict:
    candidates = [f for f in os.listdir(MODELS_DIR) if f.startswith(f"model_{ticker}_") and f.endswith(".pkl")]
    if not candidates:
        raise FileNotFoundError(f"No model bundle found for {ticker}")
    latest = sorted(candidates)[-1]
    with open(os.path.join(MODELS_DIR, latest)) as f:
        return json.load(f)


def metrics_dict(y_true: np.ndarray, y_pred: np.ndarray) -> Dict[str, float]:
    rmse = float(np.sqrt(mean_squared_error(y_true, y_pred)))
    mae = float(mean_absolute_error(y_true, y_pred))
    # directional accuracy
    da = float(np.mean(np.sign(np.diff(y_true.flatten())) == np.sign(np.diff(y_pred.flatten())))) if len(y_true) > 1 else 0.0
    # MAPE (avoid divide by zero)
    y_true_f = y_true.flatten()
    y_pred_f = y_pred.flatten()
    denom = np.where(y_true_f == 0, np.nan, np.abs(y_true_f))
    ape = np.abs((y_true_f - y_pred_f) / denom) * 100.0
    mape = float(np.nanmean(ape)) if np.isnan(ape).sum() < len(ape) else float('nan')
    return {"rmse": rmse, "mae": mae, "mape": mape, "directional_accuracy": da}


def sharpe_ratio(returns: pd.Series, risk_free_rate: float = 0.0, periods_per_year: int = 252) -> float:
    """Annualized Sharpe ratio. Assumes returns are per-period (daily)."""
    # excess returns
    ex = returns - (risk_free_rate / periods_per_year)
    mu = ex.mean()
    sigma = ex.std(ddof=1)
    if sigma == 0 or np.isnan(sigma):
        return float('nan')
    return float((mu / sigma) * np.sqrt(periods_per_year))


def max_drawdown(equity_curve: pd.Series) -> float:
    """Max drawdown given an equity curve series (cumulative). Returns negative value (e.g., -0.25)."""
    rolling_max = equity_curve.cummax()
    drawdown = (equity_curve / rolling_max) - 1.0
    return float(drawdown.min())


# ----------------------------- Modes ----------------------------------

def run_train(ticker: Optional[str], start: Optional[str], end: Optional[str], epochs: int = DEFAULT_EPOCHS) -> Dict:
    df = read_dataset(ticker, start, end)
    data = df['Close'].values.reshape(-1, 1)
    scaler = MinMaxScaler(feature_range=(0, 1))
    scaled = scaler.fit_transform(data)

    X, y = create_sequences(scaled, LOOKBACK)
    split = int(len(X) * 0.8)
    X_train, X_val = X[:split], X[split:]
    y_train, y_val = y[:split], y[split:]

    model = build_lstm(LOOKBACK)
    history = model.fit(X_train, y_train, epochs=epochs, batch_size=BATCH_SIZE, validation_data=(X_val, y_val), verbose=1)

    # Evaluate
    y_val_pred = model.predict(X_val, verbose=0)
    y_val_true = y_val.reshape(-1, 1)
    y_val_pred_inv = scaler.inverse_transform(y_val_pred)
    y_val_true_inv = scaler.inverse_transform(y_val_true)
    m = metrics_dict(y_val_true_inv, y_val_pred_inv)

    # Baseline (SMA)
    base = baseline_sma(pd.Series(data.flatten()).values, window=5)
    base_seq = base[-len(y):][split:]  # align to validation
    base_seq = np.nan_to_num(base_seq, nan=float(pd.Series(data.flatten()).iloc[:split+LOOKBACK].mean()))
    m_base = metrics_dict(y_val_true_inv.flatten(), base_seq)

    bundle = save_artifacts(ticker or 'LOCAL', scaler, model)

    report = {
        "ticker": ticker,
        "rows": int(len(df)),
        "metrics_val": m,
        "baseline_val": m_base,
        "epochs": epochs,
        "lookback": LOOKBACK,
        "bundle": bundle,
        "timestamp": datetime.utcnow().isoformat(),
    }
    with open(os.path.join(REPORTS_DIR, f"training_{bundle['created_at']}.json"), "w") as f:
        json.dump(report, f, indent=2)
    return report


def run_eval(ticker: str) -> Dict:
    bundle = load_latest_bundle(ticker)
    df = read_dataset(ticker, None, None)
    data = df['Close'].values.reshape(-1, 1)

    scaler = MinMaxScaler()
    scaler.min_ = np.array(bundle["scaler_min_"])
    scaler.scale_ = np.array(bundle["scaler_scale_"])
    scaled = scaler.transform(data)

    X, y = create_sequences(scaled, LOOKBACK)
    split = int(len(X) * 0.8)
    X_test, y_test = X[split:], y[split:]

    model = load_model(bundle["model_path"])
    y_pred = model.predict(X_test, verbose=0)
    y_pred_inv = scaler.inverse_transform(y_pred)
    y_true_inv = scaler.inverse_transform(y_test.reshape(-1, 1))
    m = metrics_dict(y_true_inv, y_pred_inv)

    # K-Fold CV on entire series (TimeSeriesSplit)
    tss = TimeSeriesSplit(n_splits=5)
    cv_metrics = []
    for train_idx, test_idx in tss.split(scaled):
        if len(train_idx) <= LOOKBACK:
            continue
        X_tr, y_tr = create_sequences(scaled[train_idx], LOOKBACK)
        X_te, y_te = create_sequences(scaled[test_idx], LOOKBACK)
        if len(X_tr) == 0 or len(X_te) == 0:
            continue
        m_cv = load_model(bundle["model_path"])  # reuse architecture/weights for speed
        yp = m_cv.predict(X_te, verbose=0)
        yp_inv = scaler.inverse_transform(yp)
        yt_inv = scaler.inverse_transform(y_te.reshape(-1, 1))
        cv_metrics.append(metrics_dict(yt_inv, yp_inv))
    cv_avg = {
        k: float(np.mean([cm[k] for cm in cv_metrics])) if cv_metrics else None for k in ["rmse", "mae", "directional_accuracy"]
    }

    report = {
        "ticker": ticker,
        "test_metrics": m,
        "cv_avg": cv_avg,
        "timestamp": datetime.utcnow().isoformat(),
    }
    with open(os.path.join(REPORTS_DIR, f"eval_{ticker}_{int(time.time())}.json"), "w") as f:
        json.dump(report, f, indent=2)
    return report


def run_predict(ticker: str) -> Dict:
    bundle = load_latest_bundle(ticker)
    df = read_dataset(ticker, None, None)
    data = df['Close'].values.reshape(-1, 1)

    scaler = MinMaxScaler()
    scaler.min_ = np.array(bundle["scaler_min_"])
    scaler.scale_ = np.array(bundle["scaler_scale_"])
    # Use transform with restored stats; do not fit which would reset stored attributes
    scaled = scaler.transform(data)

    last_seq = scaled[-LOOKBACK:].reshape(1, LOOKBACK, 1)
    model = load_model(bundle["model_path"])
    next_scaled = model.predict(last_seq, verbose=0)
    next_price = float(scaler.inverse_transform(next_scaled)[0][0])
    last_close = float(data[-1][0])
    return {
        "ticker": ticker,
        "last_close": last_close,
        "prediction_next": next_price,
        "model_version": bundle["hash"],
        "as_of": df.index[-1].strftime('%Y-%m-%d'),
    }


def run_backtest(ticker: str, periods_per_year: int = 252) -> Dict:
    """Walk-forward backtest using the latest trained LSTM model.
    Predicts next-day close with a sliding window and evaluates both price error and a simple long/flat strategy.
    """
    bundle = load_latest_bundle(ticker)
    df = read_dataset(ticker, None, None)
    if 'Close' not in df.columns and isinstance(df, pd.DataFrame):
        raise RuntimeError("DataFrame missing 'Close' column")
    closes = df['Close'].astype(float)
    if len(closes) <= LOOKBACK + 1:
        raise RuntimeError("Not enough data for backtest")

    # Restore scaler from bundle and transform full series
    scaler = MinMaxScaler()
    scaler.min_ = np.array(bundle["scaler_min_"])
    scaler.scale_ = np.array(bundle["scaler_scale_"])
    data = closes.values.reshape(-1, 1)
    scaled = scaler.transform(data)

    model = load_model(bundle["model_path"])

    preds = []
    actuals = []
    pred_dates = []

    # Predict t using window [t-LOOKBACK, t)
    for t in range(LOOKBACK, len(scaled)):
        window = scaled[t-LOOKBACK:t].reshape(1, LOOKBACK, 1)
        next_scaled = model.predict(window, verbose=0)
        next_price = float(scaler.inverse_transform(next_scaled)[0][0])
        preds.append(next_price)
        actuals.append(float(data[t][0]))
        pred_dates.append(df.index[t])

    # Metrics on prices
    y_true = np.array(actuals).reshape(-1, 1)
    y_pred = np.array(preds).reshape(-1, 1)
    price_metrics = metrics_dict(y_true, y_pred)

    # Strategy: long if predicted next close > last close, else flat.
    # Align signal at t-1 to capture return at t
    prices = pd.Series([float(v) for v in data.flatten()], index=df.index)
    returns = prices.pct_change().fillna(0.0)

    pred_series = pd.Series([float(v) for v in preds], index=pd.DatetimeIndex(pred_dates))
    last_close_series = prices.shift(1).reindex(pred_series.index)
    signal = (pred_series > last_close_series).astype(int)
    strategy_returns = (signal.shift(1).fillna(0) * returns.reindex(pred_series.index)).fillna(0.0)

    equity_curve = (1 + strategy_returns).cumprod()
    bh_equity_curve = (1 + returns.reindex(pred_series.index).fillna(0.0)).cumprod()

    out = {
        "ticker": ticker,
        "n_predictions": int(len(pred_series)),
        "start_date": str(pred_series.index[0].date()),
        "end_date": str(pred_series.index[-1].date()),
        "lookback": LOOKBACK,
        "price_metrics": price_metrics,
        "strategy": {
            "total_return": float(equity_curve.iloc[-1] - 1.0),
            "sharpe": sharpe_ratio(strategy_returns, periods_per_year=periods_per_year),
            "max_drawdown": max_drawdown(equity_curve),
        },
        "buy_and_hold": {
            "total_return": float(bh_equity_curve.iloc[-1] - 1.0),
            "sharpe": sharpe_ratio(returns.reindex(pred_series.index).fillna(0.0), periods_per_year=periods_per_year),
            "max_drawdown": max_drawdown(bh_equity_curve),
        },
        "timestamp": datetime.utcnow().isoformat(),
        "model_version": bundle.get("hash"),
    }

    # Persist
    with open(os.path.join(REPORTS_DIR, f"backtest_{ticker}_{int(time.time())}.json"), "w") as f:
        json.dump(out, f, indent=2)
    return out


# ------------------------------ CLI -----------------------------------

def main():
    p = argparse.ArgumentParser(description="Stock prediction service")
    sub = p.add_subparsers(dest='cmd', required=True)

    p_train = sub.add_parser('train', help='Train model')
    p_train.add_argument('--ticker', type=str, required=True)
    p_train.add_argument('--csv', type=str, default=None)

    p_pred = sub.add_parser('predict', help='Predict future prices')
    p_pred.add_argument('--ticker', type=str, required=True)
    p_pred.add_argument('--days', type=int, default=30)

    p_eval = sub.add_parser('evaluate', help='Evaluate model')
    p_eval.add_argument('--ticker', type=str, required=True)
    args = p.parse_args()

    # New CLI using src.core
    if args.cmd == 'train':
        from src.core import train_model
        r = train_model(args.ticker, csv_path=getattr(args, 'csv', None))
        out = {
            'ticker': r.ticker,
            'model_path': r.model_path,
            'metrics': r.metrics,
            'timestamp': r.timestamp,
        }
    elif args.cmd == 'predict':
        from src.core import predict_stock
        out = predict_stock(args.ticker, prediction_days=args.days)
    elif args.cmd == 'evaluate':
        from src.core import evaluate_model
        out = evaluate_model(args.ticker)
    else:
        # Legacy paths for LSTM retained: eval/predict/backtest
        if args.cmd == 'legacy-eval':
            out = run_eval(args.ticker)
        elif args.cmd == 'legacy-predict':
            out = run_predict(args.ticker)
        else:
            out = run_backtest(args.ticker, periods_per_year=getattr(args, 'periods_per_year', 252))

    print(json.dumps(out, indent=2, default=str))


if __name__ == '__main__':
    main()
