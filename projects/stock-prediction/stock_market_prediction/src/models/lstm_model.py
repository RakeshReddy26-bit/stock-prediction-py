from __future__ import annotations
import os
from dataclasses import dataclass
from typing import List, Tuple, Optional, Dict, Any

import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler
import tensorflow as tf

# TensorFlow / Keras
os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "2")
from tensorflow.keras import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout
from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau
from tensorflow.keras.optimizers import Adam


@dataclass
class LSTMConfig:
    lookback: int = 60
    hidden_units: int = 64
    dropout: float = 0.2
    lr: float = 1e-3
    epochs: int = 25
    batch_size: int = 64
    val_split: float = 0.1
    seed: int = 42
    # uncertainty
    mc_dropout_samples: int = 100
    ci_level: float = 0.95


def make_supervised(series: np.ndarray, lookback: int) -> Tuple[np.ndarray, np.ndarray]:
    X, y = [], []
    for i in range(len(series) - lookback):
        X.append(series[i:i+lookback])
        y.append(series[i+lookback])
    return np.asarray(X), np.asarray(y)


def make_supervised_multivariate(features: np.ndarray, target: np.ndarray, lookback: int) -> Tuple[np.ndarray, np.ndarray]:
    """
    Build sliding windows from multivariate features and aligned target.
    features: (n_samples, n_features)
    target:   (n_samples,)
    returns X:(n_windows, lookback, n_features), y:(n_windows,)
    """
    X, y = [], []
    n = len(target)
    for i in range(n - lookback):
        X.append(features[i:i+lookback, :])
        y.append(target[i+lookback])
    return np.asarray(X), np.asarray(y)


def build_lstm(input_shape: Tuple[int, int], cfg: LSTMConfig) -> Sequential:
    model = Sequential([
        LSTM(cfg.hidden_units, input_shape=input_shape, return_sequences=False),
        Dropout(cfg.dropout),
        Dense(64, activation='relu'),
        Dense(1)
    ])
    model.compile(optimizer=Adam(learning_rate=cfg.lr), loss='mse')
    return model


def train_lstm(close: pd.Series,
               cfg: Optional[LSTMConfig] = None) -> Tuple[Sequential, StandardScaler, Dict[str, float]]:
    """
    Train an LSTM on a close price series (float), next-step regression.
    Returns (model, scaler, metrics)
    """
    cfg = cfg or LSTMConfig()
    # Set seeds for reproducibility
    np.random.seed(cfg.seed)
    tf.random.set_seed(cfg.seed)

    # Clean input series (remove NaN/Inf)
    series = close.astype(float).replace([np.inf, -np.inf], np.nan).dropna()
    if len(series) < max(120, cfg.lookback + 20):
        raise RuntimeError("Not enough clean data for LSTM training")

    # Scale
    scaler = StandardScaler()
    values = series.values.reshape(-1, 1)
    values_s = scaler.fit_transform(values).ravel()

    # Supervised windows
    X, y = make_supervised(values_s, cfg.lookback)
    if len(X) < 100:
        raise RuntimeError("Not enough data for LSTM training")

    # Train/Val split (chronological)
    split = int(len(X) * (1 - cfg.val_split))
    X_train, y_train = X[:split], y[:split]
    X_val, y_val = X[split:], y[split:]

    # Add time dimension features (n_samples, lookback, 1)
    X_train = X_train[..., None]
    X_val = X_val[..., None]

    model = build_lstm((cfg.lookback, 1), cfg)
    callbacks = [
        EarlyStopping(patience=5, restore_best_weights=True, monitor='val_loss'),
        ReduceLROnPlateau(patience=3, factor=0.5, min_lr=1e-5)
    ]
    hist = model.fit(
        X_train, y_train,
        validation_data=(X_val, y_val),
        epochs=cfg.epochs,
        batch_size=cfg.batch_size,
        verbose=0,
        callbacks=callbacks
    )

    # Metrics on validation set
    if len(X_val):
        val_mse = float(model.evaluate(X_val, y_val, verbose=0))
        # Predict on val and compute additional metrics
        y_val_pred_s = model.predict(X_val, verbose=0).ravel()
        # Price-scale metrics (inverse transform)
        y_val_price = scaler.inverse_transform(y_val.reshape(-1,1)).ravel()
        y_pred_price = scaler.inverse_transform(y_val_pred_s.reshape(-1,1)).ravel()
        val_rmse_price = float(np.sqrt(np.mean((y_pred_price - y_val_price) ** 2)))
        val_mae_price = float(np.mean(np.abs(y_pred_price - y_val_price)))
        metrics = {
            'val_mse': val_mse,
            'val_rmse_price': val_rmse_price,
            'val_mae_price': val_mae_price
        }
    else:
        last_loss = float(hist.history['loss'][-1])
        metrics = { 'val_mse': last_loss }
    return model, scaler, metrics


def predict_lstm(model: Sequential,
                 scaler: StandardScaler,
                 close: pd.Series,
                 days: int,
                 cfg: Optional[LSTMConfig] = None) -> List[float]:
    cfg = cfg or LSTMConfig()
    values = close.astype(float).values.reshape(-1, 1)
    values_s = scaler.transform(values).ravel()

    if len(values_s) < cfg.lookback:
        raise RuntimeError("Insufficient length for prediction window")

    window = values_s[-cfg.lookback:].copy()
    preds: List[float] = []
    for _ in range(days):
        x = window.reshape(1, cfg.lookback, 1)
        yhat_s = float(model.predict(x, verbose=0).ravel()[0])
        preds.append(yhat_s)
        # roll window
        window = np.concatenate([window[1:], [yhat_s]])

    # inverse scale to price
    preds_arr = np.array(preds).reshape(-1, 1)
    preds_price = scaler.inverse_transform(preds_arr).ravel().tolist()
    return [float(p) for p in preds_price]


def predict_lstm_with_uncertainty(
    model: Sequential,
    scaler: StandardScaler,
    close: pd.Series,
    days: int,
    cfg: Optional[LSTMConfig] = None,
) -> Dict[str, Any]:
    """
    Multi-step forecast with Monte Carlo dropout for uncertainty.
    Returns dict with predictions, intervals, up_prob, risk_score, vol_forecast.
    """
    cfg = cfg or LSTMConfig()
    values = close.astype(float).values.reshape(-1, 1)
    values_s = scaler.transform(values).ravel()
    if len(values_s) < cfg.lookback:
        raise RuntimeError("Insufficient length for prediction window")

    # Initialize windows for each MC sample
    m = max(1, int(cfg.mc_dropout_samples))
    window0 = values_s[-cfg.lookback:].copy()
    windows = np.tile(window0, (m, 1))  # (m, lookback)

    samples_s: List[np.ndarray] = []  # list of (m,) arrays per horizon
    for _step in range(days):
        x = windows.reshape(m, cfg.lookback, 1)
        # Enable dropout at inference by passing training=True
        yhat_s = model(x, training=True).numpy().ravel()  # (m,)
        samples_s.append(yhat_s.copy())
        # roll each window with its own sample
        windows = np.concatenate([windows[:, 1:], yhat_s.reshape(m, 1)], axis=1)

    # Aggregate per-horizon statistics
    preds: List[float] = []
    intervals: List[Tuple[float, float]] = []
    vol_forecast: List[float] = []
    alpha = (1.0 - cfg.ci_level) / 2.0
    lo_q, hi_q = alpha, 1 - alpha
    last_close = float(close.values[-1])

    for h in range(days):
        s = samples_s[h].reshape(-1, 1)  # (m, 1)
        s_price = scaler.inverse_transform(s).ravel()
        mean_price = float(np.mean(s_price))
        lo = float(np.quantile(s_price, lo_q))
        hi = float(np.quantile(s_price, hi_q))
        preds.append(mean_price)
        intervals.append((lo, hi))
        # volatility as std of next-step returns (price relative to last actual for h==0, else previous mean)
        base = last_close if h == 0 else preds[h-1]
        ret = (s_price - base) / max(1e-8, base)
        vol_forecast.append(float(np.std(ret)))

    # Probability of upward movement for next day
    next_day_samples_price = scaler.inverse_transform(samples_s[0].reshape(-1, 1)).ravel()
    up_prob = float(np.mean(next_day_samples_price > last_close))

    # Risk score (0-100) based on next-day return std vs. 2% baseline
    baseline = 0.02
    risk_raw = np.std((next_day_samples_price - last_close) / max(1e-8, last_close)) / max(baseline, 1e-8)
    risk_score = float(np.clip(risk_raw * 50.0, 0.0, 100.0))  # scaled

    return {
        'predictions': preds,
        'intervals': intervals,
        'up_prob': up_prob,
        'risk_score': risk_score,
        'vol_forecast': vol_forecast,
        'last_close': last_close,
        'ci_level': cfg.ci_level,
        'samples': m,
    }


def train_lstm_multivariate(
    features: pd.DataFrame,
    target_close: pd.Series,
    cfg: Optional[LSTMConfig] = None
) -> Tuple[Sequential, StandardScaler, StandardScaler, Dict[str, float]]:
    """
    Train an LSTM on multivariate features with target as next-step close.
    Returns (model, feature_scaler, target_scaler, metrics)
    """
    cfg = cfg or LSTMConfig()
    np.random.seed(cfg.seed)
    tf.random.set_seed(cfg.seed)

    # Clean
    feats = features.replace([np.inf, -np.inf], np.nan).dropna()
    tgt = target_close.loc[feats.index].astype(float)
    if len(tgt) < max(120, cfg.lookback + 20):
        raise RuntimeError("Not enough data for multivariate LSTM training")

    feat_scaler = StandardScaler()
    tgt_scaler = StandardScaler()
    F = feat_scaler.fit_transform(feats.values)
    y = tgt_scaler.fit_transform(tgt.values.reshape(-1, 1)).ravel()

    X, y_sup = make_supervised_multivariate(F, y, cfg.lookback)
    if len(X) < 100:
        raise RuntimeError("Not enough windows for training")

    split = int(len(X) * (1 - cfg.val_split))
    X_train, y_train = X[:split], y[:split]
    X_val, y_val = X[split:], y[split:]

    model = build_lstm((cfg.lookback, X.shape[-1]), cfg)
    callbacks = [
        EarlyStopping(patience=5, restore_best_weights=True, monitor='val_loss'),
        ReduceLROnPlateau(patience=3, factor=0.5, min_lr=1e-5)
    ]
    hist = model.fit(
        X_train, y_train,
        validation_data=(X_val, y_val),
        epochs=cfg.epochs,
        batch_size=cfg.batch_size,
        verbose=0,
        callbacks=callbacks
    )

    # Metrics
    metrics: Dict[str, float] = { 'val_mse': float(hist.history['val_loss'][-1]) if 'val_loss' in hist.history else float(hist.history['loss'][-1]) }
    if len(X_val):
        y_pred_s = model.predict(X_val, verbose=0).ravel()
        y_val_price = tgt_scaler.inverse_transform(y_val.reshape(-1,1)).ravel()
        y_pred_price = tgt_scaler.inverse_transform(y_pred_s.reshape(-1,1)).ravel()
        metrics['val_rmse_price'] = float(np.sqrt(np.mean((y_pred_price - y_val_price) ** 2)))
        metrics['val_mae_price'] = float(np.mean(np.abs(y_pred_price - y_val_price)))

    return model, feat_scaler, tgt_scaler, metrics


def predict_lstm_multivariate(
    model: Sequential,
    feat_scaler: StandardScaler,
    tgt_scaler: StandardScaler,
    features: pd.DataFrame,
    days: int,
    cfg: Optional[LSTMConfig] = None
) -> List[float]:
    cfg = cfg or LSTMConfig()
    F = feat_scaler.transform(features.values)
    if F.shape[0] < cfg.lookback:
        raise RuntimeError("Insufficient features for prediction window")
    window = F[-cfg.lookback:, :].copy()  # (lookback, n_features)
    preds_s: List[float] = []
    for _ in range(days):
        x = window.reshape(1, cfg.lookback, F.shape[1])
        yhat_s = float(model.predict(x, verbose=0).ravel()[0])
        preds_s.append(yhat_s)
        # update window by appending zeros for unknown future features except the target signal
        next_feat = np.zeros((1, F.shape[1]), dtype=float)
        # place the predicted target at position 0 if your first feature is close; callers should align columns
        next_feat[0, 0] = yhat_s
        window = np.vstack([window[1:, :], next_feat])

    preds_price = tgt_scaler.inverse_transform(np.array(preds_s).reshape(-1, 1)).ravel().tolist()
    return [float(p) for p in preds_price]
