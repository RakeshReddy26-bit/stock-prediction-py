from __future__ import annotations
import os
from typing import Dict, List, Tuple, Optional

import numpy as np
import pandas as pd
import joblib
import shutil

from ..core import (
    _load_data,
    _rsi,
    _ema,
    _macd,
    MODELS_DIR,
    _bollinger_bands,
    _stochastic_oscillator,
    _atr,
    _obv,
)
from .lstm_model import (
    LSTMConfig,
    make_supervised,
    train_lstm,
    predict_lstm,
    predict_lstm_with_uncertainty,
    train_lstm_multivariate,
)
from .lstm_tuning import tune_lstm

LSTM_DIR = os.path.join(MODELS_DIR, 'lstm')
os.makedirs(LSTM_DIR, exist_ok=True)
LSTM_TUNED_DIR = os.path.join(MODELS_DIR, 'lstm_tuned')
os.makedirs(LSTM_TUNED_DIR, exist_ok=True)


def _bundle_path(ticker: str) -> str:
    return os.path.join(LSTM_DIR, f"lstm_{ticker.upper()}.pkl")

def _bundle_tuned_path(ticker: str) -> str:
    return os.path.join(LSTM_TUNED_DIR, f"lstm_tuned_{ticker.upper()}.pkl")


def _get_fundamentals(ticker: str) -> Dict[str, Optional[float]]:
    try:
        import yfinance as yf
        info = yf.Ticker(ticker).info or {}
        pe = info.get('trailingPE')
        mcap = info.get('marketCap')
        return {'PE': float(pe) if pe is not None else None,
                'MarketCap': float(mcap) if mcap is not None else None}
    except Exception:
        return {'PE': None, 'MarketCap': None}


def _compute_features_df(df: pd.DataFrame, fundamentals: Dict[str, Optional[float]]) -> pd.DataFrame:
    """Build multivariate feature frame from OHLCV with indicators and fundamentals."""
    out = pd.DataFrame(index=df.index.copy())
    close = df['Close'].astype(float)
    high = df['High'] if 'High' in df.columns else close
    low = df['Low'] if 'Low' in df.columns else close
    volume = df['Volume'] if 'Volume' in df.columns else pd.Series(0, index=df.index)

    out['Return'] = close.pct_change().fillna(0.0)
    out['SMA_5'] = close.rolling(5).mean().bfill()
    out['SMA_20'] = close.rolling(20).mean().bfill()
    out['EMA_12'] = _ema(close, 12)
    out['EMA_26'] = _ema(close, 26)
    macd, macd_sig = _macd(close)
    out['MACD'] = macd
    out['MACD_Signal'] = macd_sig
    out['RSI_14'] = _rsi(close, 14)
    bb_lo, bb_ma, bb_hi = _bollinger_bands(close)
    out['BB_lower'] = bb_lo
    out['BB_middle'] = bb_ma
    out['BB_upper'] = bb_hi
    st_k, st_d = _stochastic_oscillator(high, low, close)
    out['Stoch_K'] = st_k
    out['Stoch_D'] = st_d
    out['ATR_14'] = _atr(high, low, close)
    out['OBV'] = _obv(close, volume)
    out['Volume'] = volume.fillna(0)
    # Fundamentals (constant across index)
    pe = fundamentals.get('PE')
    mcap = fundamentals.get('MarketCap')
    out['PE'] = float(pe) if pe is not None else np.nan
    out['MarketCap'] = float(mcap) if mcap is not None else np.nan
    # Lagged close as strong signal
    out['Close_t'] = close.shift(1)
    # Drop rows with NaN introduced by rolling
    out = out.dropna()
    return out


def _latest_feature_row_full(close: pd.Series,
                             high: Optional[pd.Series],
                             low: Optional[pd.Series],
                             volume: Optional[pd.Series],
                             fundamentals: Dict[str, Optional[float]]) -> pd.Series:
    idx = close.index[-1]
    h = high if high is not None else close
    l = low if low is not None else close
    v = volume if volume is not None else pd.Series(0, index=close.index)

    ema12 = _ema(close, 12)
    ema26 = _ema(close, 26)
    macd, macd_sig = _macd(close)
    rsi14 = _rsi(close, 14)
    bb_lo, bb_ma, bb_hi = _bollinger_bands(close)
    st_k, st_d = _stochastic_oscillator(h, l, close)
    atr14 = _atr(h, l, close)
    obv = _obv(close, v)

    prev_idx = close.index[-2] if len(close) >= 2 else idx
    prev_close = float(close.loc[prev_idx])
    last_close = float(close.loc[idx])

    row = {
        'Return': (last_close - prev_close) / (prev_close if prev_close != 0 else 1.0),
        'SMA_5': float(close.rolling(5).mean().bfill().loc[idx]),
        'SMA_20': float(close.rolling(20).mean().bfill().loc[idx]),
        'EMA_12': float(ema12.loc[idx]),
        'EMA_26': float(ema26.loc[idx]),
        'MACD': float(macd.loc[idx]),
        'MACD_Signal': float(macd_sig.loc[idx]),
        'RSI_14': float(rsi14.loc[idx]),
        'BB_lower': float(bb_lo.loc[idx]),
        'BB_middle': float(bb_ma.loc[idx]),
        'BB_upper': float(bb_hi.loc[idx]),
        'Stoch_K': float(st_k.loc[idx]),
        'Stoch_D': float(st_d.loc[idx]),
        'ATR_14': float(atr14.loc[idx]) if pd.notna(atr14.loc[idx]) else 0.0,
        'OBV': float(obv.loc[idx]) if pd.notna(obv.loc[idx]) else 0.0,
        'Volume': float(v.loc[idx]) if idx in v.index and pd.notna(v.loc[idx]) else 0.0,
        'PE': float(fundamentals.get('PE')) if fundamentals.get('PE') is not None else np.nan,
        'MarketCap': float(fundamentals.get('MarketCap')) if fundamentals.get('MarketCap') is not None else np.nan,
        'Close_t': prev_close,
    }
    return pd.Series(row)


def train_stock_lstm(ticker: str, lookback: int = 60) -> str:
    df = _load_data(ticker, period='5y')
    cfg = LSTMConfig(lookback=lookback)
    # Try multivariate first; fallback to univariate
    try:
        fundamentals = _get_fundamentals(ticker)
        F = _compute_features_df(df, fundamentals)
        target = df['Close'].loc[F.index]
        model, feat_scaler, tgt_scaler, metrics = train_lstm_multivariate(F, target, cfg)
        ts = pd.Timestamp.utcnow().strftime('%Y%m%d%H%M%S')
        bundle = {
            'ticker': ticker.upper(),
            'cfg': cfg.__dict__,
            'metrics': metrics,
            'feature_cols': list(F.columns),
            'feat_scaler': feat_scaler,
            'tgt_scaler': tgt_scaler,
            'weights': model.get_weights(),
            'created_at': ts,
            'multi': True,
        }
    except Exception:
        close = df['Close']
        model, scaler, metrics = train_lstm(close, cfg)
        ts = pd.Timestamp.utcnow().strftime('%Y%m%d%H%M%S')
        bundle = {
            'ticker': ticker.upper(),
            'cfg': cfg.__dict__,
            'metrics': metrics,
            'scaler': scaler,
            'weights': model.get_weights(),
            'created_at': ts,
            'multi': False,
        }
    ts = pd.Timestamp.utcnow().strftime('%Y%m%d%H%M%S')
    # Save versioned bundle and update latest pointer
    path_latest = _bundle_path(ticker)
    path_versioned = os.path.join(LSTM_DIR, f"lstm_{ticker.upper()}_{ts}.pkl")
    joblib.dump(bundle, path_versioned)
    joblib.dump(bundle, path_latest)
    return path_versioned


def predict_stock_lstm(ticker: str, days: int = 30) -> Dict:
    path = _bundle_path(ticker)
    if not os.path.exists(path):
        # train on the fly for now
        train_stock_lstm(ticker)
    bundle = joblib.load(path)
    cfg = LSTMConfig(**bundle.get('cfg', {}))

    # rebuild model and set weights (lazy import via importlib to avoid static import issues)
    import importlib
    tfk = importlib.import_module('tensorflow.keras')
    layers = importlib.import_module('tensorflow.keras.layers')
    optim = importlib.import_module('tensorflow.keras.optimizers')

    def build_from_cfg(c: LSTMConfig):
        m = tfk.Sequential([
            layers.LSTM(c.hidden_units, input_shape=(c.lookback,1), return_sequences=False),
            layers.Dropout(c.dropout),
            layers.Dense(64, activation='relu'),
            layers.Dense(1)
        ])
        m.compile(optimizer=optim.Adam(learning_rate=c.lr), loss='mse')
        return m

    model = build_from_cfg(cfg)
    model.set_weights(bundle['weights'])
    df = _load_data(ticker, period='5y')
    metrics = bundle.get('metrics', {}) or {}
    rmse = float(metrics.get('val_rmse_price')) if metrics.get('val_rmse_price') is not None else float(np.sqrt(float(metrics.get('val_mse', 0.0))))

    multi = bool(bundle.get('multi'))
    if not multi:
        scaler = bundle['scaler']
        # Uncertainty-aware first, fallback to point + RMSE CI
        try:
            u = predict_lstm_with_uncertainty(model, scaler, df['Close'], days, cfg)
            preds = list(map(float, u['predictions']))
            intervals = [[float(a), float(b)] for (a, b) in u['intervals']]
            up_prob = float(u.get('up_prob', 0.5))
            risk_score = float(u.get('risk_score', 50.0))
            vol_forecast = list(map(float, u.get('vol_forecast', [])))
        except Exception:
            preds = predict_lstm(model, scaler, df['Close'], days, cfg)
            metrics = bundle.get('metrics', {}) or {}
            rmse = float(metrics.get('val_rmse_price')) if metrics.get('val_rmse_price') is not None else float(np.sqrt(float(metrics.get('val_mse', 0.0))))
            ci = 1.96 * rmse
            intervals = [[float(p - ci), float(p + ci)] for p in preds]
            up_prob = None
            risk_score = None
            vol_forecast = []
    else:
    # Multivariate autoregressive prediction with RMSE-based CI
        fundamentals = _get_fundamentals(ticker)
        F = _compute_features_df(df, fundamentals)
        feat_cols = bundle['feature_cols']
        feat_scaler = bundle['feat_scaler']
        tgt_scaler = bundle['tgt_scaler']
        # Align and scale
        F = F[feat_cols]
        Fs = feat_scaler.transform(F.values)
        lookback = cfg.lookback
        if Fs.shape[0] < lookback:
            raise RuntimeError('Insufficient feature length for prediction')
        window = Fs[-lookback:, :].copy()
        close_series = df['Close'].copy()
        high = df['High'] if 'High' in df.columns else None
        low = df['Low'] if 'Low' in df.columns else None
        volume = df['Volume'] if 'Volume' in df.columns else None
        preds: List[float] = []
        for _ in range(days):
            yhat_s = float(model.predict(window.reshape(1, lookback, window.shape[1]), verbose=0).ravel()[0])
            next_price = float(tgt_scaler.inverse_transform(np.array([[yhat_s]])).ravel()[0])
            preds.append(next_price)
            # advance synthetic series
            next_idx = close_series.index[-1] + pd.Timedelta(days=1)
            close_series.loc[next_idx] = next_price
            if high is not None:
                high.loc[next_idx] = next_price
            if low is not None:
                low.loc[next_idx] = next_price
            if volume is not None:
                volume.loc[next_idx] = volume.iloc[-1]
            latest_row = _latest_feature_row_full(close_series, high, low, volume, fundamentals)
            x_new = latest_row[feat_cols].to_frame().T
            x_new_s = feat_scaler.transform(x_new.values)
            window = np.vstack([window[1:, :], x_new_s])

        ci = 1.96 * rmse
        intervals = [[float(p - ci), float(p + ci)] for p in preds]
        # Probability approx under normal assumption
        last_close = float(df['Close'].iloc[-1])
        from math import erf, sqrt
        if rmse > 0:
            z = (preds[0] - last_close) / rmse
            up_prob = 0.5 * (1.0 + erf(z / sqrt(2)))
        else:
            up_prob = 0.5
        # Risk and volatility approximations
        base = max(1e-8, last_close)
        next_std_ret = rmse / base
        risk_score = float(np.clip((next_std_ret / 0.02) * 50.0, 0.0, 100.0))
        vol_forecast = [float(next_std_ret)] * days

    # enrich with indicators
    sma5 = df['Close'].rolling(5).mean().iloc[-1]
    sma20 = df['Close'].rolling(20).mean().iloc[-1]
    rsi14 = _rsi(df['Close'], 14).iloc[-1]

    return {
        'ticker': ticker.upper(),
        'predictions': preds,
        'intervals': intervals,
        'confidence': float(np.clip(1.0 - (rmse / (np.mean(df['Close']) or 1)), 0, 1)),
        'model_version': 'lstm_v1',
        'timestamp': pd.Timestamp.utcnow().isoformat(),
        'as_of': df.index[-1].isoformat(),
    'last_close': float(df['Close'].iloc[-1]),
        'sma5': float(sma5) if pd.notna(sma5) else None,
        'sma20': float(sma20) if pd.notna(sma20) else None,
        'rsi14': float(rsi14) if pd.notna(rsi14) else None,
        'up_prob': up_prob,
        'risk_score': risk_score,
        'vol_forecast': vol_forecast,
    }


def evaluate_stock_lstm(ticker: str, tuned: bool = False) -> Dict:
    """Evaluate saved LSTM model (tuned or not) on a chronological test split.
    Returns metrics and simple baselines comparable across models.
    """
    path = _bundle_tuned_path(ticker) if tuned else _bundle_path(ticker)
    if not os.path.exists(path):
        # Train if missing
        if tuned:
            train_stock_lstm_tuned(ticker, n_trials=10, timeout=300)
        else:
            train_stock_lstm(ticker)
    bundle = joblib.load(path)
    cfg = LSTMConfig(**bundle.get('cfg', {}))

    import importlib
    tfk = importlib.import_module('tensorflow.keras')
    layers = importlib.import_module('tensorflow.keras.layers')
    optim = importlib.import_module('tensorflow.keras.optimizers')

    def build_from_cfg(c: LSTMConfig, n_features: int = 1):
        m = tfk.Sequential([
            layers.LSTM(c.hidden_units, input_shape=(c.lookback, n_features), return_sequences=False),
            layers.Dropout(c.dropout),
            layers.Dense(64, activation='relu'),
            layers.Dense(1)
        ])
        m.compile(optimizer=optim.Adam(learning_rate=c.lr), loss='mse')
        return m

    df = _load_data(ticker, period='5y')
    close = df['Close'].astype(float)
    multi = bool(bundle.get('multi'))
    if not multi:
        scaler = bundle['scaler']
        values = close.values.reshape(-1, 1)
        values_s = scaler.transform(values).ravel()
        X, y = make_supervised(values_s, cfg.lookback)
        if len(X) < 100:
            raise RuntimeError('Insufficient data for evaluation')
        n = len(X)
        train_end = int(n * 0.7)
        val_end = int(n * 0.85)
        X_test, y_test = X[val_end:], y[val_end:]
        X_test = X_test[..., None]
        model = build_from_cfg(cfg, 1)
        model.set_weights(bundle['weights'])
        y_pred_s = model.predict(X_test, verbose=0).ravel()
        y_test_price = scaler.inverse_transform(y_test.reshape(-1, 1)).ravel()
        y_pred_price = scaler.inverse_transform(y_pred_s.reshape(-1, 1)).ravel()
        # baselines aligned to y_test positions
        raw = close.values
        y_all_price = raw[cfg.lookback:]
        t0 = val_end
        y_naive = raw[cfg.lookback - 1: -1][t0:]
        sma5_full = pd.Series(raw).rolling(5).mean().shift(1).bfill().values
        y_sma5 = sma5_full[cfg.lookback:][t0:]
    else:
        fundamentals = _get_fundamentals(ticker)
        F = _compute_features_df(df, fundamentals)
        target = close.loc[F.index]
        feat_cols = bundle['feature_cols']
        feat_scaler = bundle['feat_scaler']
        tgt_scaler = bundle['tgt_scaler']
        F = F[feat_cols]
        Fs = feat_scaler.transform(F.values)
        y = tgt_scaler.transform(target.values.reshape(-1, 1)).ravel()
        # Build supervised windows
        from .lstm_model import make_supervised_multivariate
        X, y_sup = make_supervised_multivariate(Fs, y, cfg.lookback)
        if len(X) < 100:
            raise RuntimeError('Insufficient data for evaluation (multi)')
        n = len(X)
        train_end = int(n * 0.7)
        val_end = int(n * 0.85)
        X_test, y_test = X[val_end:], y_sup[val_end:]
        model = build_from_cfg(cfg, X.shape[-1])
        model.set_weights(bundle['weights'])
        y_pred_s = model.predict(X_test, verbose=0).ravel()
        y_test_price = tgt_scaler.inverse_transform(y_test.reshape(-1, 1)).ravel()
        y_pred_price = tgt_scaler.inverse_transform(y_pred_s.reshape(-1, 1)).ravel()
        # baselines: naive = today's close, sma5 = rolling 5 on today's close
        # Align baseline indices to target (positions after lookback)
        raw = target.values
        # y_sup corresponds to raw[cfg.lookback:]
        y_all_price = raw[cfg.lookback:]
        t0 = val_end
        y_naive = raw[cfg.lookback - 1: -1][t0:]
        sma5_full = pd.Series(raw).rolling(5).mean().shift(1).bfill().values
        y_sma5 = sma5_full[cfg.lookback:][t0:]

    from sklearn.metrics import mean_squared_error, mean_absolute_error
    rmse = float(np.sqrt(mean_squared_error(y_test_price, y_pred_price)))
    mae = float(mean_absolute_error(y_test_price, y_pred_price))
    acc = float(np.mean(np.sign(np.diff(y_test_price)) == np.sign(np.diff(y_pred_price)))) if len(y_test_price) > 1 else 0.0
    def _m(y_true, y_hat):
        return {
            'rmse': float(np.sqrt(mean_squared_error(y_true, y_hat))),
            'mae': float(mean_absolute_error(y_true, y_hat)),
        }
    base_naive_m = _m(y_test_price, y_naive)
    base_sma_m = _m(y_test_price, y_sma5)

    return {
        'ticker': ticker.upper(),
        'test_metrics': {'rmse': rmse, 'mae': mae, 'accuracy': acc},
        'baseline': { 'naive': base_naive_m, 'sma5': base_sma_m },
        'trained_on': bundle.get('created_at'),
        'multi': multi,
        'timestamp': pd.Timestamp.utcnow().isoformat(),
    }


def train_stock_lstm_tuned(ticker: str, n_trials: int = 25, timeout: int | None = None) -> str:
    df = _load_data(ticker, period='5y')
    best = tune_lstm(df['Close'], n_trials=n_trials, timeout=timeout)
    cfg = LSTMConfig(**best)
    ts = pd.Timestamp.utcnow().strftime('%Y%m%d%H%M%S')
    # Try multivariate first using tuned hyperparams; fallback to univariate
    try:
        fundamentals = _get_fundamentals(ticker)
        F = _compute_features_df(df, fundamentals)
        target = df['Close'].loc[F.index]
        model, feat_scaler, tgt_scaler, metrics = train_lstm_multivariate(F, target, cfg)
        bundle = {
            'ticker': ticker.upper(),
            'cfg': cfg.__dict__,
            'metrics': metrics,
            'feature_cols': list(F.columns),
            'feat_scaler': feat_scaler,
            'tgt_scaler': tgt_scaler,
            'weights': model.get_weights(),
            'created_at': ts,
            'multi': True,
        }
    except Exception:
        model, scaler, metrics = train_lstm(df['Close'], cfg)
        bundle = {
            'ticker': ticker.upper(),
            'cfg': cfg.__dict__,
            'metrics': metrics,
            'scaler': scaler,
            'weights': model.get_weights(),
            'created_at': ts,
            'multi': False,
        }
    path_latest = _bundle_tuned_path(ticker)
    path_versioned = os.path.join(LSTM_TUNED_DIR, f"lstm_tuned_{ticker.upper()}_{ts}.pkl")
    joblib.dump(bundle, path_versioned)
    joblib.dump(bundle, path_latest)
    return path_versioned


def predict_stock_lstm_tuned(ticker: str, days: int = 30) -> Dict:
    path = _bundle_tuned_path(ticker)
    if not os.path.exists(path):
        train_stock_lstm_tuned(ticker, n_trials=15, timeout=600)
    bundle = joblib.load(path)
    cfg = LSTMConfig(**bundle.get('cfg', {}))

    import importlib
    tfk = importlib.import_module('tensorflow.keras')
    layers = importlib.import_module('tensorflow.keras.layers')
    optim = importlib.import_module('tensorflow.keras.optimizers')

    def build_from_cfg(c: LSTMConfig):
        m = tfk.Sequential([
            layers.LSTM(c.hidden_units, input_shape=(c.lookback,1), return_sequences=False),
            layers.Dropout(c.dropout),
            layers.Dense(64, activation='relu'),
            layers.Dense(1)
        ])
        m.compile(optimizer=optim.Adam(learning_rate=c.lr), loss='mse')
        return m

    model = build_from_cfg(cfg)
    model.set_weights(bundle['weights'])
    df = _load_data(ticker, period='5y')
    metrics = bundle.get('metrics', {}) or {}
    rmse = float(metrics.get('val_rmse_price')) if metrics.get('val_rmse_price') is not None else float(np.sqrt(float(metrics.get('val_mse', 0.0))))
    scaler = bundle.get('scaler')
    # Uncertainty-aware with fallback
    try:
        u = predict_lstm_with_uncertainty(model, scaler, df['Close'], days, cfg)
        preds = list(map(float, u['predictions']))
        intervals = [[float(a), float(b)] for (a, b) in u['intervals']]
        up_prob = float(u.get('up_prob', 0.5))
        risk_score = float(u.get('risk_score', 50.0))
        vol_forecast = list(map(float, u.get('vol_forecast', [])))
    except Exception:
        preds = predict_lstm(model, scaler, df['Close'], days, cfg)
        ci = 1.96 * rmse
        intervals = [[float(p - ci), float(p + ci)] for p in preds]
        up_prob = None
        risk_score = None
        vol_forecast = []

    sma5 = df['Close'].rolling(5).mean().iloc[-1]
    sma20 = df['Close'].rolling(20).mean().iloc[-1]
    rsi14 = _rsi(df['Close'], 14).iloc[-1]

    return {
        'ticker': ticker.upper(),
        'predictions': preds,
        'intervals': intervals,
        'confidence': float(np.clip(1.0 - (rmse / (np.mean(df['Close']) or 1)), 0, 1)),
        'model_version': 'lstm_tuned_v1',
        'timestamp': pd.Timestamp.utcnow().isoformat(),
        'as_of': df.index[-1].isoformat(),
        'last_close': float(df['Close'].iloc[-1]),
        'sma5': float(sma5) if pd.notna(sma5) else None,
        'sma20': float(sma20) if pd.notna(sma20) else None,
        'rsi14': float(rsi14) if pd.notna(rsi14) else None,
        'up_prob': up_prob,
        'risk_score': risk_score,
        'vol_forecast': vol_forecast,
    }
