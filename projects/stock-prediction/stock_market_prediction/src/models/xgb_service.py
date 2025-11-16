from __future__ import annotations
import os
from typing import Dict, List

import numpy as np
import pandas as pd
import joblib
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_squared_error, mean_absolute_error

from ..core import (
    _load_data,
    _feature_engineer,
    _latest_feature_row,
    MODELS_DIR,
    _ema,
    _rsi,
    _macd,
    _bollinger_bands,
    _stochastic_oscillator,
    _atr,
    _obv,
)

try:
    from xgboost import XGBRegressor
except Exception as e:
    XGBRegressor = None

XGB_DIR = os.path.join(MODELS_DIR, 'xgb')
os.makedirs(XGB_DIR, exist_ok=True)


def _bundle_path(ticker: str) -> str:
    return os.path.join(XGB_DIR, f"xgb_{ticker.upper()}.pkl")


def train_stock_xgb(ticker: str) -> str:
    if XGBRegressor is None:
        raise RuntimeError('xgboost not installed')
    df = _load_data(ticker, period='5y')
    # Build multivariate features with fundamentals when available; fallback to core features
    try:
        import yfinance as yf
        info = (yf.Ticker(ticker).info or {}) if yf is not None else {}
        pe = info.get('trailingPE')
        mcap = info.get('marketCap')
    except Exception:
        pe = None; mcap = None
    fe = df.copy()
    close = fe['Close']
    high = fe['High'] if 'High' in fe.columns else close
    low = fe['Low'] if 'Low' in fe.columns else close
    volume = fe['Volume'] if 'Volume' in fe.columns else pd.Series(0, index=fe.index)
    fe['Return'] = close.pct_change().fillna(0.0)
    fe['SMA_5'] = close.rolling(5).mean().bfill()
    fe['SMA_20'] = close.rolling(20).mean().bfill()
    fe['EMA_12'] = _ema(close, 12)
    fe['EMA_26'] = _ema(close, 26)
    macd, macd_sig = _macd(close)
    fe['MACD'] = macd
    fe['MACD_Signal'] = macd_sig
    fe['RSI_14'] = _rsi(close, 14)
    bb_lo, bb_ma, bb_hi = _bollinger_bands(close)
    fe['BB_lower'] = bb_lo
    fe['BB_middle'] = bb_ma
    fe['BB_upper'] = bb_hi
    st_k, st_d = _stochastic_oscillator(high, low, close)
    fe['Stoch_K'] = st_k
    fe['Stoch_D'] = st_d
    fe['ATR_14'] = _atr(high, low, close)
    fe['OBV'] = _obv(close, volume)
    fe['Volume'] = volume.fillna(0)
    fe['PE'] = float(pe) if pe is not None else np.nan
    fe['MarketCap'] = float(mcap) if mcap is not None else np.nan
    fe['Close_t'] = close.shift(1)
    fe['Target'] = close.shift(-1)
    fe = fe.dropna()
    features = ['Return','SMA_5','SMA_20','EMA_12','EMA_26','MACD','MACD_Signal','RSI_14','BB_lower','BB_middle','BB_upper','Stoch_K','Stoch_D','ATR_14','OBV','Volume','PE','MarketCap','Close_t']
    # If fundamentals are NaN for all, drop them
    if fe['PE'].isna().all():
        features.remove('PE')
    if fe['MarketCap'].isna().all():
        features.remove('MarketCap')
    X = fe[features]
    y = fe['Target']

    # Chronological split
    n = len(fe)
    train_end = int(n * 0.8)
    X_train, y_train = X.iloc[:train_end], y.iloc[:train_end]
    X_val, y_val = X.iloc[train_end:], y.iloc[train_end:]

    scaler = StandardScaler()
    X_tr = scaler.fit_transform(X_train)
    X_va = scaler.transform(X_val)

    model = XGBRegressor(
        n_estimators=600,
        max_depth=6,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        reg_lambda=1.0,
        random_state=42,
        n_jobs=-1,
        tree_method='hist'
    )
    model.fit(X_tr, y_train, eval_set=[(X_va, y_val)], verbose=False)

    preds = model.predict(X_va)
    rmse = float(np.sqrt(mean_squared_error(y_val, preds)))
    mae = float(mean_absolute_error(y_val, preds))
    ts = pd.Timestamp.utcnow().strftime('%Y%m%d%H%M%S')
    bundle = {
        'ticker': ticker.upper(),
        'created_at': ts,
        'features': features,
        'scaler': scaler,
        'model': model,
        'metrics': {'rmse': rmse, 'mae': mae},
    }
    path_latest = _bundle_path(ticker)
    path_versioned = os.path.join(XGB_DIR, f"xgb_{ticker.upper()}_{ts}.pkl")
    joblib.dump(bundle, path_versioned)
    joblib.dump(bundle, path_latest)
    return path_versioned


def predict_stock_xgb(ticker: str, days: int = 30) -> Dict:
    path = _bundle_path(ticker)
    if not os.path.exists(path):
        train_stock_xgb(ticker)
    bundle = joblib.load(path)
    features = bundle['features']
    scaler: StandardScaler = bundle['scaler']
    model = bundle['model']

    df = _load_data(ticker, period='5y')
    # Rebuild features deterministically as in training
    fe = df.copy()
    close = fe['Close']
    high = fe['High'] if 'High' in fe.columns else close
    low = fe['Low'] if 'Low' in fe.columns else close
    volume = fe['Volume'] if 'Volume' in fe.columns else pd.Series(0, index=fe.index)
    fe['Return'] = close.pct_change().fillna(0.0)
    fe['SMA_5'] = close.rolling(5).mean().bfill()
    fe['SMA_20'] = close.rolling(20).mean().bfill()
    fe['EMA_12'] = _ema(close, 12)
    fe['EMA_26'] = _ema(close, 26)
    macd, macd_sig = _macd(close)
    fe['MACD'] = macd
    fe['MACD_Signal'] = macd_sig
    fe['RSI_14'] = _rsi(close, 14)
    bb_lo, bb_ma, bb_hi = _bollinger_bands(close)
    fe['BB_lower'] = bb_lo
    fe['BB_middle'] = bb_ma
    fe['BB_upper'] = bb_hi
    st_k, st_d = _stochastic_oscillator(high, low, close)
    fe['Stoch_K'] = st_k
    fe['Stoch_D'] = st_d
    fe['ATR_14'] = _atr(high, low, close)
    fe['OBV'] = _obv(close, volume)
    fe['Volume'] = volume.fillna(0)
    # Fundamentals will be constants if present in training features
    if 'PE' in features:
        try:
            import yfinance as yf
            info = (yf.Ticker(ticker).info or {}) if yf is not None else {}
            fe['PE'] = float(info.get('trailingPE')) if info.get('trailingPE') is not None else np.nan
        except Exception:
            fe['PE'] = np.nan
    if 'MarketCap' in features:
        try:
            import yfinance as yf
            info = (yf.Ticker(ticker).info or {}) if yf is not None else {}
            fe['MarketCap'] = float(info.get('marketCap')) if info.get('marketCap') is not None else np.nan
        except Exception:
            fe['MarketCap'] = np.nan
    fe['Close_t'] = close.shift(1)
    fe = fe.dropna()
    X = fe[features]
    Xs = scaler.transform(X)

    preds: List[float] = []
    intervals: List[List[float]] = []
    last_idx = fe.index[-1]
    close_series = df['Close'].copy()
    for _ in range(days):
        next_price = float(model.predict(Xs[-1:])[0])
        preds.append(next_price)
        rmse = float(bundle['metrics'].get('rmse', 0.0))
        ci = 1.96 * rmse
        intervals.append([float(next_price - ci), float(next_price + ci)])
        next_idx = last_idx + pd.Timedelta(days=1)
        close_series.loc[next_idx] = next_price
        # recompute latest feature row with same columns. For fundamentals keep last known values
        latest = {}
        latest['Return'] = (preds[-1] - float(close.iloc[-1])) / (float(close.iloc[-1]) or 1)
        latest['SMA_5'] = float(pd.Series(close_series).rolling(5).mean().iloc[-1])
        latest['SMA_20'] = float(pd.Series(close_series).rolling(20).mean().iloc[-1])
        latest['EMA_12'] = float(pd.Series(close_series).ewm(span=12, adjust=False).mean().iloc[-1])
        latest['EMA_26'] = float(pd.Series(close_series).ewm(span=26, adjust=False).mean().iloc[-1])
        m, ms = _macd(pd.Series(close_series))
        latest['MACD'] = float(m.iloc[-1]); latest['MACD_Signal'] = float(ms.iloc[-1])
        latest['RSI_14'] = float(_rsi(pd.Series(close_series), 14).iloc[-1])
        l, mid, u = _bollinger_bands(pd.Series(close_series))
        latest['BB_lower'] = float(l.iloc[-1]); latest['BB_middle'] = float(mid.iloc[-1]); latest['BB_upper'] = float(u.iloc[-1])
        # Use last known high/low for stochastic calculation
        hser = fe['High'] if 'High' in fe.columns else pd.Series(close_series)
        lser = fe['Low'] if 'Low' in fe.columns else pd.Series(close_series)
        sk, sd = _stochastic_oscillator(hser, lser, pd.Series(close_series))
        latest['Stoch_K'] = float(sk.iloc[-1]); latest['Stoch_D'] = float(sd.iloc[-1])
        latest['ATR_14'] = float(_atr(hser, lser, pd.Series(close_series)).iloc[-1])
        latest['OBV'] = float(_obv(pd.Series(close_series), fe['Volume'] if 'Volume' in fe.columns else pd.Series(0, index=fe.index)).iloc[-1])
        latest['Volume'] = float(fe['Volume'].iloc[-1]) if 'Volume' in fe.columns else 0.0
        if 'PE' in features:
            latest['PE'] = float(fe['PE'].iloc[-1]) if 'PE' in fe.columns and pd.notna(fe['PE'].iloc[-1]) else np.nan
        if 'MarketCap' in features:
            latest['MarketCap'] = float(fe['MarketCap'].iloc[-1]) if 'MarketCap' in fe.columns and pd.notna(fe['MarketCap'].iloc[-1]) else np.nan
        latest['Close_t'] = float(close_series.iloc[-2]) if len(close_series) >= 2 else float(close_series.iloc[-1])
        X_new = pd.DataFrame([latest])[features]
        X_new_s = scaler.transform(X_new)
        Xs = np.vstack([Xs, X_new_s])
        last_idx = next_idx

    sma5 = df['Close'].rolling(5).mean().iloc[-1]
    sma20 = df['Close'].rolling(20).mean().iloc[-1]
    # RSI helper from core via engineered features
    rsi14 = fe['RSI_14'].iloc[-1] if 'RSI_14' in fe.columns else np.nan

    return {
        'ticker': ticker.upper(),
        'predictions': preds,
        'intervals': intervals,
        'confidence': float(np.clip(1.0 - (bundle['metrics']['rmse'] / (np.mean(fe['Close']) or 1)), 0, 1)),
        'model_version': f"xgb_v1_{bundle['created_at']}",
        'timestamp': pd.Timestamp.utcnow().isoformat(),
        'as_of': df.index[-1].isoformat(),
        'last_close': float(df['Close'].iloc[-1]),
        'sma5': float(sma5) if pd.notna(sma5) else None,
        'sma20': float(sma20) if pd.notna(sma20) else None,
        'rsi14': float(rsi14) if pd.notna(rsi14) else None,
    }


def evaluate_stock_xgb(ticker: str) -> Dict:
    path = _bundle_path(ticker)
    if not os.path.exists(path):
        train_stock_xgb(ticker)
    bundle = joblib.load(path)
    features = bundle['features']
    scaler: StandardScaler = bundle['scaler']
    model = bundle['model']

    df = _load_data(ticker, period='5y')
    fe = df.copy()
    close = fe['Close']
    high = fe['High'] if 'High' in fe.columns else close
    low = fe['Low'] if 'Low' in fe.columns else close
    volume = fe['Volume'] if 'Volume' in fe.columns else pd.Series(0, index=fe.index)
    fe['Return'] = close.pct_change().fillna(0.0)
    fe['SMA_5'] = close.rolling(5).mean().bfill()
    fe['SMA_20'] = close.rolling(20).mean().bfill()
    fe['EMA_12'] = _ema(close, 12)
    fe['EMA_26'] = _ema(close, 26)
    macd, macd_sig = _macd(close)
    fe['MACD'] = macd
    fe['MACD_Signal'] = macd_sig
    fe['RSI_14'] = _rsi(close, 14)
    bb_lo, bb_ma, bb_hi = _bollinger_bands(close)
    fe['BB_lower'] = bb_lo
    fe['BB_middle'] = bb_ma
    fe['BB_upper'] = bb_hi
    st_k, st_d = _stochastic_oscillator(high, low, close)
    fe['Stoch_K'] = st_k
    fe['Stoch_D'] = st_d
    fe['ATR_14'] = _atr(high, low, close)
    fe['OBV'] = _obv(close, volume)
    fe['Volume'] = volume.fillna(0)
    if 'PE' in features:
        try:
            import yfinance as yf
            info = (yf.Ticker(ticker).info or {}) if yf is not None else {}
            fe['PE'] = float(info.get('trailingPE')) if info.get('trailingPE') is not None else np.nan
        except Exception:
            fe['PE'] = np.nan
    if 'MarketCap' in features:
        try:
            import yfinance as yf
            info = (yf.Ticker(ticker).info or {}) if yf is not None else {}
            fe['MarketCap'] = float(info.get('marketCap')) if info.get('marketCap') is not None else np.nan
        except Exception:
            fe['MarketCap'] = np.nan
    fe['Close_t'] = close.shift(1)
    fe['Target'] = close.shift(-1)
    fe = fe.dropna()
    X = fe[features]
    y = fe['Target']

    n = len(fe)
    train_end = int(n * 0.8)
    X_train, y_train = X.iloc[:train_end], y.iloc[:train_end]
    X_test, y_test = X.iloc[train_end:], y.iloc[train_end:]

    X_tr = scaler.transform(X_train)
    X_te = scaler.transform(X_test)
    y_pred = model.predict(X_te)

    rmse = float(np.sqrt(mean_squared_error(y_test, y_pred)))
    mae = float(mean_absolute_error(y_test, y_pred))
    acc = float(np.mean(np.sign(np.diff(y_test.values)) == np.sign(np.diff(y_pred)))) if len(y_test) > 1 else 0.0
    # baselines
    y_naive = y_test.shift(1).fillna(method='bfill').values
    y_sma5 = fe['Close'].rolling(5).mean().shift(1).iloc[train_end:].fillna(method='bfill').values
    def _m(y_true, y_hat):
        return {
            'rmse': float(np.sqrt(mean_squared_error(y_true, y_hat))),
            'mae': float(mean_absolute_error(y_true, y_hat)),
        }
    base_naive_m = _m(y_test.values, y_naive)
    base_sma_m = _m(y_test.values, y_sma5)

    return {
        'ticker': ticker.upper(),
        'test_metrics': {'rmse': rmse, 'mae': mae, 'accuracy': acc},
        'baseline': { 'naive': base_naive_m, 'sma5': base_sma_m },
        'trained_on': bundle.get('created_at'),
        'timestamp': pd.Timestamp.utcnow().isoformat(),
    }
