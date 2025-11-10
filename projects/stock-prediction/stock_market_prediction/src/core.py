from __future__ import annotations
import os
import json
import time
from dataclasses import dataclass
from datetime import datetime
from typing import Dict, Tuple, List, Optional

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, mean_absolute_error
from sklearn.preprocessing import StandardScaler
import joblib

try:
    import yfinance as yf
except Exception:
    yf = None

ROOT = os.path.dirname(os.path.dirname(__file__))
DATA_DIR = os.path.join(ROOT, 'data')
MODELS_DIR = os.path.join(ROOT, 'models')
REPORTS_DIR = os.path.join(ROOT, 'reports')
os.makedirs(MODELS_DIR, exist_ok=True)
os.makedirs(REPORTS_DIR, exist_ok=True)


def _rsi(series: pd.Series, window: int = 14) -> pd.Series:
    delta = series.diff()
    gain = delta.clip(lower=0)
    loss = -delta.clip(upper=0)
    avg_gain = gain.rolling(window).mean()
    avg_loss = loss.rolling(window).mean()
    rs = avg_gain / (avg_loss.replace(0, np.nan))
    rsi = 100 - (100 / (1 + rs))
    return rsi.fillna(50.0)


def _ema(series: pd.Series, span: int) -> pd.Series:
    return series.ewm(span=span, adjust=False).mean()


def _macd(series: pd.Series, fast: int = 12, slow: int = 26, signal: int = 9) -> Tuple[pd.Series, pd.Series]:
    ema_fast = _ema(series, fast)
    ema_slow = _ema(series, slow)
    macd = ema_fast - ema_slow
    sig = _ema(macd, signal)
    return macd, sig


def _bollinger_bands(series: pd.Series, window: int = 20, num_std: float = 2.0) -> Tuple[pd.Series, pd.Series, pd.Series]:
    ma = series.rolling(window).mean()
    sd = series.rolling(window).std(ddof=0)
    upper = ma + num_std * sd
    lower = ma - num_std * sd
    return lower, ma, upper


def _stochastic_oscillator(high: pd.Series, low: pd.Series, close: pd.Series, k_period: int = 14, d_period: int = 3) -> Tuple[pd.Series, pd.Series]:
    lowest_low = low.rolling(k_period).min()
    highest_high = high.rolling(k_period).max()
    k = 100 * (close - lowest_low) / (highest_high - lowest_low + 1e-12)
    d = k.rolling(d_period).mean()
    return k, d


def _atr(high: pd.Series, low: pd.Series, close: pd.Series, period: int = 14) -> pd.Series:
    hl = (high - low).abs()
    hc = (high - close.shift(1)).abs()
    lc = (low - close.shift(1)).abs()
    tr = pd.concat([hl, hc, lc], axis=1).max(axis=1)
    return tr.rolling(period).mean()


def _obv(close: pd.Series, volume: pd.Series) -> pd.Series:
    direction = np.sign(close.diff()).fillna(0)
    return (direction * volume).cumsum().fillna(0)


def _feature_engineer(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    close = df['Close']
    df['Return'] = close.pct_change().fillna(0.0)
    df['SMA_5'] = close.rolling(5).mean().bfill()
    df['SMA_20'] = close.rolling(20).mean().bfill()
    df['EMA_12'] = _ema(close, 12)
    df['EMA_26'] = _ema(close, 26)
    macd, macd_sig = _macd(close)
    df['MACD'] = macd
    df['MACD_Signal'] = macd_sig
    df['RSI_14'] = _rsi(close, 14)
    # Lagged close to avoid leakage
    df['Close_t'] = close.shift(1)
    # Target: next-day close
    df['Target'] = close.shift(-1)
    df = df.dropna()
    return df


def _latest_feature_row(close_series: pd.Series) -> pd.Series:
    """Compute the feature vector for the latest date in the provided Close series
    without requiring the Target column. This mirrors the columns used in training
    (except 'Target'), allowing us to generate features for autoregressive steps.
    """
    if close_series is None or len(close_series) == 0:
        raise RuntimeError('Empty close series for feature computation')
    s = close_series.astype(float)
    # Build a small frame to compute indicators (explicit index to satisfy pandas)
    tmp = pd.DataFrame({'Close': np.ravel(s.values)}, index=s.index)
    # Indicators
    ema12 = _ema(tmp['Close'], 12)
    ema26 = _ema(tmp['Close'], 26)
    macd, macd_sig = _macd(tmp['Close'])
    rsi14 = _rsi(tmp['Close'], 14)
    sma5 = tmp['Close'].rolling(5).mean().bfill()
    sma20 = tmp['Close'].rolling(20).mean().bfill()

    last_idx = s.index[-1]
    prev_idx = s.index[-2] if len(s) >= 2 else last_idx
    prev_close = float(s.loc[prev_idx]) if len(s) >= 2 else float(s.loc[last_idx])
    last_close = float(s.loc[last_idx])
    # Assemble features aligned to latest date
    row = {
        'Return': (last_close - prev_close) / (prev_close if prev_close != 0 else 1.0),
        'SMA_5': float(sma5.loc[last_idx]),
        'SMA_20': float(sma20.loc[last_idx]),
        'EMA_12': float(ema12.loc[last_idx]),
        'EMA_26': float(ema26.loc[last_idx]),
        'MACD': float(macd.loc[last_idx]),
        'MACD_Signal': float(macd_sig.loc[last_idx]),
        'RSI_14': float(rsi14.loc[last_idx]),
        'Close_t': prev_close,
    }
    return pd.Series(row)


def _load_data(ticker: str, csv_path: Optional[str] = None, period: str = '2y', interval: str = '1d') -> pd.DataFrame:
    # Preferred: provided CSV
    if csv_path and os.path.exists(csv_path):
        df = pd.read_csv(csv_path, parse_dates=['Date'])
        return df.set_index('Date')
    # Try yfinance
    if yf is not None:
        try:
            df = yf.download(ticker, period=period, interval=interval, progress=False, auto_adjust=True)
        except Exception:
            df = pd.DataFrame()
        if df is not None and not df.empty:
            return df
    # Fallback to local sample CSVs
    for candidate in [
        os.path.join(ROOT, 'data', 'raw', f'{ticker}_{datetime.utcnow().strftime("%Y%m%d")}.csv'),
        os.path.join(ROOT, 'stock_data.csv'),
    ]:
        if os.path.exists(candidate):
            df = pd.read_csv(candidate, parse_dates=['Date'])
            return df.set_index('Date')
    raise RuntimeError('No data available from yfinance or local CSV')


@dataclass
class TrainResult:
    model_path: str
    metrics: Dict[str, float]
    feature_columns: List[str]
    ticker: str
    timestamp: str


def train_model(ticker: str, csv_path: Optional[str] = None) -> TrainResult:
    df = _load_data(ticker, csv_path)
    fe = _feature_engineer(df)
    features = ['Return', 'SMA_5', 'SMA_20', 'EMA_12', 'EMA_26', 'MACD', 'MACD_Signal', 'RSI_14', 'Close_t']
    X = fe[features]
    y = fe['Target']

    # Chronological split: 70/15/15
    n = len(fe)
    train_end = int(n * 0.7)
    val_end = int(n * 0.85)
    X_train, y_train = X.iloc[:train_end], y.iloc[:train_end]
    X_val, y_val = X.iloc[train_end:val_end], y.iloc[train_end:val_end]
    X_test, y_test = X.iloc[val_end:], y.iloc[val_end:]

    scaler = StandardScaler()
    X_train_s = scaler.fit_transform(X_train)
    X_val_s = scaler.transform(X_val)
    X_test_s = scaler.transform(X_test)

    model = RandomForestRegressor(n_estimators=400, random_state=42, n_jobs=-1)
    model.fit(np.vstack([X_train_s, X_val_s]), pd.concat([y_train, y_val]))

    preds = model.predict(X_test_s)
    rmse = float(np.sqrt(mean_squared_error(y_test, preds)))
    mae = float(mean_absolute_error(y_test, preds))

    # Directional accuracy on returns
    da = float(np.mean(np.sign(np.diff(y_test.values)) == np.sign(np.diff(preds)))) if len(y_test) > 1 else 0.0

    ts = datetime.utcnow().strftime('%Y%m%d%H%M%S')
    model_path = os.path.join(MODELS_DIR, f"model_{ticker}_{ts}.pkl")
    bundle = {
        'ticker': ticker,
        'created_at': ts,
        'features': features,
        'scaler': scaler,
        'model': model,
        'metrics': {'rmse': rmse, 'mae': mae, 'accuracy': da},
    }
    joblib.dump(bundle, model_path)

    return TrainResult(model_path=model_path, metrics=bundle['metrics'], feature_columns=features, ticker=ticker, timestamp=ts)


def _load_latest_model(ticker: str) -> Dict:
    if not os.path.isdir(MODELS_DIR):
        raise FileNotFoundError('Models directory not found')
    candidates = [f for f in os.listdir(MODELS_DIR) if f.startswith(f'model_{ticker}_') and f.endswith('.pkl')]
    if not candidates:
        raise FileNotFoundError('No model found for ticker')
    latest = sorted(candidates)[-1]
    return joblib.load(os.path.join(MODELS_DIR, latest))


def predict_stock(ticker: str, prediction_days: int = 30) -> Dict:
    bundle = _load_latest_model(ticker)
    features = bundle['features']
    scaler: StandardScaler = bundle['scaler']
    model: RandomForestRegressor = bundle['model']

    df = _load_data(ticker)
    fe = _feature_engineer(df)
    if fe.empty:
        raise RuntimeError('Insufficient engineered data for prediction')
    X = fe[features]
    Xs = scaler.transform(X)
    # For a tree-based model, produce next-day predictions autoregressively using latest features
    last_idx = fe.index[-1]
    preds: List[float] = []
    intervals: List[List[float]] = []
    # current close is the last actual close in df
    last_close = float(df['Close'].iloc[-1])
    close_series = df['Close'].copy()
    for _ in range(prediction_days):
        # Use last available feature row to predict next close
        next_price = float(model.predict(Xs[-1:])[0])
        preds.append(next_price)
        # derive naive 95% CI from train RMSE (if available)
        rmse = float(bundle['metrics'].get('rmse', 0.0))
        ci = 1.96 * rmse
        intervals.append([float(next_price - ci), float(next_price + ci)])
        # Append predicted close and compute latest feature row without requiring Target
        next_idx = last_idx + pd.Timedelta(days=1)
        close_series.loc[next_idx] = next_price
        latest_row = _latest_feature_row(close_series)
        # Construct next feature matrix by appending transformed latest_row
        X_new = latest_row[features].to_frame().T
        X_new_s = scaler.transform(X_new)
        Xs = np.vstack([Xs, X_new_s])
        # Advance state
        last_close = next_price
        last_idx = next_idx

    # Compute simple indicators on the latest real close
    as_of_dt = df.index[-1]
    sma5_series = df['Close'].rolling(5).mean().bfill()
    sma20_series = df['Close'].rolling(20).mean().bfill()
    rsi_series = _rsi(df['Close'], 14)
    sma5_val = float(sma5_series.iloc[-1]) if len(sma5_series) else float('nan')
    sma20_val = float(sma20_series.iloc[-1]) if len(sma20_series) else float('nan')
    rsi_val = float(rsi_series.iloc[-1]) if len(rsi_series) else 50.0

    return {
        'ticker': ticker,
        'predictions': preds,
        'intervals': intervals,
        'confidence': float(np.clip(1.0 - (bundle['metrics']['rmse'] / (np.mean(fe['Close']) or 1)), 0, 1)),
        'model_version': f"v1.0_{bundle['created_at']}",
        'timestamp': datetime.utcnow().isoformat(),
        'as_of': as_of_dt.isoformat(),
        'last_close': last_close,
        'sma5': sma5_val,
        'sma20': sma20_val,
        'rsi14': rsi_val,
    }


def evaluate_model(ticker: str) -> Dict:
    bundle = _load_latest_model(ticker)
    features = bundle['features']
    scaler: StandardScaler = bundle['scaler']
    model: RandomForestRegressor = bundle['model']

    df = _load_data(ticker)
    fe = _feature_engineer(df)
    X = fe[features]
    y = fe['Target']
    # chronological 70/15/15
    n = len(fe)
    train_end = int(n * 0.7)
    val_end = int(n * 0.85)
    X_train, y_train = X.iloc[:train_end], y.iloc[:train_end]
    X_val, y_val = X.iloc[train_end:val_end], y.iloc[train_end:val_end]
    X_test, y_test = X.iloc[val_end:], y.iloc[val_end:]

    X_train_s = scaler.transform(X_train)
    X_val_s = scaler.transform(X_val)
    X_test_s = scaler.transform(X_test)
    preds = model.predict(X_test_s)

    rmse = float(np.sqrt(mean_squared_error(y_test, preds)))
    mae = float(mean_absolute_error(y_test, preds))
    da = float(np.mean(np.sign(np.diff(y_test.values)) == np.sign(np.diff(preds)))) if len(y_test) > 1 else 0.0

    # Baseline: previous-day close (naive) and SMA-5
    baseline_naive = y_test.shift(1).fillna(method='bfill').values
    baseline_sma = fe['Close'].rolling(5).mean().shift(1).iloc[val_end:].fillna(method='bfill').values
    def _m(y_true, y_hat):
        return {
            'rmse': float(np.sqrt(mean_squared_error(y_true, y_hat)) ),
            'mae': float(mean_absolute_error(y_true, y_hat)),
        }
    base_naive_m = _m(y_test.values, baseline_naive)
    base_sma_m = _m(y_test.values, baseline_sma)

    out = {
        'ticker': ticker,
        'test_metrics': {'rmse': rmse, 'mae': mae, 'accuracy': da},
        'baseline': {
            'naive': base_naive_m,
            'sma5': base_sma_m,
        },
        'trained_on': bundle['created_at'],
        'timestamp': datetime.utcnow().isoformat(),
    }
    report_path = os.path.join(REPORTS_DIR, f"metrics_{ticker}_{int(time.time())}.json")
    with open(report_path, 'w') as f:
        json.dump(out, f, indent=2)
    return out


def evaluate_model_walkforward(ticker: str, steps: int = 60) -> Dict:
    """Walk-forward backtest for RF baseline over the last `steps` targets.
    Expanding window retraining each day to avoid lookahead bias.
    """
    df = _load_data(ticker)
    fe = _feature_engineer(df)
    features = ['Return', 'SMA_5', 'SMA_20', 'EMA_12', 'EMA_26', 'MACD', 'MACD_Signal', 'RSI_14', 'Close_t']
    X = fe[features]
    y = fe['Target']
    n = len(fe)
    if n < 200 or steps < 10:
        raise RuntimeError('Insufficient data for walk-forward evaluation')
    start = n - steps
    scaler = StandardScaler()
    preds = []
    truth = []
    for i in range(start, n):
        X_train, y_train = X.iloc[:i], y.iloc[:i]
        X_test_row = X.iloc[i:i+1]
        y_test_row = y.iloc[i]
        # fit scaler on train
        X_tr = scaler.fit_transform(X_train)
        X_te = scaler.transform(X_test_row)
        model = RandomForestRegressor(n_estimators=400, random_state=42, n_jobs=-1)
        model.fit(X_tr, y_train)
        y_hat = float(model.predict(X_te)[0])
        preds.append(y_hat)
        truth.append(float(y_test_row))
    preds = np.array(preds)
    truth = np.array(truth)
    from sklearn.metrics import mean_squared_error, mean_absolute_error
    rmse = float(np.sqrt(mean_squared_error(truth, preds)))
    mae = float(mean_absolute_error(truth, preds))
    acc = float(np.mean(np.sign(np.diff(truth)) == np.sign(np.diff(preds)))) if len(truth) > 1 else 0.0
    # Baselines over the same horizon
    y_naive = fe['Close'].shift(0).iloc[start-1:n-1].values  # previous actual close
    sma5 = fe['Close'].rolling(5).mean().shift(1).iloc[start:n].values
    def _m(y_true, y_hat):
        return {
            'rmse': float(np.sqrt(mean_squared_error(y_true, y_hat)) ),
            'mae': float(mean_absolute_error(y_true, y_hat)),
        }
    out = {
        'ticker': ticker,
        'window': steps,
        'test_metrics': {'rmse': rmse, 'mae': mae, 'accuracy': acc},
        'baseline': {
            'naive': _m(truth, y_naive),
            'sma5': _m(truth, sma5),
        },
        'timestamp': datetime.utcnow().isoformat(),
        'mode': 'walk-forward'
    }
    return out
